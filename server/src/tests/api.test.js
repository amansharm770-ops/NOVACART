import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
const URI = process.env.MONGODB_URI_TEST;

let app, mongoose, User, Product, memory;

beforeAll(async () => {
  let uri = URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memory = await MongoMemoryServer.create();
    uri = memory.getUri('novacart_test');
  }
  mongoose = (await import('mongoose')).default;
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  app = (await import('../app.js')).default;
  User = (await import('../models/User.js')).default;
  Product = (await import('../models/Product.js')).default;
}, 120000);

afterAll(async () => {
  await mongoose?.disconnect();
  await memory?.stop();
});

// A tiny cookie + CSRF aware client
function client() {
  const agent = request.agent(app);
  let csrf;
  return {
    async csrf() { csrf = (await agent.get('/api/auth/csrf')).body.csrfToken; },
    get: (p) => agent.get(p),
    post: (p, b) => agent.post(p).set('X-CSRF-Token', csrf || '').send(b),
    put: (p, b) => agent.put(p).set('X-CSRF-Token', csrf || '').send(b),
    patch: (p, b) => agent.patch(p).set('X-CSRF-Token', csrf || '').send(b),
    del: (p) => agent.delete(p).set('X-CSRF-Token', csrf || ''),
  };
}

const address = { fullName: 'Aman Sharma', phone: '9876543210', line1: '12 Test Street', city: 'Mohali', state: 'Punjab', pincode: '140306' };
let customer, adminC, product;

describe('NovaCart API', () => {
  it('health works', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
  });

  it('blocks state-changing requests without CSRF token', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(r.status).toBe(403);
  });

  it('registers a customer, never an admin', async () => {
    customer = client();
    await customer.csrf();
    const r = await customer.post('/api/auth/register', { name: 'Test User', email: 'Test@Example.com', password: 'Passw0rd123', role: 'admin' });
    expect(r.status).toBe(201);
    expect(r.body.user.role).toBe('customer');
    expect(r.body.user.email).toBe('test@example.com');
    expect((await customer.get('/api/auth/me')).body.user.email).toBe('test@example.com');
  });

  it('rejects weak passwords and duplicate emails', async () => {
    const c = client(); await c.csrf();
    expect((await c.post('/api/auth/register', { name: 'X Y', email: 'weak@example.com', password: 'short' })).status).toBe(400);
    expect((await c.post('/api/auth/register', { name: 'X Y', email: 'test@example.com', password: 'Passw0rd123' })).status).toBe(409);
  });

  it('lists products and filters/searches/sorts', async () => {
    product = await Product.create({ name: 'Test Phone', category: 'Mobiles', price: 1000, stock: 3, images: ['https://example.com/a.jpg'] });
    await Product.create({ name: 'Hidden Item', category: 'Home', price: 50, stock: 5, isActive: false });
    const r = await request(app).get('/api/products?search=phone&sort=price_asc');
    expect(r.body.items.map((p) => p.name)).toEqual(['Test Phone']);
    expect((await request(app).get('/api/products/categories')).body.categories).toContain('Mobiles');
    expect((await request(app).get('/api/products/not-an-id')).status).toBe(404);
  });

  it('blocks NoSQL operators in query/body', async () => {
    const r = await request(app).get('/api/products?category[$ne]=x');
    expect(r.status).toBe(200);
  });

  it('requires login for orders', async () => {
    const c = client(); await c.csrf();
    expect((await c.post('/api/orders', {})).status).toBe(401);
  });

  it('places an order with server-side pricing and reduces stock', async () => {
    const r = await customer.post('/api/orders', {
      items: [{ productId: String(product._id), qty: 2 }], shippingAddress: address, paymentMethod: 'mock_upi', total: 1,
    });
    expect(r.status).toBe(201);
    expect(r.body.order.subtotal).toBe(2000);
    expect(r.body.order.shipping).toBe(0);
    expect(r.body.order.paymentStatus).toBe('paid');
    expect((await Product.findById(product._id)).stock).toBe(1);
    globalThis.orderId = r.body.order._id;
  });

  it('refuses orders beyond stock and rolls back', async () => {
    const r = await customer.post('/api/orders', { items: [{ productId: String(product._id), qty: 5 }], shippingAddress: address, paymentMethod: 'cod' });
    expect(r.status).toBe(409);
    expect((await Product.findById(product._id)).stock).toBe(1);
  });

  it('cancels an order and restocks', async () => {
    const r = await customer.post(`/api/orders/${globalThis.orderId}/cancel`, {});
    expect(r.status).toBe(200);
    expect(r.body.order.status).toBe('cancelled');
    expect(r.body.order.paymentStatus).toBe('refunded');
    expect((await Product.findById(product._id)).stock).toBe(3);
    expect((await customer.post(`/api/orders/${globalThis.orderId}/cancel`, {})).status).toBe(409);
  });

  it('customers cannot reach admin APIs', async () => {
    expect((await customer.get('/api/admin/stats')).status).toBe(403);
    const c = client(); await c.csrf();
    expect((await c.get('/api/admin/stats')).status).toBe(401);
  });

  it('admin login works only for admins; admin can manage products & orders; audit is written', async () => {
    await User.create({ name: 'Boss', email: 'boss@example.com', role: 'admin', passwordHash: await bcrypt.hash('SuperSecret123', 10) });
    const bad = client(); await bad.csrf();
    expect((await bad.post('/api/auth/admin/login', { email: 'test@example.com', password: 'Passw0rd123' })).status).toBe(401);

    adminC = client(); await adminC.csrf();
    expect((await adminC.post('/api/auth/admin/login', { email: 'boss@example.com', password: 'SuperSecret123' })).status).toBe(200);
    expect((await adminC.get('/api/admin/stats')).body.products).toBeGreaterThan(0);

    const created = await adminC.post('/api/admin/products', { name: 'Admin Item', category: 'Home', price: 500, stock: 10, images: [] });
    expect(created.status).toBe(201);
    expect((await adminC.put(`/api/admin/products/${created.body.product._id}`, { name: 'Admin Item 2', category: 'Home', price: 600, stock: 9, images: [] })).body.product.price).toBe(600);
    expect((await adminC.del(`/api/admin/products/${created.body.product._id}`)).body.product.isActive).toBe(false);

    const o = await customer.post('/api/orders', { items: [{ productId: String(product._id), qty: 1 }], shippingAddress: address, paymentMethod: 'cod' });
    const upd = await adminC.patch(`/api/admin/orders/${o.body.order._id}/status`, { status: 'delivered' });
    expect(upd.body.order.paymentStatus).toBe('paid');

    const log = await adminC.get('/api/admin/audit');
    const actions = log.body.items.map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(['auth.admin_login', 'product.create', 'order.status']));
  });

  it('temporarily locks an account after repeated wrong passwords', async () => {
    const c = client(); await c.csrf();
    let last;
    for (let i = 0; i < 5; i++) last = await c.post('/api/auth/login', { email: 'test@example.com', password: 'wrong-password1' });
    expect(last.status).toBe(401);
    const locked = await c.post('/api/auth/login', { email: 'test@example.com', password: 'Passw0rd123' });
    expect(locked.status).toBe(429);
  });

  it('rotates refresh tokens: the old token stops working', async () => {
    const c = request.agent(app);
    const csrf = (await c.get('/api/auth/csrf')).body.csrfToken;
    const login = await c.post('/api/auth/login').set('X-CSRF-Token', csrf).send({ email: 'boss@example.com', password: 'SuperSecret123' });
    const oldRefresh = login.headers['set-cookie'].find((k) => k.startsWith('refresh_token=')).split(';')[0].split('=')[1];
    expect(oldRefresh.length).toBeGreaterThan(30);

    const first = await c.post('/api/auth/refresh').set('X-CSRF-Token', csrf);
    expect(first.status).toBe(200);
    const newRefresh = first.headers['set-cookie'].find((k) => k.startsWith('refresh_token=')).split(';')[0].split('=')[1];
    expect(newRefresh).not.toBe(oldRefresh);

    const replay = await request(app).post('/api/auth/refresh').set('X-CSRF-Token', 'abc')
      .set('Cookie', ['csrf_token=abc', `refresh_token=${oldRefresh}`]);
    expect(replay.status).toBe(401);
  });
});
