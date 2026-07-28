import { GoogleGenAI } from "@google/genai";

export interface MILAnalysisResult {
  contentCategory: string;
  warningSigns: Array<{ title: string; explanation: string; severity: "low" | "medium" | "high" }>;
  trustIndicators: Array<{ title: string; explanation: string }>;
  missingInfo: string[];
  reflectiveQuestions: string[];
  verificationSteps: string[];
  literacyLesson: string;
  recommendedActions: string[];
  educationalTip: string;
}

const MIL_ANALYSIS_PROMPT = `You are a Media and Information Literacy educator. Analyse the provided content and return a structured JSON response.

IMPORTANT RULES:
- NEVER say "this is a scam" or "this is definitely fake"
- NEVER make decisions for the user
- Frame everything as "indicators that deserve attention" or "things to verify"
- Use educational, neutral, supportive language
- Your goal is to improve digital literacy, not replace the user's judgement

Return ONLY valid JSON in this exact structure:
{
  "contentCategory": "one of: job | news | investment | shopping | government | scholarship | general",
  "warningSigns": [
    { "title": "string", "explanation": "string (explain WHY this matters, not just what it is)", "severity": "low | medium | high" }
  ],
  "trustIndicators": [
    { "title": "string", "explanation": "string" }
  ],
  "missingInfo": ["string (things that are absent or unverifiable)"],
  "reflectiveQuestions": ["question to help the user think critically"],
  "verificationSteps": ["concrete step to verify this content"],
  "literacyLesson": "2-3 sentences teaching a relevant digital literacy concept",
  "recommendedActions": ["specific next action for the user"],
  "educationalTip": "one practical tip to help in similar situations"
}`;

export async function runMILAnalysis(
  contentType: string,
  inputText: string
): Promise<MILAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return a structured placeholder when no API key is set
    return {
      contentCategory: contentType === "job" ? "job" : contentType === "news" ? "news" : "general",
      warningSigns: [
        {
          title: "AI analysis not yet configured",
          explanation: "Add your GEMINI_API_KEY to the Replit Secrets to enable AI-powered analysis. In the meantime, consider the general indicators below.",
          severity: "low",
        },
        {
          title: "Verify the source independently",
          explanation: "Always check whether the sender or publisher has an established, verifiable online presence with consistent history.",
          severity: "medium",
        },
      ],
      trustIndicators: [],
      missingInfo: ["AI-powered analysis requires a GEMINI_API_KEY"],
      reflectiveQuestions: [
        "Can you independently verify who sent or published this?",
        "Does this content create a sense of urgency or fear? Why might that be?",
        "Have you checked a second, unrelated trusted source for this information?",
      ],
      verificationSteps: [
        "Search for the sender's name or organisation on official websites",
        "Use a fact-checking site (e.g. Snopes, AFP Fact Check, Full Fact)",
        "Reverse image search any images in the content",
      ],
      literacyLesson: "Digital literacy means asking questions before you act. Legitimate organisations rarely pressure you to respond immediately or keep things secret. Taking time to verify is always the right choice.",
      recommendedActions: [
        "Do not share personal or financial information until verified",
        "Seek a second opinion from someone you trust",
      ],
      educationalTip: "When in doubt, pause and verify through an official, independent channel before taking any action.",
    };
  }

  const genai = new GoogleGenAI({ apiKey });

  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `Content type: ${contentType}\n\nContent to analyse:\n\n${inputText}` }],
      },
    ],
    config: {
      systemInstruction: MIL_ANALYSIS_PROMPT,
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Empty response from AI");

  return JSON.parse(raw) as MILAnalysisResult;
}
