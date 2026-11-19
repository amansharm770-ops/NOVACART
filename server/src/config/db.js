import mongoose from 'mongoose';
import { env } from './env.js';
import Product from '../models/Product.js';
import { seedProducts } from '../scripts/seedData.js';

let memoryServer;

// MONGODB_URI set  -> use it (Atlas / local mongod).
// MONGODB_URI empty -> development only: temporary in-memory MongoDB with demo products.
export async function connectDB() {
  mongoose.set('strictQuery', true);

  if (env.MONGODB_URI) {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');
    return;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri('novacart'));
  console.log('Using temporary in-memory MongoDB (data is lost on restart). Set MONGODB_URI to persist.');
  if ((await Product.countDocuments()) === 0) {
    console.log(`Seeded ${await seedProducts()} demo products`);
  }
}

export async function closeDB() {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
