import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { topic, period = '30day', context = [] } = await req.json()

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required for forecasting' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
      throw new Error(`Gemini API error: ${res.status}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const result = JSON.parse(cleaned)

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('[ForecastBias Failure]', err)
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Failed to generate forecast'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
