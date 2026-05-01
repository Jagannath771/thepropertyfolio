"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from "lucide-react";

import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MSG: Message = {
  role: "assistant",
  content:
    "Hi! I'm the ThePropertyFolio AI assistant 👋 I can help you find available properties, guide you through the application process, or answer any questions about our services. How can I help you today?",
};

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(
    () => `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Add assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const resp = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
          history: messages
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process buffer line by line
        let lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith("data:")) {
            // Remove 'data:' and at most one leading space if it exists (standard SSE format)
            let chunk = line.slice(5);
            if (chunk.startsWith(" ")) {
              chunk = chunk.slice(1);
            }
            
            if (chunk === "[DONE]") break;
            
            full += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: full };
              return updated;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting. Please try again or contact us at contact@thepropertyfolio.com",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // Panel dimensions
  const panelClass = maximized
    ? "fixed inset-4 sm:inset-6 z-50 flex flex-col rounded-2xl overflow-hidden"
    : "fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] h-[600px] flex flex-col rounded-2xl overflow-hidden";

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
        }`}
        style={{
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          boxShadow: "0 8px 30px rgba(99,102,241,0.5)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI chat assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-background animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key={maximized ? "max" : "min"}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={panelClass}
            style={{
              background: "rgba(17,24,39,0.97)",
              border: "1px solid rgba(99,102,241,0.25)",
              backdropFilter: "blur(20px)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.15)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{
                borderColor: "rgba(99,102,241,0.2)",
                background: "rgba(99,102,241,0.08)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    TPF Assistant
                  </div>
                  <div className="text-xs text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Online
                  </div>
                </div>
              </div>

              {/* Header action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMaximized((m) => !m)}
                  className="p-1.5 rounded-lg text-foreground-muted hover:bg-white/5 hover:text-foreground transition-colors"
                  aria-label={maximized ? "Minimize chat" : "Maximize chat"}
                  title={maximized ? "Minimize" : "Maximize"}
                >
                  {maximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setMaximized(false);
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:bg-white/5 hover:text-foreground transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{
                      background:
                        msg.role === "assistant"
                          ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                          : "rgba(245,158,11,0.2)",
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-accent" />
                    )}
                  </div>

                  <div
                    className={`px-3.5 py-2.5 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "text-foreground"
                        : "text-foreground-secondary"
                    }`}
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))"
                          : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      /* Constrain width so text wraps instead of overflowing */
                      maxWidth: maximized ? "85%" : "78%",
                      minWidth: 0,
                    }}
                  >
                    {msg.content ? (
                      <div className={`prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 ${maximized ? "max-w-3xl mx-auto" : ""}`}>
                        <ReactMarkdown>
                          {msg.content
                            // Fix joined numbered lists (e.g., "word.1." -> "word.\n\n1.")
                            .replace(/([a-z]\.)(\d\.)/gi, '$1\n\n$2')
                            // Fix missing space after numbered list (e.g., "1.Text" -> "1. Text")
                            .replace(/(\d\.)([A-Z])/g, '$1 $2')}
                        </ReactMarkdown>
                      </div>
                    ) : loading && i === messages.length - 1 ? (
                      <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {[
                  "Available 2BR apartments",
                  "How to apply?",
                  "Pet policy",
                  "Maintenance request",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#A5B4FC",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="p-3 border-t flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about properties..."
                  className="input-glass flex-1 py-2.5 text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  }}
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
