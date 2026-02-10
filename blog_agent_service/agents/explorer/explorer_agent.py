# explorer_agent.py
from __future__ import annotations

import os
from typing import List, Dict
from dotenv import load_dotenv

from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .schemas import TrendingTopics

# --------------------------------------------------
# Environment
# --------------------------------------------------
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY missing")

# --------------------------------------------------
# LLM
# --------------------------------------------------
llm = ChatOpenAI(
    model="gpt-4o-mini",
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0,
    max_tokens=4096,
)

# --------------------------------------------------
# System Prompt
# --------------------------------------------------
EXPLORER_SYSTEM = """
You are an Internet Explorer Agent for a multi-category blog platform.

Supported categories:
- tech, ai, startup
- cricket
- daily news (india, usa)

Rules:
- Classify EACH topic into the correct category and region
- Avoid gossip and low-quality clickbait
- Prefer trending, high-interest topics
- Rank topics by relevance + freshness

Return 8–12 total topics across categories.
"""

# --------------------------------------------------
# Web Search Tool
# --------------------------------------------------
def web_search(query: str, max_results: int = 5) -> List[Dict]:
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY missing")

    tool = TavilySearchResults(max_results=max_results)
    return tool.invoke({"query": query}) or []

# --------------------------------------------------
# Explorer Agent
# --------------------------------------------------
def run_explorer_agent() -> TrendingTopics:
    """
    Internet Explorer Agent:
    - Tech + AI
    - Cricket
    - Daily News (India & USA)
    """

    queries = {
        # Tech / AI
        "tech": [
            "latest AI tools launched",
            "software development trends",
            "LLM agents recent news",
        ],

        # Startups
        "startup": [
            "AI startup funding news",
            "startup acquisitions tech",
        ],

        # Cricket
        "cricket": [
            "latest cricket match news",
            "IPL latest updates",
            "international cricket breaking news",
        ],

        # News
        "news_india": [
            "today breaking news India",
            "India government latest announcements",
        ],
        "news_usa": [
            "today breaking news USA",
            "US economy and tech policy news",
        ],
    }

    raw_results: List[Dict] = []

    for category, qs in queries.items():
        for q in qs:
            results = web_search(q, max_results=4)
            for r in results:
                r["__category_hint"] = category
                raw_results.append(r)

    if not raw_results:
        raise RuntimeError("No web search results found")

    selector = llm.with_structured_output(TrendingTopics)

    response = selector.invoke(
        [
            SystemMessage(content=EXPLORER_SYSTEM),
            HumanMessage(
                content=(
                    "Below is raw internet search data.\n"
                    "Each item may include a __category_hint.\n\n"
                    "Extract trending topics, classify them, and rank them.\n\n"
                    f"{raw_results}"
                )
            ),
        ]
    )

    return response
