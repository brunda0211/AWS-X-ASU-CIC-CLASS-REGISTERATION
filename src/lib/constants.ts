// Application constants

export const APP_CONFIG = {
  name: 'Student Registration System',
  description: 'A comprehensive class registration system for students',
  version: '1.0.0',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CLASSES: '/classes',
  PROFILE: '/profile',
} as const;

export const API_ROUTES = {
  AUTH: '/api/auth',
  REGISTER: '/api/register',
  ENROLLMENTS: '/api/enrollments',
  CLASSES: '/api/classes',
  USERS: '/api/users',
} as const;

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  DROPPED: 'dropped',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
} as const;

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  STUDENT_ID_MIN_LENGTH: 5,
  STUDENT_ID_MAX_LENGTH: 20,
} as const;

export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  UPDATE_AGE: 60 * 60, // 1 hour in seconds
} as const;