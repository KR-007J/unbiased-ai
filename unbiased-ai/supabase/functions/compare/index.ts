import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getCachedResult,
  setCachedResult,
  CACHE_KEYS,
  trackEvent
} from '../_shared/cache.ts'
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  handleError,
  validateContent,
  corsHeaders,
  ERROR_CODES
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

// Apply rate limiting and enterprise utilities
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `compare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { textA, textB, metadata = {} } = await req.json()

    // Validate inputs
    const validationA = validateContent(textA, 5000)
    const validationB = validateContent(textB, 5000)

    if (!validationA.valid) {
      return new Response(JSON.stringify(createErrorResponse(`Text A: ${validationA.error}`, 400)), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!validationB.valid) {
      return new Response(JSON.stringify(createErrorResponse(`Text B: ${validationB.error}`, 400)), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
    }

    // Extract user ID from auth header (simplified)
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null
    if (authHeader) {
      // TODO: Properly decode JWT to extract user ID
      userId = 'authenticated-user' // Placeholder
    }

    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    // Check Redis cache first
    const cacheKey = CACHE_KEYS.ANALYSIS(`${textA}:${textB}`)
    let cachedResult = await getCachedResult(cacheKey)

    if (cachedResult) {
      // Track cache hit
      await trackEvent('cache_hit', userId || 'anonymous', { endpoint: 'compare' })

      const processingTime = Date.now() - startTime
      const response = createSuccessResponse(cachedResult, {
        processingTime,
        cached: true,
        model: GEMINI_MODEL
      })

      return new Response(JSON.stringify(response), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      })
    }

    const prompt = `Compare these two texts for objective integrity and linguistic bias.

TEXT A:
"""
${textA}
"""

TEXT B:
"""
${textB}
"""

RESPOND ONLY WITH JSON:
{
  "scoreA": <0-1>,
  "scoreB": <0-1>,
  "winner": "A"|"B"|"tie",
  "winnerReason": "<Explanation>",
  "categoryComparison": {
    "gender": { "A": <0-1>, "B": <0-1> },
    "racial": { "A": <0-1>, "B": <0-1> },
    "political": { "A": <0-1>, "B": <0-1> },
    "age": { "A": <0-1>, "B": <0-1> },
    "cultural": { "A": <0-1>, "B": <0-1> },
    "socioeconomic": { "A": <0-1>, "B": <0-1> }
  },
  "analysis": "<Detailed comparison>",
  "recommendationA": "<How to improve A>",
  "recommendationB": "<How to improve B>",
  "neuralSignature": "<16-char hex>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, topP: 0.95 }
    }

    const fetchUrl = buildModelUrl()
    console.log(`[${requestId}] Using ${GEMINI_MODEL} for text comparison...`)

    // Track API call event
    await trackEvent('api_call', userId || 'anonymous', {
      endpoint: 'compare',
      model: GEMINI_MODEL,
      textALength: textA.length,
      textBLength: textB.length
    })

    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
      const errorMsg = errorData.error?.message || res.statusText
      console.error(`[${requestId}] Gemini API error (${res.status}): ${errorMsg}`)

      throw new Error(`Gemini API error: ${errorMsg}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse Gemini response:`, cleaned)
      throw new Error('Failed to parse AI response as valid JSON.')
    }

    // Cache the result
    await setCachedResult(cacheKey, result, 3600) // 1 hour TTL

    // Save comparison to database for audit trail
    if (supabase && userId) {
      await supabase
        .from('analyses')
        .insert({
          user_id: userId,
          original_text: `Comparison: Text A (${textA.substring(0, 100)}...) vs Text B (${textB.substring(0, 100)}...)`,
          summary: result.analysis,
          language: metadata.language || 'en',
          content_category: 'comparison'
        })
        .catch(console.error)
    }

    const processingTime = Date.now() - startTime
    const response = createSuccessResponse(result, {
      processingTime,
      model: GEMINI_MODEL,
      cached: false
    })

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Model': GEMINI_MODEL
      }
    })
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      userId: 'compare-user', // TODO: Extract from request
      action: 'compare_texts',
      requestId,
      additionalData: {
        textALength: req.body?.textA?.length,
        textBLength: req.body?.textB?.length
      }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'COMPARE')

serve(enhancedHandler)




