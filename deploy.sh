#!/bin/bash
# ── ThePropertyFolio Deployment Script ────────────────────────────────────────

echo "🚀 Starting deployment..."

# 1. Pull latest code (assumes git is set up)
# git pull origin main

# 2. Rebuild and restart containers
echo "📦 Rebuilding production containers..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

# 3. Prune old images to save disk space
echo "🧹 Cleaning up old Docker resources..."
docker image prune -f

echo "✅ Deployment complete! System is live."
