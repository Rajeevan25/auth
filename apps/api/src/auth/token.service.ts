import { Injectable, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { env } from '../config/env.config';
import { TokenRepository } from './token.repository';
import {
  generateRandomToken,
  hashToken,
  signAccessToken,
  AccessTokenPayload,
} from '../utils/token.utils';
import { UnauthorizedError } from '../utils/errors';

export const ACCESS_COOKIE_NAME = 'accessToken';
export const REFRESH_COOKIE_NAME = 'refreshToken';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessCookieOptions: CookieOptions;
  refreshCookieOptions: CookieOptions;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly tokenRepository: TokenRepository) {}

  private getCookieOptions(maxAgeSeconds?: number): CookieOptions {
    const isProduction = env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
    };
  }

  async issueTokens(
    user: { id: string; email: string; name: string },
    rememberMe = false,
  ): Promise<IssuedTokens> {
    const accessPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    const accessToken = signAccessToken(accessPayload);

    const rawRefreshToken = generateRandomToken(48);
    const tokenHash = hashToken(rawRefreshToken);

    const expirationDays = rememberMe
      ? env.JWT_REFRESH_REMEMBER_ME_DAYS
      : env.JWT_REFRESH_EXPIRATION_DAYS;
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    await this.tokenRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const accessMaxAgeSeconds = 15 * 60; // 15 mins
    const refreshMaxAgeSeconds = expirationDays * 24 * 60 * 60;

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      accessCookieOptions: this.getCookieOptions(accessMaxAgeSeconds),
      refreshCookieOptions: this.getCookieOptions(refreshMaxAgeSeconds),
    };
  }

  setAuthCookies(res: FastifyReply, tokens: IssuedTokens): void {
    res.setCookie(ACCESS_COOKIE_NAME, tokens.accessToken, tokens.accessCookieOptions);
    res.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, tokens.refreshCookieOptions);
  }

  clearAuthCookies(res: FastifyReply): void {
    const options = this.getCookieOptions();
    res.clearCookie(ACCESS_COOKIE_NAME, options);
    res.clearCookie(REFRESH_COOKIE_NAME, options);
  }

  /**
   * Rotate Refresh Token.
   * Enforces single-use rotation and reuse detection.
   */
  async rotateRefreshToken(rawRefreshToken: string): Promise<{
    user: { id: string; email: string; name: string };
    newTokens: IssuedTokens;
  }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token missing');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingRecord = await this.tokenRepository.findRefreshTokenByHash(tokenHash);

    if (!existingRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: If token was already revoked, invalidate all active sessions
    if (existingRecord.revokedAt) {
      this.logger.warn(
        `SECURITY ALERT: Revoked refresh token reuse detected for userId=${existingRecord.userId}. Invalidating all active sessions.`,
      );
      await this.tokenRepository.revokeAllUserRefreshTokens(existingRecord.userId);
      throw new UnauthorizedError('Session expired or invalidated. Please log in again.');
    }

    if (new Date() > existingRecord.expiresAt) {
      await this.tokenRepository.revokeRefreshToken(existingRecord.id);
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    await this.tokenRepository.revokeRefreshToken(existingRecord.id);

    const newTokens = await this.issueTokens(existingRecord.user, false);

    return {
      user: existingRecord.user,
      newTokens,
    };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.revokeAllUserRefreshTokens(userId);
  }
}
