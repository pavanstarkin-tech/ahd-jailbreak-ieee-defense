#!/usr/bin/env bash
# ==============================================================================
# AHD-Jailbreak Production Deployment Script (Linux / AWS / GCP / DigitalOcean)
# ==============================================================================
set -e

echo "=== [1/4] Checking System Prerequisites ==="
if command -v docker &> /dev/null && command -v docker compose &> /dev/null; then
    echo "Docker and Docker Compose detected."
    USE_DOCKER=1
else
    echo "Docker not found. Falling back to native Python & Node deployment."
    USE_DOCKER=0
fi

if [ "$USE_DOCKER" -eq 1 ]; then
    echo "=== [2/4] Deploying via Docker Compose (Production 3-Tier Stack) ==="
    docker compose down --remove-orphans || true
    docker compose build --no-cache
    docker compose up -d

    echo "=== [3/4] Waiting for services to stabilize ==="
    sleep 5

    echo "=== [4/4] Verifying Deployment Health ==="
    curl -f http://localhost:8000/health || (echo "Health check failed!" && exit 1)
    echo ""
    echo "========================================================================"
    echo "AHD-Jailbreak successfully deployed!"
    echo "  - Security Gateway API: http://localhost:8000"
    echo "  - Interactive SOC UI:   http://localhost:5173"
    echo "  - Health Endpoint:      http://localhost:8000/health"
    echo "========================================================================"
else
    echo "=== [2/4] Installing Python & Node Dependencies ==="
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

    cd project_files
    npm install
    npm run build
    cd ..

    echo "=== [3/4] Launching Background Daemons ==="
    nohup uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4 > backend.log 2>&1 &
    cd project_files
    nohup npm run preview -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &
    cd ..

    sleep 3
    echo "=== [4/4] Verifying Deployment Health ==="
    curl -f http://localhost:8000/health
    echo ""
    echo "Native deployment complete! Logs: backend.log and frontend.log"
fi
