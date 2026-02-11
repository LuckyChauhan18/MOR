import os
import sys
import json
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import requests
from dotenv import load_dotenv

# Load common logic from agent_push.py and rag_service.py
# (We might need to refactor these to be importable or just re-implement minimal versions here)

load_dotenv()

app = FastAPI(title="Blog Agent API")

class GenerateRequest(BaseModel):
    topic: str

class IndexRequest(BaseModel):
    blog_id: str
    text: str

class QueryRequest(BaseModel):
    rag_data: List[dict]
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
    # This logic was originally in backend/scripts/rag_service.py
    # We'll need to make sure rag_service.py is accessible or copied to this container
    from agents.rag_logic import index_content
    try:
        rag_data = index_content(request.text)
        return {"blog_id": request.blog_id, "rag_data": rag_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_blog_api(request: QueryRequest):
    from agents.rag_logic import query_content
    try:
        answer = query_content(request.rag_data, request.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
