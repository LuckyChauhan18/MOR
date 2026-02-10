import torch
from diffusers import StableDiffusionPipeline
import os

def download_model():
    model_id = "runwayml/stable-diffusion-v1-5"
    local_path = "./models/stable-diffusion-v1-5"
    
    print(f"⏳ Downloading model: {model_id}...")
    print(f"📂 Destination: {os.path.abspath(local_path)}")
    
    # Download and load pipeline
    # We use float16 to save space and bandwidth, suitable for most consumer GPUs
    # If using CPU only, float32 might be safer but float16 often works with newer torch versions
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id, 
            torch_dtype=torch.float16,
            use_safetensors=True
        )
        
        # Save to local directory
        pipe.save_pretrained(local_path)
        print("✅ Model downloaded and saved successfully!")
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")

if __name__ == "__main__":
    download_model()
