import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: String,
  description: String,
  address: String,
  phone: String,
  email: String,
  logo: String,
  coverImage: String,
  categories: [String],
  rating: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema);
