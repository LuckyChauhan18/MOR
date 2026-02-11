# explorer_agent.py
from __future__ import annotations

import os
import datetime
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
today = datetime.date.today().strftime("%B %d, %Y")
EXPLORER_SYSTEM = f"""
You are an Internet Explorer Agent. TODAY IS {today}.

Supported categories:
- AI, Software Industries, Tech, Startups
- Sport (Cricket, Football, Olympics, etc.)
- Current Affairs, Daily News
- Politics (Indian Politics, Global Geopolitics)
- Geography, Space, Exploration
- Economics, Finance, Markets

Rules:
- Focus ONLY on what is happening NOW (last 24-48 hours).
- STRICTLY REJECT any news or topics from {datetime.date.today().year - 1} or earlier.
- If the search results show old news (like from 2023), IGNORE IT COMPLETELY.
- Classify EACH topic into the correct category and region.
- Avoid gossip and low-quality clickbait.
- Prefer trending, high-interest topics with broad impact.
- Rank topics by relevance + freshness + uniqueness.

Return 8–12 total topics across categories.
"""

# --------------------------------------------------
# Web Search Tool
# --------------------------------------------------
def web_search(query: str, max_results: int = 5) -> List[Dict]:
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY missing")

    # Force news search and depth for current results
    tool = TavilySearchResults(max_results=max_results)
    return tool.invoke({"query": query}) or []

# --------------------------------------------------
# Explorer Agent
# --------------------------------------------------
def run_explorer_agent(topic: str = "AI") -> TrendingTopics:
    """
    Internet Explorer Agent:
    - Generates dynamic queries based on the provided topic
    - Researches trending sub-topics
    """
    
    current_year = datetime.date.today().year
    print(f"🔍 Generating search queries for topic: {topic} (Target Year: {current_year})")
    
    query_generator_prompt = f"""
    You are a expert news researcher. TODAY IS {today}.
    The user wants to write a blog post about the broad field of: {topic}.
    
    INSTRUCTIONS:
    - Generate 4 distinct search queries to find BREAKING NEWS and RECENT developments (from {current_year}) in this area.
    - Include terms like "latest", "breaking", "{current_year}", and "today" in your queries to ensure fresh results.
    - Ensure the queries cover different sub-sectors of {topic}.
    - Return ONLY the queries, one per line.
    """
    
    query_response = llm.invoke([
        SystemMessage(content=f"You are a helpful assistant. The current date is {today}."),
        HumanMessage(content=query_generator_prompt)
    ])
    
    dynamic_queries = [q.strip() for q in query_response.content.split('\n') if q.strip()]
    
    raw_results: List[Dict] = []

    for q in dynamic_queries:
        print(f"🔎 Searching: {q}")
        results = web_search(q, max_results=5)
        for r in results:
            r["__category_hint"] = topic
            raw_results.append(r)

    if not raw_results:
        raise RuntimeError("No web search results found")

    selector = llm.with_structured_output(TrendingTopics)

    response = selector.invoke(
        [
            SystemMessage(content=EXPLORER_SYSTEM),
            HumanMessage(
                content=(
                    f"Current Date: {today}\n"
                    "Below is raw internet search data.\n"
                    "Extract ONLY the most recent (last 2-3 days) trending topics.\n"
                    "IF A TOPIC IS FROM 2023, 2024, OR 2025, DISCARD IT.\n\n"
                    f"{raw_results}"
                )
            ),
        ]
    )

    return response
