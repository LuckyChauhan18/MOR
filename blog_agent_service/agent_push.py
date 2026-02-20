import os
import json
import datetime
import requests
from pathlib import Path
from dotenv import load_dotenv
import sys
import io

# Fix for Windows console encoding issues
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Setup paths
SERVICE_DIR = Path(__file__).resolve().parent
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

# Load Env
load_dotenv(SERVICE_DIR / ".env")

from agents.blog_writer import blog_writer_app
from agents.explorer.explorer_agent import run_explorer_agent
from agents.classifier_agent.blog_classifier_agent import classify_blog

def safe_slug(title):
    import re
    s = str(title).strip().lower()
    s = re.sub(r"[^a-z0-9 _-]+", "", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s or "blog"

current_agent_topic = ""

def report_status(status, node=""):
    try:
        url = os.getenv("WEB_APP_URL", "http://localhost:5000/api/blogs/agent").replace("/agent", "/agent-status")
        key = os.getenv("AGENT_SECRET_KEY")
        requests.post(url, json={"status": status, "node": node, "topic": current_agent_topic}, headers={"x-agent-key": key}, timeout=5)
    except:
        pass

def fetch_existing_titles():
    try:
        url = os.getenv("WEB_APP_URL", "http://localhost:5000/api/blogs/agent").replace("/agent", "")
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            blogs = response.json()
            # Handle both list and object wrapping (Invoke-RestMethod style)
            if isinstance(blogs, dict) and "value" in blogs:
                blogs = blogs["value"]
            return [b.get("title", "").strip().lower() for b in blogs]
    except Exception as e:
        print(f"⚠️ Could not fetch existing blogs: {e}")
    return []

def generate_and_push(topic):
    global current_agent_topic
    
    # 1. Topic Discovery (Explorer Agent)
    existing_titles = fetch_existing_titles()
    original_topic = topic.strip().lower()
    
    # Always trigger exploration if a broad field/topic is provided
    if topic:
        print(f"🔍 Discovering fresh trending sub-topics for field: {topic}...")
        report_status("running", "Explorer")
        try:
            explorer_results = run_explorer_agent(topic)
            if explorer_results and explorer_results.topics:
                # Filter out topics that already exist
                new_topics = [t for t in explorer_results.topics if t.title.strip().lower() not in existing_titles]
                if new_topics:
                    # Pick the highest scoring new topic
                    best_topic = sorted(new_topics, key=lambda x: x.score, reverse=True)[0]
                    topic = best_topic.title
                    print(f"✨ Explorer found new topic: {topic}")
                else:
                    print("⚠️ Explorer found only existing topics. Falling back to original.")
        except Exception as e:
            print(f"⚠️ Explorer Agent failed: {e}. Using original topic.")

    current_agent_topic = topic
    print(f"🚀 Starting generation for: {topic}")
    report_status("running", "Initializing")
    
    current_date = datetime.date.today().isoformat()
    initial_state = {
        "topic": topic,
        "as_of": current_date,
        "mode": "research_heavy"
    }
    
    try:
        # 2. Generate Blog (Blog Writer Agent)
        print("🤖 AI Writer is thinking...")
        
        final_state = {}
        # Using stream to show progress on terminal
        for step in blog_writer_app.stream(initial_state, {"recursion_limit": 50}):
            for node_name, state_update in step.items():
                print(f"➡️ Node: {node_name}")
                report_status("running", node_name.capitalize())
                final_state.update(state_update)
        
        content = final_state.get("final")
        plan = final_state.get("plan")
        
        # Extract images if any
        image_specs = final_state.get("image_specs", [])
        banner_image_url = ""
        if image_specs:
            banner_image_url = f"images/{image_specs[0]['filename']}"

        if not content:
            print("❌ Agent failed to generate content.")
            report_status("error", "Generation Failed")
            return

        title = plan.blog_title if hasattr(plan, 'blog_title') else topic
        slug = safe_slug(title)
        
        # 3. Professional Classification (Classifier Agent)
        print("🏷️ Classifying blog content...")
        report_status("running", "Classifier")
        try:
            classification = classify_blog(title, content)
            assigned_categories = classification.categories
            print(f"✅ Categories assigned: {assigned_categories}")
        except Exception as e:
            print(f"⚠️ Classifier failed: {e}. Using fallback categories.")
            assigned_categories = getattr(plan, 'categories', ["AI", "Tech"])

        # 4. Save locally
        outputs_dir = SERVICE_DIR / "outputs"
        outputs_dir.mkdir(exist_ok=True)
        
        md_path = outputs_dir / f"{slug}.md"
        meta_path = outputs_dir / f"{slug}_metadata.json"
        
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        metadata = {
            "title": title,
            "content_file": f"{slug}.md",
            "categories": assigned_categories,
            "author": "AI Expert Agent",
            "date": current_date,
            "banner_image_url": banner_image_url 
        }
        
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
            
        print(f"✅ Blog saved locally: {md_path}")

        # 4b. Copy images to backend
        if image_specs:
            banner_img = banner_image_url
            if banner_img and banner_img.startswith("images/"):
                img_name = banner_img.split("/")[-1]
                src_path = SERVICE_DIR / "images" / img_name
                # Try to copy to backend's images folder
                dest_dir = SERVICE_DIR.parent / "blog_web_app" / "backend" / "images"
                if src_path.exists() and dest_dir.exists():
                    import shutil
                    shutil.copy(src_path, dest_dir / img_name)
                    print(f"🖼️ Copied banner image to backend: {img_name}")
                elif not dest_dir.exists():
                    print(f"⚠️ Warning: Backend images directory not found at {dest_dir}")

        # 5. Push to Web App
        WEB_APP_URL = os.getenv("WEB_APP_URL", "http://localhost:5000/api/blogs/agent")
        AGENT_SECRET_KEY = os.getenv("AGENT_SECRET_KEY")

        payload = {
            "title": title,
            "content": content,
            "categories": assigned_categories,
            "author": "AI Expert Agent",
            "date": current_date,
            "bannerImage": banner_image_url
        }

        headers = {
            "x-agent-key": AGENT_SECRET_KEY,
            "Content-Type": "application/json"
        }

        print(f"📤 Pushing to {WEB_APP_URL}...")
        response = requests.post(WEB_APP_URL, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✨ SUCCESS! Blog published: {title}")
            report_status("idle", "Published!")
        else:
            print(f"❌ Failed to push: {response.status_code} - {response.text}")
            report_status("error", "Push Failed")

    except Exception as e:
        print(f"❌ Error: {e}")
        report_status("error", "System Error")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    priority_topic = sys.argv[1] if len(sys.argv) > 1 else "Trending AI News"
    generate_and_push(priority_topic)
