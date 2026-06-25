jest.mock('../../config/database', () => {
  const tx = {
    medication: { findUnique: jest.fn(), update: jest.fn() },
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
    medication: { findUnique: jest.Mock; update: jest.Mock };
    sale: { create: jest.Mock };
  };
  $transaction: jest.Mock;
};

describe('SaleRepository.createWithItems', () => {
  const repo = new SaleRepository();
  const items = [{ medicationId: 'm1', quantity: 2, unitPrice: 10, subtotal: 20 }];

  it('throws when medication is missing inside the transaction', async () => {
    mp.__tx.medication.findUnique.mockResolvedValue(null);
    await expect(repo.createWithItems('u1', items, 20)).rejects.toThrow(/not found/);
    expect(mp.__tx.sale.create).not.toHaveBeenCalled();
  });

  it('throws and skips persistence when stock is insufficient', async () => {
    mp.__tx.medication.findUnique.mockResolvedValue({ id: 'm1', name: 'A', stock: 1 });
    await expect(repo.createWithItems('u1', items, 20)).rejects.toThrow(/Insufficient stock/);
    expect(mp.__tx.medication.update).not.toHaveBeenCalled();
    expect(mp.__tx.sale.create).not.toHaveBeenCalled();
  });

  it('decrements stock and creates the sale on success', async () => {
    mp.__tx.medication.findUnique.mockResolvedValue({ id: 'm1', name: 'A', stock: 100 });
    mp.__tx.medication.update.mockResolvedValue({});
    mp.__tx.sale.create.mockResolvedValue({ id: 'sale-1', items: [] });

    const result = await repo.createWithItems('u1', items, 20);

    expect(mp.__tx.medication.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { stock: { decrement: 2 } },
    });
    expect(mp.__tx.sale.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'sale-1', items: [] });
  });
});
