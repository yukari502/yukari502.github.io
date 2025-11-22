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

def prettify_xml(elem):
    """Return a pretty-printed XML string for the Element."""
    rough_string = minidom.parseString(tostring(elem, encoding='unicode'))
    return rough_string.toprettyxml(indent="  ")

def generate_sitemap():
    """Generate sitemap.xml from articles.json"""
    base_url = "https://yukari502.github.io"
    articles_json = "articles.json"
    sitemap_file = "sitemap.xml"
    
    # Create root element
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    urlset.set('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    urlset.set('xsi:schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd')
    
    # Add homepage
    url = SubElement(urlset, 'url')
    loc = SubElement(url, 'loc')
    loc.text = base_url
    lastmod = SubElement(url, 'lastmod')
    lastmod.text = datetime.now().strftime('%Y-%m-%d')
    changefreq = SubElement(url, 'changefreq')
    changefreq.text = 'daily'
    priority = SubElement(url, 'priority')
    priority.text = '1.0'
    
    # Add static pages
    static_pages = [
        {'path': '/#home', 'freq': 'daily', 'priority': '1.0'},
        {'path': '/#about', 'freq': 'monthly', 'priority': '0.8'},
    ]
    
    for page in static_pages:
        url = SubElement(urlset, 'url')
        loc = SubElement(url, 'loc')
        loc.text = base_url + page['path']
        lastmod = SubElement(url, 'lastmod')
        lastmod.text = datetime.now().strftime('%Y-%m-%d')
        changefreq = SubElement(url, 'changefreq')
        changefreq.text = page['freq']
        priority = SubElement(url, 'priority')
        priority.text = page['priority']
    
    # Load and add articles
    if os.path.exists(articles_json):
        with open(articles_json, 'r', encoding='utf-8') as f:
            articles = json.load(f)
        
        for article in articles:
            url = SubElement(urlset, 'url')
            loc = SubElement(url, 'loc')
            # Articles are accessed via the main page, not direct URLs
            # But for SEO, we can list them as fragments or use a different approach
            # Since this is an SPA, we'll use the hash-based URL
            article_path = article.get('path', '')
            # The path in articles.json is like "Articles/About%20me.md"
            # For sitemap, we might want to reference the article view
            # But since it's all on one page with client-side routing, 
            # we can't really have separate URLs for each article in the traditional sense
            # Let's just reference them via their path for now
            loc.text = f"{base_url}/#article/{article_path}"
            
            lastmod = SubElement(url, 'lastmod')
            lastmod.text = article.get('date', datetime.now().strftime('%Y-%m-%d'))
            
            changefreq = SubElement(url, 'changefreq')
            changefreq.text = 'monthly'
            
            priority = SubElement(url, 'priority')
            priority.text = '0.6'
    
    # Write to file
    xml_str = prettify_xml(urlset)
    with open(sitemap_file, 'w', encoding='utf-8') as f:
        f.write(xml_str)
    
    print(f"Sitemap generated successfully: {sitemap_file}")
    print(f"Total URLs: {len(urlset.findall('url'))}")

if __name__ == "__main__":
    generate_sitemap()
