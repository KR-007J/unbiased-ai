import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Input validation and sanitization utilities

export interface ValidationResult {
  valid: boolean;
  sanitized?: any;
  errors: string[];
}

// Content type validators
export const ContentValidators = {
  // Text content validation
  text: (content: string, options: { maxLength?: number; minLength?: number; allowHtml?: boolean } = {}) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!content || typeof content !== 'string') {
      result.valid = false;
      result.errors.push('Content must be a non-empty string');
      return result;
    }

    const { maxLength = 50000, minLength = 1, allowHtml = false } = options;

    if (content.length < minLength) {
      result.valid = false;
      result.errors.push(`Content must be at least ${minLength} characters long`);
    }

    if (content.length > maxLength) {
      result.valid = false;
      result.errors.push(`Content exceeds maximum length of ${maxLength} characters`);
    }

    // Sanitize content
    if (allowHtml) {
      result.sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'],
        ALLOWED_ATTR: []
      });
    } else {
      // For plain text, escape HTML and normalize whitespace
      result.sanitized = content
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }

    return result;
  },

  // Email validation
  email: (email: string) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!email || typeof email !== 'string') {
      result.valid = false;
      result.errors.push('Email is required');
      return result;
    }

    if (!validator.isEmail(email, { allow_utf8_local_part: false })) {
      result.valid = false;
      result.errors.push('Invalid email format');
    }

    // Check for suspicious patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      result.valid = false;
      result.errors.push('Invalid email format');
    }

    // Length checks
    if (email.length > 254) {
      result.valid = false;
      result.errors.push('Email address is too long');
    }

    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];

    if (localPart && localPart.length > 64) {
      result.valid = false;
      result.errors.push('Local part of email is too long');
    }

    result.sanitized = email.toLowerCase().trim();

    return result;
  },

  // URL validation
  url: (url: string, options: { allowPrivate?: boolean; allowLocalhost?: boolean } = {}) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!url || typeof url !== 'string') {
      result.valid = false;
      result.errors.push('URL is required');
      return result;
    }

    try {
      const parsedUrl = new URL(url);

      // Protocol validation
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        result.valid = false;
        result.errors.push('URL must use HTTP or HTTPS protocol');
      }

      // Prevent access to private networks unless explicitly allowed
      if (!options.allowPrivate) {
        const hostname = parsedUrl.hostname;

        // Check for private IP ranges
        if (validator.isIP(hostname)) {
          const ipVersion = validator.isIP(hostname);
          if (ipVersion === 4) {
            const parts = hostname.split('.').map(Number);
            // Check private IPv4 ranges
            if (
              (parts[0] === 10) ||
              (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
              (parts[0] === 192 && parts[1] === 168) ||
              (parts[0] === 127) ||
              hostname === 'localhost'
            ) {
              result.valid = false;
              result.errors.push('Access to private networks is not allowed');
            }
          } else if (ipVersion === 6) {
            // Basic IPv6 private range check (simplified)
            if (hostname.toLowerCase().startsWith('fc') || hostname.toLowerCase().startsWith('fd')) {
              result.valid = false;
              result.errors.push('Access to private networks is not allowed');
            }
          }
        }

        // Prevent localhost access unless explicitly allowed
        if (!options.allowLocalhost && (hostname === 'localhost' || hostname.startsWith('127.'))) {
          result.valid = false;
          result.errors.push('Access to localhost is not allowed');
        }
      }

      // Length and character validation
      if (url.length > 2000) {
        result.valid = false;
        result.errors.push('URL is too long');
      }

      result.sanitized = url;

    } catch (error) {
      result.valid = false;
      result.errors.push('Invalid URL format');
    }

    return result;
  },

  // Organization name validation
  organizationName: (name: string) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!name || typeof name !== 'string') {
      result.valid = false;
      result.errors.push('Organization name is required');
      return result;
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      result.valid = false;
      result.errors.push('Organization name must be at least 2 characters long');
    }

    if (trimmed.length > 100) {
      result.valid = false;
      result.errors.push('Organization name cannot exceed 100 characters');
    }

    // Check for valid characters (letters, numbers, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
      result.valid = false;
      result.errors.push('Organization name contains invalid characters');
    }

    // Check for reserved words
    const reservedWords = ['admin', 'system', 'null', 'undefined', 'test'];
    if (reservedWords.includes(trimmed.toLowerCase())) {
      result.valid = false;
      result.errors.push('Organization name is reserved');
    }

    result.sanitized = trimmed;

    return result;
  },

  // Slug validation
  slug: (slug: string) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!slug || typeof slug !== 'string') {
      result.valid = false;
      result.errors.push('Slug is required');
      return result;
    }

    const trimmed = slug.trim().toLowerCase();

    if (trimmed.length < 3) {
      result.valid = false;
      result.errors.push('Slug must be at least 3 characters long');
    }

    if (trimmed.length > 50) {
      result.valid = false;
      result.errors.push('Slug cannot exceed 50 characters');
    }

    // Check for valid slug format (letters, numbers, hyphens)
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      result.valid = false;
      result.errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    // Cannot start or end with hyphen
    if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
      result.valid = false;
      result.errors.push('Slug cannot start or end with a hyphen');
    }

    // Check for reserved slugs
    const reservedSlugs = ['admin', 'api', 'app', 'www', 'mail', 'ftp', 'smtp'];
    if (reservedSlugs.includes(trimmed)) {
      result.valid = false;
      result.errors.push('Slug is reserved');
    }

    result.sanitized = trimmed;

    return result;
  },

  // Password validation (for future use if custom auth is implemented)
  password: (password: string) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!password || typeof password !== 'string') {
      result.valid = false;
      result.errors.push('Password is required');
      return result;
    }

    if (password.length < 8) {
      result.valid = false;
      result.errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      result.valid = false;
      result.errors.push('Password cannot exceed 128 characters');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      result.valid = false;
      result.errors.push('Password is too common');
    }

    // Check for character variety
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLower || !hasUpper || !hasNumber) {
      result.valid = false;
      result.errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Optional: Check for special characters
    // if (!hasSpecial) {
    //   result.errors.push('Password should contain at least one special character');
    // }

    // Password is not sanitized - it's a secret
    result.sanitized = password;

    return result;
  },

  // API key validation
  apiKey: (key: string) => {
    const result: ValidationResult = { valid: true, errors: [] };

    if (!key || typeof key !== 'string') {
      result.valid = false;
      result.errors.push('API key is required');
      return result;
    }

    // Basic format validation (should be reasonably long and contain alphanumeric characters)
    if (key.length < 20) {
      result.valid = false;
      result.errors.push('API key is too short');
    }

    if (key.length > 200) {
      result.valid = false;
      result.errors.push('API key is too long');
    }

    // Check for valid characters
    if (!/^[a-zA-Z0-9\-_\.]+$/.test(key)) {
      result.valid = false;
      result.errors.push('API key contains invalid characters');
    }

    result.sanitized = key;

    return result;
  },

  // JSON validation
  json: (data: any, schema?: any) => {
    const result: ValidationResult = { valid: true, errors: [] };

    try {
      let parsed: any;

      if (typeof data === 'string') {
        parsed = JSON.parse(data);
      } else {
        parsed = data;
      }

      // Basic structure validation
      if (typeof parsed !== 'object' || parsed === null) {
        result.valid = false;
        result.errors.push('Data must be a valid JSON object');
        return result;
      }

      // Schema validation (basic implementation)
      if (schema) {
        const schemaErrors = validateAgainstSchema(parsed, schema);
        if (schemaErrors.length > 0) {
          result.valid = false;
          result.errors.push(...schemaErrors);
        }
      }

      // Size limits
      const sizeInBytes = new Blob([JSON.stringify(parsed)]).size;
      if (sizeInBytes > 1024 * 1024) { // 1MB limit
        result.valid = false;
        result.errors.push('JSON data exceeds size limit (1MB)');
      }

      result.sanitized = parsed;

    } catch (error) {
      result.valid = false;
      result.errors.push('Invalid JSON format');
    }

    return result;
  }
};

// Schema validation helper (basic implementation)
function validateAgainstSchema(data: any, schema: any): string[] {
  const errors: string[] = [];

  if (!schema || typeof schema !== 'object') {
    return errors;
  }

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }

  // Check field types and constraints
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in data) {
        const value = data[field];
        const fieldErrors = validateField(value, fieldSchema as any, field);
        errors.push(...fieldErrors);
      }
    }
  }

  return errors;
}

function validateField(value: any, schema: any, fieldName: string): string[] {
  const errors: string[] = [];

  // Type validation
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      errors.push(`Field '${fieldName}' must be of type ${schema.type}, got ${actualType}`);
    }
  }

  // String constraints
  if (schema.type === 'string') {
    if (typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push(`Field '${fieldName}' must be at least ${schema.minLength} characters long`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push(`Field '${fieldName}' cannot exceed ${schema.maxLength} characters`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`Field '${fieldName}' does not match required pattern`);
      }
    }
  }

  // Number constraints
  if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`Field '${fieldName}' must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`Field '${fieldName}' cannot exceed ${schema.maximum}`);
      }
    }
  }

  // Array constraints
  if (schema.type === 'array') {
    if (Array.isArray(value)) {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push(`Field '${fieldName}' must contain at least ${schema.minItems} items`);
      }
      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push(`Field '${fieldName}' cannot contain more than ${schema.maxItems} items`);
      }
    }
  }

  return errors;
}

// Rate limiting validation
export const validateRateLimit = (
  userId: string,
  action: string,
  limits: { [key: string]: { limit: number; window: number } }
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  const limit = limits[action];
  if (!limit) {
    result.valid = false;
    result.errors.push(`Unknown action: ${action}`);
    return result;
  }

  // This would integrate with the rate limiting system
  // For now, we'll assume it's valid
  result.sanitized = { userId, action, limit, window: limit.window };

  return result;
};

// XSS protection
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

// SQL injection protection (additional layer)
export const sanitizeSqlInput = (input: string): string => {
  // Remove or escape potentially dangerous characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
    .trim();
};

// File upload validation
export const validateFile = (
  file: { name: string; size: number; type: string },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };

  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  // Size validation
  if (file.size > maxSize) {
    result.valid = false;
    result.errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
  }

  // Type validation
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    result.valid = false;
    result.errors.push(`File type '${file.type}' is not allowed`);
  }

  // Extension validation
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      result.valid = false;
      result.errors.push(`File extension '${extension}' is not allowed`);
    }
  }

  // Filename validation
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    result.valid = false;
    result.errors.push('Invalid filename');
  }

  result.sanitized = file;

  return result;
};

// Batch validation helper
export const validateBatch = <T>(
  items: T[],
  validator: (item: T) => ValidationResult,
  options: { maxItems?: number; stopOnFirstError?: boolean } = {}
): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [] };
  const { maxItems = 1000, stopOnFirstError = false } = options;

  if (!Array.isArray(items)) {
    result.valid = false;
    result.errors.push('Input must be an array');
    return result;
  }

  if (items.length > maxItems) {
    result.valid = false;
    result.errors.push(`Batch cannot contain more than ${maxItems} items`);
    return result;
  }

  const validatedItems: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const itemResult = validator(items[i]);

    if (!itemResult.valid) {
      result.valid = false;
      itemResult.errors.forEach(error => {
        result.errors.push(`Item ${i + 1}: ${error}`);
      });

      if (stopOnFirstError) {
        break;
      }
    }

    if (itemResult.sanitized !== undefined) {
      validatedItems.push(itemResult.sanitized);
    }
  }

  if (result.valid) {
    result.sanitized = validatedItems;
  }

  return result;
};