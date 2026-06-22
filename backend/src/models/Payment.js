import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  amount: Number,
  currency: String,
  method: String,
  status: { type: String, enum: ['pending','success','failed','refunded'], default: 'pending' },
  xenditInvoiceId: String,
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
