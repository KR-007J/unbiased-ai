import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Standard API response types
export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  timestamp: string;
  requestId: string;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryAfter?: number;
}

export interface ApiMeta {
  processingTime: number;
  model?: string;
  cached?: boolean;
  rateLimitRemaining?: number;
}

// Error codes
export const ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // API specific
  GEMINI_API_ERROR: 'GEMINI_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business logic
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  BATCH_JOB_FAILED: 'BATCH_JOB_FAILED',
} as const;

// Generate unique request ID
export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create standardized success response
export const createSuccessResponse = <T>(
  data: T,
  meta?: Partial<ApiMeta>,
  status: number = 200
): ApiResponse<T> => {
  return {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    data,
    meta: {
      processingTime: 0,
      ...meta,
    },
  };
};

// Create standardized error response
export const createErrorResponse = (
  error: ApiError | Error | string,
  status: number = 500,
  meta?: Partial<ApiMeta>
): ApiResponse => {
  let apiError: ApiError;

  if (typeof error === 'string') {
    apiError = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error,
    };
  } else if (error instanceof Error) {
    apiError = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message,
      details: error.stack,
    };
  } else {
    apiError = error;
  }

  return {
    success: false,
    status,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    error: apiError,
    meta: {
      processingTime: 0,
      ...meta,
    },
  };
};

// Rate limit error response
export const createRateLimitResponse = (retryAfter: number = 60): ApiResponse => {
  return createErrorResponse({
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
    retryAfter,
  }, 429);
};

// Validation error response
export const createValidationErrorResponse = (details: any): ApiResponse => {
  return createErrorResponse({
    code: ERROR_CODES.VALIDATION_ERROR,
    message: 'Validation failed',
    details,
  }, 400);
};

// Handle errors with logging and audit trail
export const handleError = async (
  error: any,
  context: {
    userId?: string;
    action?: string;
    requestId?: string;
    additionalData?: any;
  } = {}
): Promise<ApiResponse> => {
  const requestId = context.requestId || generateRequestId();
  const timestamp = new Date().toISOString();

  console.error(`[${requestId}] Error:`, {
    message: error.message,
    stack: error.stack,
    context,
    timestamp,
  });

  // Log to audit trail if Supabase is available
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (SUPABASE_URL && SUPABASE_ANON_KEY && context.userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      await supabase.from('audit_logs').insert({
        user_id: context.userId,
        action: context.action || 'error',
        target_table: 'system',
        changes: {
          error: error.message,
          context: context.additionalData,
        },
        status: 'error',
        error_message: error.message,
        timestamp,
      });
    }
  } catch (auditError) {
    console.warn('Failed to log audit trail:', auditError.message);
  }

  // Return appropriate error response
  if (error.message?.includes('rate limit')) {
    return createRateLimitResponse();
  }

  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return createValidationErrorResponse(error.details || error.message);
  }

  return createErrorResponse(error.message || 'Internal server error', 500);
};

// Input validation utilities
export const validateContent = (content: string, maxLength: number = 10000): { valid: boolean; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content must be a non-empty string' };
  }

  if (content.length > maxLength) {
    return { valid: false, error: `Content exceeds maximum length of ${maxLength} characters` };
  }

  return { valid: true };
};

export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
};

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Handle CORS preflight
export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
};