/**
 * Enrollments API - Authenticated endpoints for managing class enrollments
 * 
 * SECURITY FEATURES:
 * - Requires authentication for all operations
 * - Server-side session verification
 * - Input validation with Zod schemas
 * - Generic error messages
 * - Rate limiting for enrollment actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserEnrollments, enrollInClass, isUserEnrolledInClass, unenrollFromClass, getAllEnrollments } from '@/lib/db';
import { enrollmentSchema } from '@/lib/validations';
import { 
  createApiResponse, 
  createErrorResponse, 
  validateMethod, 
  parseRequestBody,
  validateContentType,
  getClientIP,
  apiRateLimiter 
} from '@/lib/api-utils';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * SECURITY: Verify user authentication
 */
async function requireAuthentication() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Authentication required');
  }
  
  return session.user;
}

/**
 * GET /api/enrollments - Get user's enrollments
 * 
 * @param request - NextRequest object
 * @returns NextResponse with user's enrollments
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require authentication (same method as POST)
    const user = await requireAuthentication();

    console.log('=== GET ENROLLMENTS DEBUG START ===');
    console.log('API: User object:', JSON.stringify(user, null, 2));
    console.log('API: User email:', user.email);
    
    // DEBUG: First check all enrollments in the table
    console.log('API: Checking all enrollments in database...');
    const allEnrollments = await getAllEnrollments();
    console.log('API: Total enrollments in database:', allEnrollments.length);
    console.log('API: All enrollments:', JSON.stringify(allEnrollments, null, 2));

    // Get user's enrollments from database
    console.log('API: Getting enrollments for specific user...');
    const enrollments = await getUserEnrollments(user.email);
    
    // DEBUG: Log the enrollments data
    console.log('API: Retrieved enrollments for user:', user.email, 'Count:', enrollments.length);
    console.log('API: User-specific enrollments:', JSON.stringify(enrollments, null, 2));
    console.log('API: Returning enrollments array directly');
    console.log('=== GET ENROLLMENTS DEBUG END ===');

    // Return array directly, not wrapped
    return NextResponse.json(enrollments, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Get enrollments error:', error);
    return NextResponse.json({ error: 'Failed to get enrollments' }, { status: 500 });
  }
}

/**
 * POST /api/enrollments - Enroll in a class
 * 
 * @param request - NextRequest object
 * @returns NextResponse with enrollment result
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate request method
    if (!validateMethod(request, ['POST'])) {
      return createErrorResponse('Method not allowed', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Validate Content-Type
    if (!validateContentType(request, 'application/json')) {
      return createErrorResponse('Invalid content type', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Require authentication
    const user = await requireAuthentication();

    // SECURITY: Rate limiting for enrollment actions
    const clientIP = getClientIP(request);
    if (!apiRateLimiter.isAllowed(`enrollment-${user.email}-${clientIP}`)) {
      return createErrorResponse(
        'Too many enrollment attempts. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    // Parse and validate request body
    const body = await parseRequestBody(request, 512); // 512 bytes limit

    // SECURITY: Validate input with Zod schema
    const validationResult = enrollmentSchema.safeParse(body);
    
    if (!validationResult.success) {
      // SECURITY: Simplified error handling for Zod validation
      return createErrorResponse(
        `Invalid enrollment data: ${validationResult.error.message}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const { classId, action } = validationResult.data;

    if (action === 'enroll') {
      // Check if user is already enrolled
      const isEnrolled = await isUserEnrolledInClass(user.email, classId);
      
      if (isEnrolled) {
        return createErrorResponse(
          'You are already enrolled in this class',
          HTTP_STATUS.CONFLICT
        );
      }

      // Get class name for enrollment (in a real app, this would come from a classes table)
      const classNames: Record<string, string> = {
        '1': 'Web Development 101',
        '2': 'Database Basics',
        '3': 'Cybersecurity Fundamentals',
      };

      const className = classNames[classId];
      if (!className) {
        return createErrorResponse(
          'Class not found',
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Enroll user in class
      try {
        console.log('=== ENROLLMENT CREATION DEBUG START ===');
        console.log('API: About to enroll user:', user.email);
        console.log('API: Class name:', className);
        console.log('API: Class ID:', classId);
        
        await enrollInClass(user.email, className, classId);
        
        console.log('API: Enrollment creation completed successfully');
        
        // Verify the enrollment was created by checking immediately
        const verifyEnrollments = await getUserEnrollments(user.email);
        console.log('API: Verification - User now has', verifyEnrollments.length, 'enrollments');
        console.log('API: Verification - Enrollments:', JSON.stringify(verifyEnrollments, null, 2));
        console.log('=== ENROLLMENT CREATION DEBUG END ===');

        return createApiResponse(
          { 
            message: 'Successfully enrolled in class',
            classId,
            className 
          },
          'Enrollment successful',
          HTTP_STATUS.CREATED
        );
      } catch (enrollError) {
        if (enrollError instanceof Error && enrollError.message === 'User is already enrolled in this class') {
          // Return success instead of error for duplicate enrollment
          return createApiResponse(
            { 
              message: 'You are already enrolled in this class',
              alreadyEnrolled: true,
              classId,
              className 
            },
            'Already enrolled',
            HTTP_STATUS.OK
          );
        }
        
        // Re-throw other errors to be handled by outer catch
        throw enrollError;
      }

    } else if (action === 'unenroll') {
      // TODO: Implement unenrollment logic
      return createErrorResponse(
        'Unenrollment not yet implemented',
        HTTP_STATUS.NOT_IMPLEMENTED
      );
    }

    return createErrorResponse(
      'Invalid action',
      HTTP_STATUS.BAD_REQUEST
    );

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    console.error('Enrollment error:', error);
    return createErrorResponse(
      'Enrollment failed. Please try again.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/enrollments - Unenroll from a class
 * 
 * @param request - NextRequest object
 * @returns NextResponse with unenrollment result
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate request method
    if (!validateMethod(request, ['DELETE'])) {
      return createErrorResponse('Method not allowed', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Validate Content-Type
    if (!validateContentType(request, 'application/json')) {
      return createErrorResponse('Invalid content type', HTTP_STATUS.BAD_REQUEST);
    }

    // SECURITY: Require authentication
    const user = await requireAuthentication();

    // Parse and validate request body
    const body = await parseRequestBody(request, 512); // 512 bytes limit

    const { className } = body;
    if (!className || typeof className !== 'string') {
      return createErrorResponse(
        'Class name is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Unenroll user from class
    await unenrollFromClass(user.email, className);

    return createApiResponse(
      { 
        message: 'Successfully unenrolled from class',
        className 
      },
      'Unenrollment successful',
      HTTP_STATUS.OK
    );

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createErrorResponse(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    console.error('Unenroll error:', error);
    return createErrorResponse(
      'Failed to unenroll from class. Please try again.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * OPTIONS /api/enrollments - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}