# Unbiased AI

Bias detection, explanation, comparison, and neutral rewrite in one workflow.

## What It Does

Unbiased AI helps users:
- detect biased or loaded language
- explain why the wording is risky
- compare two versions side by side
- rewrite content into a more neutral form
- export audit-style outputs for review

This project was built as a Google hackathon submission and optimized for live demos. If Firebase, Supabase, or Gemini are not fully configured, the app now falls back gracefully into demo-safe mode instead of failing.

## Why It Matters

Most tools stop at a score. This project goes further:
- `Detect`: identify bias categories and severity
- `Explain`: show findings and confidence
- `Compare`: prove which version is more neutral
- `Rewrite`: generate a cleaner alternative
- `Audit`: preserve outputs for review and export

That makes the product useful for education, content moderation, writing assistance, policy review, newsroom workflows, and AI safety demos.

## Demo Flow

For a 2-minute live demo:
1. Open the dashboard and state the product in one line: "It detects bias, explains it, and rewrites content neutrally."
2. Go to `Analyze` and run one of the built-in examples.
3. Show the explanation, confidence, and neutral rewrite.
4. Go to `Compare` and load a demo pair to show why one version is safer.
5. Export the report PDF.

## Core Features

- Bias analysis across multiple categories
- Neutral rewrite suggestions
- Side-by-side comparison flow
- Demo-safe authentication fallback
- Demo-safe backend/API fallback
- Exportable report experience
- Audit-style UI with explainable outputs

## Stack

Frontend:
- React 18
- Zustand
- Framer Motion
- Three.js
- Jest + React Testing Library

Backend and services:
- Google Gemini
- Supabase Edge Functions
- Firebase Auth

## Architecture & Screenshots

![Platform Dashboard](./docs/dashboard-preview.png)
*(A look at the Unbiased AI neural engine dashboard)*

### Workflow Diagram
1. **Input:** User submits text via the React frontend.
2. **Processing:** Supabase Edge Functions securely pass the prompt to Google Gemini 1.5.
3. **Analysis:** Gemini returns a structured JSON breakdown (vectors, confidence, highlights).
4. **Refraction:** A secondary pass generates a neutral rewrite.
5. **Output:** The UI renders an interactive audit report, exportable to PDF.

## Project Structure

```text
unbiased-ai/
|-- frontend/
|   |-- src/components/
|   |-- src/pages/
|   `-- src/supabase.js
|-- supabase/
|   `-- functions/
|-- tests/
|-- docs/
`-- DEMO_SCRIPT.md
```

## Local Setup

Create `frontend/.env`:

```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key
REACT_APP_GEMINI_API_KEY=your_key
```

Run locally:

```bash
cd frontend
npm install
npm start
```

## Verification

Frontend checks used during polish:
- `npm test -- --watchAll=false`
- `npm run build`

## Submission Angle

Best one-line pitch:

`Unbiased AI turns bias detection into an actionable workflow: detect, explain, compare, and rewrite.`

## Credits

- Architect: Krish Joshi
- AI partner: Gemini
- License: Apache 2.0
