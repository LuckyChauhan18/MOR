import os
from dotenv import load_dotenv

# Replicate the logic in rag_service.py
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

print(f"ENV_PATH: {os.path.abspath(env_path)}")
print(f"EXISTS: {os.path.exists(env_path)}")
print(f"QDRANT_URL: {os.getenv('QDRANT_URL')}")
print(f"QDRANT_API_KEY: {os.getenv('QDRANT_API_KEY')[:10]}...")
