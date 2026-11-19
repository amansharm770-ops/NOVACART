import { connectDB, closeDB } from '../config/db.js';
import Product from '../models/Product.js';
import { seedProducts } from './seedData.js';

// npm run seed            -> adds demo products only if the catalogue is empty
// npm run seed -- --reset -> replaces ALL products with the demo catalogue
try {
  await connectDB();
} catch (e) {
  console.error(`Database connection failed: ${e.message}`);
  process.exit(1);
}
const reset = process.argv.includes('--reset');
if (!reset && (await Product.countDocuments()) > 0) {
  console.log('Products already exist - nothing seeded (use `npm run seed -- --reset` to replace them).');
} else {
  console.log(`Seeded ${await seedProducts({ reset })} products`);
}
await closeDB();
