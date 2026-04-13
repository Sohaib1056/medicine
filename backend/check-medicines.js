// Script to check existing medicines in pharmacy inventory
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hospital_dev';

async function checkMedicines() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const collection = db.collection('pharmacy_inventoryitems');
    
    const medicines = await collection.find({}).toArray();
    console.log(`Total medicines: ${medicines.length}\n`);
    
    if (medicines.length === 0) {
      console.log('No medicines found in database.');
      return;
    }
    
    console.log('Existing medicines:');
    console.log('='.repeat(80));
    medicines.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name}`);
      console.log(`   Category: ${med.category || 'N/A'}`);
      console.log(`   Price: Rs. ${med.lastSalePerUnit || 0}`);
      console.log(`   Stock: ${med.onHand || 0} units`);
      console.log(`   Expiry: ${med.earliestExpiry || 'N/A'}`);
      console.log(`   In Stock: ${med.onHand > 0 ? 'YES' : 'NO'}`);
      console.log('-'.repeat(80));
    });
    
  } catch (error) {
    console.error('Error checking medicines:', error);
  } finally {
    await client.close();
  }
}

checkMedicines();
