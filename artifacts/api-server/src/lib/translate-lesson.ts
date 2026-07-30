import OpenAI from "openai";

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

export async function translateLesson(
  input: LessonTranslationInput,
  targetLang: string
): Promise<LessonTranslationOutput> {
  const languageName = LANGUAGE_NAMES[targetLang];
  if (!languageName) {
    // Unsupported language — return original
    return input;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // No AI key — return original content
    return input;
  }

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
    // Validate the shape hasn't been broken
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.summary !== "string" ||
      typeof parsed.content !== "string" ||
      !Array.isArray(parsed.quiz)
    ) {
      return input;
    }
    return parsed;
  } catch {
    // Parse failed — return original English content
    return input;
  }
}
