import { pgTable, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";

/**
 * RANIA V2.1 — Passengers Table
 * Stores passenger data including passport info from OCR.
 */
export const passengersTable = pgTable("passengers", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  fullName: text("full_name").notNull(),
  passportNumber: text("passport_number").notNull(),
  passportExpiry: text("passport_expiry").notNull(), // YYYY-MM-DD
  nationality: text("nationality").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // YYYY-MM-DD
  email: text("email"),
  phone: text("phone"),
  seatNumber: text("seat_number"),
  frequentFlyer: text("frequent_flyer"),

  // OCR result from worker-validator
  ocrResult: jsonb("ocr_result").$type<{
    rawText: string;
    confidence: number;
    fields: Record<string, { value: string; confidence: number }>;
    provider: string;
  }>(),

  // Validation status
  passportValid: text("passport_valid").default("PENDING"), // PENDING | VALID | INVALID | VERIFY
  validationErrors: jsonb("validation_errors").$type<string[]>().default([]),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Passenger = typeof passengersTable.$inferSelect;
export type InsertPassenger = typeof passengersTable.$inferInsert;
