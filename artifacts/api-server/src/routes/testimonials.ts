import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { getAuthenticatedUserId } from "../lib/auth";
import { z } from "zod";

const createTestimonialSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional().default(""),
  quote: z.string().trim().min(10).max(500),
});

const listTestimonialsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

type TestimonialRow = {
  id: number;
  name: string;
  role: string;
  quote: string;
  createdAt: string;
};

const CREATE_TESTIMONIALS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    quote TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  )
`;

async function ensureTestimonialsTable(): Promise<void> {
  await db.execute(sql.raw(CREATE_TESTIMONIALS_TABLE_SQL));
}

const router: IRouter = Router();

router.get("/testimonials", async (req, res): Promise<void> => {
  const parsedQuery = listTestimonialsQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  await ensureTestimonialsTable();

  const limit = parsedQuery.data.limit ?? 6;
  const result = await db.execute(sql`
    SELECT id, name, role, quote, created_at AS "createdAt"
    FROM testimonials
    WHERE is_approved = TRUE
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

const rows =
  ((result as unknown) as { rows: TestimonialRow[] }).rows ?? [];
  res.json(rows);
});

router.post("/testimonials", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const parsedBody = createTestimonialSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  await ensureTestimonialsTable();

  const result = await db.execute(sql`
    INSERT INTO testimonials (user_id, name, role, quote, is_approved)
    VALUES (${userId}, ${parsedBody.data.name}, ${parsedBody.data.role}, ${parsedBody.data.quote}, TRUE)
    RETURNING id, name, role, quote, created_at AS "createdAt"
  `);

 const [testimonial] =
  (((result as unknown) as { rows: TestimonialRow[] }).rows ?? []);
  if (!testimonial) {
    res.status(500).json({ message: "Failed to save testimonial" });
    return;
  }

  res.status(201).json(testimonial);
});

export default router;
