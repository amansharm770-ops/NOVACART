import { readFileSync } from 'fs';
import Product from '../models/Product.js';

const products = JSON.parse(readFileSync(new URL('./_products.json', import.meta.url), 'utf8'));

export async function seedProducts({ reset = false } = {}) {
  if (reset) await Product.deleteMany({});
  await Product.insertMany(products);
  return products.length;
}
