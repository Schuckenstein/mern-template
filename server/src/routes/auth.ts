// server/src/routes/auth.ts
import express from 'express';
import passport from 'passport';
import { authController } from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validation';
import { authValidation } from '../validation/authValidation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// =============================================
// Local Authentication Routes
// =============================================
router.post('/register', 
  authRateLimiter,
  validate(authValidation.register),
  authController.register
);

router.post('/login',
  authRateLimiter,
  validate(authValidation.login),
  authController.login
);

router.post('/logout',
  authenticateToken,
  authController.logout
);

router.post('/refresh',
  authRateLimiter,
  authController.refreshToken
);

// =============================================
// Email Verification
// =============================================
router.post('/verify-email',
  authRateLimiter,
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

router.post('/resend-verification',
  authRateLimiter,
  validate(authValidation.resendVerification),
  authController.resendVerification
);

// =============================================
// Password Reset
// =============================================
router.post('/forgot-password',
  authRateLimiter,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post('/reset-password',
  authRateLimiter,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

// =============================================
// OAuth Routes
// =============================================
if (process.env.GOOGLE_CLIENT_ID) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    authController.oauthCallback
  );
}

if (process.env.GITHUB_CLIENT_ID) {
  router.get('/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    authController.oauthCallback
  );
}

// =============================================
// User Info
// =============================================
router.get('/me',
  authenticateToken,
  authController.getCurrentUser
);

export default router;

// =============================================