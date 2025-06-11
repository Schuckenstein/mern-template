// server/src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AuthProvider, UserRole } from '@shared/types';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

class AuthController {
  // =============================================
  // Register
  // =============================================
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, username } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            ...(username ? [{ username }] : [])
          ]
        }
      });

      if (existingUser) {
        throw new ApiError('User already exists', 409, 'DUPLICATE_ERROR');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          firstName,
          lastName,
          passwordHash,
          emailVerifyToken,
          provider: AuthProvider.EMAIL,
          role: UserRole.USER,
          profile: {
            create: {
              preferences: {
                theme: 'system',
                language: 'en',
                timezone: 'UTC',
                emailNotifications: true,
                pushNotifications: true
              }
            }
          }
        },
        include: {
          profile: true
        }
      });

      // Send verification email
      if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
        await emailService.sendVerificationEmail(user.email, emailVerifyToken);
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Remove sensitive data
      const { passwordHash, emailVerifyToken: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

      logger.info(`New user registered: ${user.email}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Login
  // =============================================
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, rememberMe } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true }
      });

      if (!user || !user.passwordHash) {
        throw new ApiError('Invalid email or password', 401, 'AUTHENTICATION_ERROR');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new ApiError('Invalid email or password', 401, 'AUTHENTICATION_ERROR');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      const expiresAt = rememberMe 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // 7 days

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt
        }
      });

      // Remove sensitive data
      const { passwordHash, emailVerifyToken, ...userResponse } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

      logger.info(`User logged in: ${user.email}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Logout
  // =============================================
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (refreshToken) {
        // Revoke refresh token
        await prisma.refreshToken.updateMany({
          where: { token: refreshToken },
          data: { isRevoked: true }
        });
      }

      // Clear cookies
      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      res.json({
        success: true,
        message: 'Logout successful'
      });

      logger.info(`User logged out: ${req.user?.email}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Refresh Token
  // =============================================
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw new ApiError('Refresh token required', 401, 'AUTHENTICATION_ERROR');
      }

      // Verify refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new ApiError('Invalid refresh token', 401, 'AUTHENTICATION_ERROR');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role
      );
      const newRefreshToken = this.generateRefreshToken(tokenRecord.user.id);

      // Revoke old token and create new one
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true }
      });

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: tokenRecord.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Email Verification
  // =============================================
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      const user = await prisma.user.findFirst({
        where: { emailVerifyToken: token }
      });

      if (!user) {
        throw new ApiError('Invalid verification token', 400, 'VALIDATION_ERROR');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifyToken: null
        }
      });

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

      logger.info(`Email verified: ${user.email}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Resend Verification
  // =============================================
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new ApiError('User not found', 404, 'NOT_FOUND_ERROR');
      }

      if (user.isEmailVerified) {
        throw new ApiError('Email already verified', 400, 'VALIDATION_ERROR');
      }

      const emailVerifyToken = crypto.randomBytes(32).toString('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyToken }
      });

      await emailService.sendVerificationEmail(user.email, emailVerifyToken);

      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Forgot Password
  // =============================================
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal whether user exists
        res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Reset Password
  // =============================================
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() }
        }
      });

      if (!user) {
        throw new ApiError('Invalid or expired reset token', 400, 'VALIDATION_ERROR');
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true }
      });

      res.json({
        success: true,
        message: 'Password reset successful'
      });

      logger.info(`Password reset for user: ${user.email}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // OAuth Callback
  // =============================================
  async oauthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as any;

      if (!user) {
        throw new ApiError('Authentication failed', 401, 'AUTHENTICATION_ERROR');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Redirect to client with tokens
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Get Current User
  // =============================================
  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
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

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Helper Methods
  // =============================================
  private generateAccessToken(userId: string, email: string, role: UserRole): string {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, tokenId: crypto.randomBytes(16).toString('hex') },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }
}

export const authController = new AuthController();