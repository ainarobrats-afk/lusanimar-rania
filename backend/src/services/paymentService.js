// Placeholder Xendit payment service
import Xendit from 'xendit-node';

const x = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY || '' });
export const xendit = x;

export const createInvoice = async (data) => {
  // Implement invoice creation
  return { success: true };
};
