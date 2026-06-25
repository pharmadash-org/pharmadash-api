import {
  createMedicationSchema,
  updateMedicationSchema,
  listMedicationsQuerySchema,
  searchQuerySchema,
} from './schema';

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString();
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

const valid = {
  name: 'Paracetamol',
  sku: 'PARA-500',
  category: 'Analgesico',
  price: 4.5,
  stock: 10,
  expiryDate: futureDate,
};

describe('createMedicationSchema', () => {
  it('accepts a valid medication', () => {
    expect(createMedicationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects name shorter than 3', () => {
    const r = createMedicationSchema.safeParse({ ...valid, name: 'ab' });
    expect(r.success).toBe(false);
  });

  it('rejects sku shorter than 3', () => {
    expect(createMedicationSchema.safeParse({ ...valid, sku: 'a' }).success).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(createMedicationSchema.safeParse({ ...valid, category: 'Nope' }).success).toBe(false);
  });

  it('rejects non-positive price', () => {
    expect(createMedicationSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
  });

  it('rejects negative stock', () => {
    expect(createMedicationSchema.safeParse({ ...valid, stock: -1 }).success).toBe(false);
  });

  it('rejects non-integer stock', () => {
    expect(createMedicationSchema.safeParse({ ...valid, stock: 1.5 }).success).toBe(false);
  });

  it('rejects a past expiryDate', () => {
    expect(createMedicationSchema.safeParse({ ...valid, expiryDate: pastDate }).success).toBe(false);
  });
});

describe('updateMedicationSchema', () => {
  it('allows partial fields', () => {
    expect(updateMedicationSchema.safeParse({ price: 9 }).success).toBe(true);
  });

  it('still validates provided fields', () => {
    expect(updateMedicationSchema.safeParse({ name: 'x' }).success).toBe(false);
  });
});

describe('listMedicationsQuerySchema', () => {
  it('applies defaults', () => {
    const r = listMedicationsQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(10);
  });

  it('coerces string numbers', () => {
    const r = listMedicationsQuerySchema.parse({ page: '2', limit: '50' });
    expect(r.page).toBe(2);
    expect(r.limit).toBe(50);
  });

  it('rejects limit over 100', () => {
    expect(listMedicationsQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('rejects page below 1', () => {
    expect(listMedicationsQuerySchema.safeParse({ page: '0' }).success).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('requires q', () => {
    expect(searchQuerySchema.safeParse({ q: '' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'para' }).success).toBe(true);
  });
});
