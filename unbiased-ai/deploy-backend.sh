#!/bin/bash

# DEPLOYMENT SCRIPT for Unbiased AI Backend
# This script deploys all Supabase functions with the new Gemini 1.5 Pro configuration

set -e  # Exit on error

echo "=========================================="
echo "Unbiased AI - Backend Deployment Script"
echo "=========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if GEMINI_API_KEY is set
echo "Checking Supabase configuration..."
if ! supabase secrets list | grep -q "GEMINI_API_KEY"; then
    echo ""
    echo "❌ ERROR: GEMINI_API_KEY is not set in Supabase secrets!"
    echo ""
    echo "To fix this:"
    echo "1. Get your Gemini API key from: https://aistudio.google.com/app/apikey"
    echo "2. Run this command to set it:"
    echo ""
    echo "   supabase secrets set GEMINI_API_KEY=\"your-key-here\""
    echo ""
    exit 1
fi

echo "✅ GEMINI_API_KEY is configured"
echo ""

# Deploy functions
echo "Deploying Supabase functions..."
echo ""

functions=("analyze" "detect-bias" "chat" "rewrite" "compare")

for func in "${functions[@]}"; do
    echo "Deploying: $func"
    supabase functions deploy "$func" || echo "⚠️  Warning: Failed to deploy $func"
done

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify functions deployed: supabase functions list"
echo "2. Update frontend .env with:"
echo "   REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co"
echo "   REACT_APP_SUPABASE_ANON_KEY=your-anon-key"
echo "   REACT_APP_BACKEND_URL=https://YOUR_PROJECT.supabase.co/functions/v1"
echo "3. Test with: npm start"
echo ""
