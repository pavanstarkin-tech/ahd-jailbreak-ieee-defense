@echo off
title AHD-Jailbreak - One-Click Production Deployment
echo =========================================================================
echo                  AHD-JAILBREAK PRODUCTION DEPLOYMENT
echo   Adaptive Hypergraph Defense for LLM Pre-Inference Security Gateway
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Docker status...
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Docker is installed. Launching with Docker Compose...
    docker compose down >nul 2>&1
    docker compose up -d --build
    echo.
    echo Stack deployed with Docker:
    echo  - Security Gateway API: http://localhost:8000
    echo  - SOC Frontend:         http://localhost:5173
    echo  - Ollama LLM:           http://localhost:11434
    pause
    exit /b 0
)

echo Docker not running. Launching via native Windows daemons...
echo [2/3] Starting AHD Security Gateway Backend on Port 8000...
start "AHD Security Gateway API" cmd /k "python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 2"

timeout /t 3 /nobreak >nul

echo [3/3] Starting SOC Frontend on Port 5173...
cd project_files
start "AHD SOC Frontend" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"
cd ..

timeout /t 2 /nobreak >nul
echo.
echo =========================================================================
echo Deployment successful! Opening dashboard in your browser...
echo =========================================================================
start http://localhost:5173
pause
