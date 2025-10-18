/**
 * Database error handling utilities
 * SECURITY: Provides safe error handling without exposing internal details
 */

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'DATABASE_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DatabaseError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/**
 * SECURITY: Handle DynamoDB errors safely without exposing internal details
 */
export function handleDynamoDBError(error: any): DatabaseError {
  // Don't log sensitive information
  const errorName = error?.name || 'UnknownError';
  
  switch (errorName) {
    case 'ConditionalCheckFailedException':
      return new ConflictError('Resource already exists or condition not met');
    
    case 'ResourceNotFoundException':
      return new NotFoundError('Requested resource not found');
    
    case 'ValidationException':
      return new ValidationError('Invalid input provided');
    
    case 'ProvisionedThroughputExceededException':
      return new DatabaseError('Service temporarily unavailable', 'RATE_LIMIT', 429);
    
    case 'ItemCollectionSizeLimitExceededException':
      return new DatabaseError('Data limit exceeded', 'DATA_LIMIT', 413);
    
    case 'AccessDeniedException':
      return new DatabaseError('Access denied', 'ACCESS_DENIED', 403);
    
    default:
      // SECURITY: Don't expose internal error details
      console.error('Unexpected database error:', {
        name: errorName,
        message: error?.message,
        // Don't log the full error object as it might contain sensitive data
      });
      
      return new DatabaseError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * SECURITY: Validate email format to prevent injection
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  if (email.length > 254) {
    throw new ValidationError('Email too long');
  }
}

/**
 * SECURITY: Validate student ID format
 */
export function validateStudentId(studentId: string): void {
  if (!studentId || typeof studentId !== 'string') {
    throw new ValidationError('Student ID is required');
  }
  
  if (studentId.length < 5 || studentId.length > 20) {
    throw new ValidationError('Student ID must be between 5 and 20 characters');
  }
  
  // Allow alphanumeric characters and hyphens only
  const studentIdRegex = /^[a-zA-Z0-9-]+$/;
  if (!studentIdRegex.test(studentId)) {
    throw new ValidationError('Student ID can only contain letters, numbers, and hyphens');
  }
}

/**
 * SECURITY: Validate name format
 */
export function validateName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Name is required');
  }
  
  if (name.length < 2 || name.length > 50) {
    throw new ValidationError('Name must be between 2 and 50 characters');
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name)) {
    throw new ValidationError('Name can only contain letters, spaces, hyphens, and apostrophes');
  }
}