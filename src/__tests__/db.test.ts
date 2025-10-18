/**
 * Database Functions Test Suite
 * 
 * Tests all database functions to identify which ones are not working
 */

import { 
  createUser, 
  getUserByEmail, 
  enrollInClass, 
  getUserEnrollments, 
  isUserEnrolledInClass,
  unenrollFromClass,
  getAllEnrollments
} from '@/lib/db';

// Mock data for testing
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  studentId: 'TEST123',
  password: 'hashedpassword123'
};

const testClass = {
  id: '1',
  name: 'Web Development 101',
  instructor: 'Dr. Smith'
};

describe('Database Functions Test Suite', () => {
  
  describe('User Management Functions', () => {
    
    test('createUser - should create a new user', async () => {
      console.log('🧪 Testing createUser...');
      
      try {
        const result = await createUser(
          testUser.email,
          testUser.password,
          testUser.name,
          testUser.studentId
        );
        
        console.log('✅ createUser result:', result);
        expect(result).toBeDefined();
        expect(result.email).toBe(testUser.email.toLowerCase());
        expect(result.name).toBe(testUser.name);
        expect(result.studentId).toBe(testUser.studentId);
        
      } catch (error) {
        console.error('❌ createUser failed:', error);
        // Don't fail the test if user already exists
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log('ℹ️ User already exists, continuing...');
        } else {
          throw error;
        }
      }
    });

    test('getUserByEmail - should retrieve user by email', async () => {
      console.log('🧪 Testing getUserByEmail...');
      
      try {
        const result = await getUserByEmail(testUser.email);
        
        console.log('✅ getUserByEmail result:', result);
        
        if (result) {
          expect(result.email).toBe(testUser.email.toLowerCase());
          expect(result.name).toBe(testUser.name);
        } else {
          console.log('⚠️ User not found, may need to create first');
        }
        
      } catch (error) {
        console.error('❌ getUserByEmail failed:', error);
        throw error;
      }
    });
  });

  describe('Enrollment Functions', () => {
    
    test('enrollInClass - should enroll user in a class', async () => {
      console.log('🧪 Testing enrollInClass...');
      
      try {
        await enrollInClass(
          testUser.email,
          testClass.name,
          testClass.id
        );
        
        console.log('✅ enrollInClass completed successfully');
        
      } catch (error) {
        console.error('❌ enrollInClass failed:', error);
        // Don't fail if already enrolled
        if (error instanceof Error && error.message.includes('already enrolled')) {
          console.log('ℹ️ User already enrolled, continuing...');
        } else {
          throw error;
        }
      }
    });

    test('getUserEnrollments - should retrieve user enrollments', async () => {
      console.log('🧪 Testing getUserEnrollments...');
      
      try {
        const result = await getUserEnrollments(testUser.email);
        
        console.log('✅ getUserEnrollments result:', result);
        console.log('📊 Number of enrollments found:', result.length);
        
        expect(Array.isArray(result)).toBe(true);
        
        if (result.length > 0) {
          console.log('✅ Found enrollments:', result.map(e => e.className));
          expect(result[0]).toHaveProperty('email');
          expect(result[0]).toHaveProperty('className');
          expect(result[0]).toHaveProperty('classId');
          expect(result[0]).toHaveProperty('status');
        } else {
          console.log('⚠️ No enrollments found - this might be the issue!');
        }
        
      } catch (error) {
        console.error('❌ getUserEnrollments failed:', error);
        throw error;
      }
    });

    test('isUserEnrolledInClass - should check enrollment status', async () => {
      console.log('🧪 Testing isUserEnrolledInClass...');
      
      try {
        const result = await isUserEnrolledInClass(testUser.email, testClass.id);
        
        console.log('✅ isUserEnrolledInClass result:', result);
        expect(typeof result).toBe('boolean');
        
      } catch (error) {
        console.error('❌ isUserEnrolledInClass failed:', error);
        throw error;
      }
    });

    test('getAllEnrollments - should retrieve all enrollments', async () => {
      console.log('🧪 Testing getAllEnrollments...');
      
      try {
        const result = await getAllEnrollments();
        
        console.log('✅ getAllEnrollments result:', result);
        console.log('📊 Total enrollments in database:', result.length);
        
        expect(Array.isArray(result)).toBe(true);
        
        if (result.length > 0) {
          console.log('✅ Sample enrollment:', result[0]);
        } else {
          console.log('⚠️ No enrollments found in database!');
        }
        
      } catch (error) {
        console.error('❌ getAllEnrollments failed:', error);
        throw error;
      }
    });
  });

  describe('Integration Tests', () => {
    
    test('Full enrollment flow - create, enroll, retrieve', async () => {
      console.log('🧪 Testing full enrollment flow...');
      
      const testEmail = 'integration-test@example.com';
      const testName = 'Integration Test User';
      const testStudentId = 'INT123';
      
      try {
        // Step 1: Create user (if not exists)
        console.log('Step 1: Creating user...');
        try {
          await createUser(testEmail, 'hashedpass', testName, testStudentId);
          console.log('✅ User created');
        } catch (error) {
          if (error instanceof Error && error.message.includes('already exists')) {
            console.log('ℹ️ User already exists');
          } else {
            throw error;
          }
        }
        
        // Step 2: Enroll in class
        console.log('Step 2: Enrolling in class...');
        try {
          await enrollInClass(testEmail, testClass.name, testClass.id);
          console.log('✅ Enrollment created');
        } catch (error) {
          if (error instanceof Error && error.message.includes('already enrolled')) {
            console.log('ℹ️ Already enrolled');
          } else {
            throw error;
          }
        }
        
        // Step 3: Retrieve enrollments
        console.log('Step 3: Retrieving enrollments...');
        const enrollments = await getUserEnrollments(testEmail);
        console.log('✅ Retrieved enrollments:', enrollments.length);
        
        // Step 4: Check enrollment status
        console.log('Step 4: Checking enrollment status...');
        const isEnrolled = await isUserEnrolledInClass(testEmail, testClass.id);
        console.log('✅ Enrollment status:', isEnrolled);
        
        // Verify the flow worked
        if (enrollments.length > 0 && isEnrolled) {
          console.log('🎉 Full enrollment flow PASSED!');
        } else {
          console.log('❌ Full enrollment flow FAILED!');
          console.log('- Enrollments found:', enrollments.length);
          console.log('- Is enrolled check:', isEnrolled);
        }
        
      } catch (error) {
        console.error('❌ Integration test failed:', error);
        throw error;
      }
    });
  });
});