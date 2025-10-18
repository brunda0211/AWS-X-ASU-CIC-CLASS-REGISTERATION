/**
 * SECURITY: Secure password hashing and authentication utilities
 * 
 * This module provides secure password hashing using bcryptjs with proper salt rounds.
 * CRITICAL SECURITY FEATURES:
 * - Uses bcrypt one-way hashing (cannot be reversed)
 * - 10 salt rounds for security vs performance balance
 * - NEVER logs passwords or hashes anywhere
 * - Protects against rainbow table attacks
 * - Even if database is breached, passwords remain secure
 */

import bcrypt from 'bcryptjs';
import type { DefaultSession } from 'next-auth';

/**
 * SECURITY: 10 salt rounds provides strong security while maintaining reasonable performance
 * - Each additional round doubles the computation time
 * - 10 rounds = ~100ms on modern hardware (good balance)
 * - Higher rounds = more secure but slower authentication
 * - Lower rounds = faster but less secure against brute force
 */
const SALT_ROUNDS = 10;

/**
 * TypeScript type for authenticated session user
 * Contains only non-sensitive user information for client-side use
 */
export interface SessionUser {
  email: string;
  name: string;
  studentId: string;
}

/**
 * Extended NextAuth session type with our custom user properties
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: SessionUser;
  }
  
  interface User {
    email: string;
    name: string;
    studentId: string;
  }
}

/**
 * SECURITY: Hash a plain text password using bcrypt with salt
 * 
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password string
 * 
 * SECURITY NOTES:
 * - Uses bcrypt.hash() with 10 salt rounds
 * - Bcrypt automatically generates a unique salt for each password
 * - The salt is embedded in the hash output
 * - NEVER logs the password or hash for security
 * - One-way function - cannot be reversed to get original password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // SECURITY: Validate input without logging it
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    if (password.length > 100) {
      throw new Error('Password is too long');
    }
    
    // SECURITY: Hash password with bcrypt using 10 salt rounds
    // bcrypt.hash(data, saltRounds) automatically:
    // 1. Generates a random salt
    // 2. Combines salt with password
    // 3. Hashes the combination 2^10 (1024) times
    // 4. Returns salt + hash in a single string
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // SECURITY: Never log passwords or hashes
    // Only log that the operation completed successfully
    console.log('Password hashed successfully');
    
    return hashedPassword;
  } catch (error) {
    // SECURITY: Log error without exposing password details
    console.error('Password hashing failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to hash password');
  }
}

/**
 * SECURITY: Verify a plain text password against its bcrypt hash
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored bcrypt hash to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 * 
 * SECURITY NOTES:
 * - Uses bcrypt.compare() for constant-time comparison
 * - Extracts salt from stored hash automatically
 * - Hashes input password with extracted salt
 * - Compares hashes in constant time (prevents timing attacks)
 * - NEVER logs passwords or hashes
 * - Returns false for any error (fail-safe)
 */
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    // SECURITY: Validate inputs without logging them
    if (!password || typeof password !== 'string') {
      return false; // Fail-safe: invalid input = no access
    }
    
    if (!hashedPassword || typeof hashedPassword !== 'string') {
      return false; // Fail-safe: invalid hash = no access
    }
    
    // SECURITY: Use bcrypt.compare for secure password verification
    // bcrypt.compare(data, hash) automatically:
    // 1. Extracts the salt from the stored hash
    // 2. Hashes the input password with the extracted salt
    // 3. Compares the new hash with the stored hash
    // 4. Uses constant-time comparison to prevent timing attacks
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    // SECURITY: Never log passwords, hashes, or comparison results
    // Only log authentication attempts for monitoring
    console.log('Password verification completed');
    
    return isValid;
  } catch (error) {
    // SECURITY: Log error without exposing sensitive details
    console.error('Password verification failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // SECURITY: Return false on any error (fail-safe approach)
    // Better to deny access than risk security breach
    return false;
  }
}

/**
 * SECURITY: Generate a secure random password for testing/development
 * 
 * @param length - Length of password to generate (default: 12)
 * @returns string - Randomly generated password
 * 
 * NOTE: This is for development/testing only. In production, users should
 * create their own passwords following security guidelines.
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * SECURITY: Validate password strength
 * 
 * @param password - Password to validate
 * @returns object - Validation result with strength score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // SECURITY: Don't log the password being validated
  
  if (!password) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required']
    };
  }
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }
  
  // Common password patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score -= 1;
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Avoid common patterns');
    score -= 2;
  }
  
  const isValid = score >= 4 && password.length >= 8;
  
  if (feedback.length === 0 && isValid) {
    feedback.push('Strong password!');
  }
  
  return {
    isValid,
    score: Math.max(0, score),
    feedback
  };
}

/**
 * SECURITY: Rate limiting for authentication attempts
 * Simple in-memory rate limiter for development
 * In production, use Redis or database-backed rate limiting
 */
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const attempts = authAttempts.get(identifier);
  
  if (!attempts) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  
  return true;
}

/**
 * SECURITY: Clear rate limit for an identifier (e.g., after successful login)
 */
export function clearRateLimit(identifier: string): void {
  authAttempts.delete(identifier);
}