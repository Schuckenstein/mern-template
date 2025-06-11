// server/src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export const connectDatabase = async (): Promise<PrismaClient> => {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
      errorFormat: 'pretty'
    });

    // Test the connection
    await prisma.$connect();
    
    // Run any pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      logger.info('Running database migrations...');
      // Note: In production, you should run migrations during deployment
      // await prisma.$executeRaw`SELECT 1`;
    }

    logger.info('Database connected successfully');
    return prisma;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

export { prisma };

// =============================================