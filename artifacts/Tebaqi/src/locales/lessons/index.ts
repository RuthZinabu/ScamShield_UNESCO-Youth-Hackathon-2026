/**
 * Static lesson locale files — one JSON per language.
 * Each file mirrors en.json: keys are lesson IDs (strings), values are
 * { title, summary, content, quiz: [{question, options, correctIndex, explanation}] }.
 *
 * On language change the frontend reads from here instead of calling the API,
 * so lessons and quizzes update immediately without a round-trip.
 */

import en from "./en.json";
import am from "./am.json";
import om from "./om.json";
import so from "./so.json";
import ti from "./ti.json";

type LessonLocaleEntry = {
  title: string;
  summary: string;
  content: string;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
};

type LessonLocale = Record<string, LessonLocaleEntry>;

const LOCALES: Record<string, LessonLocale> = {
  en: en as unknown as LessonLocale,
  am: am as unknown as LessonLocale,
  om: om as unknown as LessonLocale,
  so: so as unknown as LessonLocale,
  ti: ti as unknown as LessonLocale,
};

/**
 * Returns the localised lesson data for a given lesson ID and language code.
 * Falls back to English if the language or lesson is not found.
 */
export function getLocalizedLesson(
  lessonId: number,
  langCode: string
): LessonLocaleEntry | null {
  const locale = LOCALES[langCode] ?? LOCALES.en;
  return locale[String(lessonId)] ?? LOCALES.en[String(lessonId)] ?? null;
}

/**
 * Returns every translated lesson entry for a language — useful for
 * overriding the listing page titles/summaries.
 */
export function getAllLocalizedLessons(langCode: string): LessonLocale {
  return LOCALES[langCode] ?? LOCALES.en;
}
