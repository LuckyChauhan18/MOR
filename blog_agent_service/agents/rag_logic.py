import os
import json
import numpy as np
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

def query_content(rag_data, question):
    if not rag_data:
        return "No information available for this blog."
        
    embeddings_model = get_embeddings()
    query_vector = embeddings_model.embed_query(question)
    
    # Simple cosine similarity search
    results = []
    for item in rag_data:
        if 'embedding' not in item or not item['embedding']:
            continue
        doc_vector = np.array(item['embedding'])
        q_vector = np.array(query_vector)
        
        # Check if dimensions match
        if doc_vector.shape != q_vector.shape:
            continue
            
        similarity = np.dot(doc_vector, q_vector) / (np.linalg.norm(doc_vector) * np.linalg.norm(q_vector))
        results.append((item['text'], similarity))
    
    # Sort by similarity and take top 8
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
    
    return response.content
