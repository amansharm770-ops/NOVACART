import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../../models/Product.js';
import { validate } from '../../middleware/validate.js';
import { httpError } from '../../utils/httpError.js';

const router = Router();

const querySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  sort: z.enum(['featured', 'price_asc', 'price_desc', 'rating', 'newest']).catch('featured'),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(48).catch(12),
});
const SORTS = {
  featured: { reviews: -1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  rating: { rating: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/categories', async (_req, res) => {
  res.json({ categories: (await Product.distinct('category', { isActive: true })).sort() });
});

router.get('/', validate(querySchema, 'query'), async (req, res) => {
  const { search, category, sort, page, limit } = req.valid.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found');
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!product) throw httpError(404, 'Product not found');
  res.json({ product });
});

export default router;
