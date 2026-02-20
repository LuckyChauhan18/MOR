import requests
import json
import os
import glob
from pathlib import Path
from dotenv import load_dotenv

# Load config from the local .env
project_root = Path(__file__).parent
load_dotenv(project_root / ".env")

# Configuration for Web App
# Note: AGENT_SECRET_KEY is now loaded from .env
WEB_APP_URL = os.getenv("WEB_APP_URL", "http://localhost:5000/api/blogs/agent")
AGENT_SECRET_KEY = os.getenv("AGENT_SECRET_KEY", "change_me_in_env")

def push_blogs():
    outputs_dir = project_root / "outputs"
    if not outputs_dir.exists():
        print(f"❌ Outputs directory not found: {outputs_dir}")
        return

    # Find all metadata json files
    meta_files = glob.glob(str(outputs_dir / "*_metadata.json"))
    
    if not meta_files:
        print("ℹ️ No blogs found to push.")
        return

    for meta_path in meta_files:
        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Determine content path
            content_filename = metadata.get("content_file")
            if not content_filename:
                print(f"⚠️ No content file specified in metadata: {meta_path}")
                continue

            content_path = outputs_dir / content_filename
            
            if not content_path.exists():
                print(f"⚠️ Content file not found for {metadata.get('title')}: {content_path}")
                continue
                
            with open(content_path, 'r', encoding='utf-8') as f:
                content = f.read()

            payload = {
                "title": metadata.get("title"),
                "content": content,
                "categories": metadata.get("categories", []),
                "author": metadata.get("author", "Agent"),
                "date": metadata.get("date"),
                "bannerImage": metadata.get("banner_image_url")
            }

            # Optional: Copy images to backend if running locally
            banner_img = metadata.get("banner_image_url")
            if banner_img and banner_img.startswith("images/"):
                img_name = banner_img.split("/")[-1]
                src_path = project_root / "images" / img_name
                # Try to copy to backend's images folder
                dest_dir = project_root.parent / "blog_web_app" / "backend" / "images"
                if src_path.exists() and dest_dir.exists():
                    import shutil
                    shutil.copy(src_path, dest_dir / img_name)
                    print(f"🖼️ Copied image to backend: {img_name}")

            headers = {
                "x-agent-key": AGENT_SECRET_KEY,
                "Content-Type": "application/json"
            }

            response = requests.post(WEB_APP_URL, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                print(f"✅ Successfully pushed: {metadata.get('title')}")
            else:
                print(f"❌ Failed to push {metadata.get('title')}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error processing {meta_path}: {e}")

if __name__ == "__main__":
    push_blogs()
