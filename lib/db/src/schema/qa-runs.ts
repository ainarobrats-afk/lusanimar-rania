import { pgTable, text, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

export const testRunsTable = pgTable("test_runs", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  trigger: text("trigger").notNull().default("manual"),
  durationMs: integer("duration_ms").default(0),
  totalTests: integer("total_tests").default(0),
  passCount: integer("pass_count").default(0),
  warnCount: integer("warn_count").default(0),
  failCount: integer("fail_count").default(0),
  passRate: real("pass_rate").default(0),
  otaScore: real("ota_score").default(0),
  otaStatus: text("ota_status").default("PENDING"),
  regressionDetected: boolean("regression_detected").default(false),
  regressionDetails: jsonb("regression_details").$type<Record<string, unknown>>().default({}),
  categoryScores: jsonb("category_scores").$type<Record<string, number>>().default({}),
  executiveReport: jsonb("executive_report").$type<Record<string, unknown>>().default({}),
  status: text("status").default("running"),
});

export const testResultsTable = pgTable("test_results", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms").default(0),
  detail: text("detail"),
  query: text("query"),
  response: text("response"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const testFailuresTable = pgTable("test_failures", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  testId: text("test_id"),
  category: text("category").notNull(),
  name: text("name").notNull(),
  query: text("query"),
  expected: text("expected"),
  actual: text("actual"),
  error: text("error"),
  component: text("component"),
  rootCause: text("root_cause"),
  confidence: real("confidence").default(0.5),
  recommendedFix: text("recommended_fix"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const improvementRecsTable = pgTable("improvement_recs", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  area: text("area").notNull(),
  priority: text("priority").notNull(),
  suggestion: text("suggestion").notNull(),
  autoFixable: boolean("auto_fixable").default(false),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TestRun = typeof testRunsTable.$inferSelect;
export type InsertTestRun = typeof testRunsTable.$inferInsert;
export type TestResult = typeof testResultsTable.$inferSelect;
export type TestFailure = typeof testFailuresTable.$inferSelect;
export type ImprovementRec = typeof improvementRecsTable.$inferSelect;
