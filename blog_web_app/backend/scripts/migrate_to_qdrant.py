"""
Migration Script: Move ragData embeddings from MongoDB to Qdrant Cloud.

This script:
1. Connects to MongoDB and reads all blogs with ragData
2. Upserts the embeddings to Qdrant Cloud
3. Sets ragIndexed=true and removes ragData from MongoDB
"""
import os
import sys
import uuid
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from pymongo import MongoClient
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue
)

QDRANT_COLLECTION = "blog_embeddings"
VECTOR_SIZE = 1536  # text-embedding-3-small dimension

def main():
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("ERROR: MONGO_URI not set in .env")
        sys.exit(1)
    
    mongo_client = MongoClient(mongo_uri)
    # The app uses 'test' database (default for Atlas connections without db path)
    db = mongo_client["test"]
    blogs_collection = db["blogs"]
    
    # Connect to Qdrant
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_key = os.getenv("QDRANT_API_KEY")
    if not qdrant_url or not qdrant_key:
        print("ERROR: QDRANT_URL or QDRANT_API_KEY not set in .env")
        sys.exit(1)
    
    qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_key)
    
    # Create collection if needed
    collections = [c.name for c in qdrant.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        qdrant.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        print(f"✅ Created Qdrant collection '{QDRANT_COLLECTION}'")
    else:
        print(f"ℹ️  Qdrant collection '{QDRANT_COLLECTION}' already exists")
    
    # Find all blogs with ragData
    blogs = list(blogs_collection.find(
        {"ragData": {"$exists": True, "$not": {"$size": 0}}},
        {"_id": 1, "title": 1, "ragData": 1}
    ))
    
    print(f"\n📦 Found {len(blogs)} blogs with ragData to migrate\n")
    
    if len(blogs) == 0:
        print("Nothing to migrate. All blogs may have already been migrated.")
        return
    
    total_points = 0
    migrated = 0
    
    for blog in blogs:
        blog_id = str(blog["_id"])
        title = blog.get("title", "Unknown")
        rag_data = blog.get("ragData", [])
        
        if not rag_data:
            continue
        
        # Build Qdrant points
        points = []
        skipped = 0
        for i, item in enumerate(rag_data):
            embedding = item.get("embedding")
            text = item.get("text", "")
            
            if not embedding or len(embedding) != VECTOR_SIZE:
                skipped += 1
                continue
            
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{blog_id}_{i}"))
            points.append(PointStruct(
                id=point_id,
                vector=embedding,
                payload={"blog_id": blog_id, "text": text, "chunk_index": i}
            ))
        
        if not points:
            print(f"  ⚠️  [{title}] — no valid embeddings (skipped {skipped})")
            continue
        
        # Upsert to Qdrant
        qdrant.upsert(collection_name=QDRANT_COLLECTION, points=points)
        total_points += len(points)
        migrated += 1
        
        # Update MongoDB: set ragIndexed=true, remove ragData
        blogs_collection.update_one(
            {"_id": blog["_id"]},
            {
                "$set": {"ragIndexed": True},
                "$unset": {"ragData": ""}
            }
        )
        
        print(f"  ✅ [{title}] — {len(points)} chunks migrated" + (f" ({skipped} skipped)" if skipped else ""))
    
    print(f"\n{'='*50}")
    print(f"🎉 Migration complete!")
    print(f"   Blogs migrated: {migrated}/{len(blogs)}")
    print(f"   Total vectors in Qdrant: {total_points}")
    print(f"   ragData removed from MongoDB: {migrated} documents")
    
    # Verify
    collection_info = qdrant.get_collection(QDRANT_COLLECTION)
    print(f"\n📊 Qdrant Collection Status:")
    print(f"   Total points: {collection_info.points_count}")
    print(f"   Vector size: {collection_info.config.params.vectors.size}")

if __name__ == "__main__":
    main()
