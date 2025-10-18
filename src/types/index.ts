// Core type definitions for the student registration system

export interface User {
  email: string; // Primary key in DynamoDB
  name: string;
  studentId: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string; // Primary key
  name: string;
  description: string;
  instructor: string;
  schedule: string;
  capacity: number;
  currentEnrollment: number;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string; // Primary key (composite: email-classId-timestamp)
  email: string; // GSI partition key
  classId: string; // GSI sort key
  className: string;
  enrolledAt: string;
  status: 'active' | 'dropped';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface RegisterFormData {
  name: string;
  email: string;
  studentId: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface EnrollmentAction {
  classId: string;
  action: 'enroll' | 'unenroll';
}