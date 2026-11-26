import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const fn = () => jest.fn<(...args: any[]) => any>();

  const mockRepository = {
    findAll: fn(),
    findById: fn(),
    findConflict: fn(),
    create: fn(),
    update: fn(),
    countActiveUsers: fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: fn(),
    },
  };

  beforeEach(() => {
    service = new DepartmentsService(
      mockRepository as unknown as DepartmentsRepository,
      mockPrisma as unknown as PrismaService,
    );
  });

  describe('findById', () => {
    it('returns department when found', async () => {
      const dept = { id: 'dept-1', name: 'Engineering', code: 'ENG' };
      mockRepository.findById.mockResolvedValue(dept);

      await expect(service.findById('dept-1')).resolves.toEqual(dept);
    });

    it('throws NotFoundError when department does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates department when name and code are unique', async () => {
      mockRepository.findConflict.mockResolvedValue(null);
      const created = { id: 'dept-1', name: 'Engineering', code: 'ENG' };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create({
        name: 'Engineering',
        code: 'ENG',
        description: 'Software Engineering',
      });

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Engineering',
        code: 'ENG',
        description: 'Software Engineering',
        headId: null,
      });
    });

    it('throws ConflictError when name or code already exists', async () => {
      mockRepository.findConflict.mockResolvedValue({ id: 'dept-1', name: 'Engineering', code: 'ENG' });

      await expect(
        service.create({ name: 'Engineering', code: 'ENG' }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError when headId user does not exist', async () => {
      mockRepository.findConflict.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Engineering', code: 'ENG', headId: 'user-missing' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws BadRequestError when headId user is inactive', async () => {
      mockRepository.findConflict.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: false });

      await expect(
        service.create({ name: 'Engineering', code: 'ENG', headId: 'user-1' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deactivate', () => {
    it('blocks deactivation when active users belong to the department', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'dept-1', name: 'Engineering', code: 'ENG' });
      mockRepository.countActiveUsers.mockResolvedValue(3);

      await expect(service.deactivate('dept-1')).rejects.toThrow(BadRequestError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('deactivates department when no active users belong to it', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'dept-1', name: 'Engineering', code: 'ENG' });
      mockRepository.countActiveUsers.mockResolvedValue(0);
      mockRepository.update.mockResolvedValue({ id: 'dept-1', isActive: false });

      const result = await service.deactivate('dept-1');
      expect(result).toEqual({ id: 'dept-1', isActive: false });
      expect(mockRepository.update).toHaveBeenCalledWith('dept-1', { isActive: false });
    });
  });
});
