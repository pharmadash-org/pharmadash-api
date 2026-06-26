jest.mock('../../config/database', () => {
  const tx = {
    medication: { updateMany: jest.fn() },
    sale: { create: jest.fn() },
  };
  return {
    prisma: {
      __tx: tx,
      $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
    },
  };
});

import { prisma } from '../../config/database';
import { SaleRepository } from './repository';

const mp = prisma as unknown as {
  __tx: {
    medication: { updateMany: jest.Mock };
    sale: { create: jest.Mock };
  };
  $transaction: jest.Mock;
};

describe('SaleRepository.createWithItems', () => {
  const repo = new SaleRepository();
  const items = [{ medicationId: 'm1', quantity: 2, unitPrice: 10, subtotal: 20 }];

  it('throws 422 and skips persistence when the atomic decrement affects 0 rows', async () => {
    // count === 0 = no existía o no había stock suficiente (también cubre la carrera)
    mp.__tx.medication.updateMany.mockResolvedValue({ count: 0 });
    await expect(repo.createWithItems('u1', items, 20)).rejects.toThrow(/Insufficient stock/);
    expect(mp.__tx.sale.create).not.toHaveBeenCalled();
  });

  it('decrements stock atomically and creates the sale on success', async () => {
    mp.__tx.medication.updateMany.mockResolvedValue({ count: 1 });
    mp.__tx.sale.create.mockResolvedValue({ id: 'sale-1', items: [] });

    const result = await repo.createWithItems('u1', items, 20);

    expect(mp.__tx.medication.updateMany).toHaveBeenCalledWith({
      where: { id: 'm1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(mp.__tx.sale.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'sale-1', items: [] });
  });
});
