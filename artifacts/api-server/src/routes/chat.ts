import { Router, type IRouter } from "express";
import { eq, asc, desc, count } from "drizzle-orm";
import { db, conversationsTable, chatMessagesTable } from "@workspace/db";
import {
  CreateConversationBody,
  GetConversationParams,
  DeleteConversationParams,
  SendChatMessageParams,
  SendChatMessageBody,
} from "@workspace/api-zod";
import { GoogleGenAI } from "@google/genai";

const MIL_SYSTEM_PROMPT = `You are an educational assistant specialising in Media and Information Literacy (MIL).

Your role is to help users think critically about digital content — not to judge it for them.

Rules:
- NEVER say "this is a scam", "this is fake", or "this is definitely real"
- NEVER make decisions for the user
- ALWAYS explain your reasoning in a calm, educational tone
- Identify potential warning signs and explain WHY they matter
- Explain manipulation techniques used in digital content
- Highlight credibility indicators (or their absence)
- Suggest trusted verification methods (e.g. reverse image search, official sources)
- Ask reflective questions to help users think critically
- Teach critical thinking and media literacy skills
- Encourage informed, independent decision-making

Your goal is to improve digital literacy — not replace the user's judgement.
Use clear, supportive language suitable for young people.`;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const router: IRouter = Router();

router.get("/chat/conversations", async (_req, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));

  const withCounts = await Promise.all(
    convs.map(async (c) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.conversationId, c.id));
      return { ...c, messageCount: Number(value) };
    })
  );

  res.json(withCounts);
});

router.post("/chat/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();

  const result = { ...conv, messageCount: 0 };
  res.status(201).json(result);
});

router.get("/chat/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conv.id))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json({ ...conv, messages });
});

router.delete("/chat/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendChatMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendChatMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const genai = getGeminiClient();

  // Save user message
  await db.insert(chatMessagesTable).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content,
  });

  // Load conversation history
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, params.data.id))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!genai) {
    // No API key — send an educational placeholder response
    const placeholder =
      "I'm your Media and Information Literacy assistant. To enable AI-powered responses, please add your GEMINI_API_KEY in the Replit Secrets panel. In the meantime, I encourage you to ask yourself: What is the source of this information? Can you verify it through an independent, trusted source? What emotions does this content trigger, and why?";
    res.write(`data: ${JSON.stringify({ content: placeholder })}\n\n`);
    await db.insert(chatMessagesTable).values({
      conversationId: params.data.id,
      role: "assistant",
      content: placeholder,
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  // Gemini uses "model" for the assistant role
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let fullResponse = "";

  const stream = await genai.models.generateContentStream({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: MIL_SYSTEM_PROMPT,
      maxOutputTokens: 1024,
    },
  });

  for await (const chunk of stream) {
    const content = chunk.text;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  // Save assistant message
  await db.insert(chatMessagesTable).values({
    conversationId: params.data.id,
    role: "assistant",
    content: fullResponse,
  });

  // Update conversation updatedAt
  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, params.data.id));

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
