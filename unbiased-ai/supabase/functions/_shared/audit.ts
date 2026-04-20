import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

export interface AuditLogEntry {
  user_id: string;
  action: string;
  target_table?: string;
  target_id?: string;
  old_values?: any;
  new_values?: any;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  status?: 'success' | 'error' | 'warning';
  error_message?: string;
  metadata?: any;
}

// Initialize Supabase client for audit logging
let auditClient: any = null;

function getAuditClient() {
  if (!auditClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    auditClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return auditClient;
}

// Core audit logging function
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const client = getAuditClient();
    if (!client) {
      console.warn('Audit logging unavailable: Supabase client not configured');
      return;
    }

    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      // Add additional context if available
      session_id: entry.metadata?.sessionId,
      request_id: entry.metadata?.requestId,
      api_version: entry.metadata?.apiVersion || 'v1',
    };

    const { error } = await client
      .from('audit_logs')
      .insert(logEntry);

    if (error) {
      console.error('Failed to insert audit log:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging failures shouldn't break the main flow
  }
}

// Convenience functions for common audit events
export async function logApiCall(
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'api_call',
    target_table: 'api_endpoints',
    changes: {
      endpoint,
      method,
      status_code: statusCode,
      success: statusCode >= 200 && statusCode < 300,
    },
    status: statusCode >= 400 ? 'error' : 'success',
    metadata: {
      ...metadata,
      endpoint,
      method,
      statusCode,
    },
  });
}

export async function logDataAccess(
  userId: string,
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  recordId?: string,
  changes?: any,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: `data_${operation.toLowerCase()}`,
    target_table: table,
    target_id: recordId,
    changes,
    metadata: {
      ...metadata,
      operation,
      recordId,
    },
  });
}

export async function logAuthentication(
  userId: string,
  action: 'login' | 'logout' | 'register' | 'password_reset' | 'token_refresh',
  success: boolean,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: `auth_${action}`,
    status: success ? 'success' : 'error',
    metadata: {
      ...metadata,
      success,
      action,
    },
  });
}

export async function logAnalysis(
  userId: string,
  analysisType: string,
  contentLength: number,
  biasScore: number,
  processingTime: number,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'analysis_performed',
    target_table: 'analyses',
    changes: {
      analysis_type: analysisType,
      content_length: contentLength,
      bias_score: biasScore,
      processing_time_ms: processingTime,
    },
    metadata: {
      ...metadata,
      analysisType,
      contentLength,
      biasScore,
      processingTime,
    },
  });
}

export async function logBatchOperation(
  userId: string,
  operationType: string,
  batchId: string,
  itemCount: number,
  successCount: number,
  failureCount: number,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: `batch_${operationType}`,
    target_table: 'batch_jobs',
    target_id: batchId,
    changes: {
      item_count: itemCount,
      success_count: successCount,
      failure_count: failureCount,
      success_rate: itemCount > 0 ? successCount / itemCount : 0,
    },
    status: failureCount > 0 ? (successCount > 0 ? 'warning' : 'error') : 'success',
    metadata: {
      ...metadata,
      operationType,
      batchId,
      itemCount,
      successCount,
      failureCount,
    },
  });
}

export async function logSecurityEvent(
  userId: string | null,
  eventType: 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach_attempt',
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any,
  metadata?: any
): Promise<void> {
  const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };

  await logAuditEvent({
    user_id: userId || 'system',
    action: `security_${eventType}`,
    status: severity === 'critical' ? 'error' : 'warning',
    changes: {
      event_type: eventType,
      severity,
      severity_level: severityMap[severity],
      details,
    },
    metadata: {
      ...metadata,
      eventType,
      severity,
      details,
    },
  });
}

export async function logSystemEvent(
  eventType: 'startup' | 'shutdown' | 'maintenance' | 'backup' | 'migration',
  status: 'success' | 'error' | 'warning',
  details?: any,
  metadata?: any
): Promise<void> {
  await logAuditEvent({
    user_id: 'system',
    action: `system_${eventType}`,
    status,
    changes: details,
    metadata: {
      ...metadata,
      eventType,
      component: 'edge_function',
      details,
    },
  });
}

export async function logError(
  userId: string | null,
  error: Error,
  context: {
    endpoint?: string;
    operation?: string;
    component?: string;
    additionalData?: any;
  } = {}
): Promise<void> {
  await logAuditEvent({
    user_id: userId || 'unknown',
    action: 'error_occurred',
    status: 'error',
    error_message: error.message,
    changes: {
      error_name: error.name,
      error_stack: error.stack,
      context,
    },
    metadata: {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
  });
}

// Audit log query functions for compliance and monitoring
export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    targetTable?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<any[]> {
  try {
    const client = getAuditClient();
    if (!client) return [];

    let query = client
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.targetTable) query = query.eq('target_table', filters.targetTable);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('timestamp', filters.startDate);
    if (filters.endDate) query = query.lte('timestamp', filters.endDate);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Audit log query error:', error);
    return [];
  }
}

export async function getUserActivitySummary(
  userId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  lastActivity: string;
  riskyActions: number;
}> {
  try {
    const client = getAuditClient();
    if (!client) return { totalActions: 0, actionsByType: {}, lastActivity: '', riskyActions: 0 };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await client
      .from('audit_logs')
      .select('action, status, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to get user activity summary:', error);
      return { totalActions: 0, actionsByType: {}, lastActivity: '', riskyActions: 0 };
    }

    const actionsByType: Record<string, number> = {};
    let riskyActions = 0;
    let lastActivity = '';

    for (const log of data || []) {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      if (log.status === 'error' || log.action.includes('security_')) {
        riskyActions++;
      }
      if (!lastActivity) lastActivity = log.timestamp;
    }

    return {
      totalActions: data?.length || 0,
      actionsByType,
      lastActivity,
      riskyActions,
    };
  } catch (error) {
    console.error('User activity summary error:', error);
    return { totalActions: 0, actionsByType: {}, lastActivity: '', riskyActions: 0 };
  }
}