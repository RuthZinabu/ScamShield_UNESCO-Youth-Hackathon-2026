import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  ListAnalysesQueryParams,
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
  ToggleAnalysisBookmarkParams,
  ToggleAnalysisBookmarkBody,
} from "@workspace/api-zod";
import { runMILAnalysis } from "../lib/mil-analysis";

const router: IRouter = Router();

router.get("/analyses", async (req, res): Promise<void> => {
  const query = ListAnalysesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { bookmarked, limit = 20, offset = 0 } = query.data;

  let q = db.select().from(analysesTable).orderBy(desc(analysesTable.createdAt));

  const rows = await db
    .select()
    .from(analysesTable)
    .where(bookmarked !== undefined ? eq(analysesTable.isBookmarked, bookmarked) : undefined)
    .orderBy(desc(analysesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(rows);
});

router.post("/analyses", async (req, res): Promise<void> => {
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { contentType, inputText, sourceUrl, responseLanguage } = parsed.data;

  // Run AI analysis
  let result = null;
  let warningSignCount = 0;
  let trustIndicatorCount = 0;
  let status = "completed";

  try {
    result = await runMILAnalysis(contentType, inputText, responseLanguage);
    warningSignCount = result.warningSigns?.length ?? 0;
    trustIndicatorCount = result.trustIndicators?.length ?? 0;
  } catch (err) {
    req.log.error({ err }, "Analysis AI call failed");
    status = "failed";
  }

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      contentType,
      inputText,
      sourceUrl: sourceUrl ?? null,
      status,
      result,
      warningSignCount,
      trustIndicatorCount,
    })
    .returning();

  res.status(201).json(analysis);
});

router.get("/analyses/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(analysesTable);
  const total = all.length;
  const bookmarked = all.filter((a) => a.isBookmarked).length;

  const countMap: Record<string, number> = {};
  for (const a of all) {
    countMap[a.contentType] = (countMap[a.contentType] ?? 0) + 1;
  }
  const byContentType = Object.entries(countMap).map(([contentType, count]) => ({ contentType, count }));

  res.json({ total, bookmarked, byContentType });
});

router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(analysis);
});

router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/analyses/:id/bookmark", async (req, res): Promise<void> => {
  const params = ToggleAnalysisBookmarkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ToggleAnalysisBookmarkBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(analysesTable)
    .set({ isBookmarked: body.data.isBookmarked })
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(updated);
});

export default router;
