@echo off
REM Unbiased AI - Quick Deployment Script (Windows)
REM Usage: deploy.bat YOUR_PROJECT_ID

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: deploy.bat YOUR_PROJECT_ID
    echo.
    echo Find your PROJECT_ID in Supabase Dashboard ^> Settings ^> General
    exit /b 1
)

set PROJECT_ID=%1

echo 🚀 Deploying Unbiased AI Edge Functions...
echo Project ID: %PROJECT_ID%
echo.

REM Array of functions to deploy
set FUNCTIONS=analyze chat compare detect-bias rewrite

for %%F in (%FUNCTIONS%) do (
    echo 📦 Deploying %%F...
    call supabase functions deploy %%F --project-id %PROJECT_ID%
    
    if errorlevel 1 (
        echo ❌ %%F deployment failed
        exit /b 1
    )
    
    echo ✅ %%F deployed successfully
    echo.
)

echo 🎉 All functions deployed successfully!
echo.
echo Next steps:
echo 1. Go to https://app.supabase.com/project/%PROJECT_ID%/functions
echo 2. Verify all functions show status: ACTIVE
echo 3. Hard refresh the website (Ctrl+Shift+R)
echo 4. Test the analyze function
echo.
echo If you still see errors:
echo - Check that GEMINI_API_KEY is set in Function Secrets
echo - Clear browser cache and cookies
echo - Wait 2-3 minutes for CDN cache to clear
echo.
pause
