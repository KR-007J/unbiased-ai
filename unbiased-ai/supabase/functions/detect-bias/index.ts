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
      return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: GEMINI_API_KEY is missing. Neural link inactive.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
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

    const res = await fetch(GEMINI_URL + '?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1500 } })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Gemini API Error:', errorText)
      throw new Error('Supabase Edge Error: ' + res.status)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { result = JSON.parse(cleaned) }
    catch (e) { 
      console.error('Detect Parsing Error:', e)
      result = { detected: false, biasInstances: [], overallAssessment: 'Integrity scan failed.' } 
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Detect Bias Error:', err)
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + err.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
