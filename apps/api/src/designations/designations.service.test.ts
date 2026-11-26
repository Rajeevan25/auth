import { jest } from '@jest/globals';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { DesignationsRepository } from './designations.repository';
import { DesignationsService } from './designations.service';

describe('DesignationsService', () => {
  let service: DesignationsService;

  const fn = () => jest.fn<(...args: any[]) => any>();

  const mockRepository = {
    findAll: fn(),
    findById: fn(),
    findConflict: fn(),
    create: fn(),
    update: fn(),
    countActiveUsers: fn(),
  };

  beforeEach(() => {
    service = new DesignationsService(
      mockRepository as unknown as DesignationsRepository,
    );
  });

  describe('findById', () => {
    it('throws NotFoundError when designation does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates designation when name and code are unique', async () => {
      mockRepository.findConflict.mockResolvedValue(null);
      const created = { id: 'desig-1', name: 'Senior', code: 'SENIOR', level: 4, leaveQuota: 24 };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create({
        name: 'Senior',
        code: 'SENIOR',
        level: 4,
        leaveQuota: 24,
      });

      expect(result).toEqual(created);
    });

    it('throws ConflictError on duplicate name or code', async () => {
      mockRepository.findConflict.mockResolvedValue({ id: 'desig-1', name: 'Senior', code: 'SENIOR' });

      await expect(
        service.create({ name: 'Senior', code: 'SENIOR', level: 4, leaveQuota: 24 }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deactivate', () => {
    it('blocks deactivation when active users hold the designation', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'desig-1', name: 'Senior', code: 'SENIOR' });
      mockRepository.countActiveUsers.mockResolvedValue(2);

      await expect(service.deactivate('desig-1')).rejects.toThrow(BadRequestError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('deactivates designation when zero active users hold it', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'desig-1', name: 'Senior', code: 'SENIOR' });
      mockRepository.countActiveUsers.mockResolvedValue(0);
      mockRepository.update.mockResolvedValue({ id: 'desig-1', isActive: false });

      const result = await service.deactivate('desig-1');
      expect(result).toEqual({ id: 'desig-1', isActive: false });
    });
  });
});
