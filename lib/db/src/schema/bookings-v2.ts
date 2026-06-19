import { pgTable, text, timestamp, boolean, integer, real, jsonb, numeric } from "drizzle-orm/pg-core";

/**
 * RANIA V2.1 — Bookings Table
 * Tracks the full booking lifecycle:
 * SEARCH → VALIDATED → PAYMENT_PENDING → PAID → BOOKING → BOOKED
 * Any error → VERIFY (admin review, never auto-refund)
 */
export const bookingsV2Table = pgTable("bookings_v2", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  status: text("status").notNull().default("SEARCH"),

  // Flight data (ALL from API, never hardcoded)
  flightId: text("flight_id"),
  flightSource: text("flight_source"), // travelport | trip | travelpayouts
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: text("departure_date").notNull(),
  returnDate: text("return_date"),
  cabinClass: text("cabin_class").default("economy"),

  // Pricing (ALL from API — Iron Rule #4: no static prices)
  basePrice: numeric("base_price", { precision: 12, scale: 2 }),
  taxes: numeric("taxes", { precision: 12, scale: 2 }),
  fees: numeric("fees", { precision: 12, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  profitMargin: numeric("profit_margin", { precision: 12, scale: 2 }),

  // Payment
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"), // QRIS | VA | CC | BANK_TRANSFER
  paymentStatus: text("payment_status"), // PENDING | PAID | FAILED | REFUNDED | EXPIRED
  xenditInvoiceId: text("xendit_invoice_id"),
  xenditPaymentUrl: text("xendit_payment_url"),

  // Booking result
  pnr: text("pnr"),                       // PNR from Travelport
  eTicketUrl: text("e_ticket_url"),       // R2 URL: original airline e-ticket PDF
  invoiceUrl: text("invoice_url"),        // R2 URL: RANIA invoice PDF

  // Error handling (Iron Rule #3: no auto-refund)
  verifyReason: text("verify_reason"),
  verifyAt: timestamp("verify_at"),
  errorMessage: text("error_message"),

  // Passenger contact
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactWhatsapp: text("contact_whatsapp"),

  // Metadata
  data: jsonb("data").$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BookingV2 = typeof bookingsV2Table.$inferSelect;
export type InsertBookingV2 = typeof bookingsV2Table.$inferInsert;
