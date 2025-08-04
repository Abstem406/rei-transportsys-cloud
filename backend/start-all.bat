@echo off
start cmd /k "echo Starting Backend Service... && npm start"
start cmd /k "echo Starting Frontend Service... && cd frontend && npm run dev"
start cmd /k "echo Starting PDF Service... && python python_pdf_service.py"
echo All services are starting in separate windows. 