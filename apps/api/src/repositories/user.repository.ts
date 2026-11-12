import { prisma } from '../config/db';
import { User } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: { email: string; name: string; passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementFailedAttempts(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
      },
    });
  }

  async lockAccount(id: string, lockedUntil: Date, failedAttempts: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedAttempts,
        lockedUntil,
      },
    });
  }

  async resetFailedAttempts(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}

export const userRepository = new UserRepository();

