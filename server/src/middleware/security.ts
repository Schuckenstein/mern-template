// server/src/middleware/security.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

// XSS Protection
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS protection by sanitizing inputs
  const sanitizeString = (str: string): string => {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

// CSRF Protection (for non-API routes)
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for API routes and GET requests
  if (req.path.startsWith('/api') || req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._token;
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    throw new ApiError('Invalid CSRF token', 403, 'SECURITY_ERROR');
  }

  next();
};