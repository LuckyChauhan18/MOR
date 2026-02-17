import os
import json
import hashlib
import time
import re
import numpy as np
import redis
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import SystemMessage, HumanMessage

# Load env
load_dotenv()

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
        temperature=0,
        max_tokens=1000
    )

def get_redis_client():
    url = os.getenv("REDIS_URL", "redis://localhost:6379")
    return redis.from_url(url)

def normalize_question(q):
    """Normalize question to handle common variations and filler phrases."""
    q = q.lower().strip()
    # Remove punctuation
    q = re.sub(r'[?.\!]', '', q)
    # Remove common filler phrases that don't change intent
    fillers = [
        r'\b(of|about|in|on)\b',
        r'\b(this blog|the blog|this post|the post|this article|the article|blog|post|article)\b',
    ]
    for pattern in fillers:
        q = re.sub(pattern, '', q)
    # Clean up double spaces
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
        
        # Search for similar questions by vector (passing positionally to avoid conflicts)
        results = vector_store.similarity_search_with_score_by_vector(
            query_vector,
            k=1
        )
        
        if results:
            doc, score = results[0]
            # In Redis similarity_search_with_score, lower score often means more similar depending on distance metric
            # But let's assume we use Cosine (1 - distance) or similar.
            # langchain-redis usually returns distance.
            if score < 0.1: # Distance < 0.1 means similarity > 0.9
                return doc.metadata.get("answer")
    except Exception as e:
        print(f"Redis Cache Error: {e}")
    return None

def update_semantic_cache(blog_id, question, answer, embedding):
    """Store the question, answer and embedding in Redis with TTL for exact matches."""
    try:
        # 1. Exact match cache with TTL (2 hours)
        r = get_redis_client()
        question_norm = normalize_question(question)
        question_hash = hashlib.md5(question_norm.encode()).hexdigest()
        kv_cache_key = f"exact_cache:{blog_id}:{question_hash}"
        r.setex(kv_cache_key, 7200, answer) # TTL = 2 hours

        # 2. Semantic cache (Vector Store) - naturally supports LRU if Redis is configured
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
    except Exception as e:
        print(f"Redis Cache Update Error: {e}")

def index_content(text):
    if not text.strip():
        return []
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_text(text)
    
    if not chunks:
        return []

    embeddings_model = get_embeddings()
    embeddings = embeddings_model.embed_documents(chunks)
    
    rag_data = []
    for i, chunk in enumerate(chunks):
        rag_data.append({
            "text": chunk,
            "embedding": embeddings[i]
        })
    return rag_data

def query_content(blog_id, rag_data, question):
    if not rag_data and not blog_id:
        return "No information available for this blog."
        
    embeddings_model = get_embeddings()
    # Normalize question: remove fillers, punctuation, etc.
    question_clean = normalize_question(question)
    question_hash = hashlib.md5(question_clean.encode()).hexdigest()
    
    # 1. Check Exact Match Cache first (with TTL)
    if blog_id:
        r = get_redis_client()
        kv_cache_key = f"exact_cache:{blog_id}:{question_hash}"
        cached_answer = r.get(kv_cache_key)
        if cached_answer:
            print(f"DEBUG: Exact Cache Hit for question: {question}")
            return cached_answer.decode('utf-8')

    # 2. Check for Concurrency Lock
    lock_key = f"lock:{blog_id}:{question_hash}"
    if blog_id:
        r = get_redis_client()
        
        # We loop here to ensure we either get the lock or the answer from someone else
        for attempt in range(2): # Two main attempts to either wait or acquire
            if r.exists(lock_key):
                print(f"DEBUG: Concurrent query detected for: {question}. Waiting...")
                # Poll for the answer to appear in exact_cache (up to 20 seconds)
                for _ in range(40): 
                    time.sleep(0.5)
                    ans = r.get(kv_cache_key)
                    if ans:
                        print(f"DEBUG: Retrieved answer from concurrent sibling for: {question}")
                        return ans.decode('utf-8')
                    if not r.exists(lock_key):
                        break # Lock released, let's try to acquire it if answer still missing
            
            # Try to acquire lock (SET IF NOT EXISTS) with 60s TTL
            acquired = r.set(lock_key, "processing", ex=60, nx=True)
            if acquired:
                break # We have the lock, proceed to LLM
            else:
                # Someone else beat us to it in the millisecond between check and set
                if attempt == 1:
                    # If we still can't get it, one last check of the cache
                    ans = r.get(kv_cache_key)
                    if ans: return ans.decode('utf-8')
                    # If still no answer and no lock, we'll proceed for safety, but this shouldn't happen often
                time.sleep(0.5)

    # 3. Search semantic cache in Redis if no exact hit
    query_vector = embeddings_model.embed_query(question)
    try:
        if blog_id:
            cached_answer = search_semantic_cache(blog_id, query_vector)
            if cached_answer:
                print(f"DEBUG: Semantic Cache Hit for question: {question}")
                return cached_answer

        # 4. Fallback: Search similar document in MongoDB (rag_data)
        print(f"DEBUG: Cache Miss for question: {question}. Performing RAG...")
        
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
        top_chunks = results[:8]
        context = "\n\n".join([r[0] for r in top_chunks])
        
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
        
        answer = response.content
        
        # 5. Update Redis cache with the new answer
        if blog_id:
            update_semantic_cache(blog_id, question, answer, query_vector)
            
        return answer
    finally:
        if blog_id:
            try:
                r = get_redis_client()
                r.delete(lock_key) # Always release lock
            except:
                pass
