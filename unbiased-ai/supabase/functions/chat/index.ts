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

const buildStreamModelUrl = (model: string): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:streamGenerateContent`
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
    const { messages, context, stream = false } = await req.json()

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
    let selectedModel: string = ''

    // Try each model in fallback chain
    for (const model of MODELS) {
      try {
        const url = stream ? buildStreamModelUrl(model) : buildModelUrl(model)
        const fullUrl = (url + '?key=' + GEMINI_API_KEY).replace(':streamGenerateContent', stream ? ':streamGenerateContent' : ':generateContent')
        console.log(`Attempting with model: ${model}, streaming: ${stream}`)
        res = await fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Success with model: ${model}`)
          selectedModel = model
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

    // Handle streaming response
    if (stream && res.body) {
      const encoder = new TextEncoder()
      const reader = res.body.getReader()
      
      let responseText = ''
      
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              let buffer = ''
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  // Send final chunk
                  if (buffer) {
                    try {
                      const chunk = JSON.parse(buffer)
                      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
                      if (text) {
                        responseText += text
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                      }
                    } catch (e) {
                      console.warn('Failed to parse final chunk:', e)
                    }
                  }
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  break
                }
                
                buffer += new TextDecoder().decode(value)
                
                // Process complete JSON objects
                const lines = buffer.split('\n')
                for (let i = 0; i < lines.length - 1; i++) {
                  const line = lines[i].trim()
                  if (line) {
                    try {
                      const chunk = JSON.parse(line)
                      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
                      if (text) {
                        responseText += text
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                      }
                    } catch (e) {
                      console.warn('Failed to parse chunk:', e)
                    }
                  }
                }
                buffer = lines[lines.length - 1]
              }
            } catch (err: unknown) {
              const errMsg = err instanceof Error ? err.message : String(err)
              console.error('Stream error:', errMsg)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
              controller.close()
            }
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      )
    }

    // Handle non-streaming response
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
