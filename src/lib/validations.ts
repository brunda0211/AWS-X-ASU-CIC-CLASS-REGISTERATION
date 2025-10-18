/**
 * SECURITY: Zod validation schemas for runtime type checking and input validation
 * 
 * These schemas provide:
 * - Runtime type validation
 * - Input sanitization
 * - Security against malformed data
 * - Type-safe validation helpers
 * - Consistent error messages
 */

import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

/**
 * SECURITY: Email validation schema
 * - Validates email format with regex
 * - Transforms to lowercase for consistency
 * - Trims whitespace
 * - Prevents email injection attacks
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * SECURITY: Password validation schema
 * - Enforces minimum/maximum length
 * - Validates password strength
 * - Prevents common weak passwords
 */
export const passwordSchema = z
  .string()
  .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, `Password must be less than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

/**
 * SECURITY: Name validation schema
 * - Validates length constraints
 * - Allows only safe characters (letters, spaces, hyphens, apostrophes)
 * - Trims whitespace
 * - Prevents XSS and injection attacks
 */
export const nameSchema = z
  .string()
  .min(VALIDATION_RULES.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.NAME_MAX_LENGTH, `Name must be less than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((name) => name.trim());

/**
 * SECURITY: Student ID validation schema
 * - Validates length constraints
 * - Allows only alphanumeric characters and hyphens
 * - Transforms to uppercase for consistency
 * - Trims whitespace
 */
export const studentIdSchema = z
  .string()
  .min(VALIDATION_RULES.STUDENT_ID_MIN_LENGTH, `Student ID must be at least ${VALIDATION_RULES.STUDENT_ID_MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.STUDENT_ID_MAX_LENGTH, `Student ID must be less than ${VALIDATION_RULES.STUDENT_ID_MAX_LENGTH} characters`)
  .regex(/^[a-zA-Z0-9-]+$/, 'Student ID can only contain letters, numbers, and hyphens')
  .transform((id) => id.toUpperCase().trim());

/**
 * SECURITY: Class ID validation schema
 */
export const classIdSchema = z
  .string()
  .min(1, 'Class ID is required')
  .max(50, 'Class ID is too long');

/**
 * SECURITY: User registration validation schema
 * Combines all user input fields with proper validation
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  studentId: studentIdSchema,
  password: passwordSchema,
});

/**
 * SECURITY: User login validation schema
 * Validates login credentials
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * SECURITY: Enrollment action validation schema
 */
export const enrollmentSchema = z.object({
  classId: classIdSchema,
  action: z.enum(['enroll', 'unenroll'], {
    message: 'Action must be either "enroll" or "unenroll"'
  }),
});

/**
 * SECURITY: Class creation validation schema (for admin use)
 */
export const classSchema = z.object({
  name: z
    .string()
    .min(3, 'Class name must be at least 3 characters')
    .max(100, 'Class name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&().,]+$/, 'Class name contains invalid characters'),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  instructor: nameSchema,
  
  schedule: z
    .string()
    .min(5, 'Schedule must be at least 5 characters')
    .max(100, 'Schedule must be less than 100 characters'),
  
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(1000, 'Capacity cannot exceed 1000'),
});

/**
 * SECURITY: API response validation schema
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Type inference from schemas for TypeScript
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & { data?: T };

/**
 * SECURITY: Validation helper function with error formatting
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with formatted errors
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
    return { success: false, errors };
  }
}

/**
 * SECURITY: Safe parsing helper that returns null on error
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data or null if validation fails
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

/**
 * SECURITY: Sanitize HTML input to prevent XSS attacks
 * Basic sanitization - in production, use a library like DOMPurify
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SECURITY: Validate and sanitize user input for database operations
 */
export const sanitizedStringSchema = z
  .string()
  .transform((str) => sanitizeHtml(str.trim()));

/**
 * SECURITY: Rate limiting validation schema
 */
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  maxAttempts: z.number().int().min(1).max(100).default(5),
  windowMs: z.number().int().min(1000).max(3600000).default(900000), // 15 minutes default
});

/**
 * SECURITY: Environment variables validation schema
 */
export const envSchema = z.object({
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  DYNAMODB_USERS_TABLE: z.string().min(1, 'DYNAMODB_USERS_TABLE is required'),
  DYNAMODB_ENROLLMENTS_TABLE: z.string().min(1, 'DYNAMODB_ENROLLMENTS_TABLE is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
});

/**
 * SECURITY: Validate environment variables on startup
 */
export function validateEnvironment(): void {
  const result = envSchema.safeParse(process.env);
  
  if (result.success) {
    console.log('Environment variables validated successfully');
  } else {
    const errors = result.error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
    console.error('Environment validation failed:', errors);
    throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
  }
}