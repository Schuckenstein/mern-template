// server/src/routes/debug.ts

import express from 'express';
import { debugController } from '../controllers/debugController';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Health check (public)
router.get('/health', debugController.healthCheck);

// System info (requires auth)
router.get('/info', debugController.getSystemInfo);

// Database info (admin only)
router.get('/database', requireAdmin, debugController.getDatabaseInfo);

// Database query (admin only)
router.post('/database/query', requireAdmin, debugController.queryDatabase);

// Cache management (admin only)
router.post('/cache/clear', requireAdmin, debugController.clearCache);

// Email testing (admin only)
router.post('/email/test', requireAdmin, debugController.testEmail);

// Logs (admin only)
router.get('/logs', requireAdmin, debugController.getLogs);

export default router;