import os
import json
import datetime
import re
import glob
import urllib.parse
import subprocess

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
    return frontmatter, match

def get_git_date(file_path):
    """Try to get the creation date from git history."""
    try:
        # Get the date of the first commit that added the file
        # %as gives YYYY-MM-DD
        cmd = ['git', 'log', '--diff-filter=A', '--follow', '--format=%as', '-1', '--', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        date_str = result.stdout.strip()
        if date_str:
            return date_str
            
        # Fallback: try to get the last commit date if creation date fails
        cmd = ['git', 'log', '-1', '--format=%as', '--', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        date_str = result.stdout.strip()
        if date_str:
            return date_str
            
    except Exception as e:
        print(f"Git date extraction failed for {file_path}: {e}")
    return None

def generate_hierarchical_index():
    """
    Generate a hierarchical index similar to Ref folder approach:
    - main index.json with list of years
    - yearly index files with articles for each year
    - maintain compatibility with existing pinned articles
    """
    print(f"Starting generate_hierarchical_index.py...")
    print(f"Current working directory: {os.getcwd()}")
    
    articles_dir = 'Articles'
    index_dir = 'Index'
    main_index_file = os.path.join(index_dir, 'index.json')
    articles_json_file = 'articles.json'  # For backward compatibility
    
    print(f"Articles directory: {os.path.abspath(articles_dir)}")
    print(f"Index directory: {os.path.abspath(index_dir)}")
    print(f"Main index file: {os.path.abspath(main_index_file)}")
    print(f"Articles JSON file: {os.path.abspath(articles_json_file)}")

    # Create Index directory if it doesn't exist
    if not os.path.exists(index_dir):
        print(f"Creating Index directory: {os.path.abspath(index_dir)}")
        os.makedirs(index_dir)

    if not os.path.exists(articles_dir):
        print(f"Directory '{articles_dir}' not found. Creating it.")
        os.makedirs(articles_dir)
        if not os.listdir(articles_dir):
            print("Articles directory is empty. No articles to process.")
            # Create empty index files
            with open(main_index_file, 'w', encoding='utf-8') as f:
                json.dump({"updated": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "years": []}, f, ensure_ascii=False, indent=2)
            with open(articles_json_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
            return

    # Get all markdown files recursively
    md_files = glob.glob(os.path.join(articles_dir, '**', '*.md'), recursive=True)
    print(f"Found {len(md_files)} markdown files")
    for f in md_files:
        print(f" - {f}")
    
    # Process all files into a list with metadata
    articles_data = []
    for file_path in md_files:
        file_name = os.path.basename(file_path)
        print(f"Processing file: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter, frontmatter_match = parse_frontmatter(content)

            # Determine Category from directory structure
            # Get path relative to Articles dir
            rel_path = os.path.relpath(file_path, articles_dir)
            # Get directory name
            category_dir = os.path.dirname(rel_path)
            
            if category_dir and category_dir != '.':
                # Use the first part of the path as the category
                category = category_dir.split(os.sep)[0]
            else:
                category = "Uncategorized"

            # Slugify helper
            def slugify(text):
                import urllib.parse
                text = urllib.parse.unquote(text)
                text = text.replace('.md', '')
                text = text.lower()
                # Keep unicode characters (like Chinese)
                text = re.sub(r'[^\w\s-]', '', text)
                text = re.sub(r'[-\s]+', '-', text)
                return text.strip('-')

            # Generate slugs
            file_slug = slugify(file_name)
            category_slug = slugify(category)
            
            # Generate static URL
            static_url = f"/posts/{category_slug}/{file_slug}.html"

            # 1. Title Extraction
            title = frontmatter.get('title')
            content_without_frontmatter = content
            if frontmatter_match:
                content_without_frontmatter = content[frontmatter_match.end():]
            
            if not title:
                # Try to find the first H1 header
                h1_match = re.search(r'^#\s+(.+)$', content_without_frontmatter, re.MULTILINE)
                if h1_match:
                    title = h1_match.group(1).strip()
                else:
                    # Fallback to filename
                    title = file_name.replace('.md', '').replace('_', ' ').title()

            # 2. Date Extraction
            date_str = frontmatter.get('date')
            if isinstance(date_str, datetime.date):
                date_str = date_str.strftime('%Y-%m-%d')
            
            if not date_str:
                # Try to get date from filename (YYYY-MM-DD-Title.md)
                date_match = re.match(r'^(\d{4}-\d{2}-\d{2})', file_name)
                if date_match:
                    date_str = date_match.group(1)
                else:
                    # Try git history
                    date_str = get_git_date(file_path)
            
            # Final fallback: today's date
            if not date_str:
                print(f"Warning: Could not determine date for {file_name}. Using today's date.")
                date_str = datetime.date.today().strftime('%Y-%m-%d')

            # 3. Description Extraction
            description = frontmatter.get('description')
            if not description:
                # Remove markdown formatting and get clean text
                clean_text = re.sub(r'[#*`\[\]]', '', content_without_frontmatter)
                # Remove HTML tags
                clean_text = re.sub(r'<[^>]+>', '', clean_text)
                clean_text = re.sub(r'\n+', ' ', clean_text).strip()
                
                # Take first 150 characters (increased from 30 for better context)
                if len(clean_text) > 150:
                    description = clean_text[:150] + '...'
                else:
                    description = clean_text

            # 4. Path Encoding
            # We need to keep the directory structure but encode special chars
            # os.path.join uses OS separator, but web URLs use /
            # split path parts
            path_parts = file_path.split(os.sep)
            # encode each part
            encoded_parts = [urllib.parse.quote(part) for part in path_parts]
            encoded_path = "/".join(encoded_parts)

            # Ensure date is in YYYY-MM-DD format
            try:
                date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                formatted_date = date_obj.strftime('%Y-%m-%d')
                year = formatted_date[:4]
            except ValueError:
                print(f"Warning: Invalid date format '{date_str}' for {file_name}. Using today's date.")
                formatted_date = datetime.date.today().strftime('%Y-%m-%d')
                year = formatted_date[:4]

            article_info = {
                "title": title,
                "description": description,
                "path": encoded_path,
                "date": formatted_date,
                "year": year,
                "category": category,
                "filename": file_name,
                "slug": file_slug,
                "url": static_url
            }
            articles_data.append(article_info)
            print(f"Successfully parsed: {title} ({formatted_date})")
            
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")

    if not articles_data:
        print("No articles found to process.")
        # Create empty index files
        with open(main_index_file, 'w', encoding='utf-8') as f:
            json.dump({"updated": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "years": []}, f, ensure_ascii=False, indent=2)
        with open(articles_json_file, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        return

    # Group articles by year
    articles_by_year = {}
    for article in articles_data:
        year = article['year']
        if year not in articles_by_year:
            articles_by_year[year] = []
        articles_by_year[year].append(article)

    # Sort articles within each year by date (descending)
    for year in articles_by_year:
        articles_by_year[year].sort(key=lambda x: x['date'], reverse=True)

    # Generate yearly index files
    for year, articles in articles_by_year.items():
        year_index_data = {
            'year': year,
            'articles': articles,
            'count': len(articles)
        }
        year_file_path = os.path.join(index_dir, f'index_{year}.json')
        with open(year_file_path, 'w', encoding='utf-8') as f:
            json.dump(year_index_data, f, ensure_ascii=False, indent=2)
        print(f"Generated yearly index: {year_file_path} with {len(articles)} articles")

    # Generate main index with list of years (sorted descending)
    available_years = sorted(articles_by_year.keys(), reverse=True)
    main_index = {
        'updated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'years': available_years,
        'total_articles': len(articles_data)
    }
    
    with open(main_index_file, 'w', encoding='utf-8') as f:
        json.dump(main_index, f, ensure_ascii=False, indent=2)
    print(f"Generated main index: {main_index_file} with {len(available_years)} years")

    # Generate flat articles.json for backward compatibility
    # Sort all articles by date (descending)
    all_articles = sorted(articles_data, key=lambda x: x['date'], reverse=True)
    with open(articles_json_file, 'w', encoding='utf-8') as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    print(f"Generated backward-compatible: {articles_json_file} with {len(all_articles)} articles")

if __name__ == "__main__":
    # Check if PyYAML is installed, if not, print a message
    try:
        import yaml
        print("PyYAML is installed.")
    except ImportError:
        print("PyYAML is not installed. Markdown frontmatter parsing might be limited.")
        print("Install it using: pip install PyYAML")
        print("Proceeding with basic parsing for now.")
    
    generate_hierarchical_index()
