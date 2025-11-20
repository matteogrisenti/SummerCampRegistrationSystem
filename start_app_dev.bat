@echo off
REM Camp Registration System - Development Mode Launcher
REM Runs Electron with Vite dev server for fast development

echo.
echo ========================================
echo Camp Registration System - Dev Mode
echo ========================================
echo.
echo This launcher runs:
echo   1. Vite dev server on http://localhost:5173
echo   2. Electron app loading from dev server
echo.
echo You can now edit React files and see changes instantly!
echo.

cd /d "%~dp0dashboard"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting development environment...
echo Press Ctrl+C in either window to stop
echo.

REM Start both Vite dev server and Electron app
start "Vite Dev Server" cmd /k "npm run dev"
timeout /t 2 /nobreak
start "Electron App" cmd /k "npm run electron-dev"

pause
