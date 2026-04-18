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
    const { text, biasTypes } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
    }

    const prompt = `Rewrite the following text to eliminate all bias while preserving the original meaning and tone.
${biasTypes?.length > 0 ? `Focus on: ${biasTypes.join(', ')} bias.` : ''}

Original text:
"""
${text}
"""

Respond ONLY with JSON:
{
  "rewritten": "<the rewritten text>",
  "explanation": "<explanation of changes>",
  "changesCount": <number>,
  "biasRemoved": ["<list>"]
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError = ''
    let selectedModel = ''

    for (const model of MODELS) {
      try {
        const url = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`[Rewrite] Attempting ${model}...`)
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
      throw new Error('Failed to parse refracted text.')
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Neural-Signature': `v1beta-${selectedModel}` }
    })
  } catch (err: any) {
    console.error('[Rewrite Failure]', err)
    return new Response(JSON.stringify({ error: '[NEURAL_REWRITE_FAILURE]: ' + err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
