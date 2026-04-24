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

const BIAS_PATTERNS = {
  emotional: ['feel', 'believe', 'always', 'never', 'everyone knows', 'obviously'],
  us_vs_them: ['they', 'them', 'our', 'we', 'those people', 'insiders', 'outsiders'],
  absolutes: ['all', 'none', 'every', 'must', 'should always', 'never'],
  generalizations: ['women', 'men', 'young people', 'old people', 'the rich', 'the poor'],
  loaded_words: ['radical', 'extreme', 'mainstream', 'elite', 'woke', 'cancel'],
}

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const handler = withRateLimit(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const requestId = `fingerprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { content, userId } = await req.json()

    if (!content) {
      throw new Error('Content is required for fingerprint analysis')
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const contentLower = content.toLowerCase()
    let patternCounts: Record<string, number> = {}
    
    for (const [pattern, words] of Object.entries(BIAS_PATTERNS)) {
      patternCounts[pattern] = words.filter(w => contentLower.includes(w)).length
    }

    const prompt = `Analyze this text and create a unique "bias fingerprint" profile.

Text:
"""
${content}
"""

Analyze patterns for:
1. Writing style (formal/informal, emotional/analytical)
2. Bias tendency (which types appear most)
3. Tone markers (positive/negative/neutral)
4. Perspective bias (subjective/objective)

Respond ONLY with JSON:
{
  "fingerprint": {
    "style": "formal|informal|mixed",
    "tone": "emotional|analytical|neutral",
    "perspective": "subjective|objective|mixed",
    "biasTendency": ["<top 3 bias types>"],
    "emoji": "<one emoji that represents writing style>",
    "archetype": "<writer archetype name>"
  },
  "characteristics": {
    "emotional_appeal": <0-100>,
    "objectivity": <0-100>,
    "inclusivity": <0-100>,
    "neutrality_score": <0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "areas_to_improve": ["<area 1>", "<area 2>"],
  "tips": ["<tip 1>", "<tip 2>"],
  "comparison_quote": "<one sentence that best represents this text's style>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000, topP: 0.95 }
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

    result.patternCounts = patternCounts
    result.fingerprintId = crypto.randomUUID()
    result.timestamp = new Date().toISOString()

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.from('bias_fingerprints').insert({
        user_id: userId,
        fingerprint_data: result,
        archetype: result.fingerprint?.archetype,
        characteristics: result.characteristics
      }).catch(err => console.error('[Fingerprint DB Error]', err))
    }

    return successResponse(result)
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      action: 'bias-fingerprint',
      requestId
    })
    return createResponse(errorResponse)
  }
}, 'BIAS_FINGERPRINT')

serve(handler)
