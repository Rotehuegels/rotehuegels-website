"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

type Msg = { role: "user" | "assistant" | "assistant-typing"; content: string };

export default function WebLLMAssistant() {
  const [history, setHistory] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Rotehügels Assist. I can answer questions about our services, products, and capabilities. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;

    const userMsg: Msg = { role: "user", content: question };
    setHistory((h) => [...h, userMsg, { role: "assistant-typing", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      // Build message history for API (user/assistant only)
      const apiMessages = [...history, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setHistory((h) => {
          const hh = [...h];
          const idx = hh.findLastIndex((m) => m.role === "assistant-typing");
          if (idx !== -1) hh[idx] = { role: "assistant-typing", content: fullText };
          return hh;
        });
      }

      // Finalise — switch typing → assistant
      setHistory((h) => {
        const hh = [...h];
        const idx = hh.findLastIndex((m) => m.role === "assistant-typing");
        if (idx !== -1) hh[idx] = { role: "assistant", content: fullText };
        return hh;
      });
    } catch {
      setHistory((h) => {
        const hh = [...h];
        const idx = hh.findLastIndex((m) => m.role === "assistant-typing");
        if (idx !== -1)
          hh[idx] = {
            role: "assistant",
            content: "Sorry, I couldn't process that. Please try again or email us at sales@rotehuegels.com.",
          };
        return hh;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Chat history */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-sm">
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                m.role === "user"
                  ? "bg-rose-600 text-white rounded-br-sm"
                  : m.role === "assistant-typing"
                  ? "bg-zinc-800 text-zinc-300 rounded-bl-sm"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
              }`}
            >
              {m.role === "assistant-typing"
                ? m.content
                  ? m.content
                  : <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl bg-zinc-800/80 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about our services, products, or capabilities..."
          disabled={busy}
        />
        <button
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1.5 text-sm font-medium"
          onClick={send}
          disabled={busy}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
