// server/src/routes/files.ts

import express from 'express';
import { fileController } from '../controllers/fileController';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateQuery } from '../middleware/validation';
import { fileValidation } from '../validation/fileValidation';
import { fileService } from '../services/fileService';

const router = express.Router();

// =============================================
// File Upload Routes
// =============================================
router.post('/upload',
  uploadRateLimiter,
  fileService.getMulterConfig().single('file'),
  fileController.uploadFile
);

router.post('/upload-multiple',
  uploadRateLimiter,
  fileService.getMulterConfig().array('files', 10),
  fileController.uploadMultipleFiles
);

// =============================================
// File Management Routes
// =============================================
router.get('/',
  validateQuery(fileValidation.getFilesQuery),
  fileController.getFiles
);

router.get('/:fileId', fileController.getFile);

router.delete('/:fileId', fileController.deleteFile);

router.get('/:fileId/download', fileController.downloadFile);

router.get('/:fileId/thumbnail', fileController.getThumbnail);

export default router;