jest.mock('../../config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    medication: { findUnique: jest.fn() },
  },
}));

import { prisma } from '../../config/database';
import { SaleService } from './service';
import { SaleRepository } from './repository';
import { NotFoundException, UnprocessableException } from '../../shared/exceptions';

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
  medication: { findUnique: jest.Mock };
};

describe('SaleService', () => {
  let repo: jest.Mocked<SaleRepository>;
  let service: SaleService;

  beforeEach(() => {
    repo = { createWithItems: jest.fn() } as unknown as jest.Mocked<SaleRepository>;
    service = new SaleService(repo);
  });

  it('throws NotFound when user is not in DB', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.create('entra-oid', { items: [{ medicationId: 'm1', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when a medication does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.medication.findUnique.mockResolvedValue(null);
    await expect(
      service.create('entra-oid', { items: [{ medicationId: 'm1', quantity: 1 }] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Unprocessable when stock is insufficient and never persists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.medication.findUnique.mockResolvedValue({
      id: 'm1',
      name: 'Paracetamol',
      price: 4.5,
      stock: 2,
    });
    await expect(
      service.create('entra-oid', { items: [{ medicationId: 'm1', quantity: 5 }] }),
    ).rejects.toBeInstanceOf(UnprocessableException);
    expect(repo.createWithItems).not.toHaveBeenCalled();
  });

  it('computes totals and delegates to repository on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.medication.findUnique
      .mockResolvedValueOnce({ id: 'm1', name: 'A', price: 10, stock: 100 })
      .mockResolvedValueOnce({ id: 'm2', name: 'B', price: 2.5, stock: 100 });
    repo.createWithItems.mockResolvedValue({ id: 'sale-1' } as never);

    await service.create('entra-oid', {
      items: [
        { medicationId: 'm1', quantity: 2 },
        { medicationId: 'm2', quantity: 4 },
      ],
    });

    expect(repo.createWithItems).toHaveBeenCalledWith(
      'user-1',
      [
        { medicationId: 'm1', quantity: 2, unitPrice: 10, subtotal: 20 },
        { medicationId: 'm2', quantity: 4, unitPrice: 2.5, subtotal: 10 },
      ],
      30,
    );
  });
});
