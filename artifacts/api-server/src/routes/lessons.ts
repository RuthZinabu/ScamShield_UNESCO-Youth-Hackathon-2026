import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, lessonsTable, quizQuestionsTable, progressTable } from "@workspace/db";
import { getAuthenticatedUserId } from "../lib/auth";
import {
  ListLessonsQueryParams,
  GetLessonParams,
  CompleteLessonParams,
  CompleteLessonBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORY_LABELS: Record<string, string> = {
  "fake-news": "Fake News",
  "online-scams": "Online Scams",
  "phishing": "Phishing",
  "social-engineering": "Social Engineering",
  "digital-privacy": "Digital Privacy",
  "ai-content": "AI-Generated Content",
  "deepfakes": "Deepfakes",
  "safe-shopping": "Safe Online Shopping",
};

const CATEGORY_ICONS: Record<string, string> = {
  "fake-news": "Newspaper",
  "online-scams": "AlertTriangle",
  "phishing": "Fish",
  "social-engineering": "Users",
  "digital-privacy": "Lock",
  "ai-content": "Bot",
  "deepfakes": "Video",
  "safe-shopping": "ShoppingCart",
};

async function getCompletedLessonIds(userId: number | null): Promise<Set<number>> {
  if (!userId) {
    return new Set();
  }

  const done = await db
    .select({ lessonId: progressTable.lessonId })
    .from(progressTable)
    .where(eq(progressTable.userId, userId));
  return new Set(done.map((d) => d.lessonId));
}

router.get("/lessons", async (req, res): Promise<void> => {
  const query = ListLessonsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category } = query.data;
  const userId = getAuthenticatedUserId(req);
  const completedIds = await getCompletedLessonIds(userId);

  let rows = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.id));
  if (category) {
    rows = rows.filter((l) => l.category === category);
  }

  const result = rows.map((l) => ({
    id: l.id,
    title: l.title,
    category: l.category,
    summary: l.summary,
    durationMinutes: l.durationMinutes,
    difficulty: l.difficulty,
    isCompleted: completedIds.has(l.id),
    completedAt: null as string | null,
  }));

  res.json(result);
});

router.get("/lessons/categories", async (req, res): Promise<void> => {
  const lessons = await db.select().from(lessonsTable);
  const completedIds = await getCompletedLessonIds(getAuthenticatedUserId(req));

  const map: Record<string, { lessonCount: number; completedCount: number }> = {};
  for (const l of lessons) {
    if (!map[l.category]) map[l.category] = { lessonCount: 0, completedCount: 0 };
    map[l.category].lessonCount++;
    if (completedIds.has(l.id)) map[l.category].completedCount++;
  }

  const categories = Object.entries(map).map(([category, counts]) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    iconName: CATEGORY_ICONS[category] ?? "BookOpen",
    ...counts,
  }));

  res.json(categories);
});

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, params.data.id));

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const quiz = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.lessonId, lesson.id))
    .orderBy(asc(quizQuestionsTable.orderIndex));

  const completedIds = await getCompletedLessonIds(getAuthenticatedUserId(req));

  res.json({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
    quiz,
  });
});

router.post("/lessons/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CompleteLessonBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const [progress] = await db
    .insert(progressTable)
    .values({
      userId,
      lessonId: params.data.id,
      quizScore: body.data.quizScore,
    })
    .returning();

  res.json(progress);
});

export default router;
