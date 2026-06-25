import { createSaleSchema } from './schema';

const uuid = '11111111-1111-1111-1111-111111111111';

describe('createSaleSchema', () => {
  it('accepts a valid sale', () => {
    const r = createSaleSchema.safeParse({ items: [{ medicationId: uuid, quantity: 2 }] });
    expect(r.success).toBe(true);
  });

  it('rejects empty items', () => {
    expect(createSaleSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it('rejects non-uuid medicationId', () => {
    expect(
      createSaleSchema.safeParse({ items: [{ medicationId: 'x', quantity: 1 }] }).success,
    ).toBe(false);
  });

  it('rejects quantity below 1', () => {
    expect(
      createSaleSchema.safeParse({ items: [{ medicationId: uuid, quantity: 0 }] }).success,
    ).toBe(false);
  });

  it('rejects non-integer quantity', () => {
    expect(
      createSaleSchema.safeParse({ items: [{ medicationId: uuid, quantity: 1.5 }] }).success,
    ).toBe(false);
  });
});
