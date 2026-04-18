# Backend Setup & Deployment Guide

## Overview
The Unbiased AI backend uses **Google Gemini 1.5 Pro** API (v1) for all AI operations through Supabase Edge Functions. This guide covers configuration and deployment.

## Critical: API Model Selection

### Why Gemini 1.5 Pro?
- ✅ **Stable & Production-Ready**: Uses official `v1` API (not experimental `v1beta`)
- ✅ **Best for Bias Detection**: 1.5 Pro has excellent instruction following and context understanding
- ✅ **Reliable Availability**: Widely available across all regions
- ✅ **Cost-Effective**: Lower cost than Pro Max, sufficient performance
- ✅ **Well-Documented**: Full support and examples available

### What Changed
- **Before**: Multiple fallback models (gemini-1.5-pro-latest, gemini-1.5-pro, gemini-1.5-flash)
- **Before**: Used unstable `v1beta` API version
- **Now**: Single model `gemini-1.5-pro` with stable `v1` API

## Prerequisites

1. **Google Cloud Account** with Gemini API enabled
2. **Supabase Account** (free tier works)
3. **Node.js 18+** (for local testing)
4. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

## Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. **Keep this secret!** Never commit to version control

## Step 2: Configure Supabase Secrets

### Option A: Via Supabase Dashboard
1. Log in to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings → Secrets**
4. Add new secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from Step 1
5. Click "Add secret"

### Option B: Via Supabase CLI
```bash
cd supabase
supabase secrets set GEMINI_API_KEY="your-api-key-here"
```

## Step 3: Verify Configuration

Check that all functions have `verify_jwt = false` in [config.toml](./config.toml):

```toml
[functions.analyze]
verify_jwt = false

[functions.detect-bias]
verify_jwt = false

[functions.rewrite]
verify_jwt = false

[functions.compare]
verify_jwt = false

[functions.chat]
verify_jwt = false
```

This allows frontend calls without authentication headers.

## Step 4: Deploy Functions

### Local Testing First
```bash
# Start Supabase locally
supabase start

# In another terminal, test a function
supabase functions serve analyze

# Test with curl
curl -X POST http://localhost:54321/functions/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"This is biased language"}'
```

### Deploy to Production
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy analyze

# Verify deployment
supabase functions list
```

## Step 5: Configure Frontend Environment

Create or update [frontend/.env.local](../frontend/.env.local):

```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_BACKEND_URL=https://YOUR_PROJECT.supabase.co/functions/v1
```

Get these values from Supabase Dashboard → Settings → API.

## Backend Functions Reference

### 1. `/analyze` (POST)
**Analyze text for bias across multiple dimensions**

Request:
```json
{
  "text": "Your text to analyze",
  "url": "https://example.com (optional, will fetch and extract content)"
}
```

Response:
```json
{
  "biasScore": 0.75,
  "confidence": 0.92,
  "biasTypes": {
    "gender": 0.8,
    "racial": 0.6,
    "political": 0.7,
    "age": 0.2,
    "cultural": 0.5,
    "socioeconomic": 0.4
  },
  "biases": [
    {
      "type": "gender",
      "text": "exact quote from input",
      "explanation": "why this is biased",
      "confidence": 0.9,
      "suggestion": "unbiased alternative",
      "counterVector": "opposing perspective",
      "corroboratingTruth": "factual data point"
    }
  ],
  "summary": "Executive summary",
  "severity": "high",
  "propheticVector": "Potential impact",
  "objectiveRefraction": "Rewritten version"
}
```

### 2. `/detect-bias` (POST)
**Quick detection of specific bias instances**

Request:
```json
{
  "content": "Your text",
  "type": "text (optional: text, article, social-media, etc.)"
}
```

Response:
```json
{
  "detected": true,
  "biasInstances": [
    {
      "phrase": "exact phrase",
      "biasType": "gender",
      "severity": "high",
      "explanation": "Why this is biased",
      "suggestion": "Better alternative"
    }
  ],
  "overallAssessment": "Brief assessment"
}
```

### 3. `/rewrite` (POST)
**Generate unbiased versions of text**

Request:
```json
{
  "text": "Your biased text",
  "biasTypes": ["gender", "racial"] (optional)
}
```

Response:
```json
{
  "rewritten": "Unbiased version of text",
  "explanation": "Changes made",
  "changesCount": 3,
  "biasRemoved": ["gender bias", "stereotypes"]
}
```

### 4. `/compare` (POST)
**Compare two texts for bias**

Request:
```json
{
  "textA": "First text",
  "textB": "Second text"
}
```

Response:
```json
{
  "scoreA": 0.4,
  "scoreB": 0.8,
  "winner": "A",
  "winnerReason": "Text A has less bias",
  "categoryComparison": {
    "gender": {"A": 0.2, "B": 0.7},
    ...
  },
  "analysis": "Detailed comparison",
  "recommendationA": "How to improve A",
  "recommendationB": "How to improve B"
}
```

### 5. `/chat` (POST)
**Interactive conversation about bias detection**

Request:
```json
{
  "messages": [
    {"role": "user", "content": "What biases do you see?"}
  ],
  "context": "Optional context about the topic"
}
```

Response:
```json
{
  "response": "AI's response about bias",
  "model": "gemini-1.5-pro"
}
```

## Error Handling

All functions return proper HTTP status codes:

- **500**: Configuration error (missing API key) or API failure
- **200**: Success (even if empty results)
- **400**: Invalid request format

### Debugging

Check Supabase function logs:
```bash
# View live logs
supabase functions list

# Or in dashboard: Logs section
```

## Common Issues & Solutions

### Issue: "GEMINI_API_KEY is not configured"
- **Solution**: Verify secret is set in Supabase dashboard
- **Verify**: `supabase secrets list`

### Issue: "Gemini API error (429)"
- **Cause**: Rate limiting
- **Solution**: Implement exponential backoff in frontend (already done)

### Issue: "Failed to parse Gemini response as JSON"
- **Cause**: API returned non-JSON or malformed response
- **Solution**: Check API usage limits and quota

### Issue: CORS errors in frontend
- **Solution**: Already configured in all functions with:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
  ```

## Performance Optimization

The current setup is optimized for:
- **Latency**: Direct Gemini API calls (no extra hops)
- **Reliability**: Single stable model eliminates retry complexity
- **Cost**: Gemini 1.5 Pro offers best price/performance ratio

## Monitoring

Monitor these metrics:
1. **Response time**: Should be < 3 seconds for most requests
2. **Error rate**: Should be < 1%
3. **API quota**: Check Google Cloud console

## Next Steps

1. ✅ Deploy backend to Supabase
2. ✅ Configure Gemini API key
3. ✅ Test each endpoint locally
4. ✅ Update frontend .env with URLs
5. ✅ Deploy frontend
6. ✅ Run integration tests

## Support & Documentation

- [Gemini API Docs](https://ai.google.dev/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google AI Studio](https://aistudio.google.com)
