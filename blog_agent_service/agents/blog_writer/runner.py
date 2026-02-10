import datetime
from agents.blog_writer import blog_writer_app

def generate_blog(topic: str) -> str:
    """
    Triggers the blog writer agent for a given topic.
    Returns the final markdown content.
    """
    print(f"🚀 [Runner] Starting generation for: {topic}")
    
    inputs = {
        "topic": topic,
        "as_of": datetime.date.today().isoformat()
    }
    
    # Invoke the graph
    # Recursion limit can be adjusted if needed
    output = blog_writer_app.invoke(inputs, {"recursion_limit": 50})
    
    final_md = output.get("final")
    if final_md:
        print(f"✅ [Runner] Blog generated: {topic}")
        return final_md
    else:
        print(f"❌ [Runner] Failed to generate blog: {topic}")
        return ""
