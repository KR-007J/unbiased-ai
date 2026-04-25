# Unbiased AI - Live Demo Script

**Target Time:** 90 seconds
**Goal:** Prove the platform turns bias detection into an actionable workflow, even under strict hackathon demo constraints.

---

## [0:00 - 0:15] The Hook (Landing Page)
**Action:** Open the Landing Page.
**Narration:**
"Hi judges. Welcome to Unbiased AI. Most tools today just tell you if text is biased, and maybe give you a score. We built an end-to-end sovereign workflow that goes further: it detects bias, explains exactly why, and generates a neutral rewrite you can use immediately. Let me show you."

## [0:15 - 0:25] The Setup (Dashboard)
**Action:** Click 'Initialize System' -> takes you to Auth/Dashboard.
**Narration:**
"We’re entering the dashboard now. For this demo, we're using our resilient fallback mode which guarantees zero hard crashes, meaning we can always deliver results even if cloud services are throttling."

## [0:25 - 0:50] The Core Loop (Analyze Page)
**Action:** Click 'Analyze' in the sidebar. Click 'EXAMPLE 2' (or 1) to load text. Click 'INITIATE AUDIT'.
**Narration:**
"Here’s the core engine. Let’s load a loaded political statement. I hit Audit. Instantly, our system breaks down the bias intensity, showing the exact categories—like Political and Socioeconomic skew. It doesn't just score it; it maps the text, highlighting exactly which phrases are risky and explaining the underlying manipulation."

## [0:50 - 1:10] The Solution (Refraction / Rewrite)
**Action:** Click the 'OBJECTIVE REFRACTION' tab.
**Narration:**
"But here is where we deliver value. We don't just point out the problem. We offer an 'Objective Refraction'—a neutral rewrite that preserves the factual density of the original text but strips away the manipulative framing. You can see the clean output here, ready for publishing."

## [1:10 - 1:25] The Proof (Compare Page)
**Action:** Go to the 'Compare' page in the sidebar. Load a demo pair.
**Narration:**
"If you're an editor or moderator, you need proof. Our Compare tool lets you put two versions of a text side-by-side. The neural engine proves mathematically why the refracted version is safer and more objective."

## [1:25 - 1:30] The Closer (Export PDF)
**Action:** Go back to Analyze. Click 'EXPORT PDF'.
**Narration:**
"Finally, every analysis can be exported into an immutable Sovereign Audit PDF. Unbiased AI is ready to scale for newsrooms, policy review, and education. Thank you."

---

## Q&A Prep for Judges

**Q: What happens if the API goes down during the demo?**
A: "We engineered a graceful fallback. The UI automatically switches to a high-fidelity simulation mode with pre-computed examples so the product experience never breaks."

**Q: How does the AI determine 'neutrality'?**
A: "We use a multi-vector approach. It doesn't just look for 'bad words'; it analyzes phrasing, framing, and emotional skew across gender, racial, and political vectors using Gemini 1.5."

**Q: What's the tech stack?**
A: "React 18 frontend with Zustand for state, styled with custom CSS and Framer Motion for the UI. The backend uses Supabase Edge Functions connecting to Google's Gemini API, with Firebase handling auth and hosting."
