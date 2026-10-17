@echo off
echo ========================================================
echo  Starting PostPulse Studio (local dev)
echo ========================================================
echo.

echo [1/2] FastAPI backend on port 3005...
start "PostPulse FastAPI (3005)" cmd /k "cd /d %~dp0fastapi-backend && uvicorn main:app --port 3005 --reload"

timeout /t 2 >nul

echo [2/2] React client on port 5173...
start "PostPulse React (5173)" cmd /k "cd /d %~dp0client && bun install && bun run dev"

echo.
echo ========================================================
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:3005
echo  API docs:  http://localhost:3005/docs
echo  Switch Social Studio / Lead Gen in the app header.
echo ========================================================
