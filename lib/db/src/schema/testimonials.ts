import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  quote: text("quote").notNull(),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createTestimonialSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional().default(""),
  quote: z.string().trim().min(10).max(500),
});

export const listTestimonialsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
