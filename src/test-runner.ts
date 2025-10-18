/**
 * Simple Test Runner for Database and API Functions
 * 
 * Run this script to test all functions and identify issues
 * Usage: npx tsx src/test-runner.ts
 */

import { 
  createUser, 
  getUserByEmail, 
  enrollInClass, 
  getUserEnrollments, 
  isUserEnrolledInClass,
  unenrollFromClass,
  getAllEnrollments
} from './lib/db';

import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength
} from './lib/auth';

async function runTests() {
  console.log('🚀 Starting comprehensive function tests...\n');
  
  const testResults: { [key: string]: 'PASS' | 'FAIL' | 'SKIP' } = {};
  
  // Test data
  const testUser = {
    email: 'test-runner@example.com',
    name: 'Test Runner User',
    studentId: 'TR123',
    password: 'TestPassword123!'
  };

  // Test 1: Environment Variables
  console.log('=== TEST 1: Environment Variables ===');
  try {
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('DYNAMODB_USERS_TABLE:', process.env.DYNAMODB_USERS_TABLE);
    console.log('DYNAMODB_ENROLLMENTS_TABLE:', process.env.DYNAMODB_ENROLLMENTS_TABLE);
    console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
    
    if (process.env.AWS_REGION && process.env.DYNAMODB_USERS_TABLE && process.env.DYNAMODB_ENROLLMENTS_TABLE) {
      testResults['Environment Variables'] = 'PASS';
      console.log('✅ Environment variables: PASS\n');
    } else {
      testResults['Environment Variables'] = 'FAIL';
      console.log('❌ Environment variables: FAIL - Missing required variables\n');
    }
  } catch (error) {
    testResults['Environment Variables'] = 'FAIL';
    console.log('❌ Environment variables: FAIL -', error, '\n');
  }

  // Test 2: Password Hashing
  console.log('=== TEST 2: Password Hashing ===');
  let hashedPassword = '';
  try {
    hashedPassword = await hashPassword(testUser.password);
    console.log('Hash result length:', hashedPassword.length);
    console.log('Hash starts with $2:', hashedPassword.startsWith('$2'));
    
    testResults['Password Hashing'] = 'PASS';
    console.log('✅ Password hashing: PASS\n');
  } catch (error) {
    testResults['Password Hashing'] = 'FAIL';
    console.log('❌ Password hashing: FAIL -', error, '\n');
  }

  // Test 3: Password Verification
  console.log('=== TEST 3: Password Verification ===');
  if (hashedPassword) {
    try {
      const correctVerification = await verifyPassword(testUser.password, hashedPassword);
      const wrongVerification = await verifyPassword('WrongPassword', hashedPassword);
      
      console.log('Correct password verification:', correctVerification);
      console.log('Wrong password verification:', wrongVerification);
      
      if (correctVerification === true && wrongVerification === false) {
        testResults['Password Verification'] = 'PASS';
        console.log('✅ Password verification: PASS\n');
      } else {
        testResults['Password Verification'] = 'FAIL';
        console.log('❌ Password verification: FAIL - Logic error\n');
      }
    } catch (error) {
      testResults['Password Verification'] = 'FAIL';
      console.log('❌ Password verification: FAIL -', error, '\n');
    }
  } else {
    testResults['Password Verification'] = 'SKIP';
    console.log('⏭️ Password verification: SKIP - No hash available\n');
  }

  // Test 4: User Creation
  console.log('=== TEST 4: User Creation ===');
  try {
    const user = await createUser(testUser.email, hashedPassword, testUser.name, testUser.studentId);
    console.log('Created user:', { email: user.email, name: user.name, studentId: user.studentId });
    
    testResults['User Creation'] = 'PASS';
    console.log('✅ User creation: PASS\n');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      testResults['User Creation'] = 'PASS';
      console.log('✅ User creation: PASS (user already exists)\n');
    } else {
      testResults['User Creation'] = 'FAIL';
      console.log('❌ User creation: FAIL -', error, '\n');
    }
  }

  // Test 5: User Retrieval
  console.log('=== TEST 5: User Retrieval ===');
  try {
    const user = await getUserByEmail(testUser.email);
    console.log('Retrieved user:', user ? { email: user.email, name: user.name } : 'null');
    
    if (user) {
      testResults['User Retrieval'] = 'PASS';
      console.log('✅ User retrieval: PASS\n');
    } else {
      testResults['User Retrieval'] = 'FAIL';
      console.log('❌ User retrieval: FAIL - User not found\n');
    }
  } catch (error) {
    testResults['User Retrieval'] = 'FAIL';
    console.log('❌ User retrieval: FAIL -', error, '\n');
  }

  // Test 6: Get All Enrollments (Database Connection Test)
  console.log('=== TEST 6: Database Connection (All Enrollments) ===');
  try {
    const allEnrollments = await getAllEnrollments();
    console.log('Total enrollments in database:', allEnrollments.length);
    console.log('Sample enrollments:', allEnrollments.slice(0, 2));
    
    testResults['Database Connection'] = 'PASS';
    console.log('✅ Database connection: PASS\n');
  } catch (error) {
    testResults['Database Connection'] = 'FAIL';
    console.log('❌ Database connection: FAIL -', error, '\n');
  }

  // Test 7: Class Enrollment
  console.log('=== TEST 7: Class Enrollment ===');
  try {
    await enrollInClass(testUser.email, 'Web Development 101', '1');
    console.log('Enrollment created successfully');
    
    testResults['Class Enrollment'] = 'PASS';
    console.log('✅ Class enrollment: PASS\n');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already enrolled')) {
      testResults['Class Enrollment'] = 'PASS';
      console.log('✅ Class enrollment: PASS (already enrolled)\n');
    } else {
      testResults['Class Enrollment'] = 'FAIL';
      console.log('❌ Class enrollment: FAIL -', error, '\n');
    }
  }

  // Test 8: Get User Enrollments (THE CRITICAL TEST)
  console.log('=== TEST 8: Get User Enrollments (CRITICAL) ===');
  try {
    const userEnrollments = await getUserEnrollments(testUser.email);
    console.log('User enrollments found:', userEnrollments.length);
    console.log('Enrollment details:', userEnrollments);
    
    if (userEnrollments.length > 0) {
      testResults['Get User Enrollments'] = 'PASS';
      console.log('✅ Get user enrollments: PASS\n');
    } else {
      testResults['Get User Enrollments'] = 'FAIL';
      console.log('❌ Get user enrollments: FAIL - No enrollments found despite enrollment creation\n');
    }
  } catch (error) {
    testResults['Get User Enrollments'] = 'FAIL';
    console.log('❌ Get user enrollments: FAIL -', error, '\n');
  }

  // Test 9: Enrollment Status Check
  console.log('=== TEST 9: Enrollment Status Check ===');
  try {
    const isEnrolled = await isUserEnrolledInClass(testUser.email, '1');
    console.log('Is user enrolled in class 1:', isEnrolled);
    
    testResults['Enrollment Status Check'] = isEnrolled ? 'PASS' : 'FAIL';
    console.log(isEnrolled ? '✅ Enrollment status check: PASS\n' : '❌ Enrollment status check: FAIL\n');
  } catch (error) {
    testResults['Enrollment Status Check'] = 'FAIL';
    console.log('❌ Enrollment status check: FAIL -', error, '\n');
  }

  // Test 10: Password Strength Validation
  console.log('=== TEST 10: Password Strength Validation ===');
  try {
    const weakPassword = validatePasswordStrength('weak');
    const strongPassword = validatePasswordStrength('StrongPassword123!');
    
    console.log('Weak password result:', weakPassword);
    console.log('Strong password result:', strongPassword);
    
    if (!weakPassword.isValid && strongPassword.isValid) {
      testResults['Password Strength Validation'] = 'PASS';
      console.log('✅ Password strength validation: PASS\n');
    } else {
      testResults['Password Strength Validation'] = 'FAIL';
      console.log('❌ Password strength validation: FAIL\n');
    }
  } catch (error) {
    testResults['Password Strength Validation'] = 'FAIL';
    console.log('❌ Password strength validation: FAIL -', error, '\n');
  }

  // Final Results Summary
  console.log('=== FINAL TEST RESULTS SUMMARY ===');
  Object.entries(testResults).forEach(([testName, result]) => {
    const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${testName}: ${result}`);
  });

  const passCount = Object.values(testResults).filter(r => r === 'PASS').length;
  const failCount = Object.values(testResults).filter(r => r === 'FAIL').length;
  const skipCount = Object.values(testResults).filter(r => r === 'SKIP').length;
  
  console.log(`\n📊 Results: ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP`);
  
  if (failCount > 0) {
    console.log('\n🔍 FOCUS ON FAILED TESTS TO IDENTIFY THE ISSUE');
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Test run completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test run failed:', error);
      process.exit(1);
    });
}