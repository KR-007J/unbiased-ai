import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { analysisQueue, webhookQueue } from '../_shared/queue.ts'
import { triggerBatchComplete } from '../_shared/webhooks.ts'
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
import { trackEvent } from '../_shared/cache.ts'

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
  const requestId = `batch-analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const { texts, webhookUrl, priority = 0, metadata = {} } = await req.json()

    // Validate input
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify(createErrorResponse('Array of texts is required', 400)), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (texts.length > 100) {
      return new Response(JSON.stringify(createErrorResponse('Maximum 100 items per batch', 400)), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate each text item
    for (const item of texts) {
      const content = item.content || item.text || ''
      const validation = validateContent(content, 10000)
      if (!validation.valid) {
        return new Response(JSON.stringify(createErrorResponse(`Invalid content in item ${item.id}: ${validation.error}`, 400)), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
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

    // Create batch job record
    let batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (supabase && userId) {
      const { data: batchRecord } = await supabase
        .from('batch_jobs')
        .insert({
          user_id: userId,
          batch_id: batchId,
          status: 'processing',
          total_items: texts.length,
          webhook_url: webhookUrl,
          results: [],
        })
        .select()
        .single()

      if (batchRecord) {
        batchId = batchRecord.id
      }
    }

    // Add individual analysis jobs to queue
    const jobIds: string[] = []
    for (const item of texts) {
      const jobId = await analysisQueue.add('analyze_text', {
        textId: item.id,
        content: item.content || item.text,
        batchId,
        userId,
        metadata,
      }, {
        priority,
        removeOnComplete: 100,
        removeOnFail: 50,
      })
      jobIds.push(jobId)
    }

    // Schedule webhook notification if provided
    if (webhookUrl) {
      try {
        // Register webhook if not already registered
        const webhookId = `batch-${batchId}`;
        await triggerBatchComplete(batchId, {
          status: 'processing',
          totalItems: texts.length,
          estimatedCompletionTime: texts.length * 2,
        }, organizationId);

        // Store webhook URL for later delivery
        await supabase
          .from('batch_jobs')
          .update({
            webhook_deliveries: [webhookId],
            metadata: {
              ...metadata,
              webhookUrl,
              webhookRegistered: true,
            }
          })
          .eq('id', batchId);

      } catch (webhookError) {
        console.error('Failed to register webhook:', webhookError);
        // Continue without webhook - don't fail the batch
      }
    }

    // Track batch job creation
    await trackEvent('batch_job_created', userId || 'anonymous', {
      batchId,
      itemCount: texts.length,
      hasWebhook: !!webhookUrl,
    })

    const processingTime = Date.now() - startTime
    const response = createSuccessResponse({
      batchId,
      status: 'processing',
      totalItems: texts.length,
      queuedJobs: jobIds.length,
      estimatedCompletionTime: texts.length * 2, // Rough estimate: 2 seconds per item
      webhookUrl,
    }, {
      processingTime,
    })

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Batch-ID': batchId,
      }
    })
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      userId: 'batch-analyze-user', // TODO: Extract from request
      action: 'batch_analyze',
      requestId,
      additionalData: { textsCount: req.body?.texts?.length }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'BATCH_ANALYZE')

serve(enhancedHandler)
