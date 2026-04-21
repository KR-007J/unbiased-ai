import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-1.5-flash'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const NEWS_SOURCES = [
  { name: 'CNN', bias: 'left', url: 'https://www.cnn.com' },
  { name: 'Fox News', bias: 'right', url: 'https://www.foxnews.com' },
  { name: 'Reuters', bias: 'center', url: 'https://www.reuters.com' },
  { name: 'AP News', bias: 'center', url: 'https://apnews.com' },
  { name: 'BBC', bias: 'center-left', url: 'https://www.bbc.com/news' },
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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

    const fetchUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const res = await fetch(fetchUrl, {
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

    const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    if (supabase) {
      await supabase.from('news_bias_analyses').insert({
        topic,
        analysis_data: result,
        user_id: null // Can be updated if req includes auth
      }).catch(console.error);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    console.error('[News Bias Analysis Error]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
