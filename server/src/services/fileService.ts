// server/src/services/fileService.ts

import multer from 'multer'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import fs from 'fs/promises'
import { PrismaClient } from '@prisma/client'
import { FileUpload } from '@shared/types'
import { logger } from '../utils/logger'
import { generateUniqueFilename, formatBytes } from '../utils/helpers'

const prisma = new PrismaClient()

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
}

interface UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  resize?: {
    width?: number
    height?: number
    quality?: number
  }
}

class FileService {
  private uploadDir = path.join(process.cwd(), 'uploads')

  constructor() {
    this.ensureUploadDirectory()
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
      logger.info('Created uploads directory')
    }
  }

  // Multer configuration for file uploads
  getMulterConfig(options: UploadOptions = {}) {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        await this.ensureUploadDirectory()
        cb(null, this.uploadDir)
      },
      filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename(file.originalname)
        cb(null, uniqueName)
      }
    })

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = options.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`))
      }
    }

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
      }
    })
  }

  // Upload file and save to database
  async uploadFile(file: Express.Multer.File, userId: string, options: UploadOptions = {}): Promise<FileUpload> {
    try {
      let filePath = file.path
      let fileUrl: string
      let publicId: string | undefined

      // Process image if needed
      if (file.mimetype.startsWith('image/') && options.resize) {
        filePath = await this.processImage(file.path, options.resize)
      }

      // Upload to cloud storage if configured
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudinaryResult = await this.uploadToCloudinary(filePath, file.mimetype)
        fileUrl = cloudinaryResult.secure_url
        publicId = cloudinaryResult.public_id

        // Delete local file after cloud upload
        await fs.unlink(filePath).catch(() => {})
      } else {
        fileUrl = `/uploads/${path.basename(filePath)}`
      }

      // Save file info to database
      const dbFile = await prisma.file.create({
        data: {
          originalName: file.originalname,
          fileName: path.basename(filePath),
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
          publicId,
          uploadedBy: userId,
          uploadPath: publicId ? undefined : filePath
        }
      })

      logger.info('File uploaded successfully', {
        fileId: dbFile.id,
        originalName: file.originalname,
        size: formatBytes(file.size),
        userId
      })

      return dbFile as FileUpload
    } catch (error) {
      logger.error('File upload failed', error)
      
      // Clean up local file on error
      if (file.path) {
        await fs.unlink(file.path).catch(() => {})
      }
      
      throw error
    }
  }

  // Process image (resize, compress)
  private async processImage(filePath: string, options: {
    width?: number
    height?: number
    quality?: number
  }): Promise<string> {
    const processedPath = filePath.replace(path.extname(filePath), '_processed.jpg')
    
    let sharpInstance = sharp(filePath)

    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    await sharpInstance
      .jpeg({ quality: options.quality || 80 })
      .toFile(processedPath)

    // Delete original file
    await fs.unlink(filePath).catch(() => {})

    return processedPath
  }

  // Upload to Cloudinary
  private async uploadToCloudinary(filePath: string, mimeType: string) {
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw'
    
    return cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: 'mern-template',
      use_filename: true,
      unique_filename: true
    })
  }

  // Get file by ID
  async getFile(fileId: string, userId?: string): Promise<FileUpload | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { user: { select: { id: true, email: true } } }
    })

    if (!file) {
      return null
    }

    // Check if user has access to file
    if (userId && file.uploadedBy !== userId && !file.isPublic) {
      return null
    }

    return file as FileUpload
  }

  // Get user files
  async getUserFiles(userId: string, options: {
    page?: number
    limit?: number
    type?: string
  } = {}): Promise<{ files: FileUpload[]; total: number }> {
    const { page = 1, limit = 10, type } = options
    const skip = (page - 1) * limit

    const where: any = { uploadedBy: userId }
    
    if (type) {
      where.mimeType = { startsWith: type }
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.file.count({ where })
    ])

    return { files: files as FileUpload[], total }
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      })

      if (!file || file.uploadedBy !== userId) {
        return false
      }

      // Delete from cloud storage
      if (file.publicId) {
        await cloudinary.uploader.destroy(file.publicId).catch((error) => {
          logger.warn('Failed to delete file from Cloudinary', error)
        })
      }

      // Delete local file
      if (file.uploadPath) {
        await fs.unlink(file.uploadPath).catch(() => {})
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      })

      logger.info('File deleted successfully', { fileId, userId })
      return true
    } catch (error) {
      logger.error('File deletion failed', error)
      return false
    }
  }

  // Generate file thumbnail
  async generateThumbnail(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<string | null> {
    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId }
      })

      if (!file || !file.mimeType.startsWith('image/')) {
        return null
      }

      const dimensions = {
        small: { width: 150, height: 150 },
        medium: { width: 300, height: 300 },
        large: { width: 600, height: 600 }
      }

      if (file.publicId) {
        // Use Cloudinary transformation
        const { width, height } = dimensions[size]
        return cloudinary.url(file.publicId, {
          width,
          height,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        })
      } else if (file.uploadPath) {
        // Generate local thumbnail
        const thumbnailPath = file.uploadPath.replace(
          path.extname(file.uploadPath),
          `_thumb_${size}.jpg`
        )

        try {
          await fs.access(thumbnailPath)
          return `/uploads/${path.basename(thumbnailPath)}`
        } catch {
          // Generate thumbnail
          const { width, height } = dimensions[size]
          await sharp(file.uploadPath)
            .resize(width, height, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath)

          return `/uploads/${path.basename(thumbnailPath)}`
        }
      }

      return null
    } catch (error) {
      logger.error('Thumbnail generation failed', error)
      return null
    }
  }

  // Get file statistics
  async getFileStats(userId?: string): Promise<{
    totalFiles: number
    totalSize: number
    fileTypes: Record<string, number>
  }> {
    const where = userId ? { uploadedBy: userId } : {}

    const files = await prisma.file.findMany({
      where,
      select: { mimeType: true, size: true }
    })

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      fileTypes: files.reduce((acc, file) => {
        const type = file.mimeType.split('/')[0]
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return stats
  }
}

export const fileService = new FileService()