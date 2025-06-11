// server/src/types/index.ts
/**
 * Server-specific types that extend or complement shared types
 */

import { Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { User, UserRole } from '@shared/types'

// =============================================
// Request/Response Types
// =============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    stack?: string
  }
  meta?: PaginationMeta
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

// =============================================
// JWT Types
// =============================================

export interface TokenPayload extends JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string
  tokenId: string
}

// =============================================
// Middleware Types
// =============================================

export interface RateLimitConfig {
  windowMs: number
  max: number
  message: string
  statusCode: number
  headers: boolean
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  destination?: string
  filename?: (file: Express.Multer.File) => string
}

// =============================================
// Service Types
// =============================================

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  variables?: Record<string, any>
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
  cid?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface FileUploadResult {
  id: string
  originalName: string
  filename: string
  mimeType: string
  size: number
  url: string
  publicId?: string
}

export interface ImageProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  crop?: boolean
}

// =============================================
// Database Types
// =============================================

export interface QueryOptions {
  where?: Record<string, any>
  select?: Record<string, boolean>
  include?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  skip?: number
  take?: number
}

export interface DatabaseStats {
  totalDocuments: number
  collections: CollectionStats[]
  size: number
  avgObjSize: number
  indexes: number
}

export interface CollectionStats {
  name: string
  count: number
  size: number
  avgObjSize: number
  indexes: number
}

// =============================================
// Monitoring Types
// =============================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: ServiceHealth[]
}

export interface ServiceHealth {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  lastCheck: string
  error?: string
}

export interface PerformanceMetrics {
  cpuUsage: NodeJS.CpuUsage
  memoryUsage: NodeJS.MemoryUsage
  requestCount: number
  averageResponseTime: number
  errorRate: number
  activeConnections: number
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: string
  meta?: Record<string, any>
  stack?: string
}

// =============================================
// WebSocket Types
// =============================================

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  userId?: string
}

export interface SocketUser {
  userId: string
  socketId: string
  connectedAt: string
  lastActivity: string
}

// =============================================
// Cache Types
// =============================================

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl: number
  createdAt: string
  accessCount: number
}

export interface CacheStats {
  totalKeys: number
  hitRate: number
  missRate: number
  totalMemory: number
  usedMemory: number
}

// =============================================
// Configuration Types
// =============================================

export interface DatabaseConfig {
  url: string
  maxConnections?: number
  timeout?: number
  ssl?: boolean
  logging?: boolean
}

export interface RedisConfig {
  url: string
  keyPrefix?: string
  retryDelayOnFailover?: number
  maxRetriesPerRequest?: number
}

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from?: string
}

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder?: string
}

export interface ServerConfig {
  port: number
  host: string
  cors: {
    origin: string | string[]
    credentials: boolean
    methods: string[]
  }
  rateLimit: RateLimitConfig
  upload: UploadOptions
}

// =============================================
// Error Types
// =============================================

export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  path?: string
  method?: string
  timestamp: string
}

// =============================================
// Audit Types
// =============================================

export interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
  timestamp: string
  ip?: string
  userAgent?: string
}

// =============================================
// Environment Types
// =============================================

export interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: string
  DATABASE_URL: string
  REDIS_URL?: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  JWT_EXPIRES_IN: string
  JWT_REFRESH_EXPIRES_IN: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  EMAIL_HOST?: string
  EMAIL_PORT?: string
  EMAIL_USER?: string
  EMAIL_PASS?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  CLIENT_URL: string
  DEBUG_ENABLED?: string
  LOG_LEVEL?: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnv {}
  }
}

// =============================================
// Utility Types
// =============================================

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]