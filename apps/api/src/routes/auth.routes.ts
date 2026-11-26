import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authRateLimiter, strictLoginLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is invalid or missing'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Auth endpoints
router.post(
  '/login',
  strictLoginLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post('/logout', authController.logout);

router.post('/refresh', authController.refresh);

router.get('/me', authenticate, authController.getMe);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

// OAuth stubs
router.get('/oauth/google', authController.oauthGoogleStub);
router.get('/oauth/github', authController.oauthGithubStub);

export const authRoutes = router;

