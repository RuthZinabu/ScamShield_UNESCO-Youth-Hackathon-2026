import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, analysesTable, progressTable, lessonsTable } from "@workspace/db";

const router: IRouter = Router();

function calcLiteracyScore(
  analysesCount: number,
  lessonsCount: number,
  avgQuiz: number | null
): number {
  const baseFromAnalyses = Math.min(analysesCount * 5, 30);
  const baseFromLessons = Math.min(lessonsCount * 8, 40);
  const baseFromQuiz = avgQuiz != null ? Math.round((avgQuiz / 100) * 30) : 0;
  return Math.min(baseFromAnalyses + baseFromLessons + baseFromQuiz, 100);
}

function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let current = today.getTime();

  for (const d of sorted) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === current) {
      streak++;
      current -= 86400000;
    } else if (day.getTime() < current) {
      break;
    }
  }
  return streak;
}

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const analyses = await db.select().from(analysesTable);
  const progress = await db.select().from(progressTable);

  const analysesCompleted = analyses.length;
  const lessonsFinished = progress.length;

  let avgQuizScore: number | null = null;
  if (progress.length > 0) {
    const sum = progress.reduce((acc, p) => acc + p.quizScore, 0);
    avgQuizScore = Math.round(sum / progress.length);
  }

  const allDates = [
    ...analyses.map((a) => a.createdAt),
    ...progress.map((p) => p.completedAt),
  ];
  const currentStreak = calcStreak(allDates);
  const literacyScore = calcLiteracyScore(analysesCompleted, lessonsFinished, avgQuizScore);

  // Static achievements for demo
  const achievements = [];
  if (analysesCompleted >= 1) {
    achievements.push({
      id: 1,
      title: "First Analysis",
      description: "Completed your first content analysis",
      iconName: "Search",
      earnedAt: analyses[0]?.createdAt?.toISOString() ?? null,
    });
  }
  if (lessonsFinished >= 1) {
    achievements.push({
      id: 2,
      title: "Eager Learner",
      description: "Completed your first lesson",
      iconName: "BookOpen",
      earnedAt: progress[0]?.completedAt?.toISOString() ?? null,
    });
  }
  if (literacyScore >= 50) {
    achievements.push({
      id: 3,
      title: "Digital Defender",
      description: "Reached a literacy score of 50",
      iconName: "Shield",
      earnedAt: new Date().toISOString(),
    });
  }

  res.json({
    analysesCompleted,
    lessonsFinished,
    averageQuizScore: avgQuizScore,
    currentStreak,
    literacyScore,
    achievements,
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  const recentAnalyses = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(5);

  const recentProgress = await db
    .select({ id: progressTable.id, lessonId: progressTable.lessonId, completedAt: progressTable.completedAt })
    .from(progressTable)
    .orderBy(desc(progressTable.completedAt))
    .limit(5);

  const lessonMap: Record<number, string> = {};
  if (recentProgress.length > 0) {
    const lessons = await db.select().from(lessonsTable);
    for (const l of lessons) lessonMap[l.id] = l.title;
  }

  const items: Array<{ id: number; type: string; title: string; description: string; createdAt: string }> = [];

  for (const a of recentAnalyses) {
    items.push({
      id: a.id,
      type: "analysis",
      title: `Analysed ${a.contentType} content`,
      description: a.inputText.slice(0, 80) + (a.inputText.length > 80 ? "…" : ""),
      createdAt: a.createdAt.toISOString(),
    });
  }

  for (const p of recentProgress) {
    items.push({
      id: p.id + 10000,
      type: "lesson",
      title: `Completed lesson`,
      description: lessonMap[p.lessonId] ?? `Lesson #${p.lessonId}`,
      createdAt: p.completedAt.toISOString(),
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(items.slice(0, 10));
});

export default router;
