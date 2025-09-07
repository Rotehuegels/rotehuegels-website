// components/WebLLMAssistant.tsx
"use client";
import React from "react";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";

type Msg = { role: "user" | "assistant" | "assistant-typing"; content: string };

const STORAGE_KEY = "rh.assistant.history";

// Try to extract a trailing SUMMARY line from a reply
function extractSummary(text: string): string | null {
  const idx = text.toUpperCase().indexOf("SUMMARY:");
  if (idx === -1) return null;
  return text.slice(idx).trim();
}

export default function WebLLMAssistant() {
  const [engine, setEngine] = React.useState<MLCEngine | null>(null);
  const [progress, setProgress] = React.useState<string>("not started");
  const [history, setHistory] = React.useState<Msg[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = window.localStorage.getItem(STORAGE_KEY);
        if (s) return JSON.parse(s) as Msg[];
      } catch {}
    }
    return [
      { role: "assistant", content: "Hello 👋 I run entirely in your browser (no cloud). How can I help?" },
    ];
  });
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Scroll & persist history
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  // ⚡️ Use a much smaller model to reduce first download size
  const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
  // Alternatives if you want to test later:
  // const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";   // small
  // const MODEL_ID = "Llama-3.2-3B-Instruct-q4f16_1-MLC";   // bigger, better

  // Initialize the model
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProgress(`Initializing model (${MODEL_ID})…`);
        const eng = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (report) => {
            if (cancelled) return;
            const pct = report.progress ? Math.round(report.progress * 100) : 0;
            setProgress(report.text ? `${report.text}${pct ? ` (${pct}%)` : ""}` : `Loading… ${pct}%`);
          },
          // Hint to be gentle on memory in some environments
          // engineConfig: { gpuMemoryUtilization: 0.6 },
        });
        if (!cancelled) {
          setEngine(eng);
          setProgress("Ready");
        }
      } catch (e: any) {
        setProgress("Failed to initialize: " + (e?.message || String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!engine || !input.trim() || busy) return;
    const question = input.trim();
    const newHistory = [...history, { role: "user", content: question }];
    setHistory(newHistory);
    setInput("");
    setBusy(true);

    const system =
      "You are Rotehügels Assist, a concise professional assistant. " +
      "Ask clarifying questions about metal/process, stage (concept/pilot/EPC/commissioning/operations), " +
      "location, timeline, budget band, and KPIs. When enough info, end with one line starting 'SUMMARY:'.";

    const messages = [
      { role: "system", content: system },
      ...newHistory.map(({ role, content }) => ({
        role: role === "assistant-typing" ? "assistant" : (role as "user" | "assistant"),
        content,
      })),
    ];

    let reply = "";
    try {
      await engine.chat.completions.create(
        { messages, stream: true, temperature: 0.6, max_tokens: 256 }, // smaller output -> lighter memory
        {
          onToken: (t) => {
            reply += t;
            setHistory((cur) => {
              if (cur[cur.length - 1]?.role === "assistant-typing") {
                const clone = cur.slice(0, -1);
                return [...clone, { role: "assistant-typing", content: reply }];
              } else {
                return [...cur, { role: "assistant-typing", content: reply }];
              }
            });
          },
        }
      );
    } catch (e: any) {
      reply = "⚠️ Local model error: " + (e?.message || String(e));
    } finally {
      setHistory((cur) => {
        const last = cur[cur.length - 1];
        if (last?.role === "assistant-typing") {
          return [...cur.slice(0, -1), { role: "assistant", content: last.content }];
        }
        return [...cur, { role: "assistant", content: reply || "…" }];
      });
      setBusy(false);
    }
  }

  function emailSummary() {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") {
        const sum = extractSummary(history[i].content);
        if (sum) {
          const subject = encodeURIComponent("Rotehügels — Enquiry Summary");
          const body = encodeURIComponent(`${sum}\n\nPlease reply with next steps.`);
          window.location.href = `mailto:sales@rotehuegels.com?subject=${subject}&body=${body}`;
          return;
        }
      }
    }
    // Fallback: email the whole transcript
    const transcript = history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    const subject = encodeURIComponent("Rotehügels — Enquiry (Chat Transcript)");
    const body = encodeURIComponent(transcript);
    window.location.href = `mailto:sales@rotehuegels.com?subject=${subject}&body=${body}`;
  }

  function clearChat() {
    const seed: Msg[] = [
      { role: "assistant", content: "Hello 👋 I run entirely in your browser (no cloud). How can I help?" },
    ];
    setHistory(seed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div>Model status: {progress}</div>
        <div className="flex gap-2">
          <button
            onClick={emailSummary}
            className="rounded-md border border-zinc-800 px-2 py-1 hover:bg-zinc-800 text-zinc-200"
          >
            Email Summary
          </button>
          <button
            onClick={clearChat}
            className="rounded-md border border-zinc-800 px-2 py-1 hover:bg-zinc-800 text-zinc-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className="max-h-64 overflow-y-auto space-y-2 text-sm p-2 rounded-lg border border-zinc-800 bg-zinc-900/50"
      >
        {history.map((m, i) => (
          <div key={i} className={m.role.startsWith("assistant") ? "text-zinc-200" : "text-rose-300"}>
            <b>{m.role.startsWith("assistant") ? "Assist" : "You"}:</b> {m.content}
          </div>
        ))}
        {busy && (
          <div className="text-zinc-400 text-sm">
            <b>Assist:</b> typing…
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type (runs locally, no cloud)"
        />
        <button
          onClick={send}
          disabled={!engine || busy}
          className="rounded-lg bg-rose-500/90 hover:bg-rose-500 text-black px-3 text-sm disabled:opacity-60"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}