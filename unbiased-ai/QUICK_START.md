# 🚀 Quick Start: Unbiased AI Sovereign Engine

Get the system running in under 5 minutes for your hackathon demo.

---

## 1. Environment Setup

The system is designed for "Instant Demo" mode. It will work with mock data out of the box, but requires a Gemini API key for real-time neural audits.

### Create `frontend/.env`
```env
# Firebase Authentication
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...

# Supabase (Audit Archive & Delta Engine)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Neural Intelligence (REQUIRED for real AI)
# Get from: https://aistudio.google.com/app/apikey
REACT_APP_GEMINI_API_KEY=your-gemini-key
```

---

## 2. Local Launch

```bash
cd frontend
npm install
npm start
```

---

## 3. Demo Guide for Judges

### Instant Access
Use the **Demo Mode** to bypass setup:
1. Visit the login page.
2. Use the following credentials:
   - **Email**: `judge@unbiased.ai`
   - **Password**: `hackathon2026`
3. Notice the **JUDGE ACCESS** badge in the sidebar.

### Key Demo Flow
1. **SCAN**: Paste biased text (e.g., *"The chairman led the meeting and he said..."*). Show the real-time detection highlights and neural refraction.
2. **DELTA**: Compare two similar news articles to see the variance in bias intensity.
3. **ARCHIVE**: Show the persistent audit trail with neural signatures.

---

## 4. Troubleshooting

### ❌ "Neural Uplink Failed"
- **Cause**: Missing or invalid Gemini API key.
- **Fix**: Check `REACT_APP_GEMINI_API_KEY` in `frontend/.env`.
- **Demo Safety**: The system will automatically enter **Neural Simulation Mode** (Mock Data) so your demo never fails!

### ❌ "Database Sync Failed"
- **Cause**: Supabase connection issues.
- **Fix**: Verify your Supabase URL and Anon Key. The core analysis will still work, but history won't save.

---

## 🚀 Deployment

To push your optimized build to production:
```bash
cd frontend
npm run build
firebase deploy
```

**System Version**: 2.5 (Sovereign Layer)
**Neural Core**: Gemini 1.5 Pro
