import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("QDRANT_URL")
api_key = os.getenv("QDRANT_API_KEY")

# Clean URL
url = url.rstrip('/')
if url.endswith('/dashboard'):
    url = url[:-10]

query_url = f"{url}/collections/blog_embeddings/points/query"
headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

payload = {
    "query": [0.0] * 1536,
    "filter": {
        "must": [
            {
                "key": "blog_id",
                "match": {"value": "6992ac479891e158a84876fc"}
            }
        ]
    },
    "limit": 1
}

print(f"Testing REST POST to: {query_url}")
response = requests.post(query_url, headers=headers, json=payload)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
