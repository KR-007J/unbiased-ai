import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const handler = withRateLimit(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const requestId = `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { topic, period = '30day', context = [] } = await req.json()

    if (!topic) {
      throw new Error('Topic is required for forecasting')
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    console.log(`[ForecastBias] Forecasting for topic: ${topic}, period: ${period}`)

    const prompt = `Act as an AI Ethicist and Predictive Analyst. Forecast bias trends for the given topic over the next ${period}.
    
    TOPIC: ${topic}
    HISTORICAL CONTEXT: ${JSON.stringify(context)}
    
    Respond ONLY with JSON:
    {
      "topic": "${topic}",
      "period": "${period}",
      "forecast": {
        "overallTrend": "increasing|decreasing|stable",
        "primaryBiasTypes": ["type1", "type2"],
        "probabilityOfEmergingBias": 0.0-1.0,
        "predictedSeverity": "low|medium|high",
        "confidenceScore": 0.0-1.0,
        "reasoning": "<explanation for the forecast>",
        "emergingRisks": [
          { "risk": "<risk name>", "description": "<description>" }
        ],
        "mitigationStrategies": [
          "<strategy 1>", "<strategy 2>"
        ]
      }
    }`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1000, topP: 0.95 }
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
    
    const result = JSON.parse(cleaned)

    return successResponse(result)
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      action: 'forecast-bias',
      requestId
    })
    return createResponse(errorResponse)
  }
}, 'FORECAST')

serve(handler)
