import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const FREE_SHIPPING_ABOVE = 499;
export const SHIPPING_FEE = 49;

// Cancels an order exactly once and puts the stock back.
export async function cancelOrder(orderId, allowedFrom = ['placed', 'processing']) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: { $in: allowedFrom } },
    { status: 'cancelled' },
    { returnDocument: 'after' }
  );
  if (!order) return null;
  await Promise.all(
    order.items.map((it) => Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } }))
  );
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded'; // mock refund
    await order.save();
  }
  return order;
}
