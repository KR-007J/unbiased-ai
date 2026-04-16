import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, url, userId } = await req.json()
    let contentToAnalyze = text

    if (url) {
      try {
        const response = await fetch(url)
        const html = await response.text()
        // Simple extraction: remove scripts and styles
        contentToAnalyze = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 15000) // Limit for Gemini
      } catch (e) {
        throw new Error(`Failed to ingest URL: ${e.message}`)
      }
    }

    const prompt = `You are the Sovereign Neural Arbiter of Objectivity. Analyze the following text with absolute surgical precision for ALL types of bias including gender, racial, political, age, cultural, religious, socioeconomic, and manipulative linguistic patterns.

Text to analyze:
"""
${contentToAnalyze}
"""

Respond ONLY with a valid JSON object (no markdown, no preamble) with this exact structure:
{
  "biasScore": <number 0-1, overall bias intensity>,
  "confidence": <number 0-1, model confidence>,
  "biasTypes": {
    "<type>": <number 0-1>
  },
  "findings": [
    {
      "type": "<bias type>",
      "text": "<exact biased phrase>",
      "explanation": "<profound logical breakdown>",
      "confidence": <0-1>
    }
  ],
  "summary": "<2-3 sentence overall analysis>",
  "severity": "low|medium|high|critical",
  "propheticVector": "<A deep prediction of how this specific bias will likely manipulate public sentiment or escalate in future discourse over the next 30 days.>",
  "objectiveRefraction": "<A perfectly neutral, surgically rewritten version of the input text that preserves 100% of facts but eliminates 100% of biased framing.>",
  "neuralSignature": "<A unique 16-character hexadecimal string representing the neural audit proof for this specific content.>"
}`

    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    })

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    let result
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      result = { biasScore: 0, confidence: 0.5, biasTypes: {}, findings: [], summary: 'Analysis could not be parsed.', severity: 'none' }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
