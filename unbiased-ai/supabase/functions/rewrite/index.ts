import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, biasTypes } = await req.json()

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

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2048 } })
    })

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result
    try { result = JSON.parse(cleaned) }
    catch { result = { rewritten: text, explanation: 'Could not generate rewrite.', changesCount: 0, biasRemoved: [] } }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
