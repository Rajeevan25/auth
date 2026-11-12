import request from 'supertest';
import { app } from '../app';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import * as passwordUtils from '../utils/password.utils';
import * as tokenUtils from '../utils/token.utils';
import { REFRESH_COOKIE_NAME, ACCESS_COOKIE_NAME } from '../services/token.service';

jest.mock('../repositories/user.repository');
jest.mock('../repositories/token.repository');

describe('Auth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 'user-uuid-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
      failedAttempts: 0,
      lockedUntil: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    it('should login successfully with valid credentials and set cookies', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
      (userRepository.resetFailedAttempts as jest.Mock).mockResolvedValue(mockUser);
      (tokenRepository.createRefreshToken as jest.Mock).mockResolvedValue({
        id: 'token-uuid-1',
        userId: mockUser.id,
        tokenHash: 'hashed',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          rememberMe: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt.toISOString(),
      });

      // Verify Set-Cookie header contains both tokens
      const cookies = response.headers['set-cookie'] as unknown as string[] | string;
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr).toContain(ACCESS_COOKIE_NAME);
      expect(cookieStr).toContain(REFRESH_COOKIE_NAME);
      expect(cookieStr).toContain('HttpOnly');
    });

    it('should return 401 when password is wrong and increment failed attempts', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);
      (userRepository.incrementFailedAttempts as jest.Mock).mockResolvedValue({
        ...mockUser,
        failedAttempts: 1,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
      expect(userRepository.incrementFailedAttempts).toHaveBeenCalledWith(mockUser.id);
    });

    it('should lock account and return 429 when failed attempts reach 5', async () => {
      const userNearLock = {
        ...mockUser,
        failedAttempts: 4,
      };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(userNearLock);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);
      (userRepository.lockAccount as jest.Mock).mockResolvedValue({
        ...userNearLock,
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword5Times!',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is temporarily locked');
      expect(response.body.lockoutRemainingSeconds).toBeGreaterThan(0);
      expect(userRepository.lockAccount).toHaveBeenCalled();
    });

    it('should reject already locked account with 429 and remaining seconds', async () => {
      const lockedUser = {
        ...mockUser,
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 mins remaining
      };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(lockedUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.lockoutRemainingSeconds).toBeGreaterThan(0);
    });

    it('should validate request body and return 400 for malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email address',
          }),
        ]),
      );
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 if refresh token cookie is missing', async () => {
      const response = await request(app).post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should rotate token successfully when valid refresh token is supplied', async () => {
      const rawToken = 'valid_raw_refresh_token_12345';
      const mockRecord = {
        id: 'token-id-1',
        userId: 'user-id-1',
        tokenHash: tokenUtils.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-id-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      (tokenRepository.findRefreshTokenByHash as jest.Mock).mockResolvedValue(mockRecord);
      (tokenRepository.revokeRefreshToken as jest.Mock).mockResolvedValue({
        ...mockRecord,
        revokedAt: new Date(),
      });
      (tokenRepository.createRefreshToken as jest.Mock).mockResolvedValue({
        id: 'token-id-2',
        userId: 'user-id-1',
        tokenHash: 'new_hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=${rawToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toEqual({
        id: 'user-id-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      // Old token revoked
      expect(tokenRepository.revokeRefreshToken).toHaveBeenCalledWith('token-id-1');
      // New token issued
      expect(tokenRepository.createRefreshToken).toHaveBeenCalled();
    });

    it('should revoke all tokens and return 401 when a revoked token is reused (theft detection)', async () => {
      const rawToken = 'stolen_and_reused_refresh_token';
      const reusedRecord = {
        id: 'token-id-1',
        userId: 'user-id-1',
        tokenHash: tokenUtils.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date('2026-01-01'), // Already revoked!
        createdAt: new Date('2026-01-01'),
        user: {
          id: 'user-id-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      (tokenRepository.findRefreshTokenByHash as jest.Mock).mockResolvedValue(reusedRecord);
      (tokenRepository.revokeAllUserRefreshTokens as jest.Mock).mockResolvedValue({ count: 5 });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=${rawToken}`]);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      // All user tokens should be revoked for security
      expect(tokenRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('api');
    });
  });
});

