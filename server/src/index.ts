// server/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authenticateToken } from './middleware/auth';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { setupPassport } from './config/passport';
import { setupGraphQL } from './config/graphql';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import fileRoutes from './routes/files';
import debugRoutes from './routes/debug';
import { setupWebSocket } from './services/websocket';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server for Socket.IO
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ==============================================
// Global Middleware Setup
// ==============================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

app.use(cors(corsOptions));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(rateLimiter);

// Initialize Passport
setupPassport(app);

// ==============================================
// Health Check Endpoint
// ==============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ==============================================
// API Routes
// ==============================================
const apiRouter = express.Router();

// Public routes
apiRouter.use('/auth', authRoutes);

// Protected routes
apiRouter.use('/users', authenticateToken, userRoutes);
apiRouter.use('/files', authenticateToken, fileRoutes);

// Debug routes (conditionally enabled)
if (NODE_ENV === 'development' || process.env.DEBUG_ENABLED === 'true') {
  apiRouter.use('/debug', debugRoutes);
}

app.use('/api', apiRouter);

// ==============================================
// GraphQL Setup (Optional)
// ==============================================
if (process.env.ENABLE_GRAPHQL === 'true') {
  setupGraphQL(app);
}

// ==============================================
// Static Files
// ==============================================
app.use('/uploads', express.static('uploads'));

// ==============================================
// Catch-all Route for SPA
// ==============================================
app.get('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ==============================================
// Error Handling Middleware
// ==============================================
app.use(errorHandler);

// ==============================================
// WebSocket Setup
// ==============================================
setupWebSocket(io);

// ==============================================
// Graceful Shutdown
// ==============================================
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==============================================
// Database Connection & Server Start
// ==============================================
const startServer = async () => {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connected successfully');
    
    // Initialize Redis connection
    if (process.env.REDIS_URL) {
      await initializeRedis();
      logger.info('Redis connected successfully');
    }
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`🌐 CORS enabled for: ${process.env.CORS_ORIGINS}`);
      logger.info(`🔗 WebSocket server ready`);
      
      if (NODE_ENV === 'development') {
        logger.info(`🛠️  Debug dashboard: http://localhost:8080`);
        logger.info(`📊 API docs: http://localhost:${PORT}/api`);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Start the server
startServer();