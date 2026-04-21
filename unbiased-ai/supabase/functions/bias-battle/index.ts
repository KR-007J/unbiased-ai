import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
import { handleError, createResponse, handleCors, successResponse } from '../_shared/api.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { textA, textB, userId } = await req.json()

    if (!textA || !textB) {
      throw new Error('Both textA and textB are required for bias battle')
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const prompt = `You are a Bias Battle Judge. Compare these two texts and determine which one contains MORE bias.

TEXT A:
"""
${textA}
"""

TEXT B:
"""
${textB}
"""

Analyze both texts for bias (gender, racial, political, age, cultural, religious, socioeconomic, etc.)

Respond ONLY with this JSON format:
{
  "winner": "A|B|DRAW",
  "scoreA": <0-100>,
  "scoreB": <0-100>,
  "analysisA": {
    "biasInstances": [
      {
        "phrase": "<exact biased phrase>",
        "type": "<bias type>",
        "severity": "low|medium|high",
        "explanation": "<why this is biased>"
      }
    ],
    "totalBiasCount": <number>,
    "overallBiasLevel": "low|medium|high"
  },
  "analysisB": {
    "biasInstances": [
      {
        "phrase": "<exact biased phrase>",
        "type": "<bias type>",
        "severity": "low|medium|high",
        "explanation": "<why this is biased>"
      }
    ],
    "totalBiasCount": <number>,
    "overallBiasLevel": "low|medium|high"
  },
  "verdict": "<brief explanation of why one won or if it's a draw>",
  "improvementTips": ["<tip for textA>", "<tip for textB>"]
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000, topP: 0.95 }
    }

    const fetchUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
      throw new Error(`Gemini API error: ${errorData.error?.message || res.statusText}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch (e) {
      throw new Error('Failed to parse Gemini response')
    }

    result.battleId = crypto.randomUUID()
    result.timestamp = new Date().toISOString()
    result.textA = textA.substring(0, 100) + '...'
    result.textB = textB.substring(0, 100) + '...'

    const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    if (supabase) {
      await supabase.from('bias_battles').insert({
        text_a: textA,
        text_b: textB,
        winner: result.winner,
        score_a: result.scoreA,
        score_b: result.scoreB,
        battle_data: result,
        user_id: userId
      }).catch(console.error);
    }

    return successResponse(result)
  } catch (err: any) {
    const errorResponse = await handleError(err, { action: 'bias-battle' })
    return createResponse(errorResponse)
  }
})
