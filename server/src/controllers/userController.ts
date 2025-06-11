// server/src/controllers/userController.ts

import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { fileService } from '../services/fileService';
import { sendResponse } from '../utils/helpers';

const prisma = new PrismaClient();

class UserController {
  // =============================================
  // Get Profile
  // =============================================
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { profile: true },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isEmailVerified: true,
          role: true,
          provider: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          profile: true
        }
      });

      if (!user) {
        throw new ApiError('User not found', 404, 'NOT_FOUND_ERROR');
      }

      sendResponse(res, 200, true, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Update Profile
  // =============================================
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const {
        firstName,
        lastName,
        username,
        bio,
        phoneNumber,
        dateOfBirth,
        address,
        preferences,
        socialLinks
      } = req.body;

      // Check if username is already taken
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            id: { not: userId }
          }
        });

        if (existingUser) {
          throw new ApiError('Username already taken', 409, 'DUPLICATE_ERROR');
        }
      }

      // Update user basic info
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          username
        }
      });

      // Update or create profile
      const profile = await prisma.userProfile.upsert({
        where: { userId },
        update: {
          bio,
          phoneNumber,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          preferences: preferences || undefined,
          socialLinks
        },
        create: {
          userId,
          bio,
          phoneNumber,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          preferences: preferences || {
            theme: 'system',
            language: 'en',
            timezone: 'UTC',
            emailNotifications: true,
            pushNotifications: true
          },
          socialLinks
        }
      });

      sendResponse(res, 200, true, 'Profile updated successfully', { user, profile });
      
      logger.info('User profile updated', { userId });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Upload Avatar
  // =============================================
  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        throw new ApiError('No file uploaded', 400, 'VALIDATION_ERROR');
      }

      // Upload file
      const uploadedFile = await fileService.uploadFile(file, userId, {
        resize: { width: 400, height: 400, quality: 90 }
      });

      // Update user avatar
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadedFile.url }
      });

      sendResponse(res, 200, true, 'Avatar uploaded successfully', { 
        avatarUrl: uploadedFile.url,
        user 
      });

      logger.info('Avatar uploaded', { userId, fileId: uploadedFile.id });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Change Password
  // =============================================
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true }
      });

      if (!user || !user.passwordHash) {
        throw new ApiError('User not found or no password set', 404, 'NOT_FOUND_ERROR');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new ApiError('Current password is incorrect', 400, 'VALIDATION_ERROR');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      // Revoke all refresh tokens to force re-login on other devices
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true }
      });

      sendResponse(res, 200, true, 'Password changed successfully');

      logger.info('Password changed', { userId });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Delete Account
  // =============================================
  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // Delete user (cascade deletes profile, tokens, etc.)
      await prisma.user.delete({
        where: { id: userId }
      });

      sendResponse(res, 200, true, 'Account deleted successfully');

      logger.info('Account deleted', { userId });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Admin: Get Users
  // =============================================
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, role, verified } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (role) {
        where.role = role;
      }

      if (verified !== undefined) {
        where.isEmailVerified = verified === 'true';
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isEmailVerified: true,
            role: true,
            provider: true,
            lastLoginAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      const meta = {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: skip + limit < total,
        hasPreviousPage: page > 1
      };

      sendResponse(res, 200, true, 'Users retrieved successfully', { users }, meta);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Admin: Get User by ID
  // =============================================
  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isEmailVerified: true,
          role: true,
          provider: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          profile: true
        }
      });

      if (!user) {
        throw new ApiError('User not found', 404, 'NOT_FOUND_ERROR');
      }

      sendResponse(res, 200, true, 'User retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Admin: Update User Role
  // =============================================
  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      sendResponse(res, 200, true, 'User role updated successfully', { user });

      logger.info('User role updated', { 
        adminId: req.user!.id, 
        targetUserId: userId, 
        newRole: role 
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Admin: Ban User
  // =============================================
  async banUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true }
      });

      // You might want to add a 'banned' field to your user model
      // For now, we'll just revoke tokens

      sendResponse(res, 200, true, 'User banned successfully');

      logger.info('User banned', { 
        adminId: req.user!.id, 
        targetUserId: userId 
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Admin: Unban User
  // =============================================
  async unbanUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Implementation depends on how you handle bans
      // This is a placeholder

      sendResponse(res, 200, true, 'User unbanned successfully');

      logger.info('User unbanned', { 
        adminId: req.user!.id, 
        targetUserId: userId 
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();