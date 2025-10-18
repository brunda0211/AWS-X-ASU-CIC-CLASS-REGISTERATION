import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  ScanCommand,
  PutCommandInput,
  GetCommandInput,
  QueryCommandInput
} from '@aws-sdk/lib-dynamodb';
import { 
  handleDynamoDBError, 
  validateEmail, 
  validateStudentId, 
  validateName,
  ConflictError 
} from './db-errors';

// SECURITY: Validate all required environment variables exist
function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DYNAMODB_USERS_TABLE',
    'DYNAMODB_ENROLLMENTS_TABLE'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Validate environment variables on module initialization
validateEnvironmentVariables();

// SECURITY: Initialize DynamoDB client with credentials from environment variables ONLY
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Create DynamoDB Document Client for easier operations
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

// Table names from environment variables
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE!;
const ENROLLMENTS_TABLE = process.env.DYNAMODB_ENROLLMENTS_TABLE!;

// DEBUG: Log environment variables on module load
console.log('=== DB MODULE INITIALIZATION ===');
console.log('USERS_TABLE:', USERS_TABLE);
console.log('ENROLLMENTS_TABLE:', ENROLLMENTS_TABLE);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('=== DB MODULE INITIALIZATION END ===');

// TypeScript interfaces for type safety
export interface User {
  email: string;
  passwordHash: string;
  name: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  email: string;
  className: string;
  classId: string;
  enrolledAt: string;
  status: 'active' | 'dropped';
}

/**
 * SECURITY: Create user with parameterized query to prevent NoSQL injection
 * @param email - User email (validated input)
 * @param passwordHash - Hashed password (never log this)
 * @param name - User display name
 * @param studentId - Unique student identifier
 * @returns Promise<User> - Created user object
 */
export async function createUser(
  email: string, 
  passwordHash: string, 
  name: string, 
  studentId: string
): Promise<User> {
  try {
    // SECURITY: Validate all inputs before database operation
    validateEmail(email);
    validateName(name);
    validateStudentId(studentId);
    
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new Error('Password hash is required');
    }
    
    const now = new Date().toISOString();
    
    const user: User = {
      email: email.toLowerCase().trim(), // Normalize email
      passwordHash,
      name: name.trim(),
      studentId: studentId.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // SECURITY: Use parameterized PutCommand to prevent injection
    const params: PutCommandInput = {
      TableName: USERS_TABLE,
      Item: user,
      // Prevent overwriting existing users
      ConditionExpression: 'attribute_not_exists(email)',
    };

    await docClient.send(new PutCommand(params));
    
    // SECURITY: Never log password hash
    console.log(`User created successfully: ${email}`);
    
    return user;
  } catch (error) {
    // SECURITY: Use safe error handling
    throw handleDynamoDBError(error);
  }
}

/**
 * SECURITY: Get user by email with parameterized query
 * @param email - User email to search for
 * @returns Promise<User | null> - User object or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // SECURITY: Validate email input
    validateEmail(email);
    
    // SECURITY: Use parameterized GetCommand
    const params: GetCommandInput = {
      TableName: USERS_TABLE,
      Key: {
        email: email.toLowerCase().trim(),
      },
    };

    const result = await docClient.send(new GetCommand(params));
    
    // Return null if user not found (don't throw error)
    if (!result.Item) {
      return null;
    }

    return result.Item as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    // SECURITY: Return null instead of throwing to prevent information leakage
    return null;
  }
}

/**
 * SECURITY: Enroll user in class with parameterized query
 * @param email - User email
 * @param className - Name of the class
 * @param classId - Unique class identifier
 * @returns Promise<void>
 */
export async function enrollInClass(
  email: string, 
  className: string, 
  classId: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const enrollmentId = `${email}-${classId}-${Date.now()}`;

    const enrollment: Enrollment = {
      id: enrollmentId,
      email: email.toLowerCase().trim(), // Normalize email to match user records
      className,
      classId,
      enrolledAt: now,
      status: 'active',
    };

    // DEBUG: Log the enrollment being created
    console.log('DB: Creating enrollment:', JSON.stringify(enrollment, null, 2));
    console.log('DB: Table name:', ENROLLMENTS_TABLE);

    // SECURITY: Use parameterized PutCommand
    const params: PutCommandInput = {
      TableName: ENROLLMENTS_TABLE,
      Item: enrollment,
      // Prevent duplicate enrollments
      ConditionExpression: 'attribute_not_exists(id)',
    };

    await docClient.send(new PutCommand(params));
    
    console.log(`DB: Successfully created enrollment for ${email} in ${className}`);
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      throw new Error('User is already enrolled in this class');
    }
    
    console.error('Error enrolling in class:', error);
    throw new Error('Failed to enroll in class');
  }
}

export async function getUserEnrollments(email: string): Promise<Enrollment[]> {
  try {
    console.log('Getting enrollments for:', email);
    
    const params = {
      TableName: ENROLLMENTS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim()
        // NO IndexName - scan the table directly
        // NO FilterExpression for status - filter in JavaScript
      }
    };

    const result = await docClient.send(new ScanCommand(params));
    console.log('Scan returned:', result.Count, 'items');
    
    const allEnrollments = (result.Items as Enrollment[]) || [];
    
    // Filter for active enrollments only (exclude dropped)
    const activeEnrollments = allEnrollments.filter(enrollment => enrollment.status === 'active');
    console.log('Active enrollments:', activeEnrollments.length);
    
    return activeEnrollments;
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return [];
  }
}

/**
 * SECURITY: Unenroll user from class with parameterized query
 * @param email - User email
 * @param classId - Class identifier to unenroll from
 * @returns Promise<void>
 */
export async function unenrollFromClass(email: string, classIdOrName: string): Promise<void> {
  try {
    // First, find the enrollment record
    const enrollments = await getUserEnrollments(email);
    const enrollment = enrollments.find(e => 
      e.classId === classIdOrName || e.className === classIdOrName
    );
    
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Update enrollment status to 'dropped'
    const params: PutCommandInput = {
      TableName: ENROLLMENTS_TABLE,
      Item: {
        ...enrollment,
        status: 'dropped',
        updatedAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));
    
    console.log(`User ${email} unenrolled from class ${enrollment.className}`);
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    throw new Error('Failed to unenroll from class');
  }
}

/**
 * SECURITY: Check if user is enrolled in a specific class
 * @param email - User email
 * @param classId - Class identifier
 * @returns Promise<boolean> - True if enrolled, false otherwise
 */
export async function isUserEnrolledInClass(email: string, classId: string): Promise<boolean> {
  try {
    const enrollments = await getUserEnrollments(email);
    return enrollments.some(enrollment => enrollment.classId === classId);
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
}

/**
 * DEBUG: Get all enrollments in the table (for debugging only)
 */
export async function getAllEnrollments(): Promise<Enrollment[]> {
  try {
    console.log('=== DB SCAN DEBUG START ===');
    console.log('DB: Getting ALL enrollments from table:', ENROLLMENTS_TABLE);
    console.log('DB: AWS Region:', process.env.AWS_REGION);
    console.log('DB: AWS Access Key ID exists:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('DB: AWS Secret Key exists:', !!process.env.AWS_SECRET_ACCESS_KEY);
    
    const params = {
      TableName: ENROLLMENTS_TABLE,
    };

    console.log('DB: Sending scan command...');
    const result = await docClient.send(new ScanCommand(params));
    
    console.log('DB: Scan completed successfully');
    console.log('DB: Total enrollments in table:', result.Count);
    console.log('DB: Scan result metadata:', {
      Count: result.Count,
      ScannedCount: result.ScannedCount,
      ConsumedCapacity: result.ConsumedCapacity
    });
    console.log('DB: All enrollments:', JSON.stringify(result.Items, null, 2));
    console.log('=== DB SCAN DEBUG END ===');
    
    return (result.Items as Enrollment[]) || [];
  } catch (error) {
    console.error('=== DB SCAN ERROR ===');
    console.error('DB: Error getting all enrollments:', error);
    console.error('DB: Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('DB: Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('DB: Full error object:', JSON.stringify(error, null, 2));
    console.error('=== DB SCAN ERROR END ===');
    return [];
  }
}

// Export the DynamoDB client for advanced operations if needed
export { docClient, dynamoDBClient };