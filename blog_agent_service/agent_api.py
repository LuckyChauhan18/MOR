import os
import sys
import json
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Blog Agent API")

class GenerateRequest(BaseModel):
    topic: str

class IndexRequest(BaseModel):
    blog_id: str
    text: str

class QueryRequest(BaseModel):
    blog_id: str
    rag_data: Optional[List[dict]] = None  # Optional — Qdrant is now primary
    question: str

# Re-importing or defining logic
def trigger_generation(topic: str):
    from agent_push import generate_and_push
    generate_and_push(topic)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate")
def generate_blog(request: GenerateRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(trigger_generation, request.topic)
    return {"message": "Generation started", "topic": request.topic}

@app.post("/index")
def index_blog_api(request: IndexRequest):
    from agents.rag_logic import index_content
    try:
        rag_data = index_content(request.text, request.blog_id)
        return {"blog_id": request.blog_id, "success": True, "chunks_indexed": len(rag_data)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_blog_api(request: QueryRequest):
    print(f"DEBUG: Querying blog {request.blog_id}. Question: {request.question}")
    from agents.rag_logic import query_content
    try:
        answer = query_content(request.blog_id, request.rag_data or [], request.question)
        return {"answer": answer}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
