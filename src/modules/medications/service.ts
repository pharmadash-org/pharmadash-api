import { Medication } from '@prisma/client';
import { MedicationRepository, MedicationFilters } from './repository';
import { CreateMedicationDto, UpdateMedicationDto } from './schema';
import { ConflictException, NotFoundException } from '../../shared/exceptions';
import { PaginatedResult } from '../../shared/types';

const CRITICAL_STOCK_THRESHOLD = 10;
const NEAR_EXPIRY_DAYS = 30;

export interface MedicationView extends Medication {
  isCriticalStock: boolean;
  isNearExpiry: boolean;
}

function enrich(m: Medication): MedicationView {
  const msInDay = 1000 * 60 * 60 * 24;
  const daysToExpiry = Math.floor((m.expiryDate.getTime() - Date.now()) / msInDay);
  return {
    ...m,
    isCriticalStock: m.stock < CRITICAL_STOCK_THRESHOLD,
    isNearExpiry: daysToExpiry <= NEAR_EXPIRY_DAYS,
  };
}

export class MedicationService {
  constructor(private readonly repo: MedicationRepository) {}

  async list(filters: MedicationFilters): Promise<PaginatedResult<MedicationView>> {
    const result = await this.repo.findAll(filters);
    return { ...result, items: result.items.map(enrich) };
  }

  async search(q: string): Promise<MedicationView[]> {
    const items = await this.repo.search(q);
    return items.map(enrich);
  }

  async getById(id: string): Promise<MedicationView> {
    const med = await this.repo.findById(id);
    if (!med) throw new NotFoundException('Medication', id);
    return enrich(med);
  }

  async create(dto: CreateMedicationDto): Promise<MedicationView> {
    const existing = await this.repo.findBySku(dto.sku);
    if (existing) throw new ConflictException(`SKU '${dto.sku}' already exists`);

    const med = await this.repo.create({
      ...dto,
      price: dto.price,
      expiryDate: new Date(dto.expiryDate),
    });
    return enrich(med);
  }

  async update(id: string, dto: UpdateMedicationDto): Promise<MedicationView> {
    await this.getById(id);

    if (dto.sku) {
      const existing = await this.repo.findBySku(dto.sku, id);
      if (existing) throw new ConflictException(`SKU '${dto.sku}' already exists`);
    }

    const med = await this.repo.update(id, {
      ...dto,
      ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
    });
    return enrich(med);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
  }
}
