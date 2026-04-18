import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-2.5-flash'

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { textA, textB } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
    }

    const prompt = `Compare these two texts for objective integrity and linguistic bias.

TEXT A:
"""
${textA}
"""

TEXT B:
"""
${textB}
"""

RESPOND ONLY WITH JSON:
{
  "scoreA": <0-1>,
  "scoreB": <0-1>,
  "winner": "A"|"B"|"tie",
  "winnerReason": "<Explanation>",
  "categoryComparison": {
    "gender": { "A": <0-1>, "B": <0-1> },
    "racial": { "A": <0-1>, "B": <0-1> },
    "political": { "A": <0-1>, "B": <0-1> },
    "age": { "A": <0-1>, "B": <0-1> },
    "cultural": { "A": <0-1>, "B": <0-1> },
    "socioeconomic": { "A": <0-1>, "B": <0-1> }
  },
  "analysis": "<Detailed comparison>",
  "recommendationA": "<How to improve A>",
  "recommendationB": "<How to improve B>",
  "neuralSignature": "<16-char hex>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, topP: 0.95 }
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set in Supabase secrets')
    }

    const fetchUrl = buildModelUrl()
    console.log(`[Compare] Using ${GEMINI_MODEL} (v1 API)...`)
    
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
      const errorMsg = errorData.error?.message || res.statusText
      console.error(`[Compare Error] ${GEMINI_MODEL} failed: ${errorMsg}`)
      throw new Error(`Gemini API error (${res.status}): ${errorMsg}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { 
      result = JSON.parse(cleaned) 
    } catch (e) { 
      throw new Error('Failed to parse Gemini response as JSON.')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': GEMINI_MODEL }
    })
  } catch (err: any) {
    console.error('[Compare Failure]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})




