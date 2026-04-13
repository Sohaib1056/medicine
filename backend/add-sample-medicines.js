// Script to add sample medicines to pharmacy inventory
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hospital_dev';

const sampleMedicines = [
  {
    key: "panadol 500mg",
    name: "Panadol 500mg",
    category: "Pain Relief",
    manufacturer: "GSK",
    brand: "Panadol",
    genericName: "Paracetamol",
    unitType: "Tablet",
    unitsPerPack: 10,
    onHand: 100,
    minStock: 20,
    lastSalePerUnit: 10,
    lastSalePerPack: 100,
    lastBuyPerUnit: 7,
    lastBuyPerPack: 70,
    defaultDiscountPct: 10,
    narcotic: false,
    image: "",
    description: "Effective pain relief and fever reducer. Contains paracetamol for fast relief.",
    earliestExpiry: "2026-12-31",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "brufen 400mg",
    name: "Brufen 400mg",
    category: "Pain Relief",
    manufacturer: "Abbott",
    brand: "Brufen",
    genericName: "Ibuprofen",
    unitType: "Tablet",
    unitsPerPack: 20,
    onHand: 75,
    minStock: 15,
    lastSalePerUnit: 15,
    lastSalePerPack: 300,
    lastBuyPerUnit: 10,
    lastBuyPerPack: 200,
    defaultDiscountPct: 5,
    narcotic: false,
    image: "",
    description: "Anti-inflammatory pain reliever for headaches, muscle pain, and fever.",
    earliestExpiry: "2026-06-30",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "augmentin 625mg",
    name: "Augmentin 625mg",
    category: "Antibiotics",
    manufacturer: "GSK",
    brand: "Augmentin",
    genericName: "Amoxicillin + Clavulanic Acid",
    unitType: "Tablet",
    unitsPerPack: 6,
    onHand: 30,
    minStock: 10,
    lastSalePerUnit: 45,
    lastSalePerPack: 270,
    lastBuyPerUnit: 35,
    lastBuyPerPack: 210,
    defaultDiscountPct: 0,
    narcotic: true,
    image: "",
    description: "Broad-spectrum antibiotic for bacterial infections. Prescription required.",
    earliestExpiry: "2025-12-31",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "vitamin d3 1000iu",
    name: "Vitamin D3 1000IU",
    category: "Vitamins",
    manufacturer: "Nature's Bounty",
    brand: "Nature's Bounty",
    genericName: "Cholecalciferol",
    unitType: "Capsule",
    unitsPerPack: 30,
    onHand: 85,
    minStock: 20,
    lastSalePerUnit: 25,
    lastSalePerPack: 750,
    lastBuyPerUnit: 18,
    lastBuyPerPack: 540,
    defaultDiscountPct: 15,
    narcotic: false,
    image: "",
    description: "Essential vitamin D supplement for bone health and immunity.",
    earliestExpiry: "2027-03-31",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "omron bp monitor hem-7121",
    name: "Omron BP Monitor HEM-7121",
    category: "Medical Devices",
    manufacturer: "Omron",
    brand: "Omron",
    genericName: "",
    unitType: "Device",
    unitsPerPack: 1,
    onHand: 15,
    minStock: 5,
    lastSalePerUnit: 3500,
    lastSalePerPack: 3500,
    lastBuyPerUnit: 2800,
    lastBuyPerPack: 2800,
    defaultDiscountPct: 20,
    narcotic: false,
    image: "",
    description: "Automatic blood pressure monitor with advanced accuracy technology.",
    earliestExpiry: "2030-12-31",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "disprin 300mg",
    name: "Disprin 300mg",
    category: "Pain Relief",
    manufacturer: "Reckitt Benckiser",
    brand: "Disprin",
    genericName: "Aspirin",
    unitType: "Tablet",
    unitsPerPack: 12,
    onHand: 60,
    minStock: 15,
    lastSalePerUnit: 8,
    lastSalePerPack: 96,
    lastBuyPerUnit: 5,
    lastBuyPerPack: 60,
    defaultDiscountPct: 0,
    narcotic: false,
    image: "",
    description: "Fast-acting pain relief and fever reducer. Soluble tablets.",
    earliestExpiry: "2026-09-30",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "calpol 120mg syrup",
    name: "Calpol 120mg Syrup",
    category: "Pain Relief",
    manufacturer: "GSK",
    brand: "Calpol",
    genericName: "Paracetamol",
    unitType: "Syrup",
    unitsPerPack: 1,
    onHand: 45,
    minStock: 10,
    lastSalePerUnit: 85,
    lastSalePerPack: 85,
    lastBuyPerUnit: 65,
    lastBuyPerPack: 65,
    defaultDiscountPct: 5,
    narcotic: false,
    image: "",
    description: "Paracetamol syrup for children. Strawberry flavored.",
    earliestExpiry: "2026-08-31",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: "multivitamin tablets",
    name: "Multivitamin Tablets",
    category: "Vitamins",
    manufacturer: "Centrum",
    brand: "Centrum",
    genericName: "Multivitamin Complex",
    unitType: "Tablet",
    unitsPerPack: 30,
    onHand: 50,
    minStock: 15,
    lastSalePerUnit: 30,
    lastSalePerPack: 900,
    lastBuyPerUnit: 22,
    lastBuyPerPack: 660,
    defaultDiscountPct: 10,
    narcotic: false,
    image: "",
    description: "Complete multivitamin and mineral supplement for daily health.",
    earliestExpiry: "2027-06-30",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addSampleMedicines() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('pharmacy_inventoryitems');
    
    // Check if medicines already exist
    const existingCount = await collection.countDocuments();
    console.log(`Existing medicines: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('Medicines already exist. Skipping insertion.');
      console.log('If you want to add more, delete existing ones first or modify the script.');
      return;
    }
    
    // Insert sample medicines
    const result = await collection.insertMany(sampleMedicines);
    console.log(`✅ Successfully inserted ${result.insertedCount} sample medicines!`);
    
    // Display inserted medicines
    console.log('\nInserted medicines:');
    sampleMedicines.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} - Rs. ${med.lastSalePerUnit} (Stock: ${med.onHand})`);
    });
    
  } catch (error) {
    console.error('Error adding sample medicines:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

addSampleMedicines();
