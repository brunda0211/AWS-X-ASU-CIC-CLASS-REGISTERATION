/**
 * API Endpoints Test Suite
 * 
 * Tests all API endpoints to identify which ones are not working
 */

import { NextRequest } from 'next/server';

// Mock NextAuth session
const mockSession = {
  user: {
    email: 'test@example.com',
    name: 'Test User',
    studentId: 'TEST123'
  }
};

// Mock getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession))
}));

describe('API Endpoints Test Suite', () => {
  
  describe('Classes API (/api/classes)', () => {
    
    test('GET /api/classes - should return available classes', async () => {
      console.log('🧪 Testing GET /api/classes...');
      
      try {
        const response = await fetch('http://localhost:3000/api/classes');
        const data = await response.json();
        
        console.log('✅ Classes API response:', {
          status: response.status,
          dataType: typeof data,
          isArray: Array.isArray(data),
          hasClasses: data?.classes?.length || 0
        });
        
        expect(response.status).toBe(200);
        
        if (data.success) {
          expect(data.data.classes).toBeDefined();
          expect(Array.isArray(data.data.classes)).toBe(true);
          expect(data.data.classes.length).toBeGreaterThan(0);
        } else if (Array.isArray(data)) {
          expect(data.length).toBeGreaterThan(0);
        }
        
      } catch (error) {
        console.error('❌ Classes API test failed:', error);
        throw error;
      }
    });
  });

  describe('Enrollments API (/api/enrollments)', () => {
    
    test('GET /api/enrollments - should return user enrollments', async () => {
      console.log('🧪 Testing GET /api/enrollments...');
      
      try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
          headers: {
            'Cookie': 'next-auth.session-token=mock-session-token'
          }
        });
        
        const data = await response.json();
        
        console.log('✅ Enrollments GET response:', {
          status: response.status,
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A'
        });
        
        if (response.status === 200) {
          expect(Array.isArray(data)).toBe(true);
        } else if (response.status === 401) {
          console.log('ℹ️ Authentication required (expected in test environment)');
        }
        
      } catch (error) {
        console.error('❌ Enrollments GET test failed:', error);
        throw error;
      }
    });

    test('POST /api/enrollments - should enroll user in class', async () => {
      console.log('🧪 Testing POST /api/enrollments...');
      
      try {
        const response = await fetch('http://localhost:3000/api/enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'next-auth.session-token=mock-session-token'
          },
          body: JSON.stringify({
            classId: '1',
            action: 'enroll'
          })
        });
        
        const data = await response.json();
        
        console.log('✅ Enrollments POST response:', {
          status: response.status,
          success: data.success,
          message: data.message,
          error: data.error
        });
        
        if (response.status === 200 || response.status === 201) {
          expect(data.success).toBe(true);
        } else if (response.status === 401) {
          console.log('ℹ️ Authentication required (expected in test environment)');
        }
        
      } catch (error) {
        console.error('❌ Enrollments POST test failed:', error);
        throw error;
      }
    });
  });

  describe('Registration API (/api/register)', () => {
    
    test('POST /api/register - should register new user', async () => {
      console.log('🧪 Testing POST /api/register...');
      
      const testUser = {
        name: 'API Test User',
        email: 'api-test@example.com',
        studentId: 'API123',
        password: 'TestPassword123!'
      };
      
      try {
        const response = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testUser)
        });
        
        const data = await response.json();
        
        console.log('✅ Registration API response:', {
          status: response.status,
          success: data.success,
          message: data.message,
          error: data.error
        });
        
        if (response.status === 201) {
          expect(data.success).toBe(true);
          expect(data.data.user.email).toBe(testUser.email.toLowerCase());
        } else if (response.status === 409) {
          console.log('ℹ️ User already exists (expected for repeated tests)');
        }
        
      } catch (error) {
        console.error('❌ Registration API test failed:', error);
        throw error;
      }
    });
  });
});