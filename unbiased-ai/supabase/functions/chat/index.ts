import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-2.5-flash'

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid request: messages array is required')
    }

    // Build conversation for gemini-2.5-flash
    let systemPrompt = "You are the Sovereign Neural Arbiter, a high-fidelity AI specialized in bias detection and objective refraction. Maintain a professional, surgical, and futuristic tone."
    
    if (context) {
      systemPrompt = `System Context: ${context}\n\n${systemPrompt}`
    }

    const contents = []
    
    // Add system instruction as first user message if needed
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
      contents.push({
        role: 'model',
        parts: [{ text: "Understood. Neural link established. Ready for analysis." }]
      })
    }

    // Add conversation history
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })
    }

    const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    
    console.log(`[Chat] Using ${GEMINI_MODEL} with ${contents.length} content parts`)
    
    const requestBody = {
      contents,
      generationConfig: { 
        temperature: 0.7, 
        maxOutputTokens: 2048, 
        topP: 0.95,
        topK: 64
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_UNSPECIFIED', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DEROGATORY_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_VIOLENCE', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUAL_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_MEDICAL_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
      const errorMsg = errorData.error?.message || response.statusText
      console.error(`[Chat Error] ${GEMINI_MODEL} failed (${response.status}): ${errorMsg}`)
      throw new Error(`Gemini API error (${response.status}): ${errorMsg}`)
    }

    const data = await response.json()
    console.log('[Chat Response]', JSON.stringify(data).slice(0, 200))
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    
    if (!text) {
      console.warn('[Chat Warning] Empty response from Gemini')
      throw new Error('Gemini returned empty response - check safety filters or API quota')
    }
    
    return new Response(JSON.stringify({ response: text, model: GEMINI_MODEL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Model': GEMINI_MODEL }
    })
  } catch (err: any) {
    console.error('[Chat Failure]', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
