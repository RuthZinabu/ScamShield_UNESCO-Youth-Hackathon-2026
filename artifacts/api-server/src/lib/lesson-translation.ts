import OpenAI from "openai";
import type { Lesson, QuizQuestion } from "@workspace/db";

export interface TranslatedQuizQuestion {
  id: number;
  lessonId: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  orderIndex: number;
}

export interface TranslatedLesson extends Omit<Lesson, never> {
  title: string;
  summary: string;
  content: string;
  quiz: TranslatedQuizQuestion[];
  isCompleted: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  am: "Amharic (አማርኛ)",
  om: "Oromiffa (Afaan Oromoo)",
  so: "Somali (Soomaali)",
  ti: "Tigrinya (ትግርኛ)",
};

// Simple in-memory cache: key = `${lessonId}:${lang}`
const cache = new Map<string, { translated: TranslatedLesson; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function translateLesson(
  lesson: TranslatedLesson,
  lang: string
): Promise<TranslatedLesson> {
  if (lang === "en" || !LANGUAGE_NAMES[lang]) return lesson;

  const cacheKey = `${lesson.id}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.translated;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return lesson; // graceful fallback

  const languageName = LANGUAGE_NAMES[lang];

  const payload = {
    title: lesson.title,
    summary: lesson.summary,
    content: lesson.content,
    quiz: lesson.quiz.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      explanation: q.explanation,
    })),
  };

  const systemPrompt = `You are a professional translator specialising in educational content.
Translate ALL text fields in the provided JSON from English into ${languageName}.

Rules:
- Translate title, summary, content, quiz questions, quiz options, and quiz explanations
- Keep markdown formatting intact (##, **bold**, - bullet points, numbered lists, etc.)
- Do NOT translate URLs, code snippets, technical terms, or brand names
- Keep every key name EXACTLY as-is — only translate the values
- Return ONLY valid JSON with the exact same structure as the input
- Do not add any commentary outside the JSON`;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://trustlense-unesco-youth-hackathon-2026-2.onrender.com",
      "X-Title": "TrustLens",
    },
  });

  try {
    const response = await client.chat.completions.create({
      model: "openrouter/free",
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return lesson;

    const parsed = JSON.parse(raw) as typeof payload;

    const translated: TranslatedLesson = {
      ...lesson,
      title: parsed.title ?? lesson.title,
      summary: parsed.summary ?? lesson.summary,
      content: parsed.content ?? lesson.content,
      quiz: lesson.quiz.map((q, i) => ({
        ...q,
        question: parsed.quiz[i]?.question ?? q.question,
        options: parsed.quiz[i]?.options ?? q.options,
        explanation: parsed.quiz[i]?.explanation ?? q.explanation,
      })),
    };

    cache.set(cacheKey, { translated, expiresAt: Date.now() + CACHE_TTL_MS });
    return translated;
  } catch {
    return lesson; // graceful fallback — return English on any error
  }
}
