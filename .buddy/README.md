# Buddy ↔ Claude Relay Protocol

This directory enables seamless handoff between Claude Code and Buddy CLI.

## Files
- `handoff.md` — Context from the last agent session (Claude or Buddy)
- `worklog.jsonl` — Append-only log of all actions by both agents
- `session.json` — Current session state snapshot

## How it works

### When Claude hits its limit:
1. Claude writes `.buddy/handoff.md` with what was done + what's pending
2. User runs: `buddy --continue`
3. Buddy reads the handoff and picks up seamlessly

### When Buddy finishes (or user switches back to Claude):
1. Buddy auto-saves handoff on `/quit` or `/handoff`
2. User starts Claude Code
3. Claude reads `.buddy/handoff.md` automatically (via CLAUDE.md instruction)
4. Claude continues where Buddy left off

### Worklog
Both agents append to `worklog.jsonl` so either can see what the other did:
```json
{"agent":"buddy","timestamp":"...","type":"edit_file","path":"lib/foo.ts"}
{"agent":"claude","timestamp":"...","type":"edit_file","path":"lib/bar.ts"}
```
