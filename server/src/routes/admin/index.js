import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { httpError } from '../../utils/httpError.js';
import { audit } from '../../services/audit.js';
import { cancelOrder } from '../../services/orderService.js';
import { escapeRegex } from '../public/products.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(50).catch(10),
  search: z.string().trim().max(80).optional(),
  status: z.string().trim().max(20).optional(),
});
const paged = (total, page, limit) => ({ total, page, pages: Math.max(1, Math.ceil(total / limit)) });
const checkId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Not found');
};

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  category: z.string().trim().min(2).max(40),
  price: z.number().min(0).max(10_000_000),
  oldPrice: z.number().min(0).max(10_000_000).optional().default(0),
  stock: z.number().int().min(0).max(1_000_000),
  images: z.array(z.string().trim().url().max(500)).max(8).optional().default([]),
  tag: z.string().trim().max(24).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

router.get('/stats', async (_req, res) => {
  const [users, products, orders, revenue, byStatus, lowStock, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.find({ isActive: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select('name stock').lean(),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
  ]);
  res.json({
    users, products, orders,
    revenue: revenue[0]?.total || 0,
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    lowStock, recentOrders,
  });
});

// ---- Products (soft delete: order history keeps pointing at real products)
router.get('/products', validate(pageSchema, 'query'), async (req, res) => {
  const { page, limit, search } = req.valid.query;
  const filter = search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ items, ...paged(total, page, limit) });
});

router.post('/products', validate(productSchema), async (req, res) => {
  const product = await Product.create(req.valid.body);
  await audit(req, 'product.create', 'product', product._id, { name: product.name });
  res.status(201).json({ product });
});

router.put('/products/:id', validate(productSchema), async (req, res) => {
  checkId(req.params.id);
  const product = await Product.findByIdAndUpdate(req.params.id, req.valid.body, { returnDocument: 'after', runValidators: true });
  if (!product) throw httpError(404, 'Product not found');
  await audit(req, 'product.update', 'product', product._id, { name: product.name });
  res.json({ product });
});

router.delete('/products/:id', async (req, res) => {
  checkId(req.params.id);
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
  if (!product) throw httpError(404, 'Product not found');
  await audit(req, 'product.delete', 'product', product._id, { name: product.name });
  res.json({ product });
});

// ---- Orders
router.get('/orders', validate(pageSchema, 'query'), async (req, res) => {
  const { page, limit, status } = req.valid.query;
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, ...paged(total, page, limit) });
});

router.patch('/orders/:id/status', validate(z.object({ status: z.enum(['placed', 'processing', 'shipped', 'delivered', 'cancelled']) })), async (req, res) => {
  checkId(req.params.id);
  const { status } = req.valid.body;
  const current = await Order.findById(req.params.id);
  if (!current) throw httpError(404, 'Order not found');
  if (['cancelled', 'delivered'].includes(current.status)) throw httpError(409, `A ${current.status} order cannot be changed`);

  const prevStatus = current.status;
  let order;
  if (status === 'cancelled') {
    order = await cancelOrder(current._id, ['placed', 'processing', 'shipped']); // restocks + refunds
    if (!order) throw httpError(409, 'Order could not be cancelled');
  } else {
    current.status = status;
    if (status === 'delivered' && current.paymentMethod === 'cod') current.paymentStatus = 'paid'; // cash collected
    order = await current.save();
  }
  await audit(req, 'order.status', 'order', order._id, { from: prevStatus, to: status });
  res.json({ order });
});

// ---- Users
router.get('/users', validate(pageSchema, 'query'), async (req, res) => {
  const { page, limit, search } = req.valid.query;
  const filter = search
    ? { $or: [{ name: { $regex: escapeRegex(search), $options: 'i' } }, { email: { $regex: escapeRegex(search), $options: 'i' } }] }
    : {};
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ items, ...paged(total, page, limit) });
});

router.patch('/users/:id', validate(z.object({ isActive: z.boolean() })), async (req, res) => {
  checkId(req.params.id);
  const target = await User.findById(req.params.id);
  if (!target) throw httpError(404, 'User not found');
  if (target.role === 'admin') throw httpError(403, 'Admin accounts cannot be changed here');
  target.isActive = req.valid.body.isActive;
  await target.save();
  await audit(req, target.isActive ? 'user.enable' : 'user.disable', 'user', target._id, { email: target.email });
  res.json({ user: { _id: target._id, isActive: target.isActive } });
});

// ---- Audit log
router.get('/audit', validate(pageSchema, 'query'), async (req, res) => {
  const { page, limit } = req.valid.query;
  const [items, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(),
  ]);
  res.json({ items, ...paged(total, page, limit) });
});

export default router;
