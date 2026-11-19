import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  { fullName: String, phone: String, line1: String, line2: String, city: String, state: String, pincode: String },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        image: String,
        price: Number,
        qty: Number,
      },
    ],
    shippingAddress: addressSchema,
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cod', 'mock_upi', 'mock_card'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    paymentRef: String,
    status: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'placed', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
