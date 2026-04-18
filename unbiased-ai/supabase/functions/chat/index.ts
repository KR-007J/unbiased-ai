// @ts-ignore - Deno type definitions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const VERSION = "1.2.3-PROD"

const MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = "You are the Sovereign Neural Arbiter. Tone: authoritative, analytical, objective. expertise: bias detection and forecast."

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, context, stream = false } = await req.json()
    console.log("[" + VERSION + "] Chat (stream=" + stream + ")")

    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing')

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Ensure system prompt is applied
    if (contents.length === 0 || contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }, { role: 'model', parts: [{ text: "Acknowledged. Interface active." }] })
    } else {
       contents[0].parts[0].text = SYSTEM_PROMPT + "\n\n" + contents[0].parts[0].text
    }

    const requestBody = {
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 2000 }
    }

    let response: Response | null = null
    let lastError = ''

    for (const model of MODELS) {
      const url = "https://generativelanguage.googleapis.com/" + GEMINI_API_VERSION + "/models/" + model + ":" + (stream ? "streamGenerateContent" : "generateContent") + "?key=" + GEMINI_API_KEY
      
      try {
        console.log("Attempting " + model)
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (response.ok) break
        const err = await response.json()
        lastError = err.error?.message || 'Unknown error'
        console.warn(model + " failed: " + lastError)
      } catch (e) {
        lastError = String(e)
        console.warn(model + " error: " + lastError)
      }
    }

    if (!response?.ok) throw new Error(lastError || 'Models exhausted')

    if (stream) {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const reader = response.body?.getReader()
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("Stream reader failed")

      // Process stream
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const matches = chunk.match(/"text":\s*"([^"]+)"/g)
            if (matches) {
              for (const m of matches) {
                const text = m.match(/"text":\s*"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"')
                if (text) {
                  await writer.write(encoder.encode("data: " + JSON.stringify({ text }) + "\n\n"))
                }
              }
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"))
        } catch (e) {
          await writer.write(encoder.encode("data: " + JSON.stringify({ error: String(e) }) + "\n\n"))
        } finally {
          writer.close()
        }
      })()

      return new Response(readable, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      })
    } else {
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "The Sentinel layer was unable to generate a response. Please check your query or neural parameters."
      return new Response(JSON.stringify({ response: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err: any) {
    console.error(err)
    return new Response(JSON.stringify({ response: "[SYSTEM_ERROR]: " + err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
