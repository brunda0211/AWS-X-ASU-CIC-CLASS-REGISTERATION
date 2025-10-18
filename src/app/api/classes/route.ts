/**
 * Classes API - Public endpoint for retrieving available classes
 * 
 * SECURITY: Public endpoint (no authentication required)
 * Returns hardcoded class data for demonstration
 */

import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, validateMethod } from '@/lib/api-utils';
import { HTTP_STATUS } from '@/lib/constants';

// Hardcoded class data for demonstration
const CLASSES = [
  {
    id: "1",
    name: "Web Development 101",
    instructor: "Dr. Smith",
    description: "Learn HTML, CSS, and JavaScript fundamentals. Perfect for beginners looking to start their web development journey.",
    capacity: 30,
    currentEnrollment: 18,
    schedule: "Mon/Wed 10:00-11:30 AM",
    semester: "Fall 2024",
    credits: 3,
    prerequisites: "None",
    location: "Computer Lab A"
  },
  {
    id: "2",
    name: "Database Basics",
    instructor: "Prof. Johnson",
    description: "Introduction to SQL and NoSQL databases. Learn database design, queries, and optimization techniques.",
    capacity: 25,
    currentEnrollment: 12,
    schedule: "Tue/Thu 2:00-3:30 PM",
    semester: "Fall 2024",
    credits: 3,
    prerequisites: "Basic programming knowledge",
    location: "Room 205"
  },
  {
    id: "3",
    name: "Cybersecurity Fundamentals",
    instructor: "Dr. Lee",
    description: "Security best practices and common vulnerabilities. Learn to protect systems and data from cyber threats.",
    capacity: 20,
    currentEnrollment: 15,
    schedule: "Wed/Fri 1:00-2:30 PM",
    semester: "Fall 2024",
    credits: 4,
    prerequisites: "Computer Science 101",
    location: "Security Lab"
  }
];

/**
 * GET /api/classes - Retrieve all available classes
 * 
 * @param request - NextRequest object
 * @returns NextResponse with classes data
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Validate request method
    if (!validateMethod(request, ['GET'])) {
      return createErrorResponse('Method not allowed', HTTP_STATUS.BAD_REQUEST);
    }

    // Return classes data
    return createApiResponse(
      { classes: CLASSES },
      'Classes retrieved successfully',
      HTTP_STATUS.OK
    );

  } catch (error) {
    console.error('Classes API error:', error);
    return createErrorResponse(
      'Failed to retrieve classes',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * OPTIONS /api/classes - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}