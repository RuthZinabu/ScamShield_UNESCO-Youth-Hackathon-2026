import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

export interface LessonTranslationInput {
  title: string;
  summary: string;
  content: string;
  quiz: Array<{
    question: string;
    options: string[];
    explanation: string;
  }>;
}

export interface LessonTranslationOutput {
  title: string;
  summary: string;
  content: string;
  quiz: Array<{
    question: string;
    options: string[];
    explanation: string;
  }>;
}

const LANGUAGE_NAMES: Record<string, string> = {
  am: "Amharic (አማርኛ)",
  om: "Oromiffa (Afaan Oromoo)",
  so: "Somali (Soomaali)",
  ti: "Tigrinya (ትግርኛ)",
};

// Persistent translation cache directory.
// The server process always runs from artifacts/api-server/, so
// `data/translations` resolves to artifacts/api-server/data/translations.
const CACHE_DIR = path.resolve(process.cwd(), "data/translations");

async function getCachePath(lessonId: number, lang: string): Promise<string> {
  const dir = path.join(CACHE_DIR, String(lessonId));
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, `${lang}.json`);
}

async function readCache(lessonId: number, lang: string): Promise<LessonTranslationOutput | null> {
  try {
    const filePath = path.join(CACHE_DIR, String(lessonId), `${lang}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as LessonTranslationOutput;
  } catch {
    return null;
  }
}

async function writeCache(
  lessonId: number,
  lang: string,
  data: LessonTranslationOutput
): Promise<void> {
  try {
    const filePath = await getCachePath(lessonId, lang);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Non-fatal — translation still returned, just not persisted
  }
}

/**
 * Translates a lesson into the target language.
 *
 * Lookup order:
 *   1. Persistent JSON file on disk  (free, instant)
 *   2. AI translation via OpenRouter  (costs a call; result is then saved to disk)
 *
 * @param lessonId  The numeric lesson ID used to key the cache file.
 * @param input     English lesson content to translate.
 * @param targetLang  BCP-47-like language code (am | om | so | ti).
 */
export async function translateLesson(
  lessonId: number,
  input: LessonTranslationInput,
  targetLang: string
): Promise<LessonTranslationOutput>;

/**
 * @deprecated  Use the 3-argument overload that accepts `lessonId`.
 * Kept for any callers that haven't migrated yet. Falls through to AI only.
 */
export async function translateLesson(
  input: LessonTranslationInput,
  targetLang: string
): Promise<LessonTranslationOutput>;

export async function translateLesson(
  lessonIdOrInput: number | LessonTranslationInput,
  inputOrLang: LessonTranslationInput | string,
  maybeLang?: string
): Promise<LessonTranslationOutput> {
  // Resolve overloads
  let lessonId: number | null = null;
  let input: LessonTranslationInput;
  let targetLang: string;

  if (typeof lessonIdOrInput === "number") {
    lessonId = lessonIdOrInput;
    input = inputOrLang as LessonTranslationInput;
    targetLang = maybeLang!;
  } else {
    input = lessonIdOrInput;
    targetLang = inputOrLang as string;
  }

  const languageName = LANGUAGE_NAMES[targetLang];
  if (!languageName) return input;

  // 1. Check persistent JSON cache
  if (lessonId !== null) {
    const cached = await readCache(lessonId, targetLang);
    if (cached) return cached;
  }

  // 2. Fall back to AI translation
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return input;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://trustlense-unesco-youth-hackathon-2026-2.onrender.com",
      "X-Title": "TrustLens",
    },
  });

  const systemPrompt = `You are a professional translator specializing in educational content about media literacy and digital safety.

Translate the JSON payload I provide into ${languageName}.

CRITICAL RULES:
- Return ONLY valid JSON with the exact same structure as the input.
- Translate ALL string values (title, summary, content, question, options, explanation).
- The "content" field is Markdown. Preserve ALL markdown syntax (##, *, -, **, >, \`\`\`, etc.) — only translate the human-readable words inside it.
- Do NOT translate: JSON keys, category names, URL/domain names, brand names (e.g. Snopes, WhatsApp), technical terms that have no translation.
- Keep the same number of quiz options in each "options" array.
- Do not add, remove, or reorder any fields.`;

  const response = await client.chat.completions.create({
    model: "openrouter/free",
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(input) },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return input;

  try {
    const parsed = JSON.parse(raw) as LessonTranslationOutput;
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.summary !== "string" ||
      typeof parsed.content !== "string" ||
      !Array.isArray(parsed.quiz)
    ) {
      return input;
    }

    // 3. Persist to disk so next request is instant
    if (lessonId !== null) {
      await writeCache(lessonId, targetLang, parsed);
    }

    return parsed;
  } catch {
    return input;
  }
}
