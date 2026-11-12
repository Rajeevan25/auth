import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.config';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * Hash random tokens using SHA-256 before storing in database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token string.
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Sign JWT Access Token (15 min)
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Verify JWT Access Token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

