import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useListConversations, useCreateConversation, useGetConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, Plus, MessageSquare, Loader2, Info } from "lucide-react";
import type { ChatMessage } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Chat() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { data: conversations, isLoading: listLoading } = useListConversations();
  const { data: conversationData, isLoading: chatLoading } = useGetConversation(activeId!, { query: { enabled: !!activeId } });
  const createConversation = useCreateConversation();

  const messages = conversationData?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    let convId = activeId;
    const userMsg = input.trim();
    setInput("");

    if (!convId) {
      try {
        const newConv = await createConversation.mutateAsync({ data: { title: userMsg.slice(0, 30) + "..." } });
        convId = newConv.id;
        setActiveId(convId);
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      } catch (e) {
        console.error("Failed to create conversation", e);
        return;
      }
    }

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversationId: convId,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString()
    };

    queryClient.setQueryData(
      ["/api/chat/conversations", convId],
      (old: any) => old ? { ...old, messages: [...old.messages, tempUserMsg] } : old
    );

    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg })
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const text = line.slice(6);
              if (text !== '[DONE]') {
                try {
                  const parsed = JSON.parse(text);
                  fullText += parsed.text || "";
                } catch {
                  fullText += text;
                }
                setStreamingMessage(fullText.replace(/\\n/g, '\n'));
              }
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", convId] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100dvh-8rem)]">
      <div className="grid md:grid-cols-[280px_1fr] gap-6 h-full">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border p-4 h-full">
          <Button
            className="w-full justify-start gap-2 mb-6 shadow-sm"
            onClick={() => setActiveId(null)}
          >
            <Plus className="w-4 h-4" /> {t("chat.new_chat")}
          </Button>

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            {t("chat.recent_conversations")}
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            {listLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate mb-1 transition-colors flex items-center gap-2 ${
                  activeId === conv.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{conv.title}</span>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <Card className="flex flex-col h-full overflow-hidden border-border/60 shadow-lg">
          <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{t("chat.guide_name")}</h2>
              <p className="text-xs text-muted-foreground">{t("chat.guide_subtitle")}</p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/30"
          >
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6">
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display mb-2">{t("chat.empty_title")}</h3>
                <p className="text-muted-foreground text-sm mb-8">{t("chat.empty_desc")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {[t("chat.prompt1"), t("chat.prompt2"), t("chat.prompt3")].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="text-sm p-3 rounded-xl border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <span className="bg-primary/5 text-primary text-xs px-3 py-1 rounded-full border border-primary/10 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> {t("chat.context_active")}
                  </span>
                </div>

                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-secondary text-secondary-foreground rounded-tr-sm"
                        : "bg-background border shadow-sm rounded-tl-sm"
                    }`}>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex gap-4 max-w-[85%] mr-auto">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-background border shadow-sm rounded-tl-sm min-w-[60px]">
                      {streamingMessage ? (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{streamingMessage}</div>
                      ) : (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-200"></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-background border-t">
            <div className="relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.input_placeholder")}
                className="pr-12 h-12 bg-slate-50 dark:bg-slate-900 border-border rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                className="absolute right-1.5 h-9 w-9 rounded-lg"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
