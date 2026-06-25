import { Prisma, Medication, MedicationCategory } from '@prisma/client';
import { prisma } from '../../config/database';
import { PaginatedResult } from '../../shared/types';

export interface MedicationFilters {
  page: number;
  limit: number;
  name?: string;
  category?: MedicationCategory;
}

export class MedicationRepository {
  async findAll(filters: MedicationFilters): Promise<PaginatedResult<Medication>> {
    const { page, limit, name, category } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicationWhereInput = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(category && { category }),
    };

    const [items, total] = await Promise.all([
      prisma.medication.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.medication.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async search(q: string): Promise<Medication[]> {
    return prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Medication | null> {
    return prisma.medication.findUnique({ where: { id } });
  }

  async findBySku(sku: string, excludeId?: string): Promise<Medication | null> {
    return prisma.medication.findFirst({
      where: { sku, ...(excludeId && { NOT: { id: excludeId } }) },
    });
  }

  async create(data: Prisma.MedicationCreateInput): Promise<Medication> {
    return prisma.medication.create({ data });
  }

  async update(id: string, data: Prisma.MedicationUpdateInput): Promise<Medication> {
    return prisma.medication.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.medication.delete({ where: { id } });
  }
}
