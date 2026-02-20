import os
import base64
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def generate_image(prompt, output_file="gemini_generated.png"):
    """
    Generates image bytes using Gemini Imagen.
    Requires:
      pip install google-genai
      env: GOOGLE_API_KEY
    """
    from google import genai
    from google.genai import types

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in environment")
        return

    print("🚀 Initializing Gemini Client...")
    client = genai.Client(api_key=api_key)

    print(f"🎨 Generating image for prompt: '{prompt}'...")
    try:
        result = client.models.generate_images(
            model="imagen-3.0-generate-001",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                safety_filter_level="BLOCK_ONLY_HIGH",
            ),
        )

        if not result.images:
            print("❌ No image returned by Imagen")
            return

        # Imagen returns base64
        image_base64 = result.images[0].image_bytes
        img_bytes = base64.b64decode(image_base64)
        
        Path(output_file).write_bytes(img_bytes)
        print(f"✅ Image saved to {output_file}")
        print(f"📂 Location: {os.path.abspath(output_file)}")

    except Exception as e:
        print(f"❌ Error generating image: {e}")

if __name__ == "__main__":
    prompt = "image of transformer in a futuristic cityscape at sunset, vibrant colors, cinematic lighting, highly detailed"
    generate_image(prompt)
