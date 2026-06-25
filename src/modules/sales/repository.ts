import { Sale, SaleItem, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export type SaleWithItems = Sale & { items: (SaleItem & { medication: { name: string } })[] };

export class SaleRepository {
  async createWithItems(
    userId: string,
    items: { medicationId: string; quantity: number; unitPrice: number; subtotal: number }[],
    total: number,
  ): Promise<SaleWithItems> {
    return prisma.$transaction(async (tx) => {
      // Lock medications for update and verify stock
      for (const item of items) {
        const med = await tx.medication.findUnique({ where: { id: item.medicationId } });
        if (!med) throw new Error(`Medication ${item.medicationId} not found`);
        if (med.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for '${med.name}': available ${med.stock}, requested ${item.quantity}`,
          );
        }
      }

      // Deduct stock
      for (const item of items) {
        await tx.medication.update({
          where: { id: item.medicationId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create sale
      return tx.sale.create({
        data: {
          userId,
          total: new Prisma.Decimal(total),
          items: {
            create: items.map((i) => ({
              medicationId: i.medicationId,
              quantity: i.quantity,
              unitPrice: new Prisma.Decimal(i.unitPrice),
              subtotal: new Prisma.Decimal(i.subtotal),
            })),
          },
        },
        include: { items: { include: { medication: { select: { name: true } } } } },
      });
    });
  }
}
