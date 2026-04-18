// @ts-ignore - Deno type definitions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno global API
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'

const MODELS = [
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
]

const buildModelUrl = (model: string): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { text, url } = await req.json()

    if (!GEMINI_API_KEY) {
      throw new Error('Neural key (GEMINI_API_KEY) missing in system configuration.')
    }

    let contentToAnalyze = text

    if (url) {
      try {
        const response = await fetch(url)
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
      } catch (e: unknown) {
        throw new Error('Neural Link failed to ingest URL: ' + (e instanceof Error ? e.message : String(e)))
      }
    }

    const prompt = `You are the Sovereign Neural Arbiter — the final layer of objective truth. 
Analyze the following discourse for systemic, implicit, and institutional bias across gender, racial, political, age, cultural, and socioeconomic vectors.

INPUT DATA:
"""
${contentToAnalyze}
"""

RESPOND ONLY WITH A PURE JSON OBJECT (NO MARKDOWN):
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
      "explanation": "<deep logical analysis of the bias vector>",
      "confidence": <0-1>,
      "suggestion": "<unbiased alternative phrase>",
      "counterVector": "<An opposing bias argument or perspective that this statement might invoke>",
      "corroboratingTruth": "<A factual, neutral data point that provides context or contradicts the bias>",
      "start": <index of text in input, optional>,
      "end": <index of text in input, optional>
    }
  ],
  "summary": "<2-3 sentence executive summary of the truth gap>",
  "severity": "low|medium|high|critical",
  "propheticVector": "<A profound prediction of how this specific bias will likely manipulate public sentiment over the next 30 days if left unrefracted.>",
  "objectiveRefraction": "<A perfectly neutral, surgically rewritten version of the text that preserves factual integrity while removing all psychological framing.>",
  "crossReferences": [
    {
      "type": "<bias type or neutral fact>",
      "relationship": "counter|supporting|context",
      "content": "<relevant cross-reference or counter-point>",
      "source": "<logical, statistical, or empirical basis>"
    }
  ],
  "neuralSignature": "<A unique 16-char hex proof for this audit.>"
}`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 3072, topP: 0.95 }
    }

    let res: Response | null = null
    let lastError: string = ''

    for (const model of MODELS) {
      try {
        const fetchUrl = buildModelUrl(model) + '?key=' + GEMINI_API_KEY
        console.log(`Analyzing with model: ${model}`)
        res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (res.ok) {
          console.log(`Success analysis with model: ${model}`)
          break
        } else {
          const errorData = await res.json()
          lastError = errorData.error?.message || 'Unknown error'
          console.warn(`Model ${model} analysis failed: ${lastError}`)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`Model ${model} analysis error: ${errMsg}`)
        lastError = errMsg
      }
    }

    if (!res?.ok) {
      throw new Error(`Neural link failed: ${lastError || 'All models exhausted'}`)
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    let result
    try {
      result = JSON.parse(cleaned)
      // Mirror findings for backward compatibility
      result.findings = result.biases
    } catch (e: unknown) {
      console.error('Core Analysis Parsing Error:', e, rawText)
      result = { 
        biasScore: 0, confidence: 0, biasTypes: {}, biases: [], 
        summary: 'NEURAL_LINK_DISRUPTION: Output parsing dissonance.',
        neuralSignature: 'ERR_' + Math.random().toString(16).slice(2, 10).toUpperCase() 
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    console.error('Analyze Function Error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: '[SYSTEM_ERROR]: ' + errorMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

