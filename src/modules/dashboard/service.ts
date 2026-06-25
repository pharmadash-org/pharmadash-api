import { prisma } from '../../config/database';

const CRITICAL_STOCK_THRESHOLD = 10;
const NEAR_EXPIRY_DAYS = 30;

export interface DashboardKpis {
  dailyRevenue: number;
  criticalStockCount: number;
  nearExpiryCount: number;
}

export interface TopSoldItem {
  medicationId: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

export class DashboardService {
  async getKpis(): Promise<DashboardKpis> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const nearExpiryThreshold = new Date();
    nearExpiryThreshold.setDate(nearExpiryThreshold.getDate() + NEAR_EXPIRY_DAYS);

    const [dailyRevenueResult, criticalStockCount, nearExpiryCount] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.medication.count({ where: { stock: { lt: CRITICAL_STOCK_THRESHOLD } } }),
      prisma.medication.count({
        where: { expiryDate: { lte: nearExpiryThreshold } },
      }),
    ]);

    return {
      dailyRevenue: Number(dailyRevenueResult._sum.total ?? 0),
      criticalStockCount,
      nearExpiryCount,
    };
  }

  async getTopSold(): Promise<TopSoldItem[]> {
    const result = await prisma.saleItem.groupBy({
      by: ['medicationId'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const medications = await prisma.medication.findMany({
      where: { id: { in: result.map((r) => r.medicationId) } },
      select: { id: true, name: true, sku: true },
    });

    const medMap = new Map(medications.map((m) => [m.id, m]));

    return result.map((r) => {
      const med = medMap.get(r.medicationId)!;
      return {
        medicationId: r.medicationId,
        name: med.name,
        sku: med.sku,
        totalQuantity: r._sum.quantity ?? 0,
        totalRevenue: Number(r._sum.subtotal ?? 0),
      };
    });
  }
}
