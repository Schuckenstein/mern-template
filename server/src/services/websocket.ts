// server/src/services/websocket.ts

import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { TokenPayload, WebSocketMessage, WebSocketMessageType } from '@shared/types'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
}

class WebSocketService {
  private io: SocketIOServer
  private connectedUsers: Map<string, string[]> = new Map() // userId -> socketIds

  constructor(io: SocketIOServer) {
    this.io = io
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
        
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true }
        })

        if (!user) {
          return next(new Error('Authentication error: User not found'))
        }

        socket.userId = user.id
        socket.userEmail = user.email
        
        next()
      } catch (error) {
        next(new Error('Authentication error: Invalid token'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!
      
      logger.info('User connected via WebSocket', {
        userId,
        socketId: socket.id,
        userEmail: socket.userEmail
      })

      // Track connected user
      this.addUserConnection(userId, socket.id)

      // Send connection confirmation
      socket.emit('connected', {
        message: 'WebSocket connection established',
        socketId: socket.id
      })

      // Broadcast user connection to other users (if needed)
      this.broadcastMessage({
        type: WebSocketMessageType.USER_CONNECTED,
        payload: { userId, userEmail: socket.userEmail },
        timestamp: new Date()
      }, userId)

      // Handle custom events
      socket.on('message', (data) => {
        this.handleMessage(socket, data)
      })

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId)
        logger.info('User joined room', { userId, socketId: socket.id, roomId })
      })

      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId)
        logger.info('User left room', { userId, socketId: socket.id, roomId })
      })

      socket.on('disconnect', (reason) => {
        logger.info('User disconnected from WebSocket', {
          userId,
          socketId: socket.id,
          reason
        })

        // Remove user connection
        this.removeUserConnection(userId, socket.id)

        // Broadcast user disconnection
        this.broadcastMessage({
          type: WebSocketMessageType.USER_DISCONNECTED,
          payload: { userId, userEmail: socket.userEmail },
          timestamp: new Date()
        }, userId)
      })
    })
  }

  private handleMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const message: WebSocketMessage = {
        type: data.type,
        payload: data.payload,
        timestamp: new Date(),
        userId: socket.userId
      }

      logger.info('WebSocket message received', {
        type: message.type,
        userId: socket.userId,
        socketId: socket.id
      })

      // Handle different message types
      switch (message.type) {
        case WebSocketMessageType.NOTIFICATION:
          this.handleNotification(socket, message)
          break
        case WebSocketMessageType.DEBUG_UPDATE:
          this.handleDebugUpdate(socket, message)
          break
        default:
          logger.warn('Unknown WebSocket message type', { type: message.type })
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', error)
      socket.emit('error', { message: 'Failed to process message' })
    }
  }

  private handleNotification(socket: AuthenticatedSocket, message: WebSocketMessage) {
    // Broadcast notification to user's other sessions
    this.sendToUser(socket.userId!, message)
  }

  private handleDebugUpdate(socket: AuthenticatedSocket, message: WebSocketMessage) {
    // Broadcast debug update to admin users only
    this.broadcastToAdmins(message)
  }

  // Public methods for sending messages
  sendToUser(userId: string, message: WebSocketMessage) {
    const userSockets = this.connectedUsers.get(userId)
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('message', message)
      })
    }
  }

  sendToSocket(socketId: string, message: WebSocketMessage) {
    this.io.to(socketId).emit('message', message)
  }

  broadcastMessage(message: WebSocketMessage, excludeUserId?: string) {
    const event = 'message'
    
    if (excludeUserId) {
      // Get all socket IDs to exclude
      const excludeSockets = this.connectedUsers.get(excludeUserId) || []
      
      // Broadcast to all sockets except excluded user's sockets
      this.io.emit(event, message)
      excludeSockets.forEach(socketId => {
        this.io.to(socketId).emit('exclude')
      })
    } else {
      this.io.emit(event, message)
    }
  }

  async broadcastToAdmins(message: WebSocketMessage) {
    try {
      // Get admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })

      // Send to all admin users
      adminUsers.forEach(admin => {
        this.sendToUser(admin.id, message)
      })
    } catch (error) {
      logger.error('Failed to broadcast to admins', error)
    }
  }

  sendToRoom(roomId: string, message: WebSocketMessage) {
    this.io.to(roomId).emit('message', message)
  }

  // Notification helpers
  async sendNotification(userId: string, notification: {
    type: string
    title: string
    message: string
    data?: any
  }) {
    try {
      // Store notification in database
      const dbNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          data: notification.data || null
        }
      })

      // Send via WebSocket
      this.sendToUser(userId, {
        type: WebSocketMessageType.NOTIFICATION,
        payload: dbNotification,
        timestamp: new Date()
      })
    } catch (error) {
      logger.error('Failed to send notification', error)
    }
  }

  // Connection management
  private addUserConnection(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId) || []
    userSockets.push(socketId)
    this.connectedUsers.set(userId, userSockets)
  }

  private removeUserConnection(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId) || []
    const updatedSockets = userSockets.filter(id => id !== socketId)
    
    if (updatedSockets.length > 0) {
      this.connectedUsers.set(userId, updatedSockets)
    } else {
      this.connectedUsers.delete(userId)
    }
  }

  // Statistics
  getConnectedUsersCount(): number {
    return this.connectedUsers.size
  }

  getConnectedSocketsCount(): number {
    return this.io.engine.clientsCount
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys())
  }
}

export const setupWebSocket = (io: SocketIOServer): WebSocketService => {
  const wsService = new WebSocketService(io)
  
  // Make service globally available
  global.wsService = wsService
  
  return wsService
}