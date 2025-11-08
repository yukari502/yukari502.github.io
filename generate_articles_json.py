import os
import json
import datetime
import re

# Function to parse YAML frontmatter from markdown content
def parse_frontmatter(content):
    frontmatter = {}
    # Regex to find YAML frontmatter block (--- ... ---)
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL | re.MULTILINE)
    if match:
        try:
            import yaml
            frontmatter_str = match.group(1)
            frontmatter = yaml.safe_load(frontmatter_str)
        except ImportError:
            print("PyYAML not found. Cannot parse frontmatter. Install with: pip install PyYAML")
            # Fallback: simple key-value parsing if YAML fails
            lines = frontmatter_str.strip().split('\n')
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    frontmatter[key.strip()] = value.strip()
        except Exception as e:
            print(f"Error parsing frontmatter: {e}")
    return frontmatter

def generate_articles_json():
    print(f"Starting generate_articles_json.py...")
    print(f"Current working directory: {os.getcwd()}")
    
    articles_dir = 'Articles'
    output_file = 'article-index.json' # Changed from articles.json
    articles_data = []

    print(f"Articles directory: {os.path.abspath(articles_dir)}")
    print(f"Output file: {os.path.abspath(output_file)}")

    # Get current date for default if not found in frontmatter
    today = datetime.date.today()
    default_date = today.strftime('%Y-%m-%d')
    print(f"Default date for new articles: {default_date}")

    if not os.path.exists(articles_dir):
        print(f"Directory '{articles_dir}' not found. Creating it.")
        os.makedirs(articles_dir)
        # Add a placeholder if the directory was just created and is empty
        if not os.listdir(articles_dir):
            print("Articles directory is empty. No articles to process.")
            # Optionally create a dummy article or just exit
            # For now, we'll just ensure articles.json is created if it doesn't exist
            pass

    # Read existing articles.json if it exists, to preserve existing entries
    existing_articles = []
    if os.path.exists(output_file):
        print(f"Reading existing '{output_file}'...")
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_articles = json.load(f)
            print(f"Successfully read {len(existing_articles)} existing articles.")
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {output_file}. Starting with an empty list.")
        except Exception as e:
            print(f"Error reading {output_file}: {e}. Starting with an empty list.")
    else:
        print(f"'{output_file}' not found. Starting with an empty list.")

    # Create a set of existing article paths for quick lookup
    existing_paths = {article.get('path') for article in existing_articles if article.get('path')}
    print(f"Found {len(existing_paths)} existing article paths.")

    print(f"Scanning directory '{articles_dir}' for markdown files...")
    files_processed = 0
    for filename in os.listdir(articles_dir):
        if filename.endswith(".md"):
            filepath = os.path.join(articles_dir, filename)
            
            # Skip if this article path is already in existing_articles
            if filepath in existing_paths:
                print(f"Skipping '{filepath}' as it already exists in articles.json.")
                continue

            files_processed += 1
            print(f"Processing file: {filepath}")
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                frontmatter = parse_frontmatter(content)

                # Extract data, using defaults if not found in frontmatter
                title = frontmatter.get('title', filename.replace('.md', '').replace('_', ' ').title())
                description = frontmatter.get('description', 'A brief description of the article.')
                category = frontmatter.get('category', 'General')
                date_str = frontmatter.get('date', default_date)

                # Ensure date is in YYYY-MM-DD format
                try:
                    date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                    formatted_date = date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    print(f"Warning: Invalid date format '{date_str}' for {filename}. Using default date {default_date}.")
                    formatted_date = default_date

                articles_data.append({
                    "title": title,
                    "description": description,
                    "path": filepath,
                    "category": category,
                    "date": formatted_date
                })
                print(f"Successfully parsed: {title}")
            except Exception as e:
                print(f"Error processing file {filepath}: {e}")

    if files_processed == 0:
        print("No new markdown files found to process.")

    # Combine existing articles with newly found articles
    # Ensure no duplicates based on path
    all_articles = existing_articles + [
        article for article in articles_data if article.get('path') not in existing_paths
    ]

    # Sort all articles by date (descending)
    all_articles.sort(key=lambda x: x.get('date', '1970-01-01'), reverse=True)

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_articles, f, indent=2, ensure_ascii=False)
        print(f"Successfully generated '{output_file}' with {len(all_articles)} articles.")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")

if __name__ == "__main__":
    # Check if PyYAML is installed, if not, print a message
    try:
        import yaml
        print("PyYAML is installed.")
    except ImportError:
        print("PyYAML is not installed. Markdown frontmatter parsing might be limited.")
        print("Install it using: pip install PyYAML")
        print("Proceeding with basic parsing for now.")
    
    generate_articles_json()
