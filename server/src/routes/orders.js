import { Router } from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { httpError } from '../utils/httpError.js';
import { FREE_SHIPPING_ABOVE, SHIPPING_FEE, cancelOrder } from '../services/orderService.js';

const router = Router();
router.use(requireAuth);

const orderSchema = z.object({
  items: z
    .array(z.object({
      productId: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid product'),
      qty: z.number().int().min(1).max(10),
    }))
    .min(1, 'Your cart is empty')
    .max(30),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    line1: z.string().trim().min(3).max(120),
    line2: z.string().trim().max(120).optional().default(''),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  }),
  paymentMethod: z.enum(['cod', 'mock_upi', 'mock_card']),
});

router.post('/', validate(orderSchema), async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.valid.body;

  // Merge duplicate lines; price everything from the DB, never from the client.
  const wanted = new Map();
  for (const i of items) wanted.set(i.productId, (wanted.get(i.productId) || 0) + i.qty);

  const products = await Product.find({ _id: { $in: [...wanted.keys()] }, isActive: true });
  if (products.length !== wanted.size) throw httpError(400, 'Some items are no longer available');

  const reserved = [];
  try {
    for (const p of products) {
      const qty = wanted.get(String(p._id));
      if (qty > 10) throw httpError(400, `You can order at most 10 of "${p.name}"`);
      // Atomic: decrements only if enough stock is left, so two buyers can't oversell.
      const r = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (r.modifiedCount !== 1) throw httpError(409, `Not enough stock for "${p.name}"`);
      reserved.push({ id: p._id, qty });
    }

    const lines = products.map((p) => ({
      product: p._id, name: p.name, image: p.images?.[0] || '', price: p.price, qty: wanted.get(String(p._id)),
    }));
    const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
    const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
    const isMock = paymentMethod !== 'cod';

    const order = await Order.create({
      user: req.user._id, items: lines, shippingAddress, subtotal, shipping, total: subtotal + shipping,
      paymentMethod,
      paymentStatus: isMock ? 'paid' : 'pending', // demo gateway: always succeeds
      paymentRef: isMock ? `MOCK-${crypto.randomBytes(5).toString('hex').toUpperCase()}` : undefined,
    });
    res.status(201).json({ order });
  } catch (err) {
    await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } })));
    throw err;
  }
});

router.get('/mine', async (req, res) => {
  res.json({ orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean() });
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) throw httpError(404, 'Order not found');
  res.json({ order });
});

router.post('/:id/cancel', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Order not found');
  const owned = await Order.exists({ _id: req.params.id, user: req.user._id });
  if (!owned) throw httpError(404, 'Order not found');
  const order = await cancelOrder(req.params.id);
  if (!order) throw httpError(409, 'This order can no longer be cancelled');
  res.json({ order });
});

export default router;
