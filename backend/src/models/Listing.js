import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  price: Number,
  currency: { type: String, default: 'USD' },
  images: [String],
  location: { address: String, city: String, country: String, coordinates: { lat: Number, lng: Number } },
  amenities: [String],
  capacity: { guests: Number, bedrooms: Number, bathrooms: Number },
  availability: { startDate: Date, endDate: Date, isAvailable: { type: Boolean, default: true } },
  ratings: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  tags: [String],
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active','pending','rejected','inactive'], default: 'pending' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);
