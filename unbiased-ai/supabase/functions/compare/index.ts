// @ts-ignore - Deno type definitions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno global API
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'

const MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const buildModelUrl = (model: string): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent`
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
      throw new Error('Neural key (GEMINI_API_KEY) missing in system configuration.')
    }

    const prompt = `You are the Sovereign Neural Arbiter. Compare these two texts (DELTA ANALYSIS) for objective integrity and linguistic bias vectors.

TEXT A:
"""
${textA}
"""

TEXT B:
"""
${textB}
"""

RESPOND ONLY WITH A PURE JSON OBJECT:
{
  "scoreA": <0-1 overall bias intensity for A>,
  "scoreB": <0-1 overall bias intensity for B>,
  "winner": "A"|"B"|"tie",
  "winnerReason": "<Surgical explanation of why the winner represents higher objective integrity>",
  "categoryComparison": {
    "gender": { "A": <0-1>, "B": <0-1> },
    "racial": { "A": <0-1>, "B": <0-1> },
    "political": { "A": <0-1>, "B": <0-1> },
    "age": { "A": <0-1>, "B": <0-1> },
    "cultural": { "A": <0-1>, "B": <0-1> },
    "socioeconomic": { "A": <0-1>, "B": <0-1> }
  },
  "analysis": "<Profound 3-5 sentence comparative audit breakdown>",
  "recommendationA": "<Specific neural instruction to improve Text A>",
  "recommendationB": "<Specific neural instruction to improve Text B>",
  "neuralSignature": "<Unique 16-char hex DELTA proof>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError: string = ''

    for (const model of MODELS) {
      try {
        const fetchUrl = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`Comparing with model: ${model}`)
        res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Success comparison with model: ${model}`)
          break
        } else {
          const errorData = await res.json()
          lastError = errorData.error?.message || 'Unknown error'
          console.warn(`Model ${model} comparison failed: ${lastError}`)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`Model ${model} comparison error: ${errMsg}`)
        lastError = errMsg
      }
    }

    if (!res?.ok) {
      throw new Error(`Neural link failed: ${lastError || 'All models exhausted'}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch (e: unknown) {
      console.error('Delta Audit Parsing Error:', e, rawText)
      result = { 
        scoreA: 0.5, scoreB: 0.5, winner: 'tie', 
        analysis: 'NEURAL_LINK_DISRUPTION: Output parsing dissonance in delta stream.',
        neuralSignature: 'ERR_DELTA_' + Math.random().toString(16).slice(2, 10).toUpperCase() 
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    console.error('Compare Function Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

