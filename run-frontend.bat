@echo off
echo ========================================
echo    OpenAutomate Frontend - Setup and Start
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Please run this script from the OpenAutomate.Frontend directory
    echo Current directory: %CD%
    echo.
    echo Expected to find: package.json file
    pause
    exit /b 1
)

REM Check if already configured
if exist ".env.local" if exist "node_modules" (
    echo Configuration already exists. Skipping setup...
    goto start_frontend
)

echo ========================================
echo    FIRST TIME SETUP
echo ========================================
echo.

echo Creating configuration file...

REM Create the environment file only if it does not exist
if not exist ".env.local" (
    (
    echo NEXT_PUBLIC_API_URL=http://localhost:5252
    echo NEXT_PUBLIC_APP_URL=http://localhost:3001
    echo NEXT_PUBLIC_APP_DOMAIN=localhost
    echo NEXT_PUBLIC_N8N_WEBHOOK_URL=
    echo NEXT_PUBLIC_AGENT_DOWNLOAD_URL=https://download.openautomate.io/OpenAutomate-Agent-Setup.exe
    ) > ".env.local"
    echo Configuration file created (.env.local)
) else (
    echo Using existing .env.local
)

echo.
echo Installing dependencies (this may take a few minutes)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies. Make sure Node.js is installed.
    pause
    exit /b 1
)
echo Dependencies installed

echo.
echo ========================================
echo    Starting Frontend (development)...
echo ========================================
echo.

:start_frontend
echo Starting Frontend...
echo Frontend will be available at: http://localhost:3001
echo Make sure backend is running at: http://localhost:5252
echo.
echo Press Ctrl+C to stop the frontend
echo ========================================
echo.

call npm run dev
