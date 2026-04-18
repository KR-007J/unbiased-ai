import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1beta'

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
    const { content, type } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
    }

    const prompt = `Identify specific bias instances in the following ${type || "text"}.

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
      "biasType": "gender|racial|political|age|cultural|religious|socioeconomic",
      "severity": "low|medium|high",
      "explanation": "<explanation>",
      "suggestion": "<unbiased alternative>"
    }
  ],
  "overallAssessment": "<brief assessment>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError = ''
    let selectedModel = ''

    for (const model of MODELS) {
      try {
        const url = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`[Detection] Attempting ${model}...`)
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          selectedModel = model
          break
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData.error?.message || res.statusText
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!res || !res.ok) {
      throw new Error(`Neural link failed: ${lastError || 'All models exhausted'}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { 
      result = JSON.parse(cleaned) 
    } catch (e) { 
      throw new Error('Failed to parse detection output.')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Neural-Signature': `v1beta-${selectedModel}` }
    })
  } catch (err: any) {
    console.error('[Detection Failure]', err)
    return new Response(JSON.stringify({ error: '[NEURAL_DETECTION_FAILURE]: ' + err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
