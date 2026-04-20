import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-2.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to compute URL hash using built-in crypto
const hashUrl = async (url: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Helper to extract text from HTML
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { url } = await req.json()
    if (!url || !url.startsWith('http')) throw new Error('Valid URL required')
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')

    const urlHash = await hashUrl(url)
    console.log(`[WebScan] Processing: ${url}`)

    // Check cache
    const cachedResponse = await fetch(`${SUPABASE_URL}/rest/v1/web_scans?url_hash=eq.${urlHash}`, {
      headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    })
    const cachedData = await cachedResponse.json()
    if (cachedData?.[0]) {
      return new Response(JSON.stringify({ success: true, url, cached: true, analysis: cachedData[0].bias_analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch and analyze
    const urlRes = await fetch(url)
    const html = await urlRes.text()
    const { title, content, meta } = extractTextFromHTML(html)
    const prompt = `Analyze bias in this web content: TITLE: ${title}, CONTENT: ${content}. Respond in JSON with detected (bool), overallScore (0-1), biasInstances (array).`

    const geminiRes = await fetch(buildModelUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)

    // Save cache
    await fetch(`${SUPABASE_URL}/rest/v1/web_scans`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ url, url_hash: urlHash, bias_analysis: result, user_id: 'anonymous', created_at: new Date().toISOString() })
    })

    return new Response(JSON.stringify({ success: true, url, cached: false, analysis: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
