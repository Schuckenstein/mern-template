// server/src/config/passport.ts

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';
import { AuthProvider, UserRole } from '@shared/types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const setupPassport = (app: Application): void => {
  app.use(passport.initialize());

  // =============================================
  // JWT Strategy
  // =============================================
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  }, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { profile: true }
      });

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  }));

  // =============================================
  // Local Strategy (Email/Password)
  // =============================================
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true }
      });

      if (!user || !user.passwordHash) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // =============================================
  // Google OAuth Strategy
  // =============================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: profile.emails?.[0]?.value },
              { providerId: profile.id, provider: AuthProvider.GOOGLE }
            ]
          },
          include: { profile: true }
        });

        if (user) {
          // Update existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              provider: AuthProvider.GOOGLE,
              providerId: profile.id,
              lastLoginAt: new Date(),
              avatar: profile.photos?.[0]?.value || user.avatar
            },
            include: { profile: true }
          });
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || '',
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatar: profile.photos?.[0]?.value,
              provider: AuthProvider.GOOGLE,
              providerId: profile.id,
              isEmailVerified: true,
              role: UserRole.USER,
              lastLoginAt: new Date(),
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
            include: { profile: true }
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error);
      }
    }));
  }

  // =============================================
  // GitHub OAuth Strategy
  // =============================================
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: profile.emails?.[0]?.value },
              { providerId: profile.id, provider: AuthProvider.GITHUB }
            ]
          },
          include: { profile: true }
        });

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              provider: AuthProvider.GITHUB,
              providerId: profile.id,
              lastLoginAt: new Date(),
              avatar: profile.photos?.[0]?.value || user.avatar
            },
            include: { profile: true }
          });
        } else {
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || '',
              username: profile.username,
              firstName: profile.displayName?.split(' ')[0],
              lastName: profile.displayName?.split(' ').slice(1).join(' '),
              avatar: profile.photos?.[0]?.value,
              provider: AuthProvider.GITHUB,
              providerId: profile.id,
              isEmailVerified: true,
              role: UserRole.USER,
              lastLoginAt: new Date(),
              profile: {
                create: {
                  preferences: {
                    theme: 'system',
                    language: 'en',
                    timezone: 'UTC',
                    emailNotifications: true,
                    pushNotifications: true
                  },
                  socialLinks: {
                    github: profile.profileUrl
                  }
                }
              }
            },
            include: { profile: true }
          });
        }

        return done(null, user);
      } catch (error) {
        logger.error('GitHub OAuth error:', error);
        return done(error);
      }
    }));
  }

  // =============================================
  // Serialize/Deserialize User
  // =============================================
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { profile: true }
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

// =============================================