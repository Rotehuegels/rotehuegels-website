# Project: Rotehügels Website & ERP

## Buddy Relay Protocol

This project uses a **Claude ↔ Buddy relay** system. Buddy is a CLI coding agent (powered by Ollama/Groq) that takes over when Claude hits its token limit.

### On session start:
1. Check if `.buddy/handoff.md` exists
2. If yes, read it to understand what Buddy did in the last session
3. Continue from where Buddy left off

### On session end (or when context is getting long):
1. Write a handoff to `.buddy/handoff.md` summarizing:
   - What was accomplished
   - Files modified
   - What's pending / next steps
2. Append to `.buddy/worklog.jsonl`:
   ```json
   {"agent":"claude","timestamp":"ISO","type":"handoff","direction":"claude→buddy","summary":"..."}
   ```
3. Tell the user: "I've saved a handoff. Run `buddy --continue` to keep going."

### Worklog format:
```json
{"agent":"claude","timestamp":"...","type":"edit_file","path":"path/to/file"}
{"agent":"claude","timestamp":"...","type":"run_command","command":"npm run build"}
```

## Tech Stack
- Next.js 16 (App Router) on Vercel
- Supabase (PostgreSQL + Auth)
- Tailwind CSS (dark zinc theme)
- AI: Ollama (local) → Groq (free cloud) → Claude Haiku (paid fallback)
