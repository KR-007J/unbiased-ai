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
    const { text, userId } = await req.json()

    const prompt = `You are an expert bias detection AI. Analyze the following text for ALL types of bias including gender, racial, political, age, cultural, religious, socioeconomic, and any other bias.

Text to analyze:
"""
${text}
"""

Respond ONLY with a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "biasScore": <number 0-1, overall bias intensity>,
  "confidence": <number 0-1, model confidence>,
  "biasTypes": {
    "<type>": <number 0-1>
  },
  "findings": [
    {
      "type": "<bias type>",
      "text": "<exact biased phrase from text>",
      "start": <character index>,
      "end": <character index>,
      "explanation": "<why this is biased>",
      "confidence": <0-1>
    }
  ],
  "summary": "<2-3 sentence overall analysis>",
  "severity": "low|medium|high|none"
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
