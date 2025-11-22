#!/usr/bin/env python3
"""
Clean up orphaned post files that no longer have corresponding article sources.
This script compares the posts/ directory with Articles/ directory and removes
HTML files that don't have a matching markdown source.
"""

import os
import json
import glob
import urllib.parse

def cleanup_orphaned_posts():
    """
    Remove HTML files in posts/ that don't have corresponding markdown files in Articles/
    """
    print("Starting cleanup of orphaned posts...")
    
    articles_dir = 'Articles'
    posts_dir = 'posts'
    articles_json = 'articles.json'
    
    # Read the current articles.json to get the list of valid articles
    if not os.path.exists(articles_json):
        print(f"Warning: {articles_json} not found. Run generate_articles_json.py first.")
        return
    
    with open(articles_json, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    # Create a set of valid URLs (without leading slash)
    valid_urls = set()
    for article in articles:
        if 'url' in article:
            url = article['url'].lstrip('/')
            valid_urls.add(url)
    
    print(f"Found {len(valid_urls)} valid articles")
    
    # Find all HTML files in posts/
    html_files = glob.glob(os.path.join(posts_dir, '**', '*.html'), recursive=True)
    print(f"Found {len(html_files)} HTML files in posts/")
    
    # Check each HTML file
    removed_count = 0
    for html_file in html_files:
        # Get relative path from project root
        rel_path = os.path.relpath(html_file, '.')
        
        # Check if this file is in our valid URLs
        if rel_path not in valid_urls:
            print(f"Removing orphaned file: {rel_path}")
            try:
                os.remove(html_file)
                removed_count += 1
                
                # Also remove empty parent directories
                parent_dir = os.path.dirname(html_file)
                try:
                    if os.path.isdir(parent_dir) and not os.listdir(parent_dir):
                        os.rmdir(parent_dir)
                        print(f"  Removed empty directory: {parent_dir}")
                except OSError:
                    pass  # Directory not empty, that's fine
                    
            except Exception as e:
                print(f"  Error removing {html_file}: {e}")
    
    print(f"\n✅ Cleanup complete! Removed {removed_count} orphaned post(s)")
    
    # Also clean up empty category directories
    if os.path.exists(posts_dir):
        for category_dir in os.listdir(posts_dir):
            category_path = os.path.join(posts_dir, category_dir)
            if os.path.isdir(category_path):
                try:
                    if not os.listdir(category_path):
                        os.rmdir(category_path)
                        print(f"Removed empty category directory: {category_path}")
                except OSError:
                    pass

if __name__ == "__main__":
    cleanup_orphaned_posts()
