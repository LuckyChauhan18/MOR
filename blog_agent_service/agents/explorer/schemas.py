from pydantic import BaseModel
from typing import List, Literal

class TrendingTopic(BaseModel):
    title: str
    category: Literal[
        "tech",
        "ai",
        "startup",
        "cricket",
        "news_india",
        "news_usa",
    ]
    region: Literal["global", "india", "usa"]
    reason: str
    source: str
    score: int  # 1–100


class TrendingTopics(BaseModel):
    topics: List[TrendingTopic]
