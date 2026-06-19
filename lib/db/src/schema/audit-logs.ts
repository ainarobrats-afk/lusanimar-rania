import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * RANIA V2.1 — Audit Logs Table
 * Tracks all actions on bookings for compliance and debugging.
 */
export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  action: text("action").notNull(),       // e.g. "SEARCH", "VALIDATE", "PAY", "BOOK", "VERIFY", "REFUND"
  actor: text("actor").notNull(),         // "user" | "system" | "admin"
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type InsertAuditLog = typeof auditLogsTable.$inferInsert;
