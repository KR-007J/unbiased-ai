import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-pro'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, context } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set in Supabase secrets')
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required')
    }

    // Construct proper Gemini chat history format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Add context if provided
    if (context) {
      contents.unshift({
        role: 'user',
        parts: [{ text: `System Context: ${context}\n\nYou are the Sovereign Neural Arbiter, a high-fidelity AI specialized in bias detection and objective refraction. Maintain a professional, surgical, and futuristic tone.` }]
      }, {
        role: 'model',
        parts: [{ text: "Acknowledged. Neural link established. Sovereign Layer standing by for objective audit." }]
      })
    }

    const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    
    console.log(`[Chat] Using ${GEMINI_MODEL} (v1 API)...`)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.95 }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
      const errorMsg = errorData.error?.message || response.statusText
      console.error(`[Chat Error] ${GEMINI_MODEL} failed: ${errorMsg}`)
      throw new Error(`Gemini API error (${response.status}): ${errorMsg}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Neural Arbiter encountered a void in the response space."
    
    return new Response(JSON.stringify({ response: text, model: GEMINI_MODEL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': GEMINI_MODEL }
    })
  } catch (err: any) {
    console.error('[Chat Failure]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
