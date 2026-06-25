import { MedicationService } from './service';
import { MedicationRepository } from './repository';
import { ConflictException, NotFoundException } from '../../shared/exceptions';

function med(overrides: Partial<Record<string, unknown>> = {}) {
  const inThirtyDays = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);
  return {
    id: 'id-1',
    name: 'Paracetamol',
    sku: 'PARA-500',
    category: 'Analgesico',
    description: null,
    price: 4.5,
    stock: 50,
    expiryDate: inThirtyDays,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

describe('MedicationService', () => {
  let repo: jest.Mocked<MedicationRepository>;
  let service: MedicationService;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      search: jest.fn(),
      findById: jest.fn(),
      findBySku: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MedicationRepository>;
    service = new MedicationService(repo);
  });

  describe('enrich flags', () => {
    it('marks isCriticalStock when stock < 10', async () => {
      repo.findById.mockResolvedValue(med({ stock: 5 }));
      const result = await service.getById('id-1');
      expect(result.isCriticalStock).toBe(true);
    });

    it('does not mark critical when stock >= 10', async () => {
      repo.findById.mockResolvedValue(med({ stock: 10 }));
      const result = await service.getById('id-1');
      expect(result.isCriticalStock).toBe(false);
    });

    it('marks isNearExpiry when expiry within 30 days', async () => {
      const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);
      repo.findById.mockResolvedValue(med({ expiryDate: soon }));
      const result = await service.getById('id-1');
      expect(result.isNearExpiry).toBe(true);
    });

    it('does not mark near expiry when far away', async () => {
      const far = new Date(Date.now() + 1000 * 60 * 60 * 24 * 200);
      repo.findById.mockResolvedValue(med({ expiryDate: far }));
      const result = await service.getById('id-1');
      expect(result.isNearExpiry).toBe(false);
    });
  });

  describe('list', () => {
    it('enriches every item and preserves pagination', async () => {
      repo.findAll.mockResolvedValue({
        items: [med({ stock: 2 }), med({ id: 'id-2', stock: 99 })],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      const result = await service.list({ page: 1, limit: 10 });
      expect(result.total).toBe(2);
      expect(result.items[0].isCriticalStock).toBe(true);
      expect(result.items[1].isCriticalStock).toBe(false);
    });
  });

  describe('search', () => {
    it('returns enriched results', async () => {
      repo.search.mockResolvedValue([med({ stock: 1 })]);
      const result = await service.search('para');
      expect(result).toHaveLength(1);
      expect(result[0].isCriticalStock).toBe(true);
    });
  });

  describe('getById', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getById('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      name: 'New',
      sku: 'NEW-1',
      category: 'Otro' as never,
      price: 9,
      stock: 3,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    };

    it('throws Conflict when SKU exists', async () => {
      repo.findBySku.mockResolvedValue(med());
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates when SKU is free', async () => {
      repo.findBySku.mockResolvedValue(null);
      repo.create.mockResolvedValue(med({ sku: 'NEW-1', stock: 3 }));
      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalled();
      expect(result.isCriticalStock).toBe(true);
    });
  });

  describe('update', () => {
    it('throws NotFound when medication missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('x', { price: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Conflict when new SKU belongs to another medication', async () => {
      repo.findById.mockResolvedValue(med());
      repo.findBySku.mockResolvedValue(med({ id: 'other' }));
      await expect(service.update('id-1', { sku: 'DUP' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('updates successfully', async () => {
      repo.findById.mockResolvedValue(med());
      repo.findBySku.mockResolvedValue(null);
      repo.update.mockResolvedValue(med({ price: 20 }));
      const result = await service.update('id-1', {
        sku: 'OK-1',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
      });
      expect(repo.update).toHaveBeenCalled();
      expect(result.id).toBe('id-1');
    });
  });

  describe('delete', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes when present', async () => {
      repo.findById.mockResolvedValue(med());
      repo.delete.mockResolvedValue(undefined);
      await service.delete('id-1');
      expect(repo.delete).toHaveBeenCalledWith('id-1');
    });
  });
});
