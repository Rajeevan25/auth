import { Response } from 'express';
import { env } from '../config/env.config';
import { tokenRepository } from '../repositories/token.repository';
import {
  generateRandomToken,
  hashToken,
  signAccessToken,
  AccessTokenPayload,
} from '../utils/token.utils';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export const ACCESS_COOKIE_NAME = 'accessToken';
export const REFRESH_COOKIE_NAME = 'refreshToken';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
}

export class TokenService {
  private getCookieOptions(maxAgeMs?: number): CookieOptions {
    const isProduction = env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
    };
  }

  async issueTokens(
    user: { id: string; email: string; name: string },
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string; accessCookieOptions: CookieOptions; refreshCookieOptions: CookieOptions }> {
    // 1. Generate access token
    const accessPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    const accessToken = signAccessToken(accessPayload);

    // 2. Generate cryptographically random refresh token
    const rawRefreshToken = generateRandomToken(48);
    const tokenHash = hashToken(rawRefreshToken);

    // 3. Expiration based on rememberMe (e.g. 30 days vs 7 days)
    const expirationDays = rememberMe
      ? env.JWT_REFRESH_REMEMBER_ME_DAYS
      : env.JWT_REFRESH_EXPIRATION_DAYS;
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // 4. Save hashed refresh token to DB
    await tokenRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const accessMaxAgeMs = 15 * 60 * 1000; // 15 mins
    const refreshMaxAgeMs = expirationDays * 24 * 60 * 60 * 1000;

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      accessCookieOptions: this.getCookieOptions(accessMaxAgeMs),
      refreshCookieOptions: this.getCookieOptions(refreshMaxAgeMs),
    };
  }

  setAuthCookies(
    res: Response,
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessCookieOptions: CookieOptions;
      refreshCookieOptions: CookieOptions;
    },
  ): void {
    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, tokens.accessCookieOptions);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, tokens.refreshCookieOptions);
  }

  clearAuthCookies(res: Response): void {
    const options = this.getCookieOptions();
    res.clearCookie(ACCESS_COOKIE_NAME, options);
    res.clearCookie(REFRESH_COOKIE_NAME, options);
  }

  /**
   * Rotate Refresh Token.
   * Enforces single-use rotation and reuse detection.
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
  ): Promise<{
    user: { id: string; email: string; name: string };
    newTokens: {
      accessToken: string;
      refreshToken: string;
      accessCookieOptions: CookieOptions;
      refreshCookieOptions: CookieOptions;
    };
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingRecord = await tokenRepository.findRefreshTokenByHash(tokenHash);

    if (!existingRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: If token was already revoked, someone is replaying a stolen token!
    if (existingRecord.revokedAt) {
      logger.warn(
        { userId: existingRecord.userId },
        'SECURITY ALERT: Revoked refresh token reuse detected! Invalidating all active sessions.',
      );
      // Revoke ALL active refresh tokens for this user
      await tokenRepository.revokeAllUserRefreshTokens(existingRecord.userId);
      throw new UnauthorizedError('Session expired or invalidated. Please log in again.');
    }

    // Check expiration
    if (new Date() > existingRecord.expiresAt) {
      await tokenRepository.revokeRefreshToken(existingRecord.id);
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    // Mark current token as revoked
    await tokenRepository.revokeRefreshToken(existingRecord.id);

    // Issue a brand new token pair (rotation)
    const newTokens = await this.issueTokens(existingRecord.user, false);

    return {
      user: existingRecord.user,
      newTokens,
    };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await tokenRepository.revokeAllUserRefreshTokens(userId);
  }
}

export const tokenService = new TokenService();

