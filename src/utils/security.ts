/**
 * Security utility functions for input sanitization and validation
 * Addresses CVSS 9.6 XSS vulnerabilities and input validation issues
 */

import DOMPurify from 'dompurify';

export interface SanitizationResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Comprehensive input sanitization to prevent XSS attacks
 */
export class SecuritySanitizer {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly ALLOWED_HTML_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br'];

  /**
   * Sanitize HTML content to prevent XSS injection
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Configure DOMPurify for medical data safety
    const cleanHtml = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: this.ALLOWED_HTML_TAGS,
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      REMOVE_DATA_URI: true,
      FORBID_CONTENTS: ['script', 'object', 'embed', 'base', 'link'],
      SANITIZE_DOM: true
    });

    return cleanHtml;
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters but keep medical symbols
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:(?!image\/)/gi, '')
      .trim();

    // Limit length to prevent DoS attacks
    return sanitized.length > this.MAX_STRING_LENGTH 
      ? sanitized.substring(0, this.MAX_STRING_LENGTH) + '...'
      : sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: unknown): number | null {
    if (typeof input === 'number') {
      if (!isFinite(input) || isNaN(input)) {
        return null;
      }
      return Math.max(0, Math.min(999999, input)); // Limit range
    }

    if (typeof input === 'string') {
      const parsed = parseFloat(input);
      if (!isFinite(parsed) || isNaN(parsed)) {
        return null;
      }
      return Math.max(0, Math.min(999999, parsed));
    }

    return null;
  }

  /**
   * Sanitize date input
   */
  static sanitizeDate(input: unknown): string | null {
    if (!input) return null;

    try {
      let dateObj: Date;

      if (input instanceof Date) {
        dateObj = input;
      } else if (typeof input === 'string') {
        dateObj = new Date(input);
      } else {
        return null;
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      // Check reasonable date range (1900 to 2100)
      const year = dateObj.getFullYear();
      if (year < 1900 || year > 2100) {
        return null;
      }

      return dateObj.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Sanitize entire object recursively
   */
  static sanitizeObject(obj: any): SanitizationResult {
    try {
      if (obj === null || obj === undefined) {
        return { success: true, data: obj };
      }

      if (Array.isArray(obj)) {
        const sanitizedArray = obj.map(item => this.sanitizeObject(item).data);
        return { success: true, data: sanitizedArray };
      }

      if (typeof obj === 'object') {
        const sanitizedObj: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          // Sanitize key name
          const cleanKey = this.sanitizeText(key);
          
          if (typeof value === 'string') {
            sanitizedObj[cleanKey] = this.sanitizeText(value);
          } else if (typeof value === 'number') {
            sanitizedObj[cleanKey] = this.sanitizeNumber(value);
          } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
            sanitizedObj[cleanKey] = this.sanitizeDate(value);
          } else {
            const nestedResult = this.sanitizeObject(value);
            if (nestedResult.success) {
              sanitizedObj[cleanKey] = nestedResult.data;
            }
          }
        }

        return { success: true, data: sanitizedObj };
      }

      if (typeof obj === 'string') {
        return { success: true, data: this.sanitizeText(obj) };
      }

      if (typeof obj === 'number') {
        return { success: true, data: this.sanitizeNumber(obj) };
      }

      return { success: true, data: obj };

    } catch (error) {
      return { 
        success: false, 
        error: `Sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Remove sensitive information from logs
   */
  static sanitizeForLogging(obj: any): any {
    const sensitive = ['password', 'token', 'key', 'secret', 'patient_id', 'ssn', 'phone', 'email'];
    
    const sanitizeValue = (value: any, key: string): any => {
      if (typeof key === 'string' && sensitive.some(s => key.toLowerCase().includes(s))) {
        return '[REDACTED]';
      }
      
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map((item, index) => sanitizeValue(item, index.toString()));
        }
        
        const sanitized: any = {};
        for (const [k, v] of Object.entries(value)) {
          sanitized[k] = sanitizeValue(v, k);
        }
        return sanitized;
      }
      
      return value;
    };

    return sanitizeValue(obj, '');
  }
}

/**
 * Rate limiting utility to prevent abuse
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  static checkRateLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(key) || { count: 0, lastAttempt: 0 };
    
    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      record.count = 0;
    }
    
    record.count++;
    record.lastAttempt = now;
    this.attempts.set(key, record);
    
    return record.count <= maxAttempts;
  }
}

/**
 * Content Security Policy helpers
 */
export const CSPHelpers = {
  /**
   * Check if URL is safe for medical application
   */
  isSafeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['https:', 'http:', 'mailto:'];
      const blockedDomains = ['suspicious.com', 'malware.net']; // Add known bad domains
      
      if (!allowedProtocols.includes(parsed.protocol)) {
        return false;
      }
      
      if (blockedDomains.some(domain => parsed.hostname.includes(domain))) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate nonce for inline scripts if needed
   */
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

export default SecuritySanitizer;