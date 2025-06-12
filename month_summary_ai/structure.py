# structure.py 示例
from pydantic import BaseModel, Field
from typing import Optional, List

class Structure(BaseModel):
    category_name: str = Field(description="类别名称，例如 '医学', '计算机科学'")
    tldr: str = Field(description="文章集合的精简总结")
    motivation: str = Field(description="文章集合背后的核心动机或要解决的问题")
    method: str = Field(description="文章集合中主要研究方法或技术") # Added 'method' field
    result: str = Field(description="文章集合中主要研究成果或发现")
    conclusion: str = Field(description="文章集合的整体结论或影响")
    overall_summary: str = Field(description="该类别的整体概述，包括其主要研究领域和特点")
    key_themes: List[str] = Field(description="该类别中反复出现的主要研究主题或关键词")
    current_hotspots: List[str] = Field(description="该类别目前研究最活跃、关注度最高的话题或技术")
    future_trends: List[str] = Field(description="该类别未来可能的发展方向、新兴领域或研究范式")
