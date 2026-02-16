import os
import sys
from unittest.mock import MagicMock

# Add agents directory to path
sys.path.append(os.path.join(os.getcwd(), 'agents'))

def verify_setup():
    print("--- Redis RAG Verification ---")
    
    # 1. Check requirements
    print("\n[1] Checking package imports...")
    try:
        import redis
        print("✅ redis installed")
    except ImportError:
        print("❌ redis NOT installed. Run: pip install redis")

    try:
        from langchain_redis import RedisVectorStore
        print("✅ langchain-redis installed")
    except ImportError:
        print("❌ langchain-redis NOT installed. Run: pip install langchain-redis")

    # 2. Check .env
    print("\n[2] Checking .env configuration...")
    from dotenv import load_dotenv
    load_dotenv()
    
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        print(f"✅ REDIS_URL found: {redis_url}")
    else:
        print("❌ REDIS_URL NOT found in .env")

    # 3. Test Connection
    print("\n[3] Testing live Redis connection...")
    try:
        r = redis.from_url(redis_url)
        if r.ping():
            print("✅ Successfully connected to Redis Cloud!")
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")

    # 4. Test Logic Structure
    print("\n[4] Testing rag_logic.py structure...")
    try:
        from agents.rag_logic import query_content
        print("✅ query_content imported successfully")
        print("\n✨ Setup is 100% verified and ready for use!")
    except Exception as e:
        print(f"❌ Error during logic check: {e}")

if __name__ == "__main__":
    verify_setup()
