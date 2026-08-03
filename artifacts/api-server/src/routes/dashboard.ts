import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, analysesTable, progressTable, lessonsTable, reportsTable } from "@workspace/db";
import { getAuthenticatedUserId } from "../lib/auth";

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

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const [analyses, progress, reports] = await Promise.all([
    db.select().from(analysesTable).where(eq(analysesTable.userId, userId)),
    db.select().from(progressTable).where(eq(progressTable.userId, userId)),
    db.select().from(reportsTable).where(eq(reportsTable.userId, userId)),
  ]);

  const analysesCompleted = analyses.length;
  const lessonsFinished = progress.length;
  const reportsSubmitted = reports.length;
  const totalCommunityUpvotes = reports.reduce((sum, report) => sum + report.upvoteCount, 0);

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

  const achievements = [] as Array<{
    id: number;
    title: string;
    description: string;
    iconName: string;
    earnedAt: string | null;
  }>;

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
  if (reportsSubmitted >= 1) {
    achievements.push({
      id: 3,
      title: "Community Reporter",
      description: "Submitted your first report",
      iconName: "Shield",
      earnedAt: reports[0]?.createdAt?.toISOString() ?? null,
    });
  }
  if (literacyScore >= 50) {
    achievements.push({
      id: 4,
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
    reportsSubmitted,
    totalCommunityUpvotes,
    achievementsEarned: achievements.length,
    achievements,
    badges: achievements,
  });
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const [recentAnalyses, recentProgress, recentReports] = await Promise.all([
    db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.userId, userId))
      .orderBy(desc(analysesTable.createdAt))
      .limit(5),
    db
      .select({ id: progressTable.id, lessonId: progressTable.lessonId, completedAt: progressTable.completedAt })
      .from(progressTable)
      .where(eq(progressTable.userId, userId))
      .orderBy(desc(progressTable.completedAt))
      .limit(5),
    db
      .select({ id: reportsTable.id, title: reportsTable.title, description: reportsTable.description, createdAt: reportsTable.createdAt })
      .from(reportsTable)
      .where(eq(reportsTable.userId, userId))
      .orderBy(desc(reportsTable.createdAt))
      .limit(5),
  ]);

  const lessonMap: Record<number, string> = {};
  if (recentProgress.length > 0) {
    const lessons = await db.select().from(lessonsTable);
    for (const lesson of lessons) lessonMap[lesson.id] = lesson.title;
  }

  const items: Array<{ id: number; type: string; title: string; description: string; createdAt: string }> = [];

  for (const analysis of recentAnalyses) {
    items.push({
      id: analysis.id,
      type: "analysis",
      title: `Analysed ${analysis.contentType} content`,
      description: analysis.inputText.slice(0, 80) + (analysis.inputText.length > 80 ? "…" : ""),
      createdAt: analysis.createdAt.toISOString(),
    });
  }

  for (const progressItem of recentProgress) {
    items.push({
      id: progressItem.id + 10000,
      type: "lesson",
      title: "Completed lesson",
      description: lessonMap[progressItem.lessonId] ?? `Lesson #${progressItem.lessonId}`,
      createdAt: progressItem.completedAt?.toISOString() ?? new Date().toISOString(),
    });
  }

  for (const report of recentReports) {
    items.push({
      id: report.id + 20000,
      type: "report",
      title: report.title,
      description: report.description.slice(0, 80) + (report.description.length > 80 ? "…" : ""),
      createdAt: report.createdAt.toISOString(),
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(items.slice(0, 10));
});

export default router;
