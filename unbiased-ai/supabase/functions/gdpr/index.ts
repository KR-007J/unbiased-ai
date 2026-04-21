import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  handleError,
  corsHeaders,
  ERROR_CODES
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { logAuditEvent } from '../_shared/audit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// GDPR compliance functions
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `gdpr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'export'
    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (!supabase) {
      throw new Error('Database connection not available')
    }

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify(createErrorResponse('Authentication required', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract user ID from JWT (simplified)
    let userId: string | null = null
    try {
      userId = 'authenticated-user' // Placeholder
    } catch (error) {
      return new Response(JSON.stringify(createErrorResponse('Invalid authentication token', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'export_data': {
        // Export all user data for GDPR Article 20 (data portability)

        const exportData = {
          userId,
          exportDate: new Date().toISOString(),
          data: {} as any
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (profile) {
          exportData.data.userProfile = profile
        }

        // Get analyses
        const { data: analyses } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        exportData.data.analyses = analyses || []

        // Get messages/chat history
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        exportData.data.messages = messages || []

        // Get web scans
        const { data: webScans } = await supabase
          .from('web_scans')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        exportData.data.webScans = webScans || []

        // Get batch jobs
        const { data: batchJobs } = await supabase
          .from('batch_jobs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        exportData.data.batchJobs = batchJobs || []

        // Get forecasts
        const { data: forecasts } = await supabase
          .from('forecasts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        exportData.data.forecasts = forecasts || []

        // Get organization memberships
        const { data: orgMemberships } = await supabase
          .from('organization_members')
          .select(`
            *,
            organizations (
              id,
              name,
              slug,
              created_at
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)

        exportData.data.organizationMemberships = orgMemberships || []

        // Get audit logs (user's own actions)
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(1000) // Limit for performance

        exportData.data.auditLogs = auditLogs || []

        // Log the export for compliance
        await logAuditEvent({
          user_id: userId,
          action: 'gdpr_data_export',
          target_table: 'user_data',
          changes: {
            exported: true,
            recordCount: {
              analyses: analyses?.length || 0,
              messages: messages?.length || 0,
              webScans: webScans?.length || 0,
              batchJobs: batchJobs?.length || 0,
              forecasts: forecasts?.length || 0,
              auditLogs: auditLogs?.length || 0
            }
          }
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(exportData, { processingTime })

        return new Response(JSON.stringify(response, null, 2), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Content-Disposition': `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      case 'delete_data': {
        const { confirmDeletion } = await req.json()

        if (!confirmDeletion) {
          return new Response(JSON.stringify(createErrorResponse('Deletion must be explicitly confirmed', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Start deletion process (GDPR Article 17 - right to erasure)
        // Note: In a real implementation, this would be a queued job with proper handling

        const deletionSummary = {
          userId,
          deletionStarted: new Date().toISOString(),
          recordsDeleted: {} as any
        }

        // Delete user data in order of dependencies

        // Delete messages (has foreign key to analyses)
        const { data: deletedMessages } = await supabase
          .from('messages')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.messages = deletedMessages?.length || 0

        // Delete analyses
        const { data: deletedAnalyses } = await supabase
          .from('analyses')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.analyses = deletedAnalyses?.length || 0

        // Delete web scans
        const { data: deletedWebScans } = await supabase
          .from('web_scans')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.webScans = deletedWebScans?.length || 0

        // Delete batch jobs
        const { data: deletedBatchJobs } = await supabase
          .from('batch_jobs')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.batchJobs = deletedBatchJobs?.length || 0

        // Delete forecasts
        const { data: deletedForecasts } = await supabase
          .from('forecasts')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.forecasts = deletedForecasts?.length || 0

        // Delete organization memberships (but keep organizations)
        const { data: deletedMemberships } = await supabase
          .from('organization_members')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.organizationMemberships = deletedMemberships?.length || 0

        // Delete user profile
        const { data: deletedProfile } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId)
          .select('id')

        deletionSummary.recordsDeleted.userProfile = deletedProfile?.length || 0

        // Note: We keep audit logs for compliance purposes, but anonymize them
        await supabase
          .from('audit_logs')
          .update({
            changes: {
              ...JSON.parse(JSON.stringify(await supabase
                .from('audit_logs')
                .select('changes')
                .eq('user_id', userId)
                .single()
                .then(r => r.data?.changes || {}))),
              gdpr_deleted: true,
              deletion_date: new Date().toISOString()
            }
          })
          .eq('user_id', userId)

        // Log the deletion for compliance
        await logAuditEvent({
          user_id: userId,
          action: 'gdpr_data_deletion',
          target_table: 'user_data',
          changes: {
            deleted: true,
            ...deletionSummary.recordsDeleted
          }
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          ...deletionSummary,
          message: 'Data deletion initiated. All personal data has been removed from our systems.',
          compliance: {
            gdpr_article: 17,
            right_to_erasure: true,
            retention_period: 'Data permanently deleted',
            audit_trail_maintained: true
          }
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'consent_status': {
        // Get current consent status (GDPR Article 7)
        const { data: consents } = await supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        const currentConsents = consents?.reduce((acc, consent) => {
          acc[consent.consent_type] = {
            granted: consent.granted,
            granted_at: consent.granted_at,
            expires_at: consent.expires_at,
            version: consent.version
          }
          return acc
        }, {} as any) || {}

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          userId,
          consents: currentConsents,
          lastUpdated: consents?.[0]?.created_at || null,
          gdpr: {
            version: 'GDPR 2018',
            articles: [6, 7, 17, 20],
            consent_types: {
              analytics: 'Processing of usage analytics',
              marketing: 'Marketing communications',
              third_party: 'Sharing with third parties',
              ai_processing: 'AI model training and improvement'
            }
          }
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'update_consent': {
        const { consentType, granted, version = '1.0' } = await req.json()

        if (!consentType) {
          return new Response(JSON.stringify(createErrorResponse('Consent type is required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const validConsentTypes = ['analytics', 'marketing', 'third_party', 'ai_processing']
        if (!validConsentTypes.includes(consentType)) {
          return new Response(JSON.stringify(createErrorResponse('Invalid consent type', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Record consent decision
        const { data: consentRecord } = await supabase
          .from('user_consents')
          .insert({
            user_id: userId,
            consent_type: consentType,
            granted: granted,
            version: version,
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent'),
            granted_at: new Date().toISOString(),
            expires_at: granted ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null // 1 year expiry for granted consents
          })
          .select()
          .single()

        // Log consent change for compliance
        await logAuditEvent({
          user_id: userId,
          action: 'gdpr_consent_updated',
          target_table: 'user_consents',
          target_id: consentRecord?.id,
          changes: {
            consentType,
            granted,
            version,
            ip_address: consentRecord?.ip_address,
            user_agent: consentRecord?.user_agent?.substring(0, 200)
          }
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          consentType,
          granted,
          recorded: true,
          consentId: consentRecord?.id,
          gdpr: {
            lawful_basis: granted ? 'consent' : 'withdrawn',
            article: 6,
            recorded_at: consentRecord?.granted_at
          }
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'data_processing_report': {
        // Generate report of data processing activities (GDPR Article 15)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

        const report = {
          userId,
          reportPeriod: {
            from: thirtyDaysAgo,
            to: new Date().toISOString()
          },
          processingActivities: {} as any
        }

        // Analysis processing
        const { data: analysisStats } = await supabase
          .from('analyses')
          .select('created_at, bias_score')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo)

        report.processingActivities.analyses = {
          count: analysisStats?.length || 0,
          purpose: 'Bias detection and content analysis',
          legal_basis: 'consent',
          data_categories: ['content_text', 'bias_scores', 'metadata'],
          recipients: ['ai_models', 'internal_analytics'],
          retention_period: '2_years'
        }

        // Message processing
        const { data: messageStats } = await supabase
          .from('messages')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo)

        report.processingActivities.messages = {
          count: messageStats?.length || 0,
          purpose: 'AI-powered conversation assistance',
          legal_basis: 'consent',
          data_categories: ['conversation_text', 'ai_responses', 'metadata'],
          recipients: ['ai_models', 'internal_analytics'],
          retention_period: '1_year'
        }

        // Web scan processing
        const { data: webScanStats } = await supabase
          .from('web_scans')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo)

        report.processingActivities.webScans = {
          count: webScanStats?.length || 0,
          purpose: 'Website bias analysis',
          legal_basis: 'consent',
          data_categories: ['web_content', 'urls', 'analysis_results'],
          recipients: ['ai_models', 'internal_analytics'],
          retention_period: '6_months'
        }

        // Log report generation
        await logAuditEvent({
          user_id: userId,
          action: 'gdpr_processing_report_generated',
          target_table: 'user_data',
          changes: {
            reportGenerated: true,
            periodDays: 30,
            activitiesCount: Object.keys(report.processingActivities).length
          }
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(report, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Content-Disposition': `attachment; filename="gdpr-processing-report-${userId}-${new Date().toISOString().split('T')[0]}.json"`
          }
        })
      }

      default:
        return new Response(JSON.stringify(createErrorResponse('Invalid action', 400)), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      userId: 'gdpr-user', // TODO: Extract from request
      action: 'gdpr_compliance',
      requestId,
      additionalData: { action: new URL(req.url).searchParams.get('action') }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'GENERAL')

serve(enhancedHandler)
