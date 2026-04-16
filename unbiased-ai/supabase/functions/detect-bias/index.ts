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
    const { content, type } = await req.json()

    const prompt = `Detect specific bias instances in the following ${type || 'text'}.

Content:
"""
${content}
"""

Respond ONLY with JSON:
{
  "detected": true|false,
  "biasInstances": [
    {
      "phrase": "<exact phrase>",
      "biasType": "<gender|racial|political|age|cultural|religious|socioeconomic>",
      "severity": "low|medium|high",
      "explanation": "<explanation>",
      "suggestion": "<unbiased alternative>"
    }
  ],
  "overallAssessment": "<brief assessment>"
}`

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1500 } })
    })

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { result = JSON.parse(cleaned) }
    catch { result = { detected: false, biasInstances: [], overallAssessment: 'Parse error' } }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
