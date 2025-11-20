@echo off
REM Camp Registration System - Desktop App Launcher
REM This script starts the Electron desktop application with no backend servers

echo.
echo ========================================
echo Camp Registration System - Desktop App
echo ========================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists in dashboard
if not exist "dashboard\node_modules\" (
    echo Installing dependencies...
    cd dashboard
    call npm install
    cd ..
)

REM Build the frontend
echo Building frontend...
cd dashboard
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

REM Start Electron app (no Flask, no servers, pure local app)
echo.
echo Starting application...
call npm run electron-prod

pause
