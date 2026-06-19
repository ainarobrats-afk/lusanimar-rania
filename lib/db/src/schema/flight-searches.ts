import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

/**
 * RANIA V2.1 — Flight Searches Table
 * Caches flight search results from real APIs.
 * Iron Rule #4: ALL prices must come from API, never static.
 */
export const flightSearchesTable = pgTable("flight_searches", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  origin: text("origin").notNull(),         // IATA code
  destination: text("destination").notNull(), // IATA code
  departureDate: text("departure_date").notNull(),
  returnDate: text("return_date"),
  passengers: integer("passengers").default(1),
  cabinClass: text("cabin_class").default("economy"),

  // Search results from real APIs
  results: jsonb("results").$type<Array<{
    id: string;
    source: string; // travelport | trip | travelpayouts
    airline: string;
    airlineCode: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    price: number;
    taxes: number;
    fees: number;
    totalPrice: number;
    currency: string;
    available: boolean;
    lastUpdated: string;
  }>>().default([]),

  // Which API sources were queried
  sources: jsonb("sources").$type<string[]>().default([]),
  totalResults: integer("total_results").default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Results expire after this time
});

export type FlightSearch = typeof flightSearchesTable.$inferSelect;
export type InsertFlightSearch = typeof flightSearchesTable.$inferInsert;
