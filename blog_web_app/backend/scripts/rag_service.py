import os
import sys
import json
import uuid
import numpy as np

print("DEBUG: rag_service.py VERSION: 2026-02-19-V2 (query_points)", file=sys.stderr)
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import SystemMessage, HumanMessage
import requests
from qdrant_client import QdrantClient, models
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue
)

# Load env from parent backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

QDRANT_COLLECTION = "blog_embeddings"
VECTOR_SIZE = 1536

def get_embeddings():
    return OpenAIEmbeddings(
        model="openai/text-embedding-3-small",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1"
    )

def get_llm():
    return ChatOpenAI(
        model="openai/gpt-4o-mini",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0
    )

def get_qdrant_client():
    url = os.getenv("QDRANT_URL")
    # Clean URL: strip trailing slashes and /dashboard
    url = url.rstrip('/')
    if url.endswith('/dashboard'):
        url = url[:-10]
    
    return QdrantClient(
        url=url,
        api_key=os.getenv("QDRANT_API_KEY"),
    )

def ensure_collection():
    client = get_qdrant_client()
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        print(f"Created Qdrant collection '{QDRANT_COLLECTION}'")
    return client

def index_blog(text, blog_id):
    if not text.strip():
        return []
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_text(text)
    
    if not chunks:
        return []

    embeddings_model = get_embeddings()
    embeddings = embeddings_model.embed_documents(chunks)
    
    client = ensure_collection()
    
    # Delete old vectors for this blog
    try:
        client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=Filter(
                must=[FieldCondition(key="blog_id", match=MatchValue(value=blog_id))]
            )
        )
    except Exception:
        pass
    
    points = []
    for i, chunk in enumerate(chunks):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{blog_id}_{i}"))
        points.append(PointStruct(
            id=point_id,
            vector=embeddings[i],
            payload={"blog_id": blog_id, "text": chunk, "chunk_index": i}
        ))
    
    client.upsert(collection_name=QDRANT_COLLECTION, points=points)
    print(f"Indexed {len(points)} chunks to Qdrant for blog {blog_id}")
    return [{"text": chunk} for chunk in chunks]

def query_blog(blog_id, question):
    print(f"DEBUG: Querying blog {blog_id} with question: {question}", file=sys.stderr)
    if not blog_id:
        return "No information available for this blog."
        
    print("DEBUG: Getting embeddings...", file=sys.stderr)
    embeddings_model = get_embeddings()
    try:
        query_vector = embeddings_model.embed_query(question)
        print(f"DEBUG: Got query vector (type={type(query_vector)}, len={len(query_vector)})", file=sys.stderr)
        if hasattr(query_vector, 'tolist'):
            print("DEBUG: Converting query_vector to list", file=sys.stderr)
            query_vector = query_vector.tolist()
    except Exception as e:
        print(f"DEBUG: Embedding failed (Check OPENROUTER_API_KEY): {e}", file=sys.stderr)
        raise e
    
    try:
        print("DEBUG: searching Qdrant using query_points API...", file=sys.stderr)
        client = get_qdrant_client()
        
        # Using query_points as this version of qdrant-client lacks 'search'
        search_results = client.query_points(
            collection_name=QDRANT_COLLECTION,
            query=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="blog_id",
                        match=models.MatchValue(value=blog_id)
                    )
                ]
            ),
            limit=8
        )
        
        # query_points returns a objects with .points attribute
        points = search_results.points
        print(f"DEBUG: Found {len(points)} points", file=sys.stderr)
        top_chunks = [hit.payload["text"] for hit in points]
        
        if not top_chunks:
            return "No information available for this blog."
            
        context = "\n\n".join(top_chunks)
    except Exception as e:
        print(f"DEBUG: Qdrant search failed: {e}", file=sys.stderr)
        # Try to extract the response if it's a qdrant_client exception
        try:
            from qdrant_client.http.exceptions import UnexpectedResponse
            if isinstance(e, UnexpectedResponse):
                print(f"DEBUG: Qdrant Error Content: {e.content}", file=sys.stderr)
        except:
            pass
        raise e
    
    llm = get_llm()
    RAG_SYSTEM = """
    You are a helpful assistant that answers questions based on the provided blog content.
    
    INSTRUCTIONS:
    - Use the provided context to answer the question accurately.
    - If the answer is not explicitly stated but can be inferred from the context, provide the inference clearly.
    - Only if there is absolutely no relevant information, say: "Not found in the provided blog."
    - Keep responses concise and professional.
    """
    
    response = llm.invoke([
        SystemMessage(content=RAG_SYSTEM),
        HumanMessage(content=f"Blog context:\n{context}\n\nQuestion: {question}")
    ])
    
    return response.content

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python rag_service.py <index|query> [args...]")
        sys.exit(1)
        
    mode = sys.argv[1]
    if mode == "index":
        blog_id = sys.argv[2] if len(sys.argv) > 2 else "unknown"
        if len(sys.argv) > 3 and sys.argv[3] == "--file":
            with open(sys.argv[4], 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            text = sys.stdin.read()
        result = index_blog(text, blog_id)
        print(json.dumps({"success": True, "chunks": len(result)}))
    elif mode == "query":
        if len(sys.argv) > 2 and sys.argv[2] == "--file":
            with open(sys.argv[3], 'r', encoding='utf-8') as f:
                input_data = json.loads(f.read())
        else:
            input_data = json.loads(sys.stdin.read())
            
        blog_id = input_data['blog_id']
        question = input_data['question']
        print(query_blog(blog_id, question))
