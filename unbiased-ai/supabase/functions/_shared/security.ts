import { logSecurityEvent } from './audit.ts';

// Security utilities and hardening functions

export interface SecurityCheckResult {
  passed: boolean;
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  remediation: string;
}

// Request sanitization and validation
export const sanitizeRequestInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove null bytes and other dangerous characters
    return input
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeRequestInput(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Skip dangerous keys
      if (!isDangerousKey(key)) {
        sanitized[key] = sanitizeRequestInput(value);
      }
    }
    return sanitized;
  }

  return input;
};

const isDangerousKey = (key: string): boolean => {
  const dangerousKeys = [
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf',
    'toLocaleString',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable'
  ];

  return dangerousKeys.includes(key.toLowerCase());
};

// Rate limiting with security considerations
export const checkSuspiciousActivity = (
  userId: string,
  requests: Array<{ timestamp: number; path: string; method: string; ip: string }>
): SecurityCheckResult => {
  const result: SecurityCheckResult = {
    passed: true,
    score: 100,
    issues: [],
    recommendations: []
  };

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const recentRequests = requests.filter(r => now - r.timestamp < windowMs);

  // Check for rapid requests (potential DoS)
  if (recentRequests.length > 100) {
    result.passed = false;
    result.score -= 30;
    result.issues.push({
      severity: 'high',
      category: 'dos_attempt',
      description: 'High volume of requests detected',
      impact: 'Potential denial of service attack',
      remediation: 'Implement stricter rate limiting'
    });
  }

  // Check for endpoint scanning
  const uniqueEndpoints = new Set(recentRequests.map(r => r.path));
  if (uniqueEndpoints.size > 20 && recentRequests.length > 50) {
    result.score -= 20;
    result.issues.push({
      severity: 'medium',
      category: 'reconnaissance',
      description: 'Endpoint scanning detected',
      impact: 'Potential reconnaissance activity',
      remediation: 'Monitor for further suspicious patterns'
    });
  }

  // Check for error bursts (potential exploitation attempts)
  const errorRequests = recentRequests.filter(r => r.path.includes('/error') || r.path.includes('404'));
  if (errorRequests.length > recentRequests.length * 0.3) {
    result.score -= 15;
    result.issues.push({
      severity: 'medium',
      category: 'error_exploration',
      description: 'High rate of error responses',
      impact: 'Potential vulnerability scanning',
      remediation: 'Review error handling and logging'
    });
  }

  // Check for IP diversity (proxy/VPN usage)
  const uniqueIPs = new Set(recentRequests.map(r => r.ip));
  if (uniqueIPs.size > 5 && recentRequests.length > 20) {
    result.score -= 10;
    result.issues.push({
      severity: 'low',
      category: 'ip_rotation',
      description: 'Multiple IP addresses used',
      impact: 'Possible use of proxies or VPNs',
      remediation: 'Consider additional verification for high-risk actions'
    });
  }

  // Generate recommendations
  if (result.score < 80) {
    result.recommendations.push('Enable additional monitoring for this user');
  }
  if (result.score < 60) {
    result.recommendations.push('Consider temporary access restrictions');
  }
  if (result.score < 40) {
    result.recommendations.push('Immediate security review required');
  }

  return result;
};

// Content security analysis
export const analyzeContentSecurity = (content: string): SecurityCheckResult => {
  const result: SecurityCheckResult = {
    passed: true,
    score: 100,
    issues: [],
    recommendations: []
  };

  // Check for SQL injection patterns - refined to require more structure than just keywords
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b.*\b(FROM|INTO|TABLE|SET)\b)/i,
    /('OR'|'AND')\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /(;|--|\/\*|\*\/)/
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(content)) {
      // Small penalty only if it's just one keyword, large if it looks like a query
      const isLikelyQuery = content.length < 500 && pattern.test(content);
      if (isLikelyQuery) {
        result.passed = false;
        result.score -= 25;
        result.issues.push({
          severity: 'high',
          category: 'sql_injection',
          description: 'Potential SQL injection detected',
          impact: 'Database compromise possible',
          remediation: 'Use parameterized queries and input sanitization'
        });
        break;
      } else {
        // Just a nudge for longer content that might contain these words naturally
        result.score -= 5;
      }
    }
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=(['"]|&quot;).+?\1/gi, // Refined to look for event handlers with values
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(content)) {
      result.score -= 20;
      result.issues.push({
        severity: 'high',
        category: 'xss_attempt',
        description: 'Potential XSS attack detected',
        impact: 'Client-side code execution possible',
        remediation: 'Implement content sanitization and CSP headers'
      });
      break;
    }
  }

  // Check for command injection - refined
  const commandPatterns = [
    /(\||&|;|\$\(|\`)\s*(cat|ls|rm|sh|bash|powershell|curl|wget)\b/i,
    /\b(rm -rf|format c:|del \/f)\b/i,
    /(\/etc\/passwd|\/etc\/shadow|C:\\Windows\\System32)/i
  ];

  for (const pattern of commandPatterns) {
    if (pattern.test(content)) {
      result.passed = false;
      result.score -= 30;
      result.issues.push({
        severity: 'critical',
        category: 'command_injection',
        description: 'Potential command injection detected',
        impact: 'System compromise possible',
        remediation: 'Validate and sanitize all system inputs'
      });
      break;
    }
  }

  // Check for sensitive data exposure
  const sensitivePatterns = [
    /\b\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}\b/, // Credit card numbers
    /\b\d{3}[\s\-]\d{2}[\s\-]\d{4}\b/, // SSN pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{10,15}\b/ // Phone numbers
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      result.score -= 15;
      result.issues.push({
        severity: 'medium',
        category: 'data_exposure',
        description: 'Potential sensitive data detected',
        impact: 'Privacy violation possible',
        remediation: 'Implement data classification and masking'
      });
      break;
    }
  }

  // Content length checks
  if (content.length > 100000) {
    result.score -= 10;
    result.issues.push({
      severity: 'low',
      category: 'large_payload',
      description: 'Unusually large content payload',
      impact: 'Potential DoS through resource exhaustion',
      remediation: 'Implement payload size limits'
    });
  }

  return result;
};

// API security headers
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.unbiased-ai.com https://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; '),

    // Other security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // API-specific headers
    'X-API-Version': 'v1',
    'X-RateLimit-Policy': 'standard',
  };
};

// Request fingerprinting for anomaly detection
export const generateRequestFingerprint = (req: Request): string => {
  const components = [
    req.method,
    new URL(req.url).pathname,
    req.headers.get('user-agent')?.substring(0, 50) || 'unknown',
    req.headers.get('accept-language')?.substring(0, 20) || 'unknown',
    req.headers.get('accept')?.substring(0, 50) || 'unknown',
  ];

  return btoa(components.join('|')).substring(0, 32);
};

// Threat intelligence checking (basic implementation)
export const checkThreatIntelligence = async (ip: string, userAgent: string): Promise<SecurityCheckResult> => {
  const result: SecurityCheckResult = {
    passed: true,
    score: 100,
    issues: [],
    recommendations: []
  };

  // Check for known malicious user agents
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i,
    /joomlavs/i,
    /nessus/i
  ];

  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      result.passed = false;
      result.score -= 50;
      result.issues.push({
        severity: 'critical',
        category: 'known_malware',
        description: 'Known security scanning tool detected',
        impact: 'Active security assessment or attack',
        remediation: 'Block request and alert security team'
      });

      // Log security event
      await logSecurityEvent(null, 'malicious_user_agent_detected', 'critical', `Suspicious user agent: ${userAgent}`, {
        ip,
        userAgent,
        tool: pattern.source
      });

      break;
    }
  }

  // Check for automated requests
  if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
    result.score -= 10;
    result.issues.push({
      severity: 'low',
      category: 'automated_request',
      description: 'Automated request detected',
      impact: 'Potential scraping or monitoring',
      remediation: 'Consider rate limiting for automated requests'
    });
  }

  return result;
};

// Data encryption utilities (client-side)
export const encryptData = async (data: string, key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const keyBuffer = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyBuffer,
    dataBuffer
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (encryptedData: string, key: string): Promise<string> => {
  const decoder = new TextDecoder();
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyBuffer = await crypto.subtle.importKey(
    'raw',
    decoder.encode(key),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyBuffer,
    encrypted
  );

  return decoder.decode(decrypted);
};

// Security audit logging
export async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  metadata?: any
): Promise<void> {
  try {
    // This would integrate with the audit system
    console.warn(`Security Event [${severity.toUpperCase()}]: ${description}`, {
      userId,
      eventType,
      metadata
    });

    // In production, this would send to security monitoring system
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Comprehensive security check
export const performSecurityCheck = async (
  req: Request,
  userId?: string
): Promise<SecurityCheckResult> => {
  const result: SecurityCheckResult = {
    passed: true,
    score: 100,
    issues: [],
    recommendations: []
  };

  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Threat intelligence check
    const threatCheck = await checkThreatIntelligence(ip, userAgent);
    result.score = Math.min(result.score, threatCheck.score);
    result.issues.push(...threatCheck.issues);
    result.recommendations.push(...threatCheck.recommendations);

    // Content analysis for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const body = await req.clone().json();
          const contentCheck = analyzeContentSecurity(JSON.stringify(body));
          result.score = Math.min(result.score, contentCheck.score);
          result.issues.push(...contentCheck.issues);
        }
      } catch (error) {
        // Ignore body parsing errors for security check
      }
    }

    // Update pass/fail status
    result.passed = result.score >= 70 && result.issues.filter(i => i.severity === 'critical').length === 0;

    // Log critical security events
    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      await logSecurityEvent(
        userId || null,
        'security_check_failed',
        'critical',
        `Security check failed: ${criticalIssues.map(i => i.description).join(', ')}`,
        {
          ip,
          userAgent,
          score: result.score,
          issues: criticalIssues.length
        }
      );
    }

  } catch (error) {
    result.passed = false;
    result.score = 0;
    result.issues.push({
      severity: 'high',
      category: 'security_check_error',
      description: 'Security check failed to execute',
      impact: 'Unable to verify request security',
      remediation: 'Review security check implementation'
    });
  }

  return result;
};
