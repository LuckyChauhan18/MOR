import os
import sys
import json
import numpy as np
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import SystemMessage, HumanMessage

# Load env from parent backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def get_embeddings():
    return OpenAIEmbeddings(
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1"
    )

def get_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0
    )

def index_blog(text):
    print(f"DEBUG: Starting index_blog with {len(text)} chars", file=sys.stderr, flush=True)
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = splitter.split_text(text)
    print(f"DEBUG: Split into {len(chunks)} chunks", file=sys.stderr, flush=True)
    
    if not chunks:
        return []

    embeddings_model = get_embeddings()
    sys.stderr.write("DEBUG: Generating embeddings...\n")
    embeddings = embeddings_model.embed_documents(chunks)
    sys.stderr.write(f"DEBUG: Generated {len(embeddings)} embeddings\n")
    
    rag_data = []
    for i, chunk in enumerate(chunks):
        rag_data.append({
            "text": chunk,
            "embedding": embeddings[i]
        })
    return rag_data

def query_blog(rag_data, question):
    embeddings_model = get_embeddings()
    query_vector = embeddings_model.embed_query(question)
    
    # Simple cosine similarity search
    results = []
    for item in rag_data:
        # Assuming embedding is a list of numbers
        doc_vector = np.array(item['embedding'])
        q_vector = np.array(query_vector)
        similarity = np.dot(doc_vector, q_vector) / (np.linalg.norm(doc_vector) * np.linalg.norm(q_vector))
        results.append((item['text'], similarity))
    
    # Sort by similarity and take top 4
    results.sort(key=lambda x: x[1], reverse=True)
    context = "\n\n".join([r[0] for r in results[:4]])
    
    llm = get_llm()
    RAG_SYSTEM = """
    You are a document-grounded assistant.
    
    RULES:
    - Answer ONLY from the provided blog context.
    - If answer is not present, reply: "Not found in the provided blog."
    - Do NOT use external knowledge.
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
        if len(sys.argv) > 2 and sys.argv[2] == "--file":
            with open(sys.argv[3], 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            # Read text from stdin
            text = sys.stdin.read()
        print(json.dumps(index_blog(text)))
    elif mode == "query":
        if len(sys.argv) > 2 and sys.argv[2] == "--file":
            with open(sys.argv[3], 'r', encoding='utf-8') as f:
                input_data = json.loads(f.read())
        else:
            input_data = json.loads(sys.stdin.read())
            
        rag_data = input_data['rag_data']
        question = input_data['question']
        print(query_blog(rag_data, question))
