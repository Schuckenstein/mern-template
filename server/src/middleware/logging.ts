// server/src/middleware/logging.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    };

    if (res.statusCode >= 400) {
      logger.error('HTTP Error:', logData);
    } else if (duration > 1000) {
      logger.warn('Slow Request:', logData);
    } else {
      logger.info('HTTP Request:', logData);
    }
  });

  next();
};

// =============================================