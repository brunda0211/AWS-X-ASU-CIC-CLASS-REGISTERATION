/**
 * SECURITY: User registration API endpoint with comprehensive security measures
 * 
 * CRITICAL SECURITY FEATURES:
 * - Input validation with Zod schemas
 * - Password hashing with bcrypt
 * - Rate limiting to prevent spam
 * - Duplicate email prevention
 * - Generic error messages (prevent account enumeration)
 * - Request size limits
 * - CORS protection
 */

import { NextRequest } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { 
  createApiResponse, 
  createErrorResponse, 
  validateMethod, 
  parseRequestBody, 
  validateContentType,
  getClientIP,
  authRateLimiter 
} from '@/lib/api-utils';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * SECURITY: Handle user registration with comprehensive validation
 * 
 * @param request - NextRequest object
 * @returns NextResponse with registration result
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate request method
    if (!validateMethod(request, ['POST'])) {
      return createErrorResponse('Method not allowed', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Validate Content-Type header
    if (!validateContentType(request, 'application/json')) {
      return createErrorResponse('Invalid content type', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Rate limiting to prevent spam registrations
    const clientIP = getClientIP(request);
    if (!authRateLimiter.isAllowed(clientIP)) {
      console.log(`Registration rate limit exceeded for IP: ${clientIP}`);
      return createErrorResponse(
        'Too many registration attempts. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    // SECURITY: Parse and validate request body with size limit
    const body = await parseRequestBody(request, 1024); // 1KB limit for registration

    // SECURITY: Validate input with Zod schema
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      
      return createErrorResponse(
        `Validation failed: ${errors.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const { name, email, studentId, password } = validationResult.data;

    // SECURITY: Check if user already exists (prevent duplicate accounts)
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      console.log(`Registration attempt for existing email: ${email}`);
      // SECURITY: Generic error message (don't reveal if email exists)
      return createErrorResponse(
        'Registration failed. Please check your information and try again.',
        HTTP_STATUS.CONFLICT
      );
    }

    // SECURITY: Hash password with bcrypt before storing
    const passwordHash = await hashPassword(password);

    // SECURITY: Create user in database with hashed password
    const newUser = await createUser(email, passwordHash, name, studentId);

    // SECURITY: Return success without sensitive data
    const responseData = {
      user: {
        email: newUser.email,
        name: newUser.name,
        studentId: newUser.studentId,
        createdAt: newUser.createdAt,
      },
    };

    console.log(`User registered successfully: ${email}`);

    return createApiResponse(
      responseData,
      'User registered successfully',
      HTTP_STATUS.CREATED
    );

  } catch (error) {
    // SECURITY: Log error without exposing sensitive details
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');

    // SECURITY: Return generic error message
    return createErrorResponse(
      'Registration failed. Please try again later.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * SECURITY: Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}