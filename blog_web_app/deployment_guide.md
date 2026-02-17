# Deployment Guide: MERN AI Blog Platform

This guide covers how to move your application from your local machine to production.

---

## 🚀 Option 1: Render & Vercel Hybrid (Fast & Free)

### 1. Backend & Agent (Render)
1.  **Repository**: Create a GitHub Repository and push your code.
2.  **Database**: Continue using your MongoDB Atlas URI.
3.  **Create Render Web Services**:
    - **Backend Service**:
        - **Name**: `mor-backend`
        - **Root Directory**: (Leave blank)
        - **Build Context**: `blog_web_app/backend`
        - **Dockerfile Path**: `blog_web_app/backend/Dockerfile`
    - **Agent Service**:
        - **Name**: `mor-agent`
        - **Root Directory**: (Leave blank)
        - **Build Context**: `blog_agent_service`
        - **Dockerfile Path**: `blog_agent_service/Dockerfile`

### 2. Frontend (Vercel)
1.  **Connect Repo**: Import your repo into Vercel.
2.  **Settings**:
    - Framework: `Vite`
    - Build Command: `npm run build`
    - Output Directory: `dist`
3.  **Environment Variables**:
    - `VITE_API_BASE_URL`: Use your **Render Backend URL** (e.g., `https://your-backend.onrender.com/api`).

---

## 🛡️ Option 2: Oracle Cloud Always Free (Premium & Free)

### 1. Setup VPS
1.  Sign up for **Oracle Cloud**.
2.  Create an **Ampere (ARM)** instance with **Ubuntu 22.04**.
3.  SSH into your server: `ssh -i your_key.key ubuntu@your_public_ip`.

### 2. Install Docker
Run these commands on your VPS:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Deploy
1.  Clone your repo: `git clone <your_repo_url>`
2.  Update `.env` files with production values.
3.  Run: `docker-compose up -d`.

### 4. Firewall (Crucial)
In your Oracle Cloud Console (Networking > Ingress Rules), open:
- Port `3000` (Frontend)
- Port `5000` (Backend)
- Port `8000` (Agent API)

---

## 📝 Production Environment Checklist

| Variable | Recommendation |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your Frontend URL (e.g., `https://blog.vercel.app`) |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `AGENT_SERVICE_URL` | `http://agent-service:8000` (for Docker) or Render URL |
| `VITE_API_BASE_URL` | Your Backend API URL |

## 🤖 CI/CD Automation (GitHub Actions)

This project uses GitHub Actions for automated deployment to AWS:
- **Workflow**: `.github/workflows/deploy.yml`
- **Stages**: Test -> Build -> Deploy
- **Configuration**: Requires GitHub Secrets (`AWS_SSH_KEY`, `PROD_ENV_BACKEND`, etc.)

Any push to the `main` branch will automatically trigger a redeploy to your EC2 instance.

> [!TIP]
> Always keep your `JWT_SECRET` and `OPENROUTER_API_KEY` private in the hosting provider's dashboard, **never** commit them to Git.
