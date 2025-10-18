/**
 * Authentication Functions Test Suite
 * 
 * Tests all authentication-related functions
 */

import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength,
  checkRateLimit,
  clearRateLimit
} from '@/lib/auth';

describe('Authentication Functions Test Suite', () => {
  
  describe('Password Hashing', () => {
    
    test('hashPassword - should hash password securely', async () => {
      console.log('🧪 Testing hashPassword...');
      
      const testPassword = 'TestPassword123!';
      
      try {
        const hashedPassword = await hashPassword(testPassword);
        
        console.log('✅ hashPassword result:', {
          originalLength: testPassword.length,
          hashedLength: hashedPassword.length,
          startsWithBcrypt: hashedPassword.startsWith('$2'),
          isDifferent: hashedPassword !== testPassword
        });
        
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(testPassword);
        expect(hashedPassword.length).toBeGreaterThan(50);
        expect(hashedPassword.startsWith('$2')).toBe(true); // bcrypt format
        
      } catch (error) {
        console.error('❌ hashPassword failed:', error);
        throw error;
      }
    });

    test('verifyPassword - should verify password correctly', async () => {
      console.log('🧪 Testing verifyPassword...');
      
      const testPassword = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      
      try {
        // First hash the password
        const hashedPassword = await hashPassword(testPassword);
        
        // Test correct password
        const correctResult = await verifyPassword(testPassword, hashedPassword);
        console.log('✅ Correct password verification:', correctResult);
        expect(correctResult).toBe(true);
        
        // Test wrong password
        const wrongResult = await verifyPassword(wrongPassword, hashedPassword);
        console.log('✅ Wrong password verification:', wrongResult);
        expect(wrongResult).toBe(false);
        
      } catch (error) {
        console.error('❌ verifyPassword failed:', error);
        throw error;
      }
    });
  });

  describe('Password Validation', () => {
    
    test('validatePasswordStrength - should validate password strength', () => {
      console.log('🧪 Testing validatePasswordStrength...');
      
      const testCases = [
        { password: 'weak', expectedValid: false },
        { password: 'StrongPassword123!', expectedValid: true },
        { password: 'NoNumbers!', expectedValid: false },
        { password: 'nonumbers123', expectedValid: false },
        { password: 'NOLOWERCASE123!', expectedValid: false }
      ];
      
      try {
        testCases.forEach(({ password, expectedValid }) => {
          const result = validatePasswordStrength(password);
          
          console.log(`✅ Password "${password}":`, {
            isValid: result.isValid,
            score: result.score,
            feedback: result.feedback
          });
          
          expect(result.isValid).toBe(expectedValid);
          expect(typeof result.score).toBe('number');
          expect(Array.isArray(result.feedback)).toBe(true);
        });
        
      } catch (error) {
        console.error('❌ validatePasswordStrength failed:', error);
        throw error;
      }
    });
  });

  describe('Rate Limiting', () => {
    
    test('checkRateLimit - should implement rate limiting', () => {
      console.log('🧪 Testing checkRateLimit...');
      
      const testIdentifier = 'test-user@example.com';
      
      try {
        // Clear any existing rate limit
        clearRateLimit(testIdentifier);
        
        // First few attempts should be allowed
        const attempt1 = checkRateLimit(testIdentifier, 3, 60000); // 3 attempts per minute
        console.log('✅ Attempt 1:', attempt1);
        expect(attempt1).toBe(true);
        
        const attempt2 = checkRateLimit(testIdentifier, 3, 60000);
        console.log('✅ Attempt 2:', attempt2);
        expect(attempt2).toBe(true);
        
        const attempt3 = checkRateLimit(testIdentifier, 3, 60000);
        console.log('✅ Attempt 3:', attempt3);
        expect(attempt3).toBe(true);
        
        // Fourth attempt should be blocked
        const attempt4 = checkRateLimit(testIdentifier, 3, 60000);
        console.log('✅ Attempt 4 (should be blocked):', attempt4);
        expect(attempt4).toBe(false);
        
        // Clear rate limit
        clearRateLimit(testIdentifier);
        
        // Should be allowed again after clearing
        const attempt5 = checkRateLimit(testIdentifier, 3, 60000);
        console.log('✅ Attempt 5 (after clear):', attempt5);
        expect(attempt5).toBe(true);
        
      } catch (error) {
        console.error('❌ Rate limiting test failed:', error);
        throw error;
      }
    });
  });
});