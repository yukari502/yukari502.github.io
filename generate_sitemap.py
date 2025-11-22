#!/usr/bin/env python3
"""
Generate sitemap.xml for GitHub Pages blog.
This script reads from articles.json and generates a sitemap following the standard protocol.
"""

import json
import os
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree, tostring
from xml.dom import minidom

# Import the article page generator
try:
    from generate_article_pages import generate_all_articles
except ImportError:
    generate_all_articles = None

def prettify_xml(elem):
    """Return a pretty-printed XML string for the Element."""
    rough_string = minidom.parseString(tostring(elem, encoding='unicode'))
    return rough_string.toprettyxml(indent="  ")

def generate_sitemap():
    """Generate sitemap.xml from articles.json and generated HTML pages"""
    base_url = "https://yukari502.github.io"
    articles_json = "articles.json"
    sitemap_file = "sitemap.xml"
    
    # Create root element
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    
    # Add homepage
    url = SubElement(urlset, 'url')
    loc = SubElement(url, 'loc')
    loc.text = base_url + '/'
    lastmod = SubElement(url, 'lastmod')
    lastmod.text = datetime.now().strftime('%Y-%m-%d')
    changefreq = SubElement(url, 'changefreq')
    changefreq.text = 'daily'
    priority = SubElement(url, 'priority')
    priority.text = '1.0'
    
    # Generate article HTML pages first
    generated_urls = []
    if generate_all_articles:
        print("Generating static HTML pages for articles...")
        generated_urls = generate_all_articles()
    
    # Load articles for lastmod date of homepage
    if os.path.exists(articles_json):
        with open(articles_json, 'r', encoding='utf-8') as f:
            articles = json.load(f)
        
        # Update homepage lastmod to the most recent article date
        if articles:
            most_recent = max(articles, key=lambda x: x.get('date', '1970-01-01'))
            lastmod.text = most_recent.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # Add generated article pages to sitemap
    for page in generated_urls:
        url = SubElement(urlset, 'url')
        loc = SubElement(url, 'loc')
        loc.text = base_url + page['url']
        lastmod = SubElement(url, 'lastmod')
        lastmod.text = page.get('lastmod', datetime.now().strftime('%Y-%m-%d'))
        changefreq = SubElement(url, 'changefreq')
        changefreq.text = 'monthly'
        priority = SubElement(url, 'priority')
        priority.text = '0.8'
    
    # Write to file with proper XML declaration
    tree = ElementTree(urlset)
    with open(sitemap_file, 'wb') as f:
        tree.write(f, encoding='utf-8', xml_declaration=True)
    
    # Post-process to add proper formatting
    with open(sitemap_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse and prettify
    dom = minidom.parseString(content)
    pretty_xml = dom.toprettyxml(indent="  ", encoding='utf-8')
    
    # Remove extra blank lines
    lines = pretty_xml.decode('utf-8').split('\n')
    lines = [line for line in lines if line.strip()]
    
    with open(sitemap_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"\n✅ Sitemap generated successfully: {sitemap_file}")
    print(f"Total URLs: {len(urlset.findall('url'))}")

if __name__ == "__main__":
    generate_sitemap()
