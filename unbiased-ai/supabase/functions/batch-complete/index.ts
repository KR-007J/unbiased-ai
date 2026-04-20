import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { triggerBatchComplete } from '../_shared/webhooks.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Batch completion processor
const enhancedHandler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { batchId } = await req.json()

    if (!batchId) {
      return new Response(JSON.stringify({ error: 'Batch ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (!supabase) {
      throw new Error('Database connection not available')
    }

    // Get batch job details
    const { data: batchJob, error: batchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batchJob) {
      return new Response(JSON.stringify({ error: 'Batch job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if batch is completed
    if (batchJob.status !== 'completed') {
      return new Response(JSON.stringify({
        error: 'Batch job is not completed yet',
        status: batchJob.status
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get batch results
    const results = batchJob.results || []

    // Trigger webhook if configured
    if (batchJob.metadata?.webhookUrl) {
      try {
        const deliveryIds = await triggerBatchComplete(batchId, {
          status: 'completed',
          results,
          summary: {
            totalItems: batchJob.total_items,
            processedItems: batchJob.processed_items || 0,
            failedItems: batchJob.failed_items || 0,
            completedAt: batchJob.completed_at,
          }
        }, batchJob.organization_id)

        // Update batch job with webhook delivery IDs
        await supabase
          .from('batch_jobs')
          .update({
            webhook_deliveries: deliveryIds,
            metadata: {
              ...batchJob.metadata,
              webhookTriggered: true,
              webhookDeliveryIds: deliveryIds,
            }
          })
          .eq('id', batchId)

        console.log(`Triggered webhook for completed batch ${batchId}`)
      } catch (webhookError) {
        console.error(`Failed to trigger webhook for batch ${batchId}:`, webhookError)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      batchId,
      webhookTriggered: !!batchJob.metadata?.webhookUrl,
      resultsCount: results.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Batch completion processing error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

serve(enhancedHandler)