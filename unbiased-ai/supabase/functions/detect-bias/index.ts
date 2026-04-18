// @ts-ignore - Deno type definitions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno global API
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'

// Model fallback chain - try each in order
const MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const buildModelUrl = (model: string): string => {
  return "https://generativelanguage.googleapis.com/" + GEMINI_API_VERSION + "/models/" + model + ":generateContent"
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { content, type } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('Neural key (GEMINI_API_KEY) missing in system configuration.')
    }

    const prompt = "Detect specific bias instances in the following " + (type || "text") + ".\\n\\nContent:\\n\\\"\\\"\\\"\\n" + content + "\\n\\\"\\\"\\\"\\n\\nRespond ONLY with JSON:\\n{\\n  \\\"detected\\\": true|false,\\n  \\\"biasInstances\\\": [\\n    {\\n      \\\"phrase\\\": \\\"<exact phrase>\\\",\\n      \\\"biasType\\\": \\\"<gender|racial|political|age|cultural|religious|socioeconomic>\\\",\\n      \\\"severity\\\": \\\"low|medium|high\\\",\\n      \\\"explanation\\\": \\\"<explanation>\\\",\\n      \\\"suggestion\\\": \\\"<unbiased alternative>\\\"\\n    }\\n  ],\\n  \\\"overallAssessment\\\": \\\"<brief assessment>\\\"\\n}";

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError: string = ''

    // Try each model in fallback chain
    for (const model of MODELS) {
      try {
        const url = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`Attempting audit with model: ${model}`)
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Audit success with model: ${model}`)
          break
        } else {
          const errorData = await res.json()
          lastError = errorData.error?.message || 'Unknown error'
          console.warn(`Model ${model} failed: ${lastError}`)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`Model ${model} error: ${errMsg}`)
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
    } catch (e) { 
      console.error('Detect Parsing Error:', e)
      result = { detected: false, biasInstances: [], overallAssessment: 'Integrity scan failed to parse neural output.' } 
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    console.error('Detect Bias Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

