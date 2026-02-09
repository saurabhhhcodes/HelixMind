#!/bin/bash
echo "🚀 Starting Helix Mind on Replit..."

# Install Backend Deps
echo "📦 Installing Backend Dependencies..."
pip install -r backend/requirements.txt || true

# Start Backend (Background)
# Use port 8000 for backend
echo "🔥 Starting Backend (Port 8000)..."
cd backend
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
cd ..

# Install Frontend Deps
echo "📦 Installing Frontend Dependencies..."
cd frontend
npm install

# Start Frontend
echo "✨ Starting Frontend..."
export BACKEND_URL="http://127.0.0.1:8000"
export NEXT_PUBLIC_API_URL="/api"
npm run dev
