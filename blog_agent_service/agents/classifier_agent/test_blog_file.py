from pathlib import Path
from agents.classifier_agent.blog_classifier_agent import classify_blog


def load_blog_file(path: str):
    text = Path(path).read_text(encoding="utf-8").strip()

    lines = text.splitlines()

    # Extract title (Markdown or fallback)
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()
        content = "\n".join(lines[1:]).strip()
    else:
        title = "Untitled Blog"
        content = text

    return title, content


if __name__ == "__main__":
    blog_path = r"C:/Users/Lucky/OneDrive/Desktop/AI/Blog Genrator/outputs/cricket_world_cup_2026_latest_updates_and_insights.md"

    title, content = load_blog_file(blog_path)

    print(f"Path: {blog_path}")
    print(f"Title: {title}")
    print(f"Content Length: {len(content)}")
    
    result = classify_blog(title=title, content=content)

    print("\n[BLOG FILE CLASSIFICATION RESULT]\n")
    print("Categories:", result.categories)
    print("Confidence Map:")
    for cat, score in result.confidence_map.items():
        print(f"  - {cat}: {score}")

    print("\nReasoning:")
    print(result.reasoning)
