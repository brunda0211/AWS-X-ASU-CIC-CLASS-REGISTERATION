/**
 * Database initialization script for development
 * This script creates the required DynamoDB tables with proper indexes
 * 
 * SECURITY NOTE: This is for development only. In production, tables should be
 * created through Infrastructure as Code (Terraform, CloudFormation, etc.)
 */

import { 
  CreateTableCommand, 
  DescribeTableCommand,
  CreateTableCommandInput,
  BillingMode,
  KeyType,
  AttributeDefinition,
  GlobalSecondaryIndex,
  ProjectionType
} from '@aws-sdk/client-dynamodb';
import { dynamoDBClient } from './db';

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE!;
const ENROLLMENTS_TABLE = process.env.DYNAMODB_ENROLLMENTS_TABLE!;

/**
 * Check if a table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoDBClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create Users table with email as primary key
 */
async function createUsersTable(): Promise<void> {
  if (await tableExists(USERS_TABLE)) {
    console.log(`Table ${USERS_TABLE} already exists`);
    return;
  }

  const params: CreateTableCommandInput = {
    TableName: USERS_TABLE,
    KeySchema: [
      {
        AttributeName: 'email',
        KeyType: KeyType.HASH, // Partition key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'email',
        AttributeType: 'S', // String
      },
      {
        AttributeName: 'studentId',
        AttributeType: 'S', // String
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudentIdIndex',
        KeySchema: [
          {
            AttributeName: 'studentId',
            KeyType: KeyType.HASH,
          },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
      },
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST, // On-demand billing for development
  };

  try {
    await dynamoDBClient.send(new CreateTableCommand(params));
    console.log(`Created table: ${USERS_TABLE}`);
  } catch (error) {
    console.error(`Error creating table ${USERS_TABLE}:`, error);
    throw error;
  }
}

/**
 * Create Enrollments table with composite primary key
 */
async function createEnrollmentsTable(): Promise<void> {
  if (await tableExists(ENROLLMENTS_TABLE)) {
    console.log(`Table ${ENROLLMENTS_TABLE} already exists`);
    return;
  }

  const params: CreateTableCommandInput = {
    TableName: ENROLLMENTS_TABLE,
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: KeyType.HASH, // Partition key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S', // String
      },
      {
        AttributeName: 'email',
        AttributeType: 'S', // String
      },
      {
        AttributeName: 'classId',
        AttributeType: 'S', // String
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          {
            AttributeName: 'email',
            KeyType: KeyType.HASH,
          },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
      },
      {
        IndexName: 'ClassIdIndex',
        KeySchema: [
          {
            AttributeName: 'classId',
            KeyType: KeyType.HASH,
          },
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
      },
    ],
    BillingMode: BillingMode.PAY_PER_REQUEST, // On-demand billing for development
  };

  try {
    await dynamoDBClient.send(new CreateTableCommand(params));
    console.log(`Created table: ${ENROLLMENTS_TABLE}`);
  } catch (error) {
    console.error(`Error creating table ${ENROLLMENTS_TABLE}:`, error);
    throw error;
  }
}

/**
 * Initialize all required tables
 */
export async function initializeTables(): Promise<void> {
  try {
    console.log('Initializing DynamoDB tables...');
    
    await createUsersTable();
    await createEnrollmentsTable();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Run initialization if this file is executed directly
 */
if (require.main === module) {
  initializeTables()
    .then(() => {
      console.log('Tables initialized successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize tables:', error);
      process.exit(1);
    });
}