jest.mock('../../config/database', () => ({
  prisma: {
    medication: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../../config/database';
import { MedicationRepository } from './repository';

const mp = prisma as unknown as {
  medication: Record<string, jest.Mock>;
};

describe('MedicationRepository', () => {
  const repo = new MedicationRepository();

  it('findAll computes pagination and builds filters', async () => {
    mp.medication.findMany.mockResolvedValue([{ id: '1' }]);
    mp.medication.count.mockResolvedValue(25);

    const result = await repo.findAll({ page: 2, limit: 10, name: 'para', category: 'Otro' as never });

    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    const args = mp.medication.findMany.mock.calls[0][0];
    expect(args.skip).toBe(10);
    expect(args.take).toBe(10);
    expect(args.where.name).toEqual({ contains: 'para', mode: 'insensitive' });
    expect(args.where.category).toBe('Otro');
  });

  it('search queries name OR sku and limits to 10', async () => {
    mp.medication.findMany.mockResolvedValue([]);
    await repo.search('amox');
    const args = mp.medication.findMany.mock.calls[0][0];
    expect(args.take).toBe(10);
    expect(args.where.OR).toHaveLength(2);
  });

  it('findBySku excludes an id when provided', async () => {
    mp.medication.findFirst.mockResolvedValue(null);
    await repo.findBySku('SKU-1', 'exclude-me');
    const args = mp.medication.findFirst.mock.calls[0][0];
    expect(args.where.NOT).toEqual({ id: 'exclude-me' });
  });

  it('findById delegates to prisma', async () => {
    mp.medication.findUnique.mockResolvedValue({ id: '1' });
    const result = await repo.findById('1');
    expect(result).toEqual({ id: '1' });
  });

  it('create / update / delete delegate to prisma', async () => {
    mp.medication.create.mockResolvedValue({ id: 'c' });
    mp.medication.update.mockResolvedValue({ id: 'u' });
    mp.medication.delete.mockResolvedValue({ id: 'd' });

    await repo.create({ name: 'x' } as never);
    await repo.update('1', { name: 'y' } as never);
    await repo.delete('1');

    expect(mp.medication.create).toHaveBeenCalled();
    expect(mp.medication.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { name: 'y' } });
    expect(mp.medication.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
