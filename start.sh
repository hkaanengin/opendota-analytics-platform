#!/bin/bash

# OpenDota Analytics Platform - Start Script
# This script helps you start both backend and frontend

echo "🚀 OpenDota Analytics Platform Startup"
echo "======================================"
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Backend virtual environment not found."
    echo "Creating virtual environment..."
    cd backend
    python -m venv venv
    source venv/bin/activate
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    cd ..
    echo "✅ Backend setup complete!"
    echo ""
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not found."
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend setup complete!"
    echo ""
fi

echo "Starting services..."
echo ""
echo "📍 Backend will run on: http://localhost:8000"
echo "📍 Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend in background
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait
