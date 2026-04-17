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
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: GEMINI_API_KEY is missing. Neural audit proofing unavailable.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const { text, url, userId } = await req.json()
    let contentToAnalyze = text

    if (url) {
      try {
        const response = await fetch(url)
        const html = await response.text()
        
        // Improved extraction: specifically target main content if possible, otherwise clean body
        contentToAnalyze = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
          .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gim, '')
          .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gim, '')
          .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gim, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 20000) // Slightly higher limit for pro
      } catch (e) {
        throw new Error('Neural Link Failed to ingest URL: ' + e.message)
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

    const geminiRes = await fetch(GEMINI_URL + '?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    })

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text()
      console.error('Gemini API Error:', errorBody)
      throw new Error('Neural Link Error: ' + geminiRes.status)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    let result
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      result = JSON.parse(cleaned)
      // Standardize findings/biases for frontend consumption
      if (!result.biases && result.findings) result.biases = result.findings
      if (!result.findings && result.biases) result.findings = result.biases
    } catch (e) {
      console.error('JSON Parse Error:', e, rawText)
      result = { 
        biasScore: 0, 
        confidence: 0, 
        biasTypes: {}, 
        biases: [], 
        findings: [], 
        summary: 'Sovereign Neural layer encountered a parsing dissonance.', 
        severity: 'critical', 
        neuralSignature: 'ERR_' + Math.random().toString(16).slice(2, 10).toUpperCase() 
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Analyze Error:', err)
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + err.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
