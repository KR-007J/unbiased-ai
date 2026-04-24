import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  successResponse,
  handleError,
  createResponse,
  validateContent
} from '../_shared/api.ts'
import { withRateLimit } from '../_shared/rate-limit.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const handler = withRateLimit(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const requestId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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

    const res = await fetch(buildModelUrl(), {
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

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.from('bias_battles').insert({
        text_a: textA,
        text_b: textB,
        winner: result.winner,
        score_a: result.scoreA,
        score_b: result.scoreB,
        battle_data: result,
        user_id: userId
      }).catch(err => console.error('[Bias Battle DB Error]', err))
    }

    return successResponse(result)
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      action: 'bias-battle',
      requestId
    })
    return createResponse(errorResponse)
  }
}, 'BIAS_BATTLE')

serve(handler)
