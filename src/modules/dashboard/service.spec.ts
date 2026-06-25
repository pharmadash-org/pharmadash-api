jest.mock('../../config/database', () => ({
  prisma: {
    sale: { aggregate: jest.fn() },
    medication: { count: jest.fn(), findMany: jest.fn() },
    saleItem: { groupBy: jest.fn() },
  },
}));

import { prisma } from '../../config/database';
import { DashboardService } from './service';

const mockPrisma = prisma as unknown as {
  sale: { aggregate: jest.Mock };
  medication: { count: jest.Mock; findMany: jest.Mock };
  saleItem: { groupBy: jest.Mock };
};

describe('DashboardService', () => {
  const service = new DashboardService();

  describe('getKpis', () => {
    it('returns the three KPIs', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { total: 1500 } });
      mockPrisma.medication.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

      const kpis = await service.getKpis();
      expect(kpis).toEqual({
        dailyRevenue: 1500,
        criticalStockCount: 4,
        nearExpiryCount: 2,
      });
    });

    it('defaults dailyRevenue to 0 when there are no sales', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });
      mockPrisma.medication.count.mockResolvedValue(0);
      const kpis = await service.getKpis();
      expect(kpis.dailyRevenue).toBe(0);
    });
  });

  describe('getTopSold', () => {
    it('joins grouped sales with medication info', async () => {
      mockPrisma.saleItem.groupBy.mockResolvedValue([
        { medicationId: 'm1', _sum: { quantity: 30, subtotal: 300 } },
        { medicationId: 'm2', _sum: { quantity: 10, subtotal: 50 } },
      ]);
      mockPrisma.medication.findMany.mockResolvedValue([
        { id: 'm1', name: 'A', sku: 'A-1' },
        { id: 'm2', name: 'B', sku: 'B-1' },
      ]);

      const top = await service.getTopSold();
      expect(top).toEqual([
        { medicationId: 'm1', name: 'A', sku: 'A-1', totalQuantity: 30, totalRevenue: 300 },
        { medicationId: 'm2', name: 'B', sku: 'B-1', totalQuantity: 10, totalRevenue: 50 },
      ]);
    });

    it('handles null sums gracefully', async () => {
      mockPrisma.saleItem.groupBy.mockResolvedValue([
        { medicationId: 'm1', _sum: { quantity: null, subtotal: null } },
      ]);
      mockPrisma.medication.findMany.mockResolvedValue([{ id: 'm1', name: 'A', sku: 'A-1' }]);
      const top = await service.getTopSold();
      expect(top[0].totalQuantity).toBe(0);
      expect(top[0].totalRevenue).toBe(0);
    });
  });
});
