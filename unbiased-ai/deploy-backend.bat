@echo off
REM DEPLOYMENT SCRIPT for Unbiased AI Backend (Windows)
REM This script deploys all Supabase functions with the new Gemini 1.5 Pro configuration

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Unbiased AI - Backend Deployment Script
echo ==========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not installed!
    echo Install it with: npm install -g supabase
    pause
    exit /b 1
)

echo Checking Supabase configuration...

REM Check if GEMINI_API_KEY is set
supabase secrets list | find "GEMINI_API_KEY" >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: GEMINI_API_KEY is not set in Supabase secrets!
    echo.
    echo To fix this:
    echo 1. Get your Gemini API key from: https://aistudio.google.com/app/apikey
    echo 2. Run this command to set it:
    echo.
    echo    supabase secrets set GEMINI_API_KEY="your-key-here"
    echo.
    pause
    exit /b 1
)

echo ✅ GEMINI_API_KEY is configured
echo.

REM Deploy functions
echo Deploying Supabase functions...
echo.

setlocal
set functions=analyze detect-bias chat rewrite compare

for %%f in (%functions%) do (
    echo Deploying: %%f
    call supabase functions deploy %%f
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
