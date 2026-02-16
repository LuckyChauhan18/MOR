import os
import json
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
    """Store the question, answer and embedding in Redis."""
    try:
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
    query_vector = embeddings_model.embed_query(question)
    
    # 1. Search semantic cache in Redis
    if blog_id:
        cached_answer = search_semantic_cache(blog_id, query_vector)
        if cached_answer:
            print(f"DEBUG: Cache Hit for question: {question}")
            return cached_answer

    # 2. Fallback: Search similar document in MongoDB (rag_data)
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
    
    # 3. Update Redis cache with the new answer
    if blog_id:
        update_semantic_cache(blog_id, question, answer, query_vector)
        
    return answer
