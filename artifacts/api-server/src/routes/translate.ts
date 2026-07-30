import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, lessonsTable, quizQuestionsTable } from "@workspace/db";
import { translateLesson } from "../lib/translate-lesson";

const router: IRouter = Router();

/**
 * POST /lessons/:id/translate
 * Body: { language: string }
 *
 * Returns the full lesson detail with content and quiz translated into the
 * requested language.
 *
 * Translation lookup order:
 *   1. Persistent JSON file on disk (instant — no AI call)
 *   2. AI translation via OpenRouter (result saved to disk for future requests)
 *
 * Falls back to original English if AI is unavailable or language is unsupported.
 */
router.post("/lessons/:id/translate", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid lesson id" });
    return;
  }

  const { language } = req.body as { language?: string };
  if (!language || language === "en") {
    res.status(400).json({ error: "language is required and must not be 'en'" });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, id));

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const quiz = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.lessonId, lesson.id))
    .orderBy(asc(quizQuestionsTable.orderIndex));

  const translationInput = {
    title: lesson.title,
    summary: lesson.summary,
    content: lesson.content,
    quiz: quiz.map((q) => ({
      question: q.question,
      options: q.options,
      explanation: q.explanation,
    })),
  };

  try {
    // Pass lessonId so the library can check/write the persistent JSON cache
    const translated = await translateLesson(id, translationInput, language);

    // Merge translated strings back onto original quiz items (preserving id,
    // correctIndex, orderIndex which must not be translated).
    const translatedQuiz = quiz.map((q, i) => ({
      ...q,
      question: translated.quiz[i]?.question ?? q.question,
      options: translated.quiz[i]?.options ?? q.options,
      explanation: translated.quiz[i]?.explanation ?? q.explanation,
    }));

    res.json({
      id: lesson.id,
      title: translated.title,
      summary: translated.summary,
      content: translated.content,
      category: lesson.category,
      durationMinutes: lesson.durationMinutes,
      difficulty: lesson.difficulty,
      quiz: translatedQuiz,
    });
  } catch (err) {
    req.log.error({ err }, "Lesson translation failed — returning original");
    // Graceful fallback: return original English lesson
    res.json({
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content,
      category: lesson.category,
      durationMinutes: lesson.durationMinutes,
      difficulty: lesson.difficulty,
      quiz,
    });
  }
});

export default router;
