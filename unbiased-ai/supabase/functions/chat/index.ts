import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// Using v1beta as it's often more stable for the newest features and models
const GEMINI_API_VERSION = 'v1beta'

const MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, context, stream } = await req.json()

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Supabase secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const lastMsg = messages[messages.length - 1]?.content || ''
    
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

    let response: Response | null = null
    let lastError = ''
    let selectedModel = ''

    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`
        
        console.log(`[Neural Link] Attempting ${model} (${stream ? 'SSE' : 'POST'})...`)
        
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.95 }
          })
        })

        if (response.ok) {
          selectedModel = model
          break
        } else {
          const errData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
          lastError = errData.error?.message || response.statusText
          console.warn(`[Neural Warning] ${model} failed: ${lastError}`)
        }
      } catch (err: any) {
        lastError = err.message
        console.error(`[Neural Error] ${model} exception: ${lastError}`)
      }
    }

    if (!response || !response.ok) {
      return new Response(JSON.stringify({ error: `Neural link failed after attempting all models. Last error: ${lastError}` }), {
        status: 200, // Return 200 with error object so frontend can handle it nicely
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (stream) {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const encoder = new TextEncoder()
      const reader = response.body?.getReader() // Get reader from Gemini response

      if (!reader) {
        return new Response(JSON.stringify({ error: 'Gemini returned an empty stream body.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Process the stream in the background
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            await writer.write(value) // Forward the data as is (it's already SSE from Gemini)
          }
        } catch (e) {
          console.error('[Stream Error]', e)
          await writer.write(encoder.encode(`data: {"error": "Stream interrupted: ${e.message}"}\n\n`))
        } finally {
          await writer.close()
        }
      })()

      return new Response(readable, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Neural-Signature': `v1beta-${selectedModel}`
        }
      })
    } else {
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Sovereign Layer encountered a void in the neural output."
      return new Response(JSON.stringify({ response: text, model: selectedModel }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (err: any) {
    console.error('[Critical System Failure]', err)
    return new Response(JSON.stringify({ error: '[NEURAL_CRITICAL_FAILURE]: ' + err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
