import threading
import requests
import time
import json

# Configuration
API_URL = "http://localhost:8000/query"
BLOG_ID = "67aa32fed8a98c095ece8750" # Replace with a valid blog ID from your DB if needed
QUESTION = "What is the main topic of this blog?"

def send_query(thread_id):
    print(f"Thread {thread_id}: Sending query...")
    payload = {
        "blog_id": BLOG_ID,
        "rag_data": [], # In our logic, it fetch from DB if blog_id provided
        "question": QUESTION
    }
    start_time = time.time()
    try:
        response = requests.post(API_URL, json=payload)
        end_time = time.time()
        print(f"Thread {thread_id}: Received response in {end_time - start_time:.2f}s")
        # print(f"Thread {thread_id}: Answer: {response.json().get('answer')[:50]}...")
    except Exception as e:
        print(f"Thread {thread_id}: Error: {e}")

if __name__ == "__main__":
    # Start multiple threads simultaneously
    threads = []
    print(f"🚀 Starting 5 concurrent queries for: '{QUESTION}'")
    for i in range(5):
        t = threading.Thread(target=send_query, args=(i,))
        threads.append(t)
    
    for t in threads:
        t.start()
    
    for t in threads:
        t.join()
    
    print("✅ All threads completed.")
