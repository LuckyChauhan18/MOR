from qdrant_client import QdrantClient, models
import os

url = "https://d5352460-a83b-47e6-a9d0-1c18006a26d8.us-east-1-1.aws.cloud.qdrant.io:6333"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.vKiAlkp3cnZ88ZRoegwSnE7JgcubyofBo5y7hUvTiHc"

client = QdrantClient(url=url, api_key=api_key)
vector = [0.0] * 1536

print("--- Testing minimal client.query ---")
try:
    results = client.query(
        collection_name="blog_embeddings",
        query=vector,
        limit=1
    )
    print("Minimal client.query works!")
    print(f"Found {len(results)} points.")
except Exception as e:
    print(f"Minimal client.query failed: {e}")
    if hasattr(e, 'response'):
        print(f"Response: {e.response.text}")
