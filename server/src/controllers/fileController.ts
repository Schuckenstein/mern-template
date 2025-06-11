// server/src/controllers/fileController.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { fileService } from '../services/fileService';
import { sendResponse } from '../utils/helpers';

class FileController {
  // =============================================
  // Upload Single File
  // =============================================
  async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        throw new ApiError('No file uploaded', 400, 'VALIDATION_ERROR');
      }

      const uploadedFile = await fileService.uploadFile(file, userId);

      sendResponse(res, 201, true, 'File uploaded successfully', { file: uploadedFile });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Upload Multiple Files
  // =============================================
  async uploadMultipleFiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ApiError('No files uploaded', 400, 'VALIDATION_ERROR');
      }

      const uploadPromises = files.map(file => fileService.uploadFile(file, userId));
      const uploadedFiles = await Promise.all(uploadPromises);

      sendResponse(res, 201, true, 'Files uploaded successfully', { files: uploadedFiles });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Get Files
  // =============================================
  async getFiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 10, type } = req.query as any;

      const result = await fileService.getUserFiles(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type
      });

      const meta = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.total / parseInt(limit)),
        totalItems: result.total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) * parseInt(limit) < result.total,
        hasPreviousPage: parseInt(page) > 1
      };

      sendResponse(res, 200, true, 'Files retrieved successfully', { files: result.files }, meta);
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Get Single File
  // =============================================
  async getFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user!.id;

      const file = await fileService.getFile(fileId, userId);

      if (!file) {
        throw new ApiError('File not found', 404, 'NOT_FOUND_ERROR');
      }

      sendResponse(res, 200, true, 'File retrieved successfully', { file });
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Delete File
  // =============================================
  async deleteFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user!.id;

      const success = await fileService.deleteFile(fileId, userId);

      if (!success) {
        throw new ApiError('File not found or access denied', 404, 'NOT_FOUND_ERROR');
      }

      sendResponse(res, 200, true, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Download File
  // =============================================
  async downloadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user!.id;

      const file = await fileService.getFile(fileId, userId);

      if (!file) {
        throw new ApiError('File not found', 404, 'NOT_FOUND_ERROR');
      }

      // If cloud hosted, redirect to cloud URL
      if (file.publicId) {
        return res.redirect(file.url);
      }

      // Serve local file
      if (file.uploadPath) {
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        return res.sendFile(file.uploadPath, { root: '/' });
      }

      throw new ApiError('File not available', 404, 'NOT_FOUND_ERROR');
    } catch (error) {
      next(error);
    }
  }

  // =============================================
  // Get Thumbnail
  // =============================================
  async getThumbnail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const { size = 'medium' } = req.query as any;
      const userId = req.user!.id;

      const file = await fileService.getFile(fileId, userId);

      if (!file) {
        throw new ApiError('File not found', 404, 'NOT_FOUND_ERROR');
      }

      const thumbnailUrl = await fileService.generateThumbnail(fileId, size);

      if (!thumbnailUrl) {
        throw new ApiError('Thumbnail not available', 404, 'NOT_FOUND_ERROR');
      }

      // If it's a URL, redirect
      if (thumbnailUrl.startsWith('http')) {
        return res.redirect(thumbnailUrl);
      }

      // Serve local thumbnail
      res.sendFile(thumbnailUrl, { root: process.cwd() });
    } catch (error) {
      next(error);
    }
  }
}

export const fileController = new FileController();