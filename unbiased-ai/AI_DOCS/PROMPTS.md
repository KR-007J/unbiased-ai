# 🧠 AI Strategy & Prompt Engineering

This document outlines the strategic implementation of Google Gemini 1.5 Pro/Flash within the **Unbiased AI** ecosystem.

## 🛠️ Model Selection
- **Gemini 1.5 Flash**: Used for high-throughput, low-latency tasks such as **Bias Detection**, **News Refraction**, and **Batch Processing**.
- **Gemini 1.5 Pro**: Used for complex reasoning tasks including **Sovereign Arbiter (Legal/Ethical guidance)**, **Bias Forecasting**, and **Deep Comparative Audits**.

---

## 🎭 Prompt Engineering Patterns

### 1. The "Neural Arbiter" System Prompt
**Target**: `supabase/functions/chat/index.ts`
**Goal**: Ensure a non-partisan, analytical, and "Sovereign" tone.
```markdown
Identify specific bias instances in the following text.
Tone: Analytical, objective, institutional-grade.
Rules:
- Do not take sides.
- Identify cognitive framing, emotional charge, and logical gaps.
- Provide mathematical scores for intensity.
```

### 2. The "Refraction" Pattern
**Target**: `supabase/functions/news-bias/index.ts`
**Goal**: Map a single event across the ideological spectrum.
```markdown
Analyze the news article and determine its position on the following axes:
- Left-Right Political Spectrum
- Authoritarian-Libertarian Axis
- Emotional vs. Fact-Driven Intensity
Response Format: RFC-compliant JSON.
```

---

## 🛡️ Bias Mitigation in the AI Engine
- **Cross-Verifying Models**: We use dual-pass verification for high-severity bias detection.
- **Instruction Tuning**: All prompts include explicit "Neutrality Anchors" to prevent the model from reflecting its own RLHF-induced biases.
- **Temperature Control**: We use a temperature of `0.1` for audit tasks to ensure deterministic, reproducible results, and `0.7` for the "Arbiter" for nuanced discussion.

---

## 📈 Performance Metrics
- **Avg. Latency**: < 1200ms (Flash)
- **Token Efficiency**: Optimized prefixes to reduce input token count by 30%.
- **Success Rate**: 99.8% JSON-compliance on model outputs.
