import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';
import {
  hashPassword,
  comparePassword,
  dummyComparePassword,
} from '../utils/password.utils';
import { generateRandomToken, hashToken } from '../utils/token.utils';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  TooManyRequestsError,
  NotFoundError,
} from '../utils/errors';
import { env } from '../config/env.config';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async login(data: { email: string; password: string; rememberMe?: boolean }) {
    const user = await this.userRepository.findByEmail(data.email);

    // Timing attack mitigation: run dummy compare if user does not exist
    if (!user) {
      await dummyComparePassword(data.password);
      throw new UnauthorizedError('Invalid email or password');
    }

    const now = new Date();

    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingSeconds = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000);
      throw new TooManyRequestsError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
        remainingSeconds,
      );
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      const updatedFailedAttempts = user.failedAttempts + 1;

      if (updatedFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.userRepository.lockAccount(user.id, lockedUntil, updatedFailedAttempts);
        this.logger.warn(
          `Account locked due to 5 consecutive failed login attempts (userId=${user.id}, email=${user.email})`,
        );
        throw new TooManyRequestsError(
          'Account is temporarily locked due to 5 failed login attempts. Please try again in 15 minutes.',
          15 * 60,
        );
      }

      await this.userRepository.incrementFailedAttempts(user.id);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.failedAttempts > 0 || user.lockedUntil) {
      await this.userRepository.resetFailedAttempts(user.id);
    }

    if (!user.isActive) {
      this.logger.warn(`Login blocked for deactivated account (userId=${user.id}, email=${user.email})`);
      throw new UnauthorizedError('Your account has been deactivated. Contact HR or Admin.');
    }

    const tokens = await this.tokenService.issueTokens(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation: user.designation ?? undefined,
      },
      Boolean(data.rememberMe),
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation: user.designation ?? null,
        department: user.department ?? null,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const record = await this.tokenRepository.findRefreshTokenByHash(tokenHash);
      if (record) {
        await this.tokenRepository.revokeRefreshToken(record.id);
      }
    }
  }

  async refresh(rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }
    return this.tokenService.rotateRefreshToken(rawRefreshToken);
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation ?? null,
      department: user.department ?? null,
      createdAt: user.createdAt,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);

    // Prevent user enumeration: always return same message regardless of whether user exists
    if (user) {
      const rawResetToken = generateRandomToken(32);
      const tokenHash = hashToken(rawResetToken);
      const expiresAt = new Date(
        Date.now() + env.PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000,
      );

      await this.tokenRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawResetToken}`;

      this.logger.log(
        `\n=========================================\n[DEV AUTH NOTIFICATION]\nPassword reset requested for: ${user.email}\nReset Link: ${resetUrl}\nExpires in: ${env.PASSWORD_RESET_EXPIRATION_MINUTES} minutes\n=========================================\n`,
      );
    }

    return {
      message:
        'If an account with that email exists, password reset instructions have been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const resetRecord = await this.tokenRepository.findPasswordResetTokenByHash(tokenHash);

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.userRepository.updatePassword(resetRecord.userId, passwordHash);
    await this.tokenRepository.markPasswordResetTokenUsed(resetRecord.id);
    await this.tokenRepository.revokeAllUserRefreshTokens(resetRecord.userId);

    this.logger.log(`Password reset successfully completed (userId=${resetRecord.userId})`);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
