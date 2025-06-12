import os
import json
from datetime import datetime
import re

# --- Configuration ---
# DATA_DIR 是当前脚本文件所在目录的上一级目录下的 'data' 文件夹
# os.path.dirname(__file__) 获取当前脚本的目录 (month_summary_ai/)
# os.path.join(os.path.dirname(__file__), '..', 'data') 向上退一级到项目根目录，再进入 data/
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

MONTH_AGGREGATE_DIR = os.path.join(os.path.dirname(__file__), '..', 'month')

def group_current_month_ai_summaries_by_category():
    """
    读取 data/ 目录下当前月份的 jsonl 文件，提取 AI 字段下的 tldr, motivation, result, conclusion，
    以及顶层的 categories 字段。
    然后将这些数据按类别分组，保存到 month/yyyy-mm.json 文件中。
    """
    if not os.path.exists(DATA_DIR):
        print(f"Error: '{DATA_DIR}/' directory does not exist. Please ensure your JSONL files are in this directory.")
        return

    # Get current year and month
    current_date = datetime.now()
    current_month_key = current_date.strftime('%Y-%m') # e.g., '2025-06'
    
    print(f"Processing: {current_month_key}")

    # Create month aggregation directory (if it doesn't exist)
    os.makedirs(MONTH_AGGREGATE_DIR, exist_ok=True)

    # Store categorized paper data
    # Structure: {'category_name': [ {id: '...', tldr: '...', motivation: '...', ...}, ... ]}
    categorized_papers_data = {}

    # Iterate through files in the data directory
    for filename in os.listdir(DATA_DIR):
        # Ensure only jsonl files matching the naming convention and belonging to the current month are processed
        if filename.endswith('_AI_enhanced_Chinese.jsonl') and filename.startswith(current_month_key):
            match = re.match(r'(\d{4}-\d{2}-\d{2})_AI_enhanced_Chinese\.jsonl', filename)
            if not match:
                print(f"Invalid name, skipped: {filename}")
                continue

            file_date_str = match.group(1) # e.g., '2025-06-04'
            file_path = os.path.join(DATA_DIR, filename)

            print(f"Processing: {filename}")

            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        data = json.loads(line)
                        paper_id = data.get('id')
                        paper_date_in_json = data.get('date') # Assuming 'date' field exists and is in YYYY-MM-DD format
                        
                        # Re-check if the date inside JSON matches the filename date
                        if paper_date_in_json and paper_date_in_json != file_date_str:
                            print(f"    Error: File {filename} line {line_num}, date {paper_date_in_json} does not match {file_date_str}, skipped")  
                            continue

                        ai_data = data.get('AI', {})
                        categories = data.get('categories', []) # Extract top-level categories field

                        # Prepare core paper data for extraction
                        extracted_paper_core_data = {
                            'id': paper_id,
                            'tldr': ai_data.get('tldr', ''),
                            'motivation': ai_data.get('motivation', ''),
                            'result': ai_data.get('result', ''),
                            'conclusion': ai_data.get('conclusion', '')
                        }
                        
                        # Only consider adding if at least one AI field is not empty
                        if any(extracted_paper_core_data[k] for k in ['tldr', 'motivation', 'result', 'conclusion']):
                            # Add paper to each of its categories
                            for category in categories:
                                if category not in categorized_papers_data:
                                    categorized_papers_data[category] = []
                                categorized_papers_data[category].append(extracted_paper_core_data)
                        elif not categories: # If AI field is empty and no categories, it might be an invalid entry
                            print(f"    Note: {filename} line {line_num}, paper: {paper_id} has no AI data or categories, skipped.")

                    except json.JSONDecodeError:
                        print(f"    Error: Could not parse JSON in file {filename} line {line_num}: {line.strip()}")
                    except Exception as e:
                        print(f"    Unknown error occurred while processing file {filename} line {line_num}: {e}")

    # Write aggregated data to current month's JSON file
    output_filename = f"{current_month_key}.json" # Note: this is .json
    output_path = os.path.join(MONTH_AGGREGATE_DIR, output_filename)
    
    if categorized_papers_data:
        with open(output_path, 'w', encoding='utf-8') as f:
            # Use json.dump to write the entire dictionary
            json.dump(categorized_papers_data, f, ensure_ascii=False, indent=2) # indent=2 for readability
        print(f"\nAggregated file '{output_path}' generated, containing {len(categorized_papers_data)} categories.")
    else:
        print(f"\nNo matching files or extractable AI summaries and category information found for the current month ({current_month_key}). Aggregated file not generated.")

    print("AI summaries and category information for the current month grouped by category and aggregation complete.")

if __name__ == '__main__':
    group_current_month_ai_summaries_by_category()