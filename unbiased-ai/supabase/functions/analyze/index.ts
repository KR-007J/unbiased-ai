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
  createResponse,
  successResponse,
  createErrorResponse,
  handleError,
  validateContent,
  validateUrl,
  corsHeaders,
  ERROR_CODES
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { logAnalysis, logApiCall, logError } from '../_shared/audit.ts'

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

  try {
    const { text, url } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
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
      console.error(`[Audit Error] ${GEMINI_MODEL} failed: ${errorMsg}`)
      throw new Error(`Gemini API error (${res.status}): ${errorMsg}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try { 
      result = JSON.parse(cleaned) 
    } catch (e) { 
      console.error('[Parse Failure]', e, rawText)
      throw new Error('Failed to parse Gemini response as JSON.')
    }

    return successResponse(result, { model: GEMINI_MODEL })
  } catch (err: any) {
    const errorResponse = await handleError(err, { action: 'analyze' })
    return createResponse(errorResponse)
  }
})




