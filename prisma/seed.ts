import { PrismaClient, MedicationCategory } from '@prisma/client';

const prisma = new PrismaClient();

const medications = [
  { name: 'Paracetamol 500mg', sku: 'PARA-500', category: MedicationCategory.Analgesico, price: 4.5, stock: 200, daysToExpiry: 365, description: 'Analgésico y antipirético de uso general' },
  { name: 'Ibuprofeno 400mg', sku: 'IBUP-400', category: MedicationCategory.Antiinflamatorio, price: 6.0, stock: 150, daysToExpiry: 400, description: 'Antiinflamatorio no esteroideo' },
  { name: 'Amoxicilina 500mg', sku: 'AMOX-500', category: MedicationCategory.Antibiotico, price: 12.0, stock: 80, daysToExpiry: 180, description: 'Antibiótico de amplio espectro' },
  { name: 'Enalapril 10mg', sku: 'ENAL-10', category: MedicationCategory.Antihipertensivo, price: 8.5, stock: 5, daysToExpiry: 500, description: 'Inhibidor de la ECA para hipertensión' },
  { name: 'Metformina 850mg', sku: 'METF-850', category: MedicationCategory.Antidiabetico, price: 9.0, stock: 3, daysToExpiry: 600, description: 'Antidiabético oral biguanida' },
  { name: 'Vitamina C 1000mg', sku: 'VITC-1000', category: MedicationCategory.Vitamina, price: 5.5, stock: 300, daysToExpiry: 730, description: 'Suplemento de ácido ascórbico' },
  { name: 'Loratadina 10mg', sku: 'LORA-10', category: MedicationCategory.Antihistaminico, price: 7.0, stock: 120, daysToExpiry: 450, description: 'Antihistamínico no sedante' },
  { name: 'Omeprazol 20mg', sku: 'OMEP-20', category: MedicationCategory.Antiacido, price: 10.0, stock: 8, daysToExpiry: 25, description: 'Inhibidor de la bomba de protones' },
  { name: 'Sertralina 50mg', sku: 'SERT-50', category: MedicationCategory.Antidepresivo, price: 15.0, stock: 60, daysToExpiry: 300, description: 'Antidepresivo ISRS' },
  { name: 'Aspirina 100mg', sku: 'ASPI-100', category: MedicationCategory.Analgesico, price: 3.5, stock: 250, daysToExpiry: 365, description: 'Antiagregante plaquetario' },
  { name: 'Ciprofloxacino 500mg', sku: 'CIPRO-500', category: MedicationCategory.Antibiotico, price: 18.0, stock: 40, daysToExpiry: 200, description: 'Antibiótico fluoroquinolona' },
  { name: 'Amlodipino 5mg', sku: 'AMLO-5', category: MedicationCategory.Antihipertensivo, price: 11.0, stock: 7, daysToExpiry: 550, description: 'Bloqueador de canales de calcio' },
  { name: 'Glibenclamida 5mg', sku: 'GLIB-5', category: MedicationCategory.Antidiabetico, price: 6.5, stock: 90, daysToExpiry: 400, description: 'Sulfonilurea antidiabética' },
  { name: 'Vitamina D3 2000UI', sku: 'VITD-2000', category: MedicationCategory.Vitamina, price: 8.0, stock: 2, daysToExpiry: 800, description: 'Suplemento de colecalciferol' },
  { name: 'Cetirizina 10mg', sku: 'CETI-10', category: MedicationCategory.Antihistaminico, price: 6.0, stock: 100, daysToExpiry: 500, description: 'Antihistamínico de segunda generación' },
  { name: 'Ranitidina 150mg', sku: 'RANI-150', category: MedicationCategory.Antiacido, price: 5.0, stock: 70, daysToExpiry: 20, description: 'Antagonista H2 para úlcera péptica' },
  { name: 'Fluoxetina 20mg', sku: 'FLUO-20', category: MedicationCategory.Antidepresivo, price: 14.0, stock: 45, daysToExpiry: 350, description: 'Antidepresivo ISRS de vida media larga' },
  { name: 'Naproxeno 500mg', sku: 'NAPR-500', category: MedicationCategory.Antiinflamatorio, price: 7.5, stock: 110, daysToExpiry: 420, description: 'AINE de acción prolongada' },
  { name: 'Azitromicina 500mg', sku: 'AZIT-500', category: MedicationCategory.Antibiotico, price: 22.0, stock: 9, daysToExpiry: 150, description: 'Macrólido de corta duración' },
  { name: 'Complejo B', sku: 'VITB-COMP', category: MedicationCategory.Vitamina, price: 9.5, stock: 180, daysToExpiry: 600, description: 'Vitaminas del grupo B combinadas' },
];

async function main(): Promise<void> {
  console.log('Seeding medications...');

  for (const med of medications) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + med.daysToExpiry);

    await prisma.medication.upsert({
      where: { sku: med.sku },
      update: {},
      create: {
        name: med.name,
        sku: med.sku,
        category: med.category,
        description: med.description,
        price: med.price,
        stock: med.stock,
        expiryDate,
      },
    });
  }

  console.log(`✅ Seeded ${medications.length} medications`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
