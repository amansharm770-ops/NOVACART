import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  ip: String,
  userAgent: String,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo cleans up expired tokens

export default mongoose.model('RefreshToken', schema);
