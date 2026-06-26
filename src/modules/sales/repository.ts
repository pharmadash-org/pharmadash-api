import { Sale, SaleItem, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { UnprocessableException } from '../../shared/exceptions';

export type SaleWithItems = Sale & { items: (SaleItem & { medication: { name: string } })[] };

export class SaleRepository {
  async createWithItems(
    userId: string,
    items: { medicationId: string; quantity: number; unitPrice: number; subtotal: number }[],
    total: number,
  ): Promise<SaleWithItems> {
    return prisma.$transaction(async (tx) => {
      // Atomic conditional decrement — race-safe.
      // updateMany compiles to: UPDATE medications SET stock = stock - q
      //   WHERE id = ? AND stock >= q
      // The WHERE clause is evaluated under the row lock taken by UPDATE,
      // so two concurrent sales can never both pass the check.
      // count === 0 means the row didn't exist or stock was insufficient.
      for (const item of items) {
        const { count } = await tx.medication.updateMany({
          where: { id: item.medicationId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new UnprocessableException(
            `Insufficient stock for medication '${item.medicationId}'`,
            { medicationId: item.medicationId, requested: item.quantity },
          );
        }
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
