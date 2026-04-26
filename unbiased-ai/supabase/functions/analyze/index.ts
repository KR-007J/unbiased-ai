import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { validateFirebaseToken } from '../_shared/auth.ts'
import {
  getCachedResult,
  setCachedResult,
  CACHE_KEYS,
  trackEvent,
  hashContent
} from '../_shared/cache.ts'
import {
  handleCors,
  createResponse,
  successResponse,
  createErrorResponse,
  handleError,
  validateContent,
  validateUrl,
  corsHeaders,
  ERROR_CODES,
  createSuccessResponse
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { logAnalysis, logApiCall, logError } from '../_shared/audit.ts'
import { performSecurityCheck, sanitizeRequestInput, getSecurityHeaders } from '../_shared/security.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const buildModelUrl = (stream = false): string => {
  const method = stream ? 'streamGenerateContent' : 'generateContent'
  const beta = stream ? 'v1beta' : GEMINI_API_VERSION
  const params = stream ? '&alt=sse' : ''
  return `https://generativelanguage.googleapis.com/${beta}/models/${GEMINI_MODEL}:${method}?key=${GEMINI_API_KEY}${params}`
}

// Apply rate limiting and enterprise utilities
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const rawInput = await req.json()
    const sanitizedInput = sanitizeRequestInput(rawInput)
    const { text, url, stream = false } = sanitizedInput

    // Validate Firebase JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse(createErrorResponse('Missing or invalid authorization header', 401), getSecurityHeaders())
    }

    const token = authHeader.split(' ')[1]
    const userId = await validateFirebaseToken(token)

    if (!userId) {
      return createResponse(createErrorResponse('Invalid session or unauthorized access', 403), getSecurityHeaders())
    }

    // Perform security check
    const securityCheck = await performSecurityCheck(req, userId)
    if (!securityCheck.passed) {
      await logError(userId, new Error('Security check failed'), { endpoint: 'analyze', requestId })
      return createResponse(createErrorResponse('Request blocked due to security policy', 403), getSecurityHeaders())
    }

    let contentToAnalyze = text

    if (url) {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP error ${response.status}`)
        const html = await response.text()
        contentToAnalyze = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
          .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gim, '')
          .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gim, '')
          .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gim, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30000)
      } catch (e: any) {
        throw new Error('Sentinel failed to ingest URL: ' + e.message)
      }
    }

    // Surgical Audit Prompt
    const prompt = `You are the Sovereign Neural Arbiter. Analyze the following discourse for systemic, implicit, and institutional bias across gender, racial, political, age, cultural, and socioeconomic vectors.

INPUT DATA:
"""
${contentToAnalyze}
"""

RESPOND ONLY WITH A PURE JSON OBJECT:
{
  "biasScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "biasTypes": {
    "gender": <0-1>, "racial": <0-1>, "political": <0-1>, "age": <0-1>, "cultural": <0-1>, "socioeconomic": <0-1>
  },
  "biases": [
    {
      "type": "gender|racial|political|age|cultural|socioeconomic",
      "text": "<exact string from input>",
      "explanation": "<logical analysis of the bias vector>",
      "confidence": <0-1>,
      "suggestion": "<unbiased alternative phrase>",
      "counterVector": "<An opposing perspective>",
      "corroboratingTruth": "<A factual data point>"
    }
  ],
  "summary": "<2-3 sentence executive summary>",
  "severity": "low|medium|high|critical",
  "propheticVector": "<Prediction of impact>",
  "objectiveRefraction": "<Surgically rewritten version>",
  "neuralSignature": "<16-char hex proof>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 3000, topP: 0.95 }
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set in Supabase secrets')
    }

    if (stream) {
      console.log(`[Stream] Initiating ${GEMINI_MODEL} stream...`)
      const res = await fetch(buildModelUrl(true), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!res.ok) throw new Error(`Gemini Stream Error: ${res.statusText}`)

      // SSE Transformation
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      const reader = res.body?.getReader()

      if (!reader) throw new Error('Failed to get stream reader')

      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      ;(async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            writer.write(encoder.encode(chunk))
          }
        } catch (e) {
          console.error('[Stream Error]', e)
        } finally {
          writer.close()
        }
      })()

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          ...getSecurityHeaders(),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        }
      })
    }

    const fetchUrl = buildModelUrl()
    console.log(`[Audit] Using ${GEMINI_MODEL} (v1 API)...`)
    
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
      const errorMsg = errorData.error?.message || res.statusText
      throw new Error(`Gemini API error (${res.status}): ${errorMsg}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { 
      result = JSON.parse(cleaned) 
    } catch (e) { 
      throw new Error('Failed to parse Gemini response as JSON.')
    }

    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (supabase && userId) {
      await logAnalysis(userId, 'comprehensive_analysis', contentToAnalyze.length, result.biasScore, Date.now() - startTime, {
        requestId,
        model: GEMINI_MODEL,
        url: url || undefined
      })
    }

    await logApiCall(userId, 'analyze', 'POST', 200, {
      requestId,
      processingTime: Date.now() - startTime,
      model: GEMINI_MODEL
    })

    return createResponse(createSuccessResponse(result, { 
      processingTime: Date.now() - startTime,
      model: GEMINI_MODEL 
    }), getSecurityHeaders())
  } catch (err: any) {
    const errorResponse = await handleError(err, { action: 'analyze', requestId })
    return createResponse(errorResponse, getSecurityHeaders())
  }
})

serve(enhancedHandler)
