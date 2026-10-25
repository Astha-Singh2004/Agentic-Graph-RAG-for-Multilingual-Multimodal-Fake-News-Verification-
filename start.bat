@echo off
:: TruthLens — Quick Start Script for Windows
:: Starts both the FastAPI backend and Next.js frontend in separate windows

title TruthLens Quick Start

echo.
echo  ████████╗██████╗ ██╗   ██╗████████╗██╗  ██╗    ██╗     ███████╗███╗   ██╗███████╗
echo  ╚══██╔══╝██╔══██╗██║   ██║╚══██╔══╝██║  ██║    ██║     ██╔════╝████╗  ██║██╔════╝
echo     ██║   ██████╔╝██║   ██║   ██║   ███████║    ██║     █████╗  ██╔██╗ ██║███████╗
echo     ██║   ██╔══██╗██║   ██║   ██║   ██╔══██║    ██║     ██╔══╝  ██║╚██╗██║╚════██║
echo     ██║   ██║  ██║╚██████╔╝   ██║   ██║  ██║    ███████╗███████╗██║ ╚████║███████║
echo     ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝    ╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝
echo.
echo  Cross-Lingual Multimodal Fake News Verification System
echo  ─────────────────────────────────────────────────────────
echo  Backend  → http://localhost:8000
echo  Frontend → http://localhost:3000
echo  API Docs → http://localhost:8000/docs
echo.

:: Set Python path
set PYTHON="C:\Users\Neha\AppData\Local\Python\bin\python.exe"
set NODE_PATH="C:\Program Files\nodejs"
set PATH=%NODE_PATH%;%PATH%

:: Check Python
if not exist %PYTHON% (
  echo [ERROR] Python not found at %PYTHON%
  echo Please update the PYTHON variable in this script.
  pause
  exit /b 1
)

echo [1/2] Starting FastAPI backend...
start "TruthLens Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && %PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Next.js frontend...
timeout /t 3 /nobreak >nul
start "TruthLens Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ✅ Both services are starting...
echo     Backend  → http://localhost:8000
echo     Frontend → http://localhost:3000 (ready in ~20s)
echo     API Docs → http://localhost:8000/docs
echo.
echo  Press any key to open the browser...
pause >nul
start "" "http://localhost:3000"
