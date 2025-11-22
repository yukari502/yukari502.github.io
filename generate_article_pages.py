#!/usr/bin/env python3
"""
Generate static HTML pages for each article.
This enables better SEO and direct article linking while maintaining the SPA experience for the main site.
"""

import os
import json
import re
import urllib.parse
import glob
from pathlib import Path

def slugify(text):
    """Convert text to URL-friendly slug"""
    # Decode if it's URL encoded
    text = urllib.parse.unquote(text)
    # Remove .md extension
    text = text.replace('.md', '')
    # Convert to lowercase and replace spaces with hyphens
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def read_markdown_file(file_path):
    """Read markdown file and strip frontmatter"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip frontmatter if present
    content = re.sub(r'^---\s*\n[\s\S]*?\n---\s*\n', '', content)
    return content

def convert_markdown_to_html(markdown_content):
    """Convert markdown to HTML using a simple approach (or you could use a library)"""
    # For now, we'll use marked.js on the client side via the template
    # So we'll just return the markdown as-is to be processed client-side
    # But we should escape it properly
    return markdown_content

def generate_article_html(article, template_content, base_url, output_dir):
    """Generate HTML file for a single article"""
    
    # Read the markdown file
    file_path = urllib.parse.unquote(article['path'])
    
    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}")
        return None
    
    markdown_content = read_markdown_file(file_path)
    
    # Create slug for the filename
    slug = slugify(article['filename'])
    category_slug = slugify(article.get('category', 'uncategorized'))
    
    # Create category directory
    category_dir = os.path.join(output_dir, category_slug)
    os.makedirs(category_dir, exist_ok=True)
    
    # Output file path
    output_file = os.path.join(category_dir, f"{slug}.html")
    output_url = f"{base_url}/{category_slug}/{slug}.html"
    
    # Prepare template variables
    replacements = {
        '{TITLE}': article['title'],
        '{DESCRIPTION}': article.get('description', '')[:160],  # Limit for meta description
        '{KEYWORDS}': f"{article.get('category', '')}, {article['title']}",
        '{URL}': output_url,
        '{DATE}': article.get('date', ''),
        '{CATEGORY}': article.get('category', 'Uncategorized'),
        '{CONTENT}': markdown_content  # We'll process this with marked.js on client side
    }
    
    # Replace placeholders in template
    html_content = template_content
    for key, value in replacements.items():
        html_content = html_content.replace(key, str(value))
    
    # Write the HTML file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Generated: {output_file}")
    
    # Return the URL path for sitemap
    return f"/{category_slug}/{slug}.html"

def generate_all_articles():
    """Generate HTML pages for all articles"""
    
    articles_json = 'articles.json'
    template_file = 'article-template.html'
    output_dir = 'posts'
    base_url = 'https://yukari502.github.io'
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Read template
    if not os.path.exists(template_file):
        print(f"Error: Template file not found: {template_file}")
        return []
    
    with open(template_file, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Read articles
    if not os.path.exists(articles_json):
        print(f"Error: Articles JSON not found: {articles_json}")
        return []
    
    with open(articles_json, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    # Generate HTML for each article
    generated_urls = []
    for article in articles:
        url_path = generate_article_html(article, template_content, base_url, output_dir)
        if url_path:
            generated_urls.append({
                'url': url_path,
                'lastmod': article.get('date', ''),
                'title': article.get('title', '')
            })
    
    print(f"\n✅ Generated {len(generated_urls)} article pages in '{output_dir}/' directory")
    
    return generated_urls

if __name__ == "__main__":
    generate_all_articles()
