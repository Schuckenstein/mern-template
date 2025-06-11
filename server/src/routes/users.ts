// server/src/routes/users.ts
import express from 'express';
import { userController } from '../controllers/userController';
import { requireAdmin, requireModerator } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { userValidation } from '../validation/userValidation';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { fileService } from '../services/fileService';

const router = express.Router();

// =============================================
// Profile Routes
// =============================================
router.get('/profile', userController.getProfile);

router.put('/profile',
  validate(userValidation.updateProfile),
  userController.updateProfile
);

// =============================================
// Avatar Upload
// =============================================
router.post('/avatar',
  uploadRateLimiter,
  fileService.getMulterConfig({
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    resize: { width: 400, height: 400, quality: 90 }
  }).single('avatar'),
  userController.uploadAvatar
);

// =============================================
// Password Management
// =============================================
router.post('/change-password',
  validate(userValidation.changePassword),
  userController.changePassword
);

// =============================================
// Account Management
// =============================================
router.delete('/account', userController.deleteAccount);

// =============================================
// Admin Routes
// =============================================
router.get('/',
  requireModerator,
  validateQuery(userValidation.getUsersQuery),
  userController.getUsers
);

router.get('/:userId',
  requireModerator,
  userController.getUserById
);

router.put('/:userId/role',
  requireAdmin,
  validate(userValidation.updateUserRole),
  userController.updateUserRole
);

router.put('/:userId/ban',
  requireAdmin,
  userController.banUser
);

router.put('/:userId/unban',
  requireAdmin,
  userController.unbanUser
);

export default router;