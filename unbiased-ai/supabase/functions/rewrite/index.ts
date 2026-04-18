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
    const { text, biasTypes } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('Neural key (GEMINI_API_KEY) missing in system configuration.')
    }

    const prompt = `You are an expert in fair and inclusive language. Rewrite the following text to eliminate all bias while preserving the original meaning, tone, and intent.

${biasTypes?.length > 0 ? `Focus especially on eliminating: ${biasTypes.join(', ')} bias.` : ''}

Original text:
"""
${text}
"""

Respond ONLY with JSON:
{
  "rewritten": "<the complete unbiased rewritten text>",
  "explanation": "<explanation of what was changed and why, in 2-4 sentences>",
  "changesCount": <number of changes made>,
  "biasRemoved": ["<list of specific bias instances removed>"]
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError: string = ''

    for (const model of MODELS) {
      try {
        const fetchUrl = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`Rewriting with model: ${model}`)
        res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Success rewrite with model: ${model}`)
          break
        } else {
          const errorData = await res.json()
          lastError = errorData.error?.message || 'Unknown error'
          console.warn(`Model ${model} rewrite failed: ${lastError}`)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`Model ${model} rewrite error: ${errMsg}`)
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
      console.error('Rewrite Parse Error:', e)
      result = { rewritten: text, explanation: 'Refraction failed due to neural Dissonance.', changesCount: 0, biasRemoved: [] }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    console.error('Rewrite Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
