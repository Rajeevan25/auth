import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { tokenService } from './token.service';
import {
  hashPassword,
  comparePassword,
  dummyComparePassword,
} from '../utils/password.utils';
import {
  generateRandomToken,
  hashToken,
} from '../utils/token.utils';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  TooManyRequestsError,
  NotFoundError,
} from '../utils/errors';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  async register(data: { email: string; name: string; password: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    const tokens = await tokenService.issueTokens(
      { id: user.id, email: user.email, name: user.name },
      false,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async login(data: { email: string; password: string; rememberMe?: boolean }) {
    const user = await userRepository.findByEmail(data.email);

    // Timing attack mitigation: run dummy compare if user does not exist
    if (!user) {
      await dummyComparePassword(data.password);
      throw new UnauthorizedError('Invalid email or password');
    }

    const now = new Date();

    // Check account lockout status
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
      throw new TooManyRequestsError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
        remainingSeconds,
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      const updatedFailedAttempts = user.failedAttempts + 1;

      if (updatedFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await userRepository.lockAccount(user.id, lockedUntil, updatedFailedAttempts);
        logger.warn(
          { userId: user.id, email: user.email },
          'Account locked due to 5 consecutive failed login attempts',
        );
        throw new TooManyRequestsError(
          'Account is temporarily locked due to 5 failed login attempts. Please try again in 15 minutes.',
          15 * 60,
        );
      }

      await userRepository.incrementFailedAttempts(user.id);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed attempts upon successful password match
    if (user.failedAttempts > 0 || user.lockedUntil) {
      await userRepository.resetFailedAttempts(user.id);
    }

    // Issue tokens with rememberMe lifetime preference
    const tokens = await tokenService.issueTokens(
      { id: user.id, email: user.email, name: user.name },
      Boolean(data.rememberMe),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const record = await tokenRepository.findRefreshTokenByHash(tokenHash);
      if (record) {
        await tokenRepository.revokeRefreshToken(record.id);
      }
    }
  }

  async refresh(rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }
    return tokenService.rotateRefreshToken(rawRefreshToken);
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);

    // Prevent user enumeration: always return same message regardless of whether user exists
    if (user) {
      const rawResetToken = generateRandomToken(32);
      const tokenHash = hashToken(rawResetToken);
      const expiresAt = new Date(
        Date.now() + env.PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000,
      );

      await tokenRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawResetToken}`;

      // In development / demo mode, print reset link to console
      logger.info(
        `\n=========================================\n[DEV AUTH NOTIFICATION]\nPassword reset requested for: ${user.email}\nReset Link: ${resetUrl}\nExpires in: ${env.PASSWORD_RESET_EXPIRATION_MINUTES} minutes\n=========================================\n`,
      );

      // TODO: Integrate production mailer service (e.g. Resend, SendGrid, Postmark, AWS SES)
      // await mailService.sendPasswordResetEmail({ to: user.email, resetUrl });
    }

    return {
      message:
        'If an account with that email exists, password reset instructions have been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const resetRecord = await tokenRepository.findPasswordResetTokenByHash(tokenHash);

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password and reset lockout flags
    await userRepository.updatePassword(resetRecord.userId, passwordHash);

    // Mark reset token as used
    await tokenRepository.markPasswordResetTokenUsed(resetRecord.id);

    // Revoke all existing sessions so old tokens cannot be used after password change
    await tokenRepository.revokeAllUserRefreshTokens(resetRecord.userId);

    logger.info({ userId: resetRecord.userId }, 'Password reset successfully completed');

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}

export const authService = new AuthService();

