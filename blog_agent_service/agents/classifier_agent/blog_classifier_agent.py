from __future__ import annotations

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .schemas import BlogClassification

# --------------------------------------------------
# Environment
# --------------------------------------------------
from pathlib import Path
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY missing")

# --------------------------------------------------
# LLM
# --------------------------------------------------
llm = ChatOpenAI(
    model="openai/gpt-4o-mini",
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0,
    max_tokens=4096,
)

# --------------------------------------------------
# System Prompt
# --------------------------------------------------
CLASSIFIER_SYSTEM = """
You are a multi-label blog classification agent.

Your task:
- Analyze blog title and content
- Assign ALL relevant categories (1–5)
- Provide confidence score (1–100) for each category

Allowed categories:
ai, software, web_development, backend, frontend,
devops, startup, cricket, sports,
news_india, news_usa, general

Rules:
- A blog can belong to multiple categories
- Only include categories that are truly relevant
- Confidence ≥70 means strong relevance
- Cricket is separate from sports
- India/USA news only if news-focused
- Avoid over-tagging
"""

# --------------------------------------------------
# Classifier Function
# --------------------------------------------------

from langchain_core.output_parsers import PydanticOutputParser

def classify_blog(
    title: str,
    content: str,
) -> BlogClassification:
    """
    Multi-label blog classification.
    Works for AI-generated and human-written blogs.
    """
    
    parser = PydanticOutputParser(pydantic_object=BlogClassification)
    
    # Inject format instructions into the system prompt or human message
    format_instructions = parser.get_format_instructions()
    
    final_system_prompt = f"{CLASSIFIER_SYSTEM}\n\n{format_instructions}"

    prompt_content = (
        f"Blog title:\n{title}\n\n"
        f"Blog content:\n{content[:6000]}"
    )
    
    # Raw invoke
    response = llm.invoke(
        [
            SystemMessage(content=final_system_prompt),
            HumanMessage(content=prompt_content),
        ]
    )
    
    # Parse
    try:
        return parser.parse(response.content)
    except Exception as e:
        # Fallback if parsing fails (e.g. invalid JSON)
        print(f"Parsing failed: {e}")
        print(f"Raw content: {response.content}")
        raise e
