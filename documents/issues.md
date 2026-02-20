# Project Issues & Resolutions Log

This document tracks the issues encountered during development and deployment of the MOR (MERN + AI) Blog platform, ordered by significance and recency.

## 1. RAG "Ask AI" Failure for New Blogs (Critical)
**Status:** ✅ Resolved  
**Time Taken:** ~1 Hour  
**Issue:** Newly generated blogs returned "400 Bad Request" when using the "Ask AI" feature, while older (migrated) blogs worked fine. The user could not ask questions about the `2026 Winter Olympics` post.  
**Cause:** The blog was created while the `agent-service` was rebuilding or unavailable. As a result, the initial RAG indexing request failed silently, leaving the blog's `ragIndexed` flag as `false` in MongoDB. The backend correctly blocks queries for unindexed content.  
**Resolution:**  
1. Verified the `ragIndexed: false` status in MongoDB.  
2. Created a backend script (`reindex_blog.js`) to manually trigger the `/index` endpoint for the affected blog.  
3. Confirmed the blog was successfully indexed in Qdrant and the database flag updated to `true`.  

---

## 2. Legacy Data Migration Strategy (Major)
**Status:** ✅ Resolved (Hybrid Approach)  
**Time Taken:** ~3 Hours (Design & Logic)  
**Issue:** We migrated from storing embeddings directly in MongoDB (`ragData`) to using Qdrant (Agent Service). However, 50+ existing blogs still had their vectors in Mongo, creating a "split-brain" where old data was in one place and new data in another.  
**Cause:** A full data migration script was risky and time-consuming. We needed a way for "Ask AI" to work seamlessly across both old and new architectures.  
**Resolution:**  
1. Implemented a **Fallback Logic** in `rag_logic.py`.  
2. The system first query Qdrant for vectors.  
3. If Qdrant returns empty (indicating an old blog), it falls back to using the legacy `ragData` from MongoDB and performs cosine similarity in-memory using NumPy.  
4. This ensured backward compatibility without downtime.  

---

## 3. Missing AI Dependencies in Docker Agent (Critical)
**Status:** ✅ Resolved  
**Time Taken:** ~2 Hours  
**Issue:** The "Ask AI" feature failed with a `500 Internal Server Error` inside Docker, specifically `ModuleNotFoundError: No module named 'qdrant_client'`.  
**Cause:** The `requirements.docker.txt` file used for building the `agent-service` image was missing several key dependencies (`qdrant-client`, `google-generativeai`, `tavily-python`) that were present in the local `requirements.txt`.  
**Resolution:**  
1. Synchronized `requirements.docker.txt` with the full dependency list.  
2. Rebuilt the `agent-service` container using `docker-compose up --build`.  
3. Verified the service logs to ensure all modules loaded correctly.

---

## 4. Docker Inter-Service Communication Failures (Major)
**Status:** ✅ Resolved  
**Time Taken:** ~3 Hours  
**Issue:** Frontend requests returned `500 ECONNREFUSED` and Nginx `502 Bad Gateway`. Services could not communicate with each other using `localhost`.  
**Cause:** In a Docker network, `localhost` (127.0.0.1) refers to the container itself, not the host machine or other containers. The services needed to address each other by their Docker Compose service names (DNS).  
**Resolution:**  
1. Updated `backend` and `agent-service` `.env` files to use service names: `http://backend:5000` and `http://agent-service:8000`.  
2. Configured `nginx.conf` with a proper upstream block and DNS resolver (`127.0.0.11`) to route `/api` requests to the `backend` container reliably.  

---

## 5. Port Conflicts during Deployment (Minor)
**Status:** ✅ Resolved  
**Time Taken:** ~30 Minutes  
**Issue:** Docker containers failed to start or crashed immediately upon launch.  
**Cause:** Host-based processes (Node.js backend on `5000`, Python agent on `8000`) were still running on the development machine, preventing Docker from binding the ports.  
**Resolution:** Forcefully terminated all conflicting host processes using `taskkill /F /IM node.exe` and `taskkill /F /IM python.exe` before starting Docker Compose.  

---

## 6. React Unique Key Warnings (Polish)
**Status:** ✅ Resolved  
**Time Taken:** ~15 Minutes  
**Issue:** Console warnings about "Each child in a list should have a unique key" in the Dashboard.  
**Cause:** `Dashboard.jsx` was rendering a list of blogs without passing a stable `key` prop to the list items.  
**Resolution:** Added `key={blog._id}` to the list rendering logic in React.  

---

## 7. Favicon 404 Error (Polish)
**Status:** ✅ Resolved  
**Time Taken:** ~10 Minutes  
**Issue:** Browser console showed a 404 error for `favicon.ico`.  
**Cause:** The file was missing from the public assets directory or not correctly linked.  
**Resolution:** Added `favicon.ico` to `public/` and ensured `index.html` linked to it correctly.
