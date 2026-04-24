import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  successResponse,
  handleError,
  createResponse,
  validateUrl
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

const hashUrl = async (url: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const extractTextFromHTML = (html: string): { title: string; content: string; meta: Record<string, string> } => {
  const meta: Record<string, string> = {}
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
  if (descMatch) meta.description = descMatch[1]
  const cleanedHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  const contentMatch = cleanedHtml.match(/<(?:article|main|content).*?>(.+?)<\/(?:article|main|content)>/is)
  const bodyMatch = cleanedHtml.match(/<body[^>]*>(.+?)<\/body>/is)
  const contentHtml = contentMatch?.[1] || bodyMatch?.[1] || cleanedHtml
  let content = contentHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  if (content.length > 3000) content = content.substring(0, 2000) + '...'
  return { title, content, meta }
}

const handler = withRateLimit(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const requestId = `webscan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { url } = await req.json()
    const urlValidation = validateUrl(url)
    if (!urlValidation.valid) throw new Error(urlValidation.error)
    
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')

    const urlHash = await hashUrl(url)
    console.log(`[WebScan] Processing: ${url}`)

    const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    
    if (supabase) {
      const { data: cached } = await supabase
        .from('web_scans')
        .select('bias_analysis')
        .eq('url_hash', urlHash)
        .single()
      
      if (cached) {
        return successResponse({ url, cached: true, analysis: cached.bias_analysis })
      }
    }

    const urlRes = await fetch(url)
    if (!urlRes.ok) throw new Error(`Failed to fetch URL: ${urlRes.statusText}`)
    
    const html = await urlRes.text()
    const { title, content } = extractTextFromHTML(html)
    const prompt = `Analyze bias in this web content: TITLE: ${title}, CONTENT: ${content}. Respond in JSON with: { "detected": bool, "overallScore": 0-1, "biasInstances": [] }`

    const geminiRes = await fetch(buildModelUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })

    if (!geminiRes.ok) throw new Error('Gemini API call failed')
    
    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)

    if (supabase) {
      await supabase.from('web_scans').insert({
        url,
        url_hash: urlHash,
        bias_analysis: result,
        user_id: 'anonymous',
        created_at: new Date().toISOString()
      }).catch(err => console.error('[WebScan DB Error]', err))
    }

    return successResponse({ url, cached: false, analysis: result })
  } catch (err: any) {
    const errorResponse = await handleError(err, { action: 'web-scan', requestId })
    return createResponse(errorResponse)
  }
}, 'WEB_SCAN')

serve(handler)
