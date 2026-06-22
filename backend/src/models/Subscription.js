import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  plan: { type: String, enum: ['basic','premium','pro'], default: 'basic' },
  features: Object,
  price: Number,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active','expired','cancelled'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
