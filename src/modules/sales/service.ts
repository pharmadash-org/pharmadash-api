import { prisma } from '../../config/database';
import { SaleRepository, SaleWithItems } from './repository';
import { CreateSaleDto } from './schema';
import { NotFoundException, UnprocessableException } from '../../shared/exceptions';

export class SaleService {
  constructor(private readonly repo: SaleRepository) {}

  async create(userId: string, dto: CreateSaleDto): Promise<SaleWithItems> {
    // Resolve user from DB by entraId
    const user = await prisma.user.findUnique({ where: { entraId: userId } });
    if (!user) throw new NotFoundException('User', userId);

    // Fetch medications and compute totals
    const enriched: {
      medicationId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of dto.items) {
      const med = await prisma.medication.findUnique({ where: { id: item.medicationId } });
      if (!med) throw new NotFoundException('Medication', item.medicationId);

      if (med.stock < item.quantity) {
        throw new UnprocessableException(
          `Insufficient stock for '${med.name}': available ${med.stock}, requested ${item.quantity}`,
          { medicationId: med.id, available: med.stock, requested: item.quantity },
        );
      }

      const unitPrice = Number(med.price);
      enriched.push({
        medicationId: item.medicationId,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      });
    }

    const total = enriched.reduce((sum, i) => sum + i.subtotal, 0);

    return this.repo.createWithItems(user.id, enriched, total);
  }
}
