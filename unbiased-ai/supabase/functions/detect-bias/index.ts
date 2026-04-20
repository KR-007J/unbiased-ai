import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getCachedResult,
  setCachedResult,
  CACHE_KEYS,
  trackEvent,
  hashContent
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
import { logAnalysis, logApiCall, logError } from '../_shared/audit.ts'
import { performSecurityCheck, sanitizeRequestInput, getSecurityHeaders } from '../_shared/security.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-2.5-flash'

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
  const requestId = `detect-bias-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    // Sanitize request input
    const rawInput = await req.json()
    const sanitizedInput = sanitizeRequestInput(rawInput)
    const { content, type = 'text', cache = true, metadata = {} } = sanitizedInput

    // Perform security check
    const securityCheck = await performSecurityCheck(req, userId || undefined)
    if (!securityCheck.passed) {
      // Log security violation
      await logError(userId || 'unknown', new Error('Security check failed'), {
        endpoint: 'detect-bias',
        securityScore: securityCheck.score,
        issues: securityCheck.issues.length,
        ip: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent')
      })

      return new Response(JSON.stringify(createErrorResponse('Request blocked due to security policy', 403)), {
        status: 403,
        headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
      })
    }

    // Validate input
    const validation = validateContent(content, 10000)
    if (!validation.valid) {
      return new Response(JSON.stringify(createErrorResponse(validation.error!, 400)), {
        status: 400,
        headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json' }
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

    // Check Redis cache first (enterprise caching)
    const cacheKey = CACHE_KEYS.ANALYSIS(content)
    let cachedResult = null
    let isCached = false

    if (cache) {
      cachedResult = await getCachedResult(cacheKey)
      if (cachedResult) {
        isCached = true
      }
    }

    // Fallback to database cache if Redis not available
    if (!isCached && cache && supabase) {
      const { data: dbCached } = await supabase
        .from('analysis_cache')
        .select('result')
        .eq('content_hash', hashContent(content))
        .gte('cached_at', new Date(Date.now() - 3600000).toISOString())
        .single()

      if (dbCached) {
        cachedResult = dbCached.result
        isCached = true
        // Also cache in Redis for future requests
        await setCachedResult(cacheKey, cachedResult, 3600)
      }
    }

    if (isCached) {
      // Track cache hit
      await trackEvent('cache_hit', userId || 'anonymous', { endpoint: 'detect-bias' })

      const processingTime = Date.now() - startTime
      const response = createSuccessResponse(cachedResult, {
        processingTime,
        cached: true,
        model: GEMINI_MODEL
      })

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
      })
    }

    // Generate analysis prompt
    const prompt = `Identify specific bias instances in the following ${type || "text"}.

Content:
"""
${content}
"""

Respond ONLY with JSON:
{
  "detected": true|false,
  "biasInstances": [
    {
      "phrase": "<exact phrase>",
      "biasType": "gender|racial|political|age|cultural|religious|socioeconomic",
      "severity": "low|medium|high",
      "explanation": "<explanation>",
      "suggestion": "<unbiased alternative>"
    }
  ],
  "overallAssessment": "<brief assessment>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2000, topP: 0.95 }
    }

    const fetchUrl = buildModelUrl()
    console.log(`[${requestId}] Using ${GEMINI_MODEL} for bias detection...`)

    // Track API call event
    await trackEvent('api_call', userId || 'anonymous', {
      endpoint: 'detect-bias',
      model: GEMINI_MODEL,
      contentLength: content.length
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

    // Cache the result in both Redis and database
    if (cache) {
      await setCachedResult(cacheKey, result, 3600) // 1 hour TTL

      if (supabase) {
        await supabase
          .from('analysis_cache')
          .upsert({
            content_hash: hashContent(content),
            result,
            cached_at: new Date().toISOString()
          }, { onConflict: 'content_hash' })
          .catch(console.error)
      }
    }

    // Save to analyses table for audit trail
    if (supabase && userId) {
      const analysisRecord = {
        user_id: userId,
        original_text: content,
        bias_score: result.detected ? 0.8 : 0.2, // Simplified scoring
        confidence: 0.85,
        bias_types: result.biasInstances?.map((b: any) => b.biasType) || [],
        findings: result.biasInstances || [],
        summary: result.overallAssessment || '',
        severity: result.detected ? 'high' : 'low',
        language: metadata.language || 'en',
        content_category: type || 'text'
      };

      const { data: savedAnalysis } = await supabase
        .from('analyses')
        .insert(analysisRecord)
        .select()
        .single();

      // Log the analysis for audit trail
      await logAnalysis(
        userId,
        'bias_detection',
        content.length,
        analysisRecord.bias_score,
        processingTime,
        {
          requestId,
          endpoint: 'detect-bias',
          contentType: type,
          biasDetected: result.detected,
          instanceCount: result.biasInstances?.length || 0,
          analysisId: savedAnalysis?.id,
        }
      );
    }

    const processingTime = Date.now() - startTime
    const response = createSuccessResponse(result, {
      processingTime,
      model: GEMINI_MODEL,
      cached: false
    })

    // Log successful API call
    await logApiCall(
      userId || 'anonymous',
      'detect-bias',
      'POST',
      200,
      {
        requestId,
        contentLength: content.length,
        contentType: type,
        processingTime,
        biasDetected: result.detected,
        cached: false,
      }
    );

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
    // Log the error for audit trail
    await logError(userId || 'anonymous', err, {
      endpoint: 'detect-bias',
      operation: 'bias_detection',
      requestId,
      additionalData: {
        contentLength: req.body?.content?.length,
        contentType: req.body?.type,
      }
    });

    const errorResponse = await handleError(err, {
      userId: userId || 'detect-bias-user',
      action: 'detect_bias',
      requestId,
      additionalData: { contentLength: req.body?.content?.length }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, ...getSecurityHeaders(), 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'DETECT_BIAS')

serve(enhancedHandler)
