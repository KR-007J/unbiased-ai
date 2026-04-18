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

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set in Supabase secrets')
    }

    const fetchUrl = buildModelUrl()
    console.log(`[Rewrite] Using ${GEMINI_MODEL} (v1 API)...`)
    
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
      const errorMsg = errorData.error?.message || res.statusText
      console.error(`[Rewrite Error] ${GEMINI_MODEL} failed: ${errorMsg}`)
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
    console.error('[Rewrite Failure]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
