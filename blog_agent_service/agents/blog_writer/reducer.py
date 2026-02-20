import os
import re
import base64
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from .schemas import State, GlobalImagePlan

# LLM
llm = ChatOpenAI(
    model="gpt-4o-mini",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base="https://openrouter.ai/api/v1",
    temperature=0,
    max_tokens=4096,
)

# -----------------------------
# ReducerWithImages (subgraph)
# -----------------------------
def merge_content(state: State) -> dict:
    plan = state["plan"]
    if plan is None:
        raise ValueError("merge_content called without plan.")
    ordered_sections = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
    body = "\n\n".join(ordered_sections).strip()
    merged_md = f"# {plan.blog_title}\n\n{body}\n"
    return {"merged_md": merged_md}


DECIDE_IMAGES_SYSTEM = """You are an expert technical editor.
Decide if images/diagrams are needed for THIS blog.

Rules:
- Max 3 images total.
- Each image must materially improve understanding (diagram/flow/table-like visual).
- Insert placeholders exactly: [[IMAGE_1]], [[IMAGE_2]], [[IMAGE_3]].
- If no images needed: md_with_placeholders must equal input and images=[].
- Avoid decorative images; prefer technical diagrams with short labels.
Return strictly GlobalImagePlan.
"""

def decide_images(state: State) -> dict:
    planner = llm.with_structured_output(GlobalImagePlan)
    merged_md = state["merged_md"]
    plan = state["plan"]
    assert plan is not None

    image_plan = planner.invoke(
        [
            SystemMessage(content=DECIDE_IMAGES_SYSTEM),
            HumanMessage(
                content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state['topic']}\n\n"
                    "Insert placeholders + propose image prompts.\n\n"
                    f"{merged_md}"
                )
            ),
        ]
    )

    print(f"🧠 IMAGE SPECS ({len(image_plan.images)}):", [img.placeholder for img in image_plan.images])
    if "[[IMAGE_" not in image_plan.md_with_placeholders:
        print("⚠️ WARNING: No placeholders found in md_with_placeholders!")

    return {
        "md_with_placeholders": image_plan.md_with_placeholders,
        "image_specs": [img.model_dump() for img in image_plan.images],
    }


def _generate_image_bytes(prompt: str) -> bytes:
    """
    [DISABLED] Generates image bytes using Pollinations.ai (stable fallback).
    """
    return b""


def _safe_slug(title: str) -> str:
    s = title.strip().lower()
    s = re.sub(r"[^a-z0-9 _-]+", "", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s or "blog"


def generate_and_place_images(state: State) -> dict:
    """
    [V2 Feature] Currently disabled as per user request.
    Only writes the merged markdown to the outputs directory.
    """
    plan = state["plan"]
    assert plan is not None

    md = state.get("md_with_placeholders") or state["merged_md"]
    
    # Use absolute paths
    base_dir = Path(__file__).resolve().parent.parent.parent
    output_dir = base_dir / "outputs"
    output_dir.mkdir(exist_ok=True)

    print("🚫 Image generation is disabled at this time.")

    # Remove any [[IMAGE_X]] placeholders to keep the final doc clean
    import re
    md = re.sub(r"\[\[IMAGE_\d+\]\]", "", md)

    filename = f"{_safe_slug(plan.blog_title)}.md"
    (output_dir / filename).write_text(md, encoding="utf-8")
    
    return {"final": md, "image_specs": []}
