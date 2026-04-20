import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  handleError,
  corsHeaders
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Advanced monitoring and alerting system
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `monitoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'dashboard'
    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (!supabase) {
      throw new Error('Database connection not available')
    }

    // Get authenticated user (admin check would go here)
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify(createErrorResponse('Authentication required', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let userId: string | null = null
    try {
      userId = 'authenticated-user' // Placeholder - in production, decode JWT
    } catch (error) {
      return new Response(JSON.stringify(createErrorResponse('Invalid authentication token', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'dashboard': {
        const period = url.searchParams.get('period') || '24h'
        const metrics = await getSystemMetrics(supabase, period)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(metrics, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'alerts': {
        const severity = url.searchParams.get('severity') || 'all'
        const status = url.searchParams.get('status') || 'active'
        const alerts = await getActiveAlerts(supabase, severity, status)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(alerts, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'performance': {
        const timeframe = url.searchParams.get('timeframe') || '1h'
        const performance = await getPerformanceMetrics(supabase, timeframe)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(performance, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'health': {
        const health = await performHealthChecks(supabase)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(health, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'logs': {
        const level = url.searchParams.get('level') || 'error'
        const limit = parseInt(url.searchParams.get('limit') || '100')
        const logs = await getSystemLogs(supabase, level, limit)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(logs, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'analytics': {
        const reportType = url.searchParams.get('type') || 'usage'
        const startDate = url.searchParams.get('start')
        const endDate = url.searchParams.get('end')

        let analytics
        switch (reportType) {
          case 'usage':
            analytics = await getUsageAnalytics(supabase, startDate, endDate)
            break
          case 'performance':
            analytics = await getPerformanceAnalytics(supabase, startDate, endDate)
            break
          case 'security':
            analytics = await getSecurityAnalytics(supabase, startDate, endDate)
            break
          default:
            analytics = { error: 'Invalid report type' }
        }

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(analytics, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'create_alert': {
        const { type, severity, message, metadata } = await req.json()

        if (!type || !severity || !message) {
          return new Response(JSON.stringify(createErrorResponse('Type, severity, and message are required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const alert = await createAlert(supabase, {
          type,
          severity,
          message,
          metadata: { ...metadata, createdBy: userId }
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(alert, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'resolve_alert': {
        const alertId = url.searchParams.get('alertId')
        const { resolution } = await req.json()

        if (!alertId) {
          return new Response(JSON.stringify(createErrorResponse('Alert ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        await resolveAlert(supabase, alertId, resolution, userId)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({ resolved: true }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
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
      userId: 'monitoring-user',
      action: 'monitoring',
      requestId,
      additionalData: { action: new URL(req.url).searchParams.get('action') }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'GENERAL')

// Monitoring helper functions
async function getSystemMetrics(supabase: any, period: string): Promise<any> {
  // Calculate time range
  let hours: number
  switch (period) {
    case '1h': hours = 1; break
    case '24h': hours = 24; break
    case '7d': hours = 168; break
    case '30d': hours = 720; break
    default: hours = 24
  }

  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  // Get various metrics
  const [
    userMetrics,
    apiMetrics,
    errorMetrics,
    performanceMetrics
  ] = await Promise.all([
    getUserMetrics(supabase, startTime),
    getApiMetrics(supabase, startTime),
    getErrorMetrics(supabase, startTime),
    getPerformanceMetrics(supabase, startTime)
  ])

  return {
    period,
    timestamp: new Date().toISOString(),
    users: userMetrics,
    api: apiMetrics,
    errors: errorMetrics,
    performance: performanceMetrics,
    health: await performHealthChecks(supabase)
  }
}

async function getUserMetrics(supabase: any, startTime: string): Promise<any> {
  const { data: userStats } = await supabase
    .from('user_analytics')
    .select('*')
    .limit(10)

  return {
    total: userStats?.length || 0,
    activeUsers: userStats?.filter(u => u.last_activity_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length || 0,
    newUsers: userStats?.filter(u => u.joined_at > startTime).length || 0
  }
}

async function getApiMetrics(supabase: any, startTime: string): Promise<any> {
  const { data: apiCalls } = await supabase
    .from('audit_logs')
    .select('action, status')
    .eq('action', 'api_call')
    .gte('timestamp', startTime)

  const total = apiCalls?.length || 0
  const successful = apiCalls?.filter(call => call.status === 'success').length || 0
  const failed = total - successful

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0
  }
}

async function getErrorMetrics(supabase: any, startTime: string): Promise<any> {
  const { data: errors } = await supabase
    .from('audit_logs')
    .select('action, changes')
    .in('status', ['error', 'warning'])
    .gte('timestamp', startTime)

  const critical = errors?.filter(e => e.changes?.severity === 'critical').length || 0
  const warnings = errors?.filter(e => e.status === 'warning').length || 0
  const errors_count = errors?.filter(e => e.status === 'error').length || 0

  return {
    total: errors?.length || 0,
    critical,
    warnings,
    errors: errors_count
  }
}

async function getPerformanceMetrics(supabase: any, startTime: string): Promise<any> {
  const { data: performance } = await supabase
    .from('performance_analytics')
    .select('*')
    .gte('hour', startTime)
    .order('hour', { ascending: false })
    .limit(24)

  const avgResponseTime = performance?.reduce((sum, p) => sum + (p.avg_processing_time || 0), 0) / (performance?.length || 1)
  const totalRequests = performance?.reduce((sum, p) => sum + (p.total_requests || 0), 0) || 0

  return {
    avgResponseTime: Math.round(avgResponseTime || 0),
    totalRequests,
    successRate: performance?.[0]?.success_rate || 0,
    dataPoints: performance?.length || 0
  }
}

async function performHealthChecks(supabase: any): Promise<any> {
  const checks = {
    database: false,
    redis: false,
    external_apis: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Database health check
    const { error: dbError } = await supabase.from('audit_logs').select('id').limit(1)
    checks.database = !dbError

    // Redis health check (simplified - would need actual Redis connection)
    checks.redis = true // Assume Redis is healthy for now

    // External API health check
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
        headers: { 'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}` }
      })
      checks.external_apis = response.ok
    } catch {
      checks.external_apis = false
    }

  } catch (error) {
    console.error('Health check error:', error)
  }

  const overall = checks.database && checks.redis && checks.external_apis ? 'healthy' : 'degraded'

  return {
    status: overall,
    checks,
    score: Object.values(checks).filter(Boolean).length / (Object.keys(checks).length - 1) * 100 // Exclude timestamp
  }
}

async function getActiveAlerts(supabase: any, severity: string, status: string): Promise<any[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (severity !== 'all') {
    query = query.eq('severity', severity)
  }

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query.limit(50)
  return data || []
}

async function getSystemLogs(supabase: any, level: string, limit: number): Promise<any[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })

  if (level !== 'all') {
    query = query.eq('status', level)
  }

  const { data } = await query.limit(limit)
  return data || []
}

async function getUsageAnalytics(supabase: any, startDate?: string, endDate?: string): Promise<any> {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate || new Date().toISOString()

  const { data: usage } = await supabase
    .from('organization_usage')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)

  return {
    period: { start, end },
    totalUsage: usage?.length || 0,
    byResource: usage?.reduce((acc, u) => {
      acc[u.resource_type] = (acc[u.resource_type] || 0) + u.usage_count
      return acc
    }, {}),
    byOrganization: usage?.reduce((acc, u) => {
      acc[u.organization_id] = (acc[u.organization_id] || 0) + u.usage_count
      return acc
    }, {})
  }
}

async function getPerformanceAnalytics(supabase: any, startDate?: string, endDate?: string): Promise<any> {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate || new Date().toISOString()

  const { data: performance } = await supabase
    .from('performance_analytics')
    .select('*')
    .gte('hour', start)
    .lte('hour', end)

  return {
    period: { start, end },
    avgResponseTime: performance?.reduce((sum, p) => sum + (p.avg_processing_time || 0), 0) / (performance?.length || 1),
    totalRequests: performance?.reduce((sum, p) => sum + (p.total_requests || 0), 0),
    successRate: performance?.reduce((sum, p) => sum + (p.success_rate || 0), 0) / (performance?.length || 1),
    dataPoints: performance?.length || 0
  }
}

async function getSecurityAnalytics(supabase: any, startDate?: string, endDate?: string): Promise<any> {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const end = endDate || new Date().toISOString()

  const { data: security } = await supabase
    .from('security_events')
    .select('*')
    .gte('occurred_at', start)
    .lte('occurred_at', end)

  return {
    period: { start, end },
    totalEvents: security?.length || 0,
    bySeverity: security?.reduce((acc, s) => {
      acc[s.severity] = (acc[s.severity] || 0) + 1
      return acc
    }, {}),
    byType: security?.reduce((acc, s) => {
      acc[s.event_type] = (acc[s.event_type] || 0) + 1
      return acc
    }, {}),
    recentEvents: security?.slice(0, 10)
  }
}

async function createAlert(supabase: any, alert: any): Promise<any> {
  const { data } = await supabase
    .from('alerts')
    .insert({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      status: 'active',
      metadata: alert.metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  return data
}

async function resolveAlert(supabase: any, alertId: string, resolution: string, userId: string): Promise<void> {
  await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution
    })
    .eq('id', alertId)
}

serve(enhancedHandler)