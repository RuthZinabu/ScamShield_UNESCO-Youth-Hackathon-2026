import { pgTable, serial, text, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(), // text | url | social-media | email | job | scholarship | news | general
  inputText: text("input_text").notNull(),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("completed"), // pending | completed | failed
  isBookmarked: boolean("is_bookmarked").notNull().default(false),
  warningSignCount: integer("warning_sign_count"),
  trustIndicatorCount: integer("trust_indicator_count"),
  result: jsonb("result"), // AnalysisResult JSON
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
