#!/bin/bash

echo "Starting backend..."
npm start &

echo "Starting frontend..."
cd frontend && npm run dev &

echo "Starting Python PDF service..."
python python_pdf_service.py &

echo "All services started in the background."
echo "Backend: http://localhost:3500"
echo "Frontend: http://localhost:5173 (or similar, check vite output)"
echo "Python PDF Service: http://localhost:5001/pdf" 