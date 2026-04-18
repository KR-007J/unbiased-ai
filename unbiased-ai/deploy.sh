#!/bin/bash

# Unbiased AI - Quick Deployment Script
# Usage: ./deploy.sh YOUR_PROJECT_ID

PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./deploy.sh YOUR_PROJECT_ID"
    echo ""
    echo "Find your PROJECT_ID in Supabase Dashboard -> Settings -> General"
    exit 1
fi

echo "🚀 Deploying Unbiased AI Edge Functions..."
echo "Project ID: $PROJECT_ID"
echo ""

# Array of functions to deploy
FUNCTIONS=("analyze" "chat" "compare" "detect-bias" "rewrite")

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $func..."
    supabase functions deploy $func --project-id $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ $func deployment failed"
        exit 1
    fi
    echo ""
done

echo "🎉 All functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to https://app.supabase.com/project/$PROJECT_ID/functions"
echo "2. Verify all functions show status: ACTIVE"
echo "3. Hard refresh the website (Ctrl+Shift+R)"
echo "4. Test the analyze function"
echo ""
echo "If you still see errors:"
echo "- Check that GEMINI_API_KEY is set in Function Secrets"
echo "- Clear browser cache and cookies"
echo "- Wait 2-3 minutes for CDN cache to clear"
