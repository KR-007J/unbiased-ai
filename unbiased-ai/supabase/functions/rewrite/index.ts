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
import { validateFirebaseToken } from '../_shared/auth.ts'
import { performSecurityCheck, sanitizeRequestInput, getSecurityHeaders } from '../_shared/security.ts'

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
  const requestId = `rewrite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const rawInput = await req.json()
    const sanitizedInput = sanitizeRequestInput(rawInput)
    const { text, biasTypes = [], metadata = {} } = sanitizedInput

    // Validate Firebase JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify(createErrorResponse('Missing or invalid authorization header', 401)), {
        status: 401,
        headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.split(' ')[1]
    const userId = await validateFirebaseToken(token)

    if (!userId) {
      return new Response(JSON.stringify(createErrorResponse('Invalid session or unauthorized access', 403)), {
        status: 403,
        headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
      })
    }

    // Perform security check
    const securityCheck = await performSecurityCheck(req, userId)
    if (!securityCheck.passed) {
      return new Response(JSON.stringify(createErrorResponse('Request blocked due to security policy', 403)), {
        status: 403,
        headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
      })
    }

    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    // Check Redis cache first
    const cacheKey = CACHE_KEYS.ANALYSIS(`${text}:${biasTypes.join(',')}`)
    let cachedResult = await getCachedResult(cacheKey)

    if (cachedResult) {
      // Track cache hit
      await trackEvent('cache_hit', userId || 'anonymous', { endpoint: 'rewrite' })

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

    const prompt = `Rewrite the following text to eliminate all bias while preserving the original meaning and tone.
${biasTypes?.length > 0 ? `Focus on: ${biasTypes.join(', ')} bias.` : ''}

Original text:
"""
${text}
"""

Respond ONLY with JSON:
{
  "rewritten": "<the rewritten text>",
  "explanation": "<explanation of changes>",
  "changesCount": <number>,
  "biasRemoved": ["<list>"]
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, topP: 0.95 }
    }

    const fetchUrl = buildModelUrl()
    console.log(`[${requestId}] Using ${GEMINI_MODEL} for text rewrite...`)

    // Track API call event
    await trackEvent('api_call', userId || 'anonymous', {
      endpoint: 'rewrite',
      model: GEMINI_MODEL,
      contentLength: text.length,
      biasTypesCount: biasTypes.length
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

    // Save to database for audit trail
    if (supabase && userId) {
      await supabase
        .from('analyses')
        .insert({
          user_id: userId,
          original_text: text,
          rewritten_text: result.rewritten,
          summary: result.explanation,
          language: metadata.language || 'en',
          content_category: 'rewrite'
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
        ...getSecurityHeaders(),
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Model': GEMINI_MODEL
      }
    })
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      userId: 'rewrite-user', // TODO: Extract from request
      action: 'rewrite_text',
      requestId,
      additionalData: { contentLength: req.body?.text?.length }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'REWRITE')

serve(enhancedHandler)




