import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  handleError,
  corsHeaders
} from '../_shared/api.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Load balancing and auto-scaling management
const enhancedHandler = async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `scaling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'status'
    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (!supabase) {
      throw new Error('Database connection not available')
    }

    switch (action) {
      case 'status': {
        const status = await getSystemStatus(supabase)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(status, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'scale_up': {
        const { service, reason } = await req.json()
        const result = await scaleService(supabase, service, 'up', reason)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'scale_down': {
        const { service, reason } = await req.json()
        const result = await scaleService(supabase, service, 'down', reason)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'maintenance_mode': {
        const { enabled, message } = await req.json()
        const result = await setMaintenanceMode(supabase, enabled, message)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'backup': {
        const result = await triggerBackup(supabase)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'disaster_recovery': {
        const result = await initiateDisasterRecovery(supabase)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'load_distribution': {
        const distribution = await getLoadDistribution(supabase)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(distribution, { processingTime })

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
      userId: 'scaling-user',
      action: 'scaling',
      requestId,
      additionalData: { action: new URL(req.url).searchParams.get('action') }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}

// Scaling helper functions
async function getSystemStatus(supabase: any): Promise<any> {
  // Get current system metrics
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [
    currentLoad,
    activeConnections,
    queueStatus,
    errorRate
  ] = await Promise.all([
    getCurrentLoad(supabase),
    getActiveConnections(supabase),
    getQueueStatus(supabase),
    getErrorRate(supabase, oneHourAgo)
  ])

  // Determine scaling recommendations
  const recommendations = analyzeScalingNeeds({
    load: currentLoad,
    connections: activeConnections,
    queue: queueStatus,
    errors: errorRate
  })

  return {
    timestamp: now.toISOString(),
    load: currentLoad,
    connections: activeConnections,
    queue: queueStatus,
    errors: errorRate,
    recommendations,
    maintenanceMode: await getMaintenanceMode(supabase)
  }
}

async function getCurrentLoad(supabase: any): Promise<any> {
  // Get API call metrics for the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const { data: recentCalls } = await supabase
    .from('audit_logs')
    .select('timestamp')
    .eq('action', 'api_call')
    .gte('timestamp', fiveMinutesAgo.toISOString())

  const callCount = recentCalls?.length || 0
  const callsPerMinute = callCount / 5

  return {
    callsLast5Minutes: callCount,
    callsPerMinute: Math.round(callsPerMinute),
    loadLevel: callsPerMinute > 100 ? 'high' : callsPerMinute > 50 ? 'medium' : 'low'
  }
}

async function getActiveConnections(supabase: any): Promise<any> {
  // Estimate active connections (simplified)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const { data: activeUsers } = await supabase
    .from('audit_logs')
    .select('user_id')
    .gte('timestamp', fiveMinutesAgo.toISOString())

  const uniqueUsers = new Set(activeUsers?.map(a => a.user_id) || [])
  const connectionCount = uniqueUsers.size

  return {
    estimatedActiveConnections: connectionCount,
    connectionLevel: connectionCount > 1000 ? 'high' : connectionCount > 500 ? 'medium' : 'low'
  }
}

async function getQueueStatus(supabase: any): Promise<any> {
  // Get queue statistics (simplified - would need actual queue monitoring)
  return {
    analysisQueue: { pending: 0, processing: 0, completed: 0 },
    forecastQueue: { pending: 0, processing: 0, completed: 0 },
    batchQueue: { pending: 0, processing: 0, completed: 0 },
    overallStatus: 'healthy'
  }
}

async function getErrorRate(supabase: any, since: Date): Promise<any> {
  const { data: errors } = await supabase
    .from('audit_logs')
    .select('status')
    .in('status', ['error', 'warning'])
    .gte('timestamp', since.toISOString())

  const { data: total } = await supabase
    .from('audit_logs')
    .select('id')
    .gte('timestamp', since.toISOString())

  const errorCount = errors?.length || 0
  const totalCount = total?.length || 0
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0

  return {
    errorCount,
    totalRequests: totalCount,
    errorRate: Math.round(errorRate * 100) / 100,
    errorLevel: errorRate > 5 ? 'high' : errorRate > 1 ? 'medium' : 'low'
  }
}

function analyzeScalingNeeds(metrics: any): any[] {
  const recommendations = []

  if (metrics.load.loadLevel === 'high') {
    recommendations.push({
      action: 'scale_up',
      service: 'api_functions',
      reason: 'High API call volume detected',
      priority: 'high'
    })
  }

  if (metrics.connections.connectionLevel === 'high') {
    recommendations.push({
      action: 'scale_up',
      service: 'database',
      reason: 'High concurrent connection count',
      priority: 'high'
    })
  }

  if (metrics.errors.errorLevel === 'high') {
    recommendations.push({
      action: 'investigate',
      service: 'monitoring',
      reason: 'High error rate detected',
      priority: 'critical'
    })
  }

  if (metrics.queue.analysisQueue.pending > 10) {
    recommendations.push({
      action: 'scale_up',
      service: 'workers',
      reason: 'Analysis queue backlog',
      priority: 'medium'
    })
  }

  return recommendations
}

async function scaleService(supabase: any, service: string, direction: 'up' | 'down', reason: string): Promise<any> {
  // Log scaling action
  await supabase
    .from('audit_logs')
    .insert({
      user_id: 'system',
      action: `scaling_${direction}`,
      target_table: 'system_services',
      changes: {
        service,
        direction,
        reason,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    })

  // In a real implementation, this would call cloud provider APIs
  // For now, we'll simulate scaling actions
  const scalingAction = {
    service,
    direction,
    reason,
    timestamp: new Date().toISOString(),
    status: 'initiated',
    estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  }

  // Store scaling action for tracking
  await supabase
    .from('system_events')
    .insert({
      event_type: 'scaling_action',
      description: `${direction.toUpperCase()} scaling ${service}: ${reason}`,
      metadata: scalingAction,
      severity: 'info'
    })

  return scalingAction
}

async function setMaintenanceMode(supabase: any, enabled: boolean, message?: string): Promise<any> {
  // Store maintenance mode status (in production, this would affect load balancers, etc.)
  await supabase
    .from('system_settings')
    .upsert({
      key: 'maintenance_mode',
      value: { enabled, message, timestamp: new Date().toISOString() }
    }, { onConflict: 'key' })

  await supabase
    .from('audit_logs')
    .insert({
      user_id: 'system',
      action: enabled ? 'maintenance_mode_enabled' : 'maintenance_mode_disabled',
      target_table: 'system_settings',
      changes: {
        enabled,
        message,
        timestamp: new Date().toISOString()
      },
      status: 'success'
    })

  return {
    maintenanceMode: enabled,
    message: message || (enabled ? 'System is under maintenance' : 'System is back online'),
    timestamp: new Date().toISOString()
  }
}

async function getMaintenanceMode(supabase: any): Promise<any> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  return data?.value || { enabled: false }
}

async function triggerBackup(supabase: any): Promise<any> {
  const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Log backup initiation
  await supabase
    .from('audit_logs')
    .insert({
      user_id: 'system',
      action: 'backup_initiated',
      target_table: 'system_backups',
      changes: {
        backupId,
        type: 'full',
        timestamp: new Date().toISOString()
      },
      status: 'success'
    })

  // In production, this would trigger actual backup processes
  const backup = {
    id: backupId,
    type: 'full',
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    components: ['database', 'functions', 'storage']
  }

  // Store backup record
  await supabase
    .from('system_backups')
    .insert(backup)

  return backup
}

async function initiateDisasterRecovery(supabase: any): Promise<any> {
  // This is a critical operation - in production, this would require multiple approvals

  const recoveryId = `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Log disaster recovery initiation (CRITICAL)
  await supabase
    .from('audit_logs')
    .insert({
      user_id: 'system',
      action: 'disaster_recovery_initiated',
      target_table: 'system_recovery',
      changes: {
        recoveryId,
        type: 'full_system_recovery',
        timestamp: new Date().toISOString(),
        severity: 'critical'
      },
      status: 'success'
    })

  // Create recovery plan
  const recoveryPlan = {
    id: recoveryId,
    type: 'full_system_recovery',
    status: 'initiated',
    startedAt: new Date().toISOString(),
    stages: [
      { name: 'backup_validation', status: 'pending', estimatedDuration: 300 },
      { name: 'database_restore', status: 'pending', estimatedDuration: 1800 },
      { name: 'function_deployment', status: 'pending', estimatedDuration: 600 },
      { name: 'frontend_deployment', status: 'pending', estimatedDuration: 300 },
      { name: 'health_checks', status: 'pending', estimatedDuration: 300 },
      { name: 'traffic_switch', status: 'pending', estimatedDuration: 60 }
    ],
    totalEstimatedDuration: 3360 // seconds
  }

  // Store recovery plan
  await supabase
    .from('system_recovery')
    .insert(recoveryPlan)

  return recoveryPlan
}

async function getLoadDistribution(supabase: any): Promise<any> {
  // Analyze load distribution across services
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const { data: apiCalls } = await supabase
    .from('audit_logs')
    .select('action, status, timestamp')
    .eq('action', 'api_call')
    .gte('timestamp', oneHourAgo.toISOString())

  // Group by endpoint/service
  const distribution = (apiCalls || []).reduce((acc: any, call: any) => {
    // Extract endpoint from changes (simplified)
    const endpoint = call.changes?.endpoint || 'unknown'
    if (!acc[endpoint]) {
      acc[endpoint] = { total: 0, success: 0, error: 0, avgResponseTime: 0 }
    }
    acc[endpoint].total++
    if (call.status === 'success') acc[endpoint].success++
    else acc[endpoint].error++

    // Add response time if available
    if (call.changes?.duration) {
      acc[endpoint].avgResponseTime = (acc[endpoint].avgResponseTime + call.changes.duration) / 2
    }

    return acc
  }, {})

  return {
    period: '1_hour',
    distribution,
    totalRequests: apiCalls?.length || 0,
    timestamp: new Date().toISOString()
  }
}

serve(enhancedHandler)