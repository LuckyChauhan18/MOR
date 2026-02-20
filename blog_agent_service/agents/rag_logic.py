import os
import json
import hashlib
import time
import re
import uuid
import numpy as np
import redis
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import SystemMessage, HumanMessage
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue
)

# Load env
load_dotenv()

QDRANT_COLLECTION = "blog_embeddings"
VECTOR_SIZE = 1536  # text-embedding-3-small dimension

def get_embeddings():
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        print("CRITICAL: OPENROUTER_API_KEY is missing!")
    return OpenAIEmbeddings(
        model="openai/text-embedding-3-small",
        openai_api_key=key,
        openai_api_base="https://openrouter.ai/api/v1"
    )

def get_llm():
    return ChatOpenAI(
        model="openai/gpt-4o-mini",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0,
        max_tokens=1000
    )

def get_qdrant_client():
    """Get a Qdrant Cloud client."""
    return QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )

def ensure_collection():
    """Create the Qdrant collection if it doesn't exist."""
    client = get_qdrant_client()
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        print(f"DEBUG: Created Qdrant collection '{QDRANT_COLLECTION}'")
        
        # Ensure payload index for filtering
        try:
            from qdrant_client.models import PayloadSchemaType
            client.create_payload_index(
                collection_name=QDRANT_COLLECTION,
                field_name="blog_id",
                field_schema=PayloadSchemaType.KEYWORD,
            )
            print(f"DEBUG: Created payload index for 'blog_id'")
        except Exception as e:
            print(f"DEBUG: Failed to create payload index: {e}")
    return client

def get_redis_client():
    url = os.getenv("REDIS_URL", "redis://localhost:6379")
    log_url = re.sub(r':([^:@]+)@', ':****@', url)
    print(f"DEBUG: Connecting to Redis at {log_url}")
    return redis.from_url(url)

def normalize_question(q):
    """Normalize question to handle common variations and filler phrases."""
    q = q.lower().strip()
    q = re.sub(r'[?.\!]', '', q)
    fillers = [
        r'\b(what is|what are|tell me|explain|summarize|who is|show me)\b',
        r'\b(of|about|in|on|the|a|an)\b',
        r'\b(this blog|the blog|this post|the post|this article|the article|blog|post|article)\b',
    ]
    for pattern in fillers:
        q = re.sub(pattern, ' ', q)
    q = re.sub(r'\s+', ' ', q).strip()
    return q

def search_semantic_cache(blog_id, query_vector, threshold=0.9):
    """Search Redis for a similar question already answered for this blog."""
    try:
        from langchain_redis import RedisVectorStore
        embeddings = get_embeddings()
        vector_store = RedisVectorStore(
            embeddings,
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
            index_name=f"cache:{blog_id}"
        )
        
        results = vector_store.similarity_search_with_score_by_vector(
            query_vector,
            k=1
        )
        
        if results:
            doc, score = results[0]
            if score < 0.2: 
                return doc.metadata.get("answer")
    except Exception as e:
        print(f"Redis Semantic Cache Error: {e}")
    return None

def update_semantic_cache(blog_id, question, answer, embedding):
    """Store the question, answer and embedding in Redis with TTL for exact matches."""
    try:
        r = get_redis_client()
        question_norm = normalize_question(question)
        question_hash = hashlib.md5(question_norm.encode()).hexdigest()
        kv_cache_key = f"exact_cache:{blog_id}:{question_hash}"
        r.setex(kv_cache_key, 7200, answer)

        from langchain_redis import RedisVectorStore
        from langchain_core.documents import Document
        
        embeddings = get_embeddings()
        vector_store = RedisVectorStore(
            embeddings,
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
            index_name=f"cache:{blog_id}"
        )
        
        doc = Document(
            page_content=question,
            metadata={"answer": answer, "blog_id": blog_id}
        )
        vector_store.add_documents([doc])
        print(f"DEBUG: Saved to Redis Cache for blog {blog_id}: {question_norm}")
    except Exception as e:
        print(f"Redis Cache Update Error: {e}")

def index_content(text, blog_id):
    """Split text into chunks, embed them, and upsert into Qdrant."""
    if not text.strip():
        return []
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_text(text)
    
    if not chunks:
        return []

    embeddings_model = get_embeddings()
    embeddings = embeddings_model.embed_documents(chunks)
    
    # Upsert to Qdrant
    client = ensure_collection()
    
    # Delete old vectors for this blog first (in case of re-indexing)
    try:
        client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=Filter(
                must=[FieldCondition(key="blog_id", match=MatchValue(value=blog_id))]
            )
        )
    except Exception:
        pass  # Collection might not have old data
    
    points = []
    for i, chunk in enumerate(chunks):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{blog_id}_{i}"))
        points.append(PointStruct(
            id=point_id,
            vector=embeddings[i],
            payload={
                "blog_id": blog_id,
                "text": chunk,
                "chunk_index": i
            }
        ))
    
    client.upsert(collection_name=QDRANT_COLLECTION, points=points)
    print(f"DEBUG: Indexed {len(points)} chunks to Qdrant for blog {blog_id}")
    
    # Return lightweight rag_data (text only, no embeddings) for backward compat
    return [{"text": chunk} for chunk in chunks]

def get_basic_response(question):
    """Return hardcoded formal responses for basic greetings/questions."""
    q = normalize_question(question)
    
    responses = {
        "hello": "Greetings! How may I assist you today with information regarding this blog post?",
        "hey": "Greetings! How may I assist you today with information regarding this blog post?",
        "hi": "Greetings! How may I assist you today with information regarding this blog post?",
        "how are you": "I am functioning optimally and ready to assist you with your inquiries. How can I help you regarding this blog?",
        "who are you": "I am the AI Blog Assistant, dedicated to helping you understand and explore the content of this platform.",
        "thanks": "You are most welcome. Is there anything else you would like to know about the blog?",
        "thank you": "You are most welcome. Is there anything else you would like to know about the blog?"
    }
    
    return responses.get(q)

def query_content(blog_id, rag_data, question):
    """Query blog content using Qdrant vector search instead of in-memory numpy."""
    if not blog_id:
        return "No information available for this blog."
    
    # 0. Check for Basic Greetings
    basic_ans = get_basic_response(question)
    if basic_ans:
        print(f"DEBUG: Basic hardcoded response triggered for: {question}")
        return basic_ans
        
    embeddings_model = get_embeddings()
    question_clean = normalize_question(question)
    question_hash = hashlib.md5(question_clean.encode()).hexdigest()
    
    # 1. Check Exact Match Cache first
    if blog_id:
        try:
            r = get_redis_client()
            kv_cache_key = f"exact_cache:{blog_id}:{question_hash}"
            cached_answer = r.get(kv_cache_key)
            if cached_answer:
                print(f"DEBUG: Exact Cache Hit for: {question_clean}")
                return cached_answer.decode('utf-8')
        except Exception as e:
            print(f"Redis Exact Cache Error: {e}")

    # 2. Concurrency Lock
    lock_key = f"lock:{blog_id}:{question_hash}"
    if blog_id:
        r = get_redis_client()
        
        for attempt in range(2):
            if r.exists(lock_key):
                print(f"DEBUG: Concurrent query detected for: {question}. Waiting...")
                for _ in range(40): 
                    time.sleep(0.5)
                    ans = r.get(kv_cache_key)
                    if ans:
                        print(f"DEBUG: Retrieved answer from concurrent sibling for: {question}")
                        return ans.decode('utf-8')
                    if not r.exists(lock_key):
                        break
            
            acquired = r.set(lock_key, "processing", ex=60, nx=True)
            if acquired:
                break
            else:
                if attempt == 1:
                    ans = r.get(kv_cache_key)
                    if ans: return ans.decode('utf-8')
                time.sleep(0.5)

    try:
        # 3. Check Semantic Cache in Redis
        try:
            print(f"DEBUG: Embedding question for semantic cache search...")
            query_vector = embeddings_model.embed_query(question)
            if blog_id:
                cached_answer = search_semantic_cache(blog_id, query_vector)
                if cached_answer:
                    print(f"DEBUG: Semantic Cache Hit for question: {question}")
                    return cached_answer
        except Exception as e:
            print(f"DEBUG: Semantic Cache / Embedding Error: {e}")
            if 'query_vector' not in locals():
                return "AI service is experiencing high latency. Please try again."

        # 4. Search Qdrant for similar chunks
        print(f"DEBUG: Cache Miss for question: {question}. Performing Qdrant RAG...")
        
        client = get_qdrant_client()
        try:
            search_results = client.query_points(
                collection_name=QDRANT_COLLECTION,
                query=query_vector,
                query_filter=Filter(
                    must=[FieldCondition(key="blog_id", match=MatchValue(value=blog_id))]
                ),
                limit=8
            )
            top_chunks = [hit.payload["text"] for hit in search_results.points]
            print(f"DEBUG: Qdrant query_points success. Found {len(top_chunks)} points.")
        except Exception as qe:
            print(f"DEBUG: Qdrant Query Error: {qe}")
            top_chunks = []
        
        if not top_chunks:
            # Fallback: use rag_data from MongoDB if Qdrant has no data
            if rag_data:
                print("DEBUG: Qdrant returned no results, falling back to MongoDB rag_data")
                results = []
                for item in rag_data:
                    if 'embedding' not in item or not item['embedding']:
                        continue
                    doc_vector = np.array(item['embedding'])
                    q_vector = np.array(query_vector)
                    if doc_vector.shape != q_vector.shape:
                        continue
                    similarity = np.dot(doc_vector, q_vector) / (np.linalg.norm(doc_vector) * np.linalg.norm(q_vector))
                    results.append((item['text'], similarity))
                results.sort(key=lambda x: x[1], reverse=True)
                top_chunks = [r[0] for r in results[:8]]
            
            if not top_chunks:
                return "No information available for this blog."
        
        context = "\n\n".join(top_chunks)
        
        llm = get_llm()
        RAG_SYSTEM = """
        You are a helpful assistant that answers questions based on the provided blog content.
        
        INSTRUCTIONS:
        - Use the provided context to answer the question accurately.
        - If the answer is not explicitly stated but can be inferred from the context, provide the inference clearly.
        - Only if there is absolutely no relevant information, say: "Not found in the provided blog."
        - Keep responses concise and professional.
        """
        
        try:
            print(f"DEBUG: Invoking OpenRouter LLM for answer...")
            response = llm.invoke([
                SystemMessage(content=RAG_SYSTEM),
                HumanMessage(content=f"Blog context:\n{context}\n\nQuestion: {question}")
            ])
            answer = response.content
        except Exception as le:
            print(f"DEBUG: LLM Invoke Error: {le}")
            return f"AI failed to generate a response (LLM Error). Details: {str(le)[:100]}"
        
        # 5. Update Redis cache
        if blog_id:
            update_semantic_cache(blog_id, question, answer, query_vector)
            
        return answer
    finally:
        if blog_id:
            try:
                r = get_redis_client()
                r.delete(lock_key)
            except:
                pass
