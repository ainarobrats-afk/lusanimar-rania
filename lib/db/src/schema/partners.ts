import { pgTable, text, timestamp, boolean, integer, real, jsonb } from "drizzle-orm/pg-core";

export const partnersTable = pgTable("partners", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending_review"),
  category: text("category").notNull(),
  businessName: text("business_name").notNull(),
  city: text("city").notNull(),
  country: text("country").default("Timor-Leste"),
  whatsapp: text("whatsapp").notNull(),
  email: text("email"),
  description: text("description"),
  pricingRange: text("pricing_range"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  website: text("website"),
  googleMapsLink: text("google_maps_link"),
  promoText: text("promo_text"),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  images: jsonb("images").$type<string[]>().default([]),
  featured: boolean("featured").default(false),
  views: integer("views").default(0),
  whatsappClicks: integer("whatsapp_clicks").default(0),
  inquiryCount: integer("inquiry_count").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  data: jsonb("data").$type<Record<string, unknown>>().default({}),
});

export type Partner = typeof partnersTable.$inferSelect;
export type InsertPartner = typeof partnersTable.$inferInsert;
