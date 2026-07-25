import { Router, type IRouter } from "express";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import {
  ListReportsQueryParams,
  CreateReportBody,
  GetReportParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  const query = ListReportsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, search, limit = 20, offset = 0 } = query.data;

  let rows = await db
    .select()
    .from(reportsTable)
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (category) {
    rows = rows.filter((r) => r.category === category);
  }
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s)
    );
  }

  res.json(rows);
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      country: parsed.data.country ?? null,
      language: parsed.data.language ?? null,
      evidenceUrl: parsed.data.evidenceUrl ?? null,
    })
    .returning();

  res.status(201).json(report);
});

router.get("/reports/trending", async (_req, res): Promise<void> => {
  const all = await db.select().from(reportsTable);

  const countMap: Record<string, number> = {};
  for (const r of all) {
    countMap[r.category] = (countMap[r.category] ?? 0) + 1;
  }

  const topCategories = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  const recentReports = await db
    .select()
    .from(reportsTable)
    .orderBy(desc(reportsTable.createdAt))
    .limit(5);

  res.json({ topCategories, recentReports });
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(report);
});

export default router;
