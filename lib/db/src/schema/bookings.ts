import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"),
  passengerName: text("passenger_name"),
  email: text("email"),
  phone: text("phone"),
  fromCode: text("from_code").notNull(),
  toCode: text("to_code").notNull(),
  flightDate: text("flight_date"),
  airline: text("airline"),
  totalPrice: text("total_price"),
  currency: text("currency").default("USD"),
  fraudScore: integer("fraud_score").default(0),
  fraudFlags: jsonb("fraud_flags").$type<string[]>().default([]),
  fraudAction: text("fraud_action").default("allow"),
  reviewFlag: boolean("review_flag").default(false),
  data: jsonb("data").$type<Record<string, unknown>>().default({}),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
