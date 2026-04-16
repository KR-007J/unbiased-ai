import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the Unbiased AI assistant — an expert in detecting, analyzing, and eliminating bias in human communication. You specialize in:
- Gender, racial, political, age, cultural, religious, and socioeconomic bias
- Inclusive language and equitable communication
- Media literacy and critical analysis of framing
- Academic research on bias and prejudice
- Practical techniques for writing without bias

Be helpful, clear, and educational. Provide specific examples and actionable advice. Use a professional yet approachable tone.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, context } = await req.json()

    // Build Gemini conversation format
    const contents = []

    // Add system as first user message
    contents.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT + (context ? `\n\nContext: ${context}` : '') }] })
    contents.push({ role: 'model', parts: [{ text: 'Understood. I am ready to help with bias detection and fair communication analysis.' }] })

    // Add conversation history
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    }

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    })

    const data = await res.json()
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.'

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
