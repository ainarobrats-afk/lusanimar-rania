import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  startDate: Date,
  endDate: Date,
  guests: Number,
  totalPrice: Number,
  status: { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  specialRequests: String,
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
