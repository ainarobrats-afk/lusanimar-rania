import { pgTable, text, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

/**
 * RANIA V2.1 — Payments Table
 * Tracks all Xendit payment transactions.
 * Iron Rule #1: NEVER store credit card numbers or CVV.
 */
export const paymentsTable = pgTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  xenditId: text("xendit_id"),             // Xendit invoice/payment ID
  externalId: text("external_id"),         // Our external_id sent to Xendit

  // Amount
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("IDR"),

  // Method & Status
  method: text("method").notNull(),        // QRIS | VA | CC | BANK_TRANSFER
  status: text("status").notNull().default("PENDING"), // PENDING | PAID | FAILED | REFUNDED | EXPIRED

  // Payment details
  invoiceUrl: text("invoice_url"),         // Xendit hosted payment page URL
  qrCodeUrl: text("qr_code_url"),          // QRIS code image URL
  bankCode: text("bank_code"),             // For VA payments
  vaNumber: text("va_number"),             // Virtual account number
  paymentChannel: text("payment_channel"), // Xendit payment channel

  // Webhook data (for audit trail)
  webhookData: jsonb("webhook_data").$type<Record<string, unknown>>(),
  webhookReceivedAt: timestamp("webhook_received_at"),

  // Idempotency (prevent double processing — Iron Rule: only 1 PNR per webhook)
  processedWebhookIds: jsonb("processed_webhook_ids").$type<string[]>().default([]),

  // Refund tracking
  refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }),
  refundReason: text("refund_reason"),
  refundBy: text("refund_by"),             // admin user who triggered refund
  refundedAt: timestamp("refunded_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  expiredAt: timestamp("expired_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
