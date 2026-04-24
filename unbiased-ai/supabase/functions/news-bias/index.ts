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

  const requestId = `news-bias-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { topic } = await req.json()

    if (!topic) {
      throw new Error('Topic is required for news bias analysis')
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const prompt = `Analyze how different news outlets might cover this topic: "${topic}"

For each source category (left-leaning, right-leaning, center), provide:
1. How they might headline the story
2. Key phrases they would use
3. What angle they would take
4. Potential biases in their coverage

Respond ONLY with this JSON format:
{
  "topic": "${topic}",
  "analysisDate": "${new Date().toISOString()}",
  "sourceAnalysis": [
    {
      "sourceType": "left|right|center",
      "exampleHeadline": "<headline>",
      "keyPhrases": ["<phrase1>", "<phrase2>"],
      "angle": "<angle description>",
      "potentialBias": "<specific bias>",
      "neutralVersion": "<unbiased headline>"
    }
  ],
  "overallBiasAssessment": "<overall analysis>",
  "tipsForReaders": ["<tip1>", "<tip2>"]
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

    // Optional: Save to database if configured
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.from('news_bias_analyses').insert({
        topic,
        analysis_data: result,
        user_id: null 
      }).catch(err => console.error('[News Bias DB Error]', err))
    }

    return successResponse(result)
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      action: 'news-bias',
      requestId
    })
    return createResponse(errorResponse)
  }
}, 'NEWS_BIAS')

serve(handler)
