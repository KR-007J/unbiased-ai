# UNBIASED AI - DEPLOYMENT FIX GUIDE

## Problem
Backend is returning: `models/gemini-1.0-pro is not found for API version v1, or is not supported for generateContent`

**Root Cause:** Supabase Edge Functions haven't been redeployed with the latest code that uses the correct Gemini models.

---

## Solution: Deploy Latest Backend Functions

### Step 1: Update Environment Variables (if not already set)

Make sure your Supabase project has the `GEMINI_API_KEY` environment variable set:

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Settings** → **Edge Functions**
3. Ensure `GEMINI_API_KEY` is set with your valid Google Gemini API key

**Get API Key:** https://aistudio.google.com/app/apikey

---

### Step 2: Deploy All Edge Functions

Run these commands in your terminal from the project root:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy all functions
supabase functions deploy analyze --project-id YOUR_PROJECT_ID
supabase functions deploy chat --project-id YOUR_PROJECT_ID
supabase functions deploy compare --project-id YOUR_PROJECT_ID
supabase functions deploy detect-bias --project-id YOUR_PROJECT_ID
supabase functions deploy rewrite --project-id YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID (found in project settings).

---

### Step 3: Verify Deployment

Check that functions were deployed successfully:

```bash
supabase functions list --project-id YOUR_PROJECT_ID
```

You should see all 5 functions listed with status **ACTIVE**.

---

### Step 4: Test the Backend

Once deployed, test the API:

```bash
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "context": null
  }'
```

Expected response should NOT contain the `gemini-1.0-pro` error.

---

### Step 5: Clear Frontend Cache

After deploying, clear your browser cache:

**Chrome/Edge/Firefox:**
- Press `Ctrl+Shift+Del` (or `Cmd+Shift+Del` on Mac)
- Clear "Cached images and files"
- Visit the app again

**Or in the app:**
- Open DevTools (F12)
- Go to **Application** → **Storage** → **Clear Site Data**

---

## Alternative: Quick Deployment via Supabase Dashboard

If CLI deployment doesn't work:

1. **Go to Supabase Dashboard** → Your Project → **Edge Functions**
2. **For each function (analyze, chat, compare, detect-bias, rewrite):**
   - Click the function name
   - Copy the latest code from the respective file:
     - `supabase/functions/analyze/index.ts`
     - `supabase/functions/chat/index.ts`
     - `supabase/functions/compare/index.ts`
     - `supabase/functions/detect-bias/index.ts`
     - `supabase/functions/rewrite/index.ts`
   - Paste it into the editor
   - Click **Deploy**

---

## Verify Current Model Support

**Current Gemini Models Being Used (CORRECT):**
- `gemini-1.5-pro-latest` ✅
- `gemini-1.5-pro` ✅
- `gemini-1.5-flash` ✅

**Old Models (NO LONGER USED):**
- `gemini-1.0-pro` ❌ (Deprecated, not available for generateContent)

---

## Debugging

If issues persist after deployment:

### Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Trigger an analysis and look for error messages
4. Report any errors showing `Neural link failed`

### Check Supabase Logs
1. **Supabase Dashboard** → Functions
2. Click each function
3. Check **Execution Logs** for any errors
4. Look for messages like "GEMINI_API_KEY missing" or model errors

### Verify API Key
```bash
# Test Gemini API directly
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=YOUR_GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Hello"}]}]
  }'
```

Should return a valid response, not an error about the model.

---

## If Everything Fails

**Reset Everything:**

1. **Clear all caches:**
   - Browser cache
   - Supabase cache (if available)
   - Firebase cache

2. **Re-deploy with force:**
   ```bash
   supabase functions deploy --no-verify-jwt analyze --project-id YOUR_PROJECT_ID
   supabase functions deploy --no-verify-jwt chat --project-id YOUR_PROJECT_ID
   supabase functions deploy --no-verify-jwt compare --project-id YOUR_PROJECT_ID
   supabase functions deploy --no-verify-jwt detect-bias --project-id YOUR_PROJECT_ID
   supabase functions deploy --no-verify-jwt rewrite --project-id YOUR_PROJECT_ID
   ```

3. **Wait 2-3 minutes** for Supabase to fully process the deployment

4. **Hard refresh the website:**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

## Contact

If issues persist:
- Check Supabase function logs for detailed error messages
- Verify GEMINI_API_KEY is set correctly in Supabase settings
- Ensure the Gemini API key has `generateContent` permissions enabled
