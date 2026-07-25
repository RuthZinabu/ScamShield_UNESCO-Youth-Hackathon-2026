import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // fake-news | online-scams | phishing | social-engineering | digital-privacy | ai-content | deepfakes | safe-shopping
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(10),
  difficulty: text("difficulty").notNull().default("beginner"), // beginner | intermediate | advanced
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestionsTable).omit({ id: true });

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
