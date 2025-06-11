// server/src/controllers/debugController.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { cache } from '../config/redis';
import { sendResponse } from '../utils/helpers';
import { fileService } from '../services/fileService';

const prisma = new PrismaClient();

class DebugController {
  // =============================================
  // Health Check
  // =============================================
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: false,
        email: false
      };

      // Check database connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        health.database = true;
      } catch (error) {
        logger.error('Database health check failed', error);
      }

      // Check email service
      try {
        health.email = await emailService.testConnection();
      } catch (error) {
        logger.error('Email health check failed', error);
      }

      const statusCode = health.database ? 200 : 503;
      sendResponse(res, statusCode, true, 'Health check completed', health);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // System Information
  // =============================================
  async getSystemInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [userStats, fileStats] = await Promise.all([
        this.getUserStats(),
        fileService.getFileStats()
      ]);

      const systemInfo = {
        server: {
          status: 'online',
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        },
        database: {
          status: 'connected',
          name: 'mongodb',
          collections: await this.getCollectionInfo()
        },
        auth: userStats,
        uploads: fileStats,
        performance: {
          requestCount: 0, // You might want to implement request counting
          averageResponseTime: 0,
          errorRate: 0
        }
      };

      sendResponse(res, 200, true, 'System info retrieved', systemInfo);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Database Information
  // =============================================
  async getDatabaseInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const collections = await this.getCollectionInfo();
      
      const dbInfo = {
        status: 'connected',
        collections,
        totalDocuments: collections.reduce((sum, col) => sum + col.documentCount, 0)
      };

      sendResponse(res, 200, true, 'Database info retrieved', dbInfo);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Query Database
  // =============================================
  async queryDatabase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { collection, query = {}, limit = 10 } = req.body;

      if (!collection) {
        throw new ApiError('Collection name is required', 400, 'VALIDATION_ERROR');
      }

      // Map collection names to Prisma models
      const modelMap: Record<string, any> = {
        users: prisma.user,
        files: prisma.file,
        emailJobs: prisma.emailJob,
        notifications: prisma.notification
      };

      const model = modelMap[collection];
      if (!model) {
        throw new ApiError('Invalid collection name', 400, 'VALIDATION_ERROR');
      }

      const results = await model.findMany({
        where: query,
        take: Math.min(limit, 100) // Limit to prevent overload
      });

      sendResponse(res, 200, true, 'Query executed successfully', { results });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Clear Cache
  // =============================================
  async clearCache(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await cache.flush();
      sendResponse(res, 200, true, 'Cache cleared successfully');
      
      logger.info('Cache cleared by admin', { adminId: req.user!.id });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Test Email
  // =============================================
  async testEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { to, subject = 'Test Email', message = 'This is a test email.' } = req.body;

      if (!to) {
        throw new ApiError('Recipient email is required', 400, 'VALIDATION_ERROR');
      }

      const success = await emailService.sendEmail({
        to,
        subject,
        html: `<p>${message}</p>`,
        text: message
      });

      if (success) {
        sendResponse(res, 200, true, 'Test email sent successfully');
      } else {
        throw new ApiError('Failed to send test email', 500, 'EMAIL_ERROR');
      }

      logger.info('Test email sent by admin', { 
        adminId: req.user!.id, 
        recipient: to 
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Get Logs
  // =============================================
  async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { level = 'all', limit = 100 } = req.query as any;

      // This is a simplified implementation
      // In a real app, you might read from log files or a logging service
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Server started',
          metadata: {}
        },
        {
          timestamp: new Date().toISOString(),
          level: 'debug',
          message: 'Database connected',
          metadata: {}
        }
      ];

      const filteredLogs = level === 'all' 
        ? logs 
        : logs.filter(log => log.level === level);

      sendResponse(res, 200, true, 'Logs retrieved successfully', { 
        logs: filteredLogs.slice(0, parseInt(limit)) 
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Helper Methods
  // =============================================
  private async getUserStats() {
    const [totalUsers, activeUsers, verifiedUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers
    };
  }

  private async getCollectionInfo() {
    const [userCount, fileCount, emailJobCount, notificationCount] = await Promise.all([
      prisma.user.count(),
      prisma.file.count(),
      prisma.emailJob.count(),
      prisma.notification.count()
    ]);

    return [
      { name: 'users', documentCount: userCount },
      { name: 'files', documentCount: fileCount },
      { name: 'emailJobs', documentCount: emailJobCount },
      { name: 'notifications', documentCount: notificationCount }
    ];
  }
}

export const debugController = new DebugController();