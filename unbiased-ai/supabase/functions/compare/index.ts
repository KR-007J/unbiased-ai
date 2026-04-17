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
    const { textA, textB } = await req.json()

    const prompt = `Compare these two texts for bias levels across multiple dimensions.

TEXT A:
"""
${textA}
"""

TEXT B:
"""
${textB}
"""

Respond ONLY with JSON:
{
  "scoreA": <0-1 overall bias score for A>,
  "scoreB": <0-1 overall bias score for B>,
  "winner": "A"|"B"|"tie",
  "winnerReason": "<why winner is less biased>",
  "categoryComparison": {
    "gender": { "A": <0-1>, "B": <0-1> },
    "racial": { "A": <0-1>, "B": <0-1> },
    "political": { "A": <0-1>, "B": <0-1> },
    "age": { "A": <0-1>, "B": <0-1> },
    "cultural": { "A": <0-1>, "B": <0-1> }
  },
  "analysis": "<comparative analysis in 3-5 sentences>",
  "recommendationA": "<specific suggestion to improve Text A>",
  "recommendationB": "<specific suggestion to improve Text B>"
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
      console.error('Comparison Parse Error:', e)
      result = { scoreA: 0, scoreB: 0, winner: 'tie', analysis: 'Neural convergence failed.' } 
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
