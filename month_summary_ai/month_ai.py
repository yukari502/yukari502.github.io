
import os
import json
import sys
import datetime # 导入 datetime 模块用于日期处理

import dotenv
import argparse # 虽然大部分参数被自动化，但保留 argparse 便于未来扩展或调试

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from pydantic import ValidationError # For validating structured output
from structure import Structure # 确保您的 structure.py 文件存在并定义了 Structure 类

# 获取当前脚本的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))

# 加载环境变量 (例如 GOOGLE_API_KEY, MODEL_NAME, LANGUAGE)
# 确保 .env 文件位于脚本的同一目录下
dotenv_path = os.path.join(script_dir, ".env")
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)


def get_current_month_file_paths(language: str):
    """
    根据当前月份和语言生成输入和输出文件的完整路径。
    文件路径格式为：上级目录/month/yyyy-mm.json (输入)
    和 上级目录/month/yyyy-mm_AI_language.json (输出)
    """
    current_date = datetime.datetime.now()
    # 格式化为 yyyy-mm
    month_str = current_date.strftime("%Y-%m")
    
    # 构建月文件夹路径：假设脚本在某个子目录，要访问上级目录的 month 文件夹
    # 构建到上级目录的 'month' 文件夹的路径
    month_folder_path = os.path.join(script_dir, '..', 'month')
    # 确保 month 文件夹存在
    os.makedirs(month_folder_path, exist_ok=True)

    input_filename = f"{month_str}.json"
    output_filename = f"{month_str}_AI_{language}.json"

    input_filepath = os.path.join(month_folder_path, input_filename)
    output_filepath = os.path.join(month_folder_path, output_filename)
    
    return input_filepath, output_filepath

def main():
    # --- 修改点 1：移除命令行参数解析，改为自动获取文件路径 ---
    # args = parse_args() # 不再需要此行
    
    model_name = os.environ.get("MODEL_NAME")
    language = os.environ.get("LANGUAGE")

    if not model_name:
        print("错误：环境变量 'MODEL_NAME' 未设置。", file=sys.stderr)
        sys.exit(1)
    if not language:
        print("错误：环境变量 'LANGUAGE' 未设置。", file=sys.stderr)
        sys.exit(1)

    # 获取当前月份的输入和输出文件路径
    input_filepath, output_filepath = get_current_month_file_paths(language)

    # --- 修改点 2：读取 JSON 文件而非 JSONL 文件，并处理新的数据结构 ---
    try:
        with open(input_filepath, "r", encoding="utf-8") as f:
            # 输入文件现在是一个完整的 JSON 对象，键是类别，值是文章列表
            data_by_category = json.load(f)
        print(f'成功读取输入文件: {input_filepath}', file=sys.stderr)
    except FileNotFoundError:
        print(f"错误：未找到输入文件: {input_filepath}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误：解码 JSON 文件失败: {input_filepath} - {e}", file=sys.stderr)
        sys.exit(1)

    # 配置 Gemini API 密钥
    try:
        genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        model = genai.GenerativeModel(model_name)
        print(f'已成功初始化 Gemini 模型: {model_name}', file=sys.stderr)
    except Exception as e:
        print(f"错误：初始化 Gemini 模型失败: {e}", file=sys.stderr)
        sys.exit(1)

    # 定义系统提示和用户提示模板 (内联，不再从文件读取)
    system_prompt = """你是一个专业的学术分析师。我将为你提供一系列从不同门类抓取到的学术文章数据。你的任务是深入阅读这些文章，并根据我提供的结构化输出要求，对这些文章进行全面的总结和趋势分析。"""

    user_template = """请根据以下【{category_name}】类别下所有文章的TLDR、动机、结果和结论，生成一份全面、客观、结构化的总结。你需要对这个类别整体进行概括，而不是单独总结每篇文章。请确保你的总结是全面的，并严格按照以下 JSON 格式输出，不要包含任何额外文本或解释：

```json
{{
    "category_name": "{category_name}",
    "tldr": "文章集合的精简总结",
    "motivation": "文章集合背后的核心动机或要解决的问题",
    "method": "文章集合中主要研究方法或技术",
    "result": "文章集合中主要研究成果或发现",
    "conclusion": "文章集合的整体结论或影响",
    "overall_summary": "该类别的整体概述，包括其主要研究领域和特点",
    "key_themes": ["该类别中反复出现的主要研究主题或关键词"],
    "current_hotspots": ["该类别目前研究最活跃、关注度最高的话题或技术"],
    "future_trends": ["该类别未来可能的发展方向、新兴领域或研究范式"]
}}
```

所有文章的详细内容如下：
{all_articles_content}"""

    all_category_summaries = {} # 用于存储所有类别的总结结果
    
    # --- 修改点 4：遍历类别并为每个类别生成总结 ---
    total_categories = len(data_by_category)
    for idx, (category_name, articles_list) in enumerate(data_by_category.items()):
        print(f"正在处理类别: {category_name} ({idx+1}/{total_categories})", file=sys.stderr)
        
        # 将当前类别下所有文章的关键信息拼接起来作为模型的输入
        all_articles_content = ""
        for article in articles_list:
            # 确保 article 字典包含所有预期字段，否则跳过或处理
            tldr = article.get('tldr', '')
            motivation = article.get('motivation', '')
            result = article.get('result', '')
            conclusion = article.get('conclusion', '')
            
            # 拼接每篇文章的信息，用清晰的分隔符
            all_articles_content += (
                f"文章 ID: {article.get('id', '未知ID')}\n"
                f"TLDR: {tldr}\n"
                f"Motivation: {motivation}\n"
                f"Result: {result}\n"
                f"Conclusion: {conclusion}\n"
                "--------------------\n" # 文章间的分隔符
            )
        
        # 构建完整的提示
        full_prompt = f"{system_prompt}\n\n{user_template.format(category_name=category_name, all_articles_content=all_articles_content)}"
        print(f"模型输入 (full_prompt):\n{full_prompt}\n", file=sys.stderr) # 打印模型输入

        try:
            # 调用 Gemini 模型
            gemini_response = model.generate_content(
                full_prompt,
                generation_config=GenerationConfig(response_mime_type="application/json") # 明确要求 JSON 输出
            )
            
            # 尝试解析 JSON 响应
            response_text = gemini_response.text
            print(f"模型原始输出 (gemini_response.text):\n{response_text}\n", file=sys.stderr) # 打印模型原始输出

            # 移除 markdown code block fences if present
            if response_text.startswith("```json") and response_text.endswith("```"):
                json_content = response_text[len("```json"):-len("```")].strip()
            else:
                json_content = response_text.strip()

            parsed_response = json.loads(json_content)
            
            # 使用 Pydantic 验证结构
            validated_response = Structure(**parsed_response)
            
            print(f"模型结构化输出 (validated_response):\n{validated_response.model_dump_json(indent=2)}\n", file=sys.stderr) # 打印模型结构化输出
            
            all_category_summaries[category_name] = validated_response.model_dump()

        except json.JSONDecodeError as e:
            print(f"类别 {category_name} 出现 JSON 解析错误: {e}", file=sys.stderr)
            all_category_summaries[category_name] = {
                 "tldr": "Error",
                 "motivation": "Error",
                 "method": "Error",
                 "result": "Error",
                 "conclusion": "Error",
                 "overall_summary": "Error",
                 "key_themes": [],
                 "current_hotspots": [],
                 "future_trends": [],
                 "error_message": f"JSON Decode Error: {str(e)}"
            }
        except ValidationError as e:
            print(f"类别 {category_name} 出现 Pydantic 验证错误: {e}", file=sys.stderr)
            all_category_summaries[category_name] = {
                 "tldr": "Error",
                 "motivation": "Error",
                 "method": "Error",
                 "result": "Error",
                 "conclusion": "Error",
                 "overall_summary": "Error",
                 "key_themes": [],
                 "current_hotspots": [],
                 "future_trends": [],
                 "error_message": f"Pydantic Validation Error: {str(e)}"
            }
        except Exception as e:
            print(f"类别 {category_name} 发生未知错误: {e}", file=sys.stderr)
            all_category_summaries[category_name] = {
                 "tldr": "Error",
                 "motivation": "Error",
                 "method": "Error",
                 "result": "Error",
                 "conclusion": "Error",
                 "overall_summary": "Error",
                 "key_themes": [],
                 "current_hotspots": [],
                 "future_trends": [],
                 "error_message": f"General Error: {str(e)}"
            }
        
        # 每次处理一个类别后，暂时不写入文件，待所有处理完毕后再统一写入
        print(f"完成类别 {category_name}", file=sys.stderr)
    
    # --- 修改点 5：所有类别处理完毕后，统一写入输出文件 ---
    try:
        with open(output_filepath, "w", encoding="utf-8") as f:
            json.dump(all_category_summaries, f, indent=2, ensure_ascii=False)
        print(f"\n所有类别总结已成功保存到: {output_filepath}", file=sys.stderr)
    except IOError as e:
        print(f"错误：无法写入输出文件: {output_filepath} - {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
