import os
import sys
from dotenv import load_dotenv

# Load env from .env
load_dotenv('.env')

print("1. Testing imports...")
try:
    from qdrant_client import QdrantClient
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_core.messages import SystemMessage, HumanMessage
    import numpy as np
    import json
    print(f"   Imports successful. Python: {sys.version}")
    import qdrant_client
    print(f"   qdrant_client source: {qdrant_client.__file__}")
except Exception as e:
    print(f"   Import failed: {e}")
    sys.exit(1)

print("2. Testing Qdrant Connection...")
try:
    url = os.getenv("QDRANT_URL")
    key = os.getenv("QDRANT_API_KEY")
    # ... (connection details omitted for brevity in replace block if matching context)
    client = QdrantClient(url=url, api_key=key)
    print(f"   Client type: {type(client)}")
    methods = [m for m in dir(client) if not m.startswith('_')]
    import qdrant_client.models as models
    print(f"   models contents (FULL): {[m for m in dir(models) if not m.startswith('_')]}")
    if 'Nearest' in dir(models):
        print("   SUCCESS: 'Nearest' model exists.")
    else:
        print("   FATAL: 'Nearest' model missing!")
    
    sys.exit(0) # Exit after inspection
    
    collections = client.get_collections()
    print(f"   Connection successful. Collections: {[c.name for c in collections.collections]}")
except Exception as e:
    print(f"   Qdrant connection failed: {e}")
    sys.exit(1)

print("3. Testing OpenAI Embeddings & Chat...")
try:
    embeddings_model = OpenAIEmbeddings(
        model="openai/text-embedding-3-small",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1"
    )
    vec = embeddings_model.embed_query("test")
    print(f"   Embedding successful. Vector length: {len(vec)}")

    chat = ChatOpenAI(
        model="openai/gpt-4o-mini",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0
    )
    print("   ChatOpenAI initialized.")
except Exception as e:
    print(f"   OpenAI failed: {e}")
    sys.exit(1)

print("4. Testing Stdin (Mock)...")
try:
    # We can't easily test stdin in a script unless piped, but we can test JSON parsing
    data = json.loads('{"test": "ok"}')
    print("   JSON parsing successful.")
except Exception as e:
    print(f"   JSON parsing failed: {e}")
    sys.exit(1)

print("ALL TESTS PASSED")
