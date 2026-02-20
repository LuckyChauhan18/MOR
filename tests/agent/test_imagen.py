import os
from pathlib import Path
from google import genai
from google.genai import types
import base64
from dotenv import load_dotenv

load_dotenv()

def _gemini_generate_image_bytes(prompt: str) -> bytes:
    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    result = client.models.generate_images(
        model="models/imagen-4.0-generate-001",
        prompt=prompt,
        config=types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="16:9",
            safety_filter_level="BLOCK_ONLY_HIGH",
        ),
    )
    if not result.images:
        raise RuntimeError("No image returned by Imagen")
    image_base64 = result.images[0].image_bytes
    return base64.b64decode(image_base64)

if __name__ == "__main__":
    try:
        print("🚀 Testing Imagen...")
        img_bytes = _gemini_generate_image_bytes("A futuristic robot in a laboratory")
        out_path = Path("test_imagen.png")
        out_path.write_bytes(img_bytes)
        print(f"✅ Success! Image saved to {out_path.absolute()}")
    except Exception as e:
        print(f"❌ Error: {e}")
