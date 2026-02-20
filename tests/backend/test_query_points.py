from qdrant_client import QdrantClient, models
import os

url = "https://d5352460-a83b-47e6-a9d0-1c18006a26d8.us-east-1-1.aws.cloud.qdrant.io:6333"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.vKiAlkp3cnZ88ZRoegwSnE7JgcubyofBo5y7hUvTiHc"

client = QdrantClient(url=url, api_key=api_key)
vector = [0.0] * 1536
blog_id = "6992ac479891e158a84876fc"

print("--- Testing 'query_filter' ---")
try:
    client.query_points(
        collection_name="blog_embeddings",
        query=vector,
        query_filter=models.Filter(must=[models.FieldCondition(key="blog_id", match=models.MatchValue(value=blog_id))]),
        limit=1
    )
    print("query_filter works!")
except Exception as e:
    print(f"query_filter failed: {e}")

print("\n--- Testing 'filter' ---")
try:
    client.query_points(
        collection_name="blog_embeddings",
        query=vector,
        filter=models.Filter(must=[models.FieldCondition(key="blog_id", match=models.MatchValue(value=blog_id))]),
        limit=1
    )
    print("filter works!")
except Exception as e:
    print(f"filter failed: {e}")

print("\n--- Testing 'query' with Filter ---")
try:
    # Some versions allow passing filter in query? No, usually separate.
    pass
except:
    pass
