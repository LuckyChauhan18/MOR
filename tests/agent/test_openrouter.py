import os
import requests
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

def _generate_image_bytes(prompt: str) -> bytes:
    api_key = os.getenv("OPENROUTER_API_KEY")
    client = OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1"
    )
    response = client.images.generate(
        model="openai/dall-e-3",
        prompt=prompt,
        n=1,
        size="1024x1024"
    )
    img_url = response.data[0].url
    print(f"🔗 Image URL: {img_url}")
    return requests.get(img_url).content

if __name__ == "__main__":
    try:
        print("🚀 Testing OpenRouter Image Gen...")
        data = _generate_image_bytes("A futuristic quantum computer in 2026")
        out_path = Path("test_openrouter.png")
        out_path.write_bytes(data)
        print(f"✅ Saved to {out_path.absolute()}")
    except Exception as e:
        print(f"❌ Error: {e}")
