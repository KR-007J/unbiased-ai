import { jest } from '@jest/globals';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gte: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }))
}));

import {
  ContentValidators,
  sanitizeRequestInput,
  checkSuspiciousActivity,
  analyzeContentSecurity,
  getSecurityHeaders,
  generateRequestFingerprint,
  performSecurityCheck
} from '../supabase/functions/_shared/validation.ts';

describe('Input Validation & Sanitization', () => {
  describe('ContentValidators.text', () => {
    it('validates valid text input', () => {
      const result = ContentValidators.text('Hello world');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello world');
    });

    it('rejects empty text', () => {
      const result = ContentValidators.text('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content must be a non-empty string');
    });

    it('enforces maximum length', () => {
      const longText = 'a'.repeat(50001);
      const result = ContentValidators.text(longText, { maxLength: 50000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content exceeds maximum length');
    });

    it('sanitizes HTML when allowed', () => {
      const htmlText = '<script>alert("xss")</script>Hello<p>world</p>';
      const result = ContentValidators.text(htmlText, { allowHtml: true });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toContain('<p>world</p>');
      expect(result.sanitized).not.toContain('<script>');
    });

    it('removes HTML when not allowed', () => {
      const htmlText = '<b>Hello</b> <i>world</i>';
      const result = ContentValidators.text(htmlText, { allowHtml: false });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello world');
    });
  });

  describe('ContentValidators.email', () => {
    it('validates correct email format', () => {
      const result = ContentValidators.email('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });

    it('rejects invalid email format', () => {
      const result = ContentValidators.email('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects emails with consecutive dots', () => {
      const result = ContentValidators.email('user..test@example.com');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('converts email to lowercase', () => {
      const result = ContentValidators.email('USER@EXAMPLE.COM');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });
  });

  describe('ContentValidators.url', () => {
    it('validates HTTPS URLs', () => {
      const result = ContentValidators.url('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com');
    });

    it('rejects non-HTTPS URLs', () => {
      const result = ContentValidators.url('http://example.com');
      expect(result.valid).toBe(true); // HTTP is allowed, just not preferred
    });

    it('rejects invalid URL format', () => {
      const result = ContentValidators.url('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('blocks private IP addresses when not allowed', () => {
      const result = ContentValidators.url('http://192.168.1.1', { allowPrivate: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Access to private networks is not allowed');
    });

    it('allows private IPs when explicitly allowed', () => {
      const result = ContentValidators.url('http://192.168.1.1', { allowPrivate: true });
      expect(result.valid).toBe(true);
    });

    it('blocks localhost when not allowed', () => {
      const result = ContentValidators.url('http://localhost:3000', { allowLocalhost: false });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Access to localhost is not allowed');
    });
  });

  describe('ContentValidators.organizationName', () => {
    it('validates valid organization name', () => {
      const result = ContentValidators.organizationName('Acme Corp');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Acme Corp');
    });

    it('rejects names that are too short', () => {
      const result = ContentValidators.organizationName('A');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Organization name must be at least 2 characters long');
    });

    it('rejects reserved names', () => {
      const result = ContentValidators.organizationName('admin');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Organization name is reserved');
    });

    it('rejects invalid characters', () => {
      const result = ContentValidators.organizationName('Test@Corp!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Organization name contains invalid characters');
    });
  });

  describe('ContentValidators.slug', () => {
    it('validates valid slug', () => {
      const result = ContentValidators.slug('my-organization');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('my-organization');
    });

    it('converts to lowercase', () => {
      const result = ContentValidators.slug('MyOrganization');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('myorganization');
    });

    it('rejects slugs with invalid characters', () => {
      const result = ContentValidators.slug('my_org!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug can only contain lowercase letters, numbers, and hyphens');
    });

    it('rejects slugs starting or ending with hyphen', () => {
      const result = ContentValidators.slug('-invalid-slug-');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Slug cannot start or end with a hyphen');
    });
  });

  describe('ContentValidators.password', () => {
    it('validates strong password', () => {
      const result = ContentValidators.password('MySecurePass123!');
      expect(result.valid).toBe(true);
    });

    it('rejects passwords that are too short', () => {
      const result = ContentValidators.password('12345');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('rejects common passwords', () => {
      const result = ContentValidators.password('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is too common');
    });

    it('requires uppercase, lowercase, and numbers', () => {
      const result = ContentValidators.password('password');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    });
  });

  describe('ContentValidators.apiKey', () => {
    it('validates valid API key format', () => {
      const result = ContentValidators.apiKey('sk-1234567890abcdef');
      expect(result.valid).toBe(true);
    });

    it('rejects API keys that are too short', () => {
      const result = ContentValidators.apiKey('short');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key is too short');
    });
  });

  describe('ContentValidators.json', () => {
    it('validates valid JSON', () => {
      const result = ContentValidators.json('{"key": "value"}');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toEqual({ key: 'value' });
    });

    it('rejects invalid JSON', () => {
      const result = ContentValidators.json('{invalid json}');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('validates against schema', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } }
      };
      const result = ContentValidators.json('{"name": "test"}', schema);
      expect(result.valid).toBe(true);
    });

    it('rejects JSON missing required fields', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } }
      };
      const result = ContentValidators.json('{"value": 123}', schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required field \'name\' is missing');
    });
  });

  describe('sanitizeRequestInput', () => {
    it('sanitizes string input', () => {
      const input = 'test\x00string';
      const result = sanitizeRequestInput(input);
      expect(result).toBe('teststring');
    });

    it('sanitizes object input', () => {
      const input = {
        normal: 'value',
        __proto__: { malicious: true },
        'dangerous\x00key': 'value'
      };
      const result = sanitizeRequestInput(input);
      expect(result).toHaveProperty('normal');
      expect(result).not.toHaveProperty('__proto__');
      expect(result).not.toHaveProperty('dangerous\x00key');
    });

    it('sanitizes array input', () => {
      const input = ['normal', 'string\x00with\x00nulls'];
      const result = sanitizeRequestInput(input);
      expect(result).toEqual(['normal', 'stringwithnulls']);
    });
  });

  describe('analyzeContentSecurity', () => {
    it('detects SQL injection patterns', () => {
      const result = analyzeContentSecurity("SELECT * FROM users WHERE id = '1' OR '1'='1'");
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(issue => issue.category === 'sql_injection')).toBe(true);
    });

    it('detects XSS patterns', () => {
      const result = analyzeContentSecurity('<script>alert("xss")</script>');
      expect(result.passed).toBe(false);
      expect(result.issues.some(issue => issue.category === 'xss_attempt')).toBe(true);
    });

    it('detects command injection', () => {
      const result = analyzeContentSecurity('rm -rf /; cat /etc/passwd');
      expect(result.passed).toBe(false);
      expect(result.issues.some(issue => issue.category === 'command_injection')).toBe(true);
    });

    it('allows safe content', () => {
      const result = analyzeContentSecurity('This is a normal message about technology.');
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('flags large payloads', () => {
      const largeContent = 'a'.repeat(150000);
      const result = analyzeContentSecurity(largeContent);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(issue => issue.category === 'large_payload')).toBe(true);
    });
  });

  describe('checkSuspiciousActivity', () => {
    it('detects high request volume', () => {
      const requests = Array(150).fill({
        timestamp: Date.now(),
        path: '/api/analyze',
        method: 'POST',
        ip: '192.168.1.1'
      });

      const result = checkSuspiciousActivity('user1', requests);
      expect(result.passed).toBe(false);
      expect(result.issues.some(issue => issue.category === 'dos_attempt')).toBe(true);
    });

    it('detects endpoint scanning', () => {
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push({
          timestamp: Date.now(),
          path: `/api/endpoint${i}`,
          method: 'GET',
          ip: '192.168.1.1'
        });
      }

      const result = checkSuspiciousActivity('user1', requests);
      expect(result.score).toBeLessThan(100);
    });

    it('allows normal activity', () => {
      const requests = [
        { timestamp: Date.now(), path: '/api/analyze', method: 'POST', ip: '192.168.1.1' },
        { timestamp: Date.now() - 1000, path: '/api/chat', method: 'POST', ip: '192.168.1.1' },
        { timestamp: Date.now() - 2000, path: '/api/history', method: 'GET', ip: '192.168.1.1' }
      ];

      const result = checkSuspiciousActivity('user1', requests);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('generateRequestFingerprint', () => {
    it('generates consistent fingerprints for similar requests', () => {
      const req1 = {
        method: 'POST',
        url: 'https://api.example.com/analyze',
        headers: new Headers({ 'user-agent': 'test-agent' })
      };
      const req2 = {
        method: 'POST',
        url: 'https://api.example.com/analyze',
        headers: new Headers({ 'user-agent': 'test-agent' })
      };

      const fp1 = generateRequestFingerprint(req1);
      const fp2 = generateRequestFingerprint(req2);
      expect(fp1).toBe(fp2);
    });

    it('generates different fingerprints for different requests', () => {
      const req1 = {
        method: 'POST',
        url: 'https://api.example.com/analyze',
        headers: new Headers({ 'user-agent': 'test-agent' })
      };
      const req2 = {
        method: 'GET',
        url: 'https://api.example.com/chat',
        headers: new Headers({ 'user-agent': 'different-agent' })
      };

      const fp1 = generateRequestFingerprint(req1);
      const fp2 = generateRequestFingerprint(req2);
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('getSecurityHeaders', () => {
    it('returns comprehensive security headers', () => {
      const headers = getSecurityHeaders();

      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('X-API-Version', 'v1');
    });

    it('includes CSP with default-src and other directives', () => {
      const headers = getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
    });
  });
});

describe('Batch Validation', () => {
  const mockValidator = (item: any) => ({
    valid: item.valid !== false,
    sanitized: item,
    errors: item.valid === false ? ['Invalid item'] : []
  });

  describe('validateBatch', () => {
    it('validates array of items', () => {
      const items = [
        { id: 1, valid: true },
        { id: 2, valid: true },
        { id: 3, valid: true }
      ];

      const result = ContentValidators.validateBatch(items, mockValidator);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toHaveLength(3);
    });

    it('handles invalid items', () => {
      const items = [
        { id: 1, valid: true },
        { id: 2, valid: false },
        { id: 3, valid: true }
      ];

      const result = ContentValidators.validateBatch(items, mockValidator);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item 2: Invalid item');
    });

    it('enforces maximum batch size', () => {
      const items = Array(2000).fill({ valid: true });

      const result = ContentValidators.validateBatch(items, mockValidator, { maxItems: 1000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Batch cannot contain more than 1000 items');
    });

    it('stops on first error when configured', () => {
      const items = [
        { id: 1, valid: false },
        { id: 2, valid: false },
        { id: 3, valid: true }
      ];

      const result = ContentValidators.validateBatch(items, mockValidator, { stopOnFirstError: true });
      expect(result.errors).toHaveLength(1); // Only first error
      expect(result.errors[0]).toContain('Item 1');
    });
  });
});

describe('Rate Limiting Validation', () => {
  describe('validateRateLimit', () => {
    it('validates rate limit configuration', () => {
      const limits = {
        analyze: { limit: 30, window: 60 },
        chat: { limit: 50, window: 60 }
      };

      const result = ContentValidators.validateRateLimit('user1', 'analyze', limits);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toHaveProperty('userId', 'user1');
      expect(result.sanitized).toHaveProperty('action', 'analyze');
      expect(result.sanitized).toHaveProperty('limit', 30);
      expect(result.sanitized).toHaveProperty('window', 60);
    });

    it('rejects unknown actions', () => {
      const limits = { analyze: { limit: 30, window: 60 } };

      const result = ContentValidators.validateRateLimit('user1', 'unknown', limits);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Unknown action: unknown");
    });
  });
});