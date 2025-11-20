@echo off
REM Quick start script for the Camp Registration Dashboard
REM This script sets up and starts both frontend and backend

cls
echo.
echo ====================================================
echo   SCRS - Camp Registration Dashboard
echo   Quick Start Script
echo ====================================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo WARNING: Node.js is not installed. Frontend will not work.
    echo Install from https://nodejs.org/ if you want to use the dashboard.
    echo.
    echo You can still use command-line processing:
    echo   python scripts\preprocess.py "path\to\file.xlsx"
    echo.
)

echo Installing/updating Python dependencies...
pip install -r requirements.txt > nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo ====================================================
echo   Setup Complete!
echo ====================================================
echo.
echo To start the system, run in separate terminals:
echo.
echo Terminal 1 (Backend):
echo   python app.py
echo.
echo Terminal 2 (Frontend):
echo   cd dashboards
echo   npm install
echo   npm run dev
echo.
echo Then open http://localhost:5173 in your browser
echo.
echo OR for command-line processing only:
echo   python scripts\preprocess.py "path\to\your\file.xlsx"
echo.
pause
