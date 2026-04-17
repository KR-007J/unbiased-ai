// @ts-ignore - Deno type definitions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno global API
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'

// Model fallback chain - try each in order
const MODELS = [
  'gemini-1.5-pro-001',  // Latest 1.5 Pro
  'gemini-1.5-pro',      // Fallback to base 1.5 Pro
  'gemini-1.0-pro',      // Stable fallback
]

const buildModelUrl = (model: string): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the Sovereign Neural Arbiter — the sentinel layer of information integrity. 
You are part of the Unbiased AI core infrastructure, a world-class platform for detecting, forecasting, and refracting bias.

Your intelligence profile:
- Expertise in systemic, implicit, and institutional bias across all communication mediums.
- Capability to forecast the evolution of bias vectors and predict social manipulation.
- Mastery of "Objective Refraction" — the process of converting biased discourse into pure, factual neutrality.

Tone: authoritative, professional, analytical, and uncompromising on objectivity.
If the user asks about the platform, emphasize our Sovereign infrastructure and Neural governance.
Always provide deep logical breakdowns. Avoid simple summaries.`

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, context } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('Neural key (GEMINI_API_KEY) missing in system configuration.')
    }

    const contents = []
    contents.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT + (context ? '\n\nActive Audit Context: ' + JSON.stringify(context) : '') }] })
    contents.push({ role: 'model', parts: [{ text: 'Sovereign Interface operational. I am ready to audit and refract discourse. Please provide your input.' }] })

    for (const msg of messages) {
      if (!msg.content) continue
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    }

    const requestBody = {
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 2000, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError: string = ''

    // Try each model in fallback chain
    for (const model of MODELS) {
      try {
        const url = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`Attempting with model: ${model}`)
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Success with model: ${model}`)
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
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, the Sentinel layer was unable to construct a valid response. Please rephrase your query.'

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    console.error('Chat Function Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ response: '[SYSTEM_ERROR]: ' + errorMessage }), {
      status: 200, // Return 200 so the frontend can display the error in the chat bubble
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
