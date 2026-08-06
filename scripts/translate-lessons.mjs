#!/usr/bin/env node
/**
 * Translates missing lessons into am and ti by calling OpenRouter one lesson at a time.
 * Run: node scripts/translate-lessons.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const LANGUAGES = {
  am: "Amharic (አማርኛ) — Ethiopian Semitic language, Ge'ez script",
  ti: "Tigrinya (ትግርኛ) — Semitic language of Eritrea/northern Ethiopia, Ge'ez script",
};

const KEEP_UNTRANSLATED =
  "Tebaqi AI, SIFT, Snopes, AFP Fact Check, PolitiFact, Full Fact, PolitiFact, PayPal, UNESCO, LinkedIn, WhatsApp, TikTok, GPTZero, Bitwarden, 1Password, uBlock Origin, Firefox, Brave, Hive Moderation, Reddit, Facebook, HTTP, HTTPS, 2FA";

const enLessons = JSON.parse(
  readFileSync("artifacts/Tebaqi/src/locales/lessons/en.json", "utf8")
);

async function callOpenRouter(messages, maxTokens = 3000) {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://replit.com",
      "X-Title": "Tebaqi AI",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 300)}`);
  }
  const data = await resp.json();
  return (data.choices[0]?.message?.content ?? "").trim();
}

function stripFences(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function translateMeta(langDesc, key, lesson) {
  /** Translate title, summary, quiz (without content to stay under token limit) */
  const slim = { title: lesson.title, summary: lesson.summary, quiz: lesson.quiz };
  const prompt = `Translate this JSON lesson object into ${langDesc}.
Rules:
- Keep all JSON keys unchanged
- "correctIndex" integers: do NOT change
- Translate all string values completely
- Keep untranslated: ${KEEP_UNTRANSLATED}
- Return ONLY valid JSON — no markdown fences

{"${key}": ${JSON.stringify(slim)}}`;

  const raw = await callOpenRouter([{ role: "user", content: prompt }], 3500);
  const cleaned = stripFences(raw);
  const parsed = JSON.parse(cleaned);
  return parsed[key] ?? (parsed.title ? parsed : (() => { throw new Error("unexpected shape"); })());
}

async function translateContent(langDesc, content) {
  /** Translate just the markdown content string */
  const prompt = `Translate the following markdown text into ${langDesc}.
Rules:
- Preserve all markdown: ##, **, -, numbered lists, blank lines
- Keep untranslated: ${KEEP_UNTRANSLATED}
- Return ONLY the translated text — no fences, no JSON

${content}`;

  return await callOpenRouter([{ role: "user", content: prompt }], 3000);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  for (const [code, langDesc] of Object.entries(LANGUAGES)) {
    const outPath = `artifacts/Tebaqi/src/locales/lessons/${code}.json`;
    let existing = {};
    if (existsSync(outPath)) {
      try {
        existing = JSON.parse(readFileSync(outPath, "utf8"));
      } catch {
        existing = {};
      }
    }

    const missing = Object.keys(enLessons).filter((k) => !existing[k]);
    console.log(`\n[${code}] Missing lessons: ${missing.join(", ") || "none"}`);

    for (const key of missing) {
      const lesson = enLessons[key];
      let attempts = 0;
      while (attempts < 3) {
        attempts++;
        try {
          console.log(`  [${code}] Translating lesson ${key} (attempt ${attempts})…`);
          const meta = await translateMeta(langDesc, key, lesson);
          await sleep(300);
          const content = await translateContent(langDesc, lesson.content);
          existing[key] = { ...meta, content };
          // Save after each successful lesson
          writeFileSync(outPath, JSON.stringify(existing, null, 2), "utf8");
          console.log(`  ✓ [${code}] lesson ${key} saved`);
          await sleep(400);
          break;
        } catch (e) {
          console.error(`  ✗ [${code}] lesson ${key} attempt ${attempts}: ${e.message.slice(0, 120)}`);
          await sleep(1000 * attempts);
        }
      }
    }

    // Final check — sort keys
    const sorted = {};
    for (const k of Object.keys(enLessons)) {
      if (existing[k]) sorted[k] = existing[k];
    }
    writeFileSync(outPath, JSON.stringify(sorted, null, 2), "utf8");
    console.log(`[${code}] Done — ${Object.keys(sorted).length}/8 lessons`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
