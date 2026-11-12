import { prisma } from '../config/db';
import { RefreshToken, PasswordResetToken } from '@prisma/client';

export class TokenRepository {
  // Refresh Token operations
  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<(RefreshToken & { user: { id: string; email: string; name: string } }) | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // Password Reset Token operations
  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findPasswordResetTokenByHash(
    tokenHash: string,
  ): Promise<(PasswordResetToken & { user: { id: string; email: string } }) | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async markPasswordResetTokenUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

export const tokenRepository = new TokenRepository();

