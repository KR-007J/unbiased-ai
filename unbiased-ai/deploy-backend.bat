@echo off
REM DEPLOYMENT SCRIPT for Unbiased AI Backend (Windows)
REM This script deploys all Supabase functions with the new Gemini 1.5 Pro configuration

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Unbiased AI - Backend Deployment Script
echo ==========================================
echo.

REM Check if Supabase CLI is available via npx
npx supabase --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npx supabase is not available!
    echo Please ensure you have Node.js installed.
    pause
    exit /b 1
)

echo Checking Supabase configuration...

REM Check if GEMINI_API_KEY is set
npx supabase secrets list | find "GEMINI_API_KEY" >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: GEMINI_API_KEY is not set in Supabase secrets!
    echo.
    echo To fix this:
    echo 1. Get your Gemini API key from: https://aistudio.google.com/app/apikey
    echo 2. Run this command to set it:
    echo.
    echo    npx supabase secrets set GEMINI_API_KEY="your-key-here"
    echo.
    echo I will attempt to set it if you have it in your local .env file.
    pause
    exit /b 1
)

echo ✅ GEMINI_API_KEY is configured
echo.

REM Deploy functions
echo Deploying Supabase functions...
echo.

setlocal
set functions=analyze detect-bias chat rewrite compare web-scan batch-analyze forecast-bias

for %%f in (%functions%) do (
    echo Deploying: %%f
    call npx supabase functions deploy %%f --no-verify-jwt
    if !errorlevel! neq 0 (
        echo ⚠️  Warning: Failed to deploy %%f
    )
)

echo.
echo ==========================================
echo ✅ Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Verify functions deployed: supabase functions list
echo 2. Update frontend .env with:
echo    REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
echo    REACT_APP_SUPABASE_ANON_KEY=your-anon-key
echo    REACT_APP_BACKEND_URL=https://YOUR_PROJECT.supabase.co/functions/v1
echo 3. Test with: npm start
echo.
pause
