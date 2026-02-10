# run/run_daily_blogs.py
from __future__ import annotations

import os
import sys
import logging
import datetime
from pathlib import Path
from dotenv import load_dotenv

# Add project root to sys.path to allow importing 'agents'
# Now run/run_daily_blogs.py is inside blog_agent_service/run/
# project_dir is blog_agent_service/
project_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(project_dir))

# root_dir is where .env is
root_dir = project_dir.parent
load_dotenv(root_dir / ".env")

# Setup logging
LOGS_DIR = project_dir / "logs"
LOGS_DIR.mkdir(exist_ok=True)
timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
log_file = LOGS_DIR / f"execution_{timestamp}.log"

# Configure logging to write to file AND stdout
class Unbuffered(object):
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
       # Also write to log file
       try:
           with open(log_file, "a", encoding="utf-8") as f:
               f.write(data)
       except Exception:
           pass
   def flush(self):
       self.stream.flush()

# Redirect stdout and stderr to capture all print statements from agents
sys.stdout = Unbuffered(sys.stdout)
sys.stderr = Unbuffered(sys.stderr)

print(f"📝 Logging execution to: {log_file}")

from agents.explorer.explorer_agent import run_explorer_agent
# Updated import to point to the new modular backend runner
from agents.blog_writer.runner import generate_blog

BLOGS_PER_RUN = 1

def main():
    print(f"\n🚀 One-Click Blog Run Started [{timestamp}]\n")

    try:
        print("🔍 Running Explorer Agent...")
        explorer_result = run_explorer_agent()
        topics = explorer_result.topics
        print(f"📊 Found {len(topics)} topics.")

        # Prefer tech / AI / startup for now
        preferred = [
            t for t in topics
            if t.category in {"tech", "ai", "startup"}
        ]

        if len(preferred) < BLOGS_PER_RUN:
            print("⚠️ Not enough preferred topics, using fallback")
            preferred = topics

        selected = preferred[:BLOGS_PER_RUN]

        for i, topic in enumerate(selected, 1):
            print(f"\n▶️ ({i}/{BLOGS_PER_RUN}) Processing Topic: {topic.title}")
            print(f"   Category: {topic.category}, Score: {topic.score}")
            
            try:
                content = generate_blog(topic.title)
                if content:
                    print(f"🧠 Classifying blog content...")
                    from agents.classifier_agent.blog_classifier_agent import classify_blog
                    classification = classify_blog(topic.title, content)
                    print(f"🏷️ Categories: {classification.categories}")
                    
                    # Generate filename safe slug
                    import re
                    s = topic.title.strip().lower()
                    s = re.sub(r"[^a-z0-9 _-]+", "", s)
                    s = re.sub(r"\s+", "_", s).strip("_")
                    filename_slug = s or "blog"
                    
                    # Construct metadata for export
                    metadata = {
                        "title": topic.title,
                        "date": datetime.date.today().isoformat(),
                        "categories": classification.categories,
                        "confidence_scores": classification.confidence_scores,
                        "primary_category": classification.primary_category,
                        "author": "AI Blog Agent",
                        "status": "published",
                        "source_topic_score": topic.score,
                        "content_file": f"{filename_slug}.md"
                    }
                    
                    # Save metadata
                    import json
                    outputs_dir = project_dir / "outputs"
                    outputs_dir.mkdir(exist_ok=True)
                    meta_path = outputs_dir / f"{filename_slug}_metadata.json"
                    with open(meta_path, "w", encoding="utf-8") as f:
                        json.dump(metadata, f, indent=2)
                        
                    print(f"📦 Metadata saved to: {meta_path}")

            except Exception as e:
                print(f"❌ Error generating blog for '{topic.title}': {e}")
                import traceback
                traceback.print_exc()

        print("\n✅ One-Click Blog Run Finished\n")

    except Exception as e:
        print(f"❌ Fatal error in daily run: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
