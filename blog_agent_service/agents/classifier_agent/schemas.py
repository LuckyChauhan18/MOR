from pydantic import BaseModel
from typing import Dict, List, Literal

Category = Literal[
    "ai",
    "software",
    "web_development",
    "backend",
    "frontend",
    "devops",
    "startup",
    "cricket",
    "sports",
    "news_india",
    "news_usa",
    "general",
]

class BlogClassification(BaseModel):
    categories: List[Category]
    confidence_map: Dict[Category, int]  # 1–100 per category
    reasoning: str
