"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant" | "assistant-typing"; content: string };

export default function WebLLMAssistant() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const question = input.trim();
    if (!question) return;

    // add user message
    const userMsg: Msg = { role: "user", content: question };
    const newHistory: Msg[] = [...history, userMsg];
    setHistory(newHistory);
    setInput("");
    setBusy(true);

    // add typing placeholder
    setHistory((h) => [...h, { role: "assistant-typing", content: "" } as Msg]);

    try {
      // simulate an async response (replace with your model integration)
      await new Promise((res) => setTimeout(res, 1000));
      const answer = "This is a sample assistant response.";

      // replace typing placeholder with assistant message
      setHistory((h) => {
        const hh = [...h];
        const idx = hh.findIndex((m) => m.role === "assistant-typing");
        const assistantMsg: Msg = { role: "assistant", content: answer };
        if (idx !== -1) hh[idx] = assistantMsg;
        else hh.push(assistantMsg);
        return hh;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Chat history */}
      <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
        {history.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "text-blue-400"
                : m.role === "assistant"
                ? "text-green-400"
                : "text-gray-400 italic"
            }
          >
            <strong>{m.role}:</strong> {m.content || "..."}
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="flex space-x-2">
        <input
          className="flex-1 rounded bg-zinc-800 border border-zinc-700 p-2 text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask me something..."
          disabled={busy}
        />
        <button
          className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
          onClick={send}
          disabled={busy}
        >
          Send
        </button>
      </div>
    </div>
  );
}