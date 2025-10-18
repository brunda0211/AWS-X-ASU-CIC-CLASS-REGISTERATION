/**
 * SECURITY: API utility functions for secure request/response handling
 * 
 * Provides:
 * - Standardized API response format
 * - Error handling with proper HTTP status codes
 * - Request validation helpers
 * - CORS and security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HTTP_STATUS } from './constants';
import type { ApiResponse } from './validations';

/**
 * SECURITY: Create standardized API response with proper headers
 */
export function createApiResponse<T = any>(
  data: T | null = null,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    ...(data && { data }),
    ...(message && { message }),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      // SECURITY: Add security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  });
}

/**
 * SECURITY: Create error response with safe error messages
 */
export function createErrorResponse(
  error: string | Error | ZodError,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): NextResponse<ApiResponse> {
  let errorMessage: string;
  let errorDetails: string[] = [];

  if (error instanceof ZodError) {
    errorMessage = 'Validation failed';
    errorDetails = error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
    status = HTTP_STATUS.BAD_REQUEST;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = error;
  }

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    ...(errorDetails.length > 0 && { details: errorDetails }),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  });
}

/**
 * SECURITY: Validate request method
 */
export function validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * SECURITY: Get client IP address for rate limiting
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection IP
  return request.ip || 'unknown';
}

/**
 * SECURITY: Parse and validate JSON request body
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  maxSize: number = 1024 * 1024 // 1MB default
): Promise<T> {
  try {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error('Request body too large');
    }
    
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid request body');
    }
    
    return body as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse request body: ${error.message}`);
    }
    throw new Error('Failed to parse request body');
  }
}

/**
 * SECURITY: Validate Content-Type header
 */
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes(expectedType) ?? false;
}

/**
 * SECURITY: Create CORS headers for API responses
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    // Add production domains here
  ];
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : 'null';
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * SECURITY: Handle preflight OPTIONS requests
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * SECURITY: Sanitize user input for logging
 * Removes sensitive information before logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * SECURITY: Rate limiting helper
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
  
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - attempt.count);
  }
  
  getResetTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    return attempt?.resetTime || 0;
  }
}

/**
 * SECURITY: Global rate limiter instances
 */
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute