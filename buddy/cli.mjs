#!/usr/bin/env node

// ── Buddy — AI Coding Agent ─────────────────────────────────────────────────
// A CLI coding assistant powered by Ollama (local) / Groq (cloud).
// Works in relay with Claude Code — seamless handoff via .buddy/ files.
//
// Usage:
//   buddy              — Interactive REPL (auto-reads handoff from Claude)
//   buddy "fix the bug" — One-shot prompt
//   buddy --continue    — Continue from Claude's last handoff
//
// Handoff protocol:
//   .buddy/handoff.md   — Context passed between Claude ↔ Buddy
//   .buddy/worklog.jsonl — Append-only log of all actions (both agents)
//   .buddy/session.json  — Current session state

import { createInterface } from 'readline';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { resolve, relative, join, basename } from 'path';

// ── Config ──────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.BUDDY_MODEL  ?? process.env.OLLAMA_MODEL ?? 'llama3.2:3b';
const GROQ_MODEL   = process.env.BUDDY_MODEL  ?? process.env.GROQ_MODEL   ?? 'llama-3.3-70b-versatile';
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const CWD = process.cwd();
const BUDDY_DIR = join(CWD, '.buddy');
const HANDOFF_FILE = join(BUDDY_DIR, 'handoff.md');
const WORKLOG_FILE = join(BUDDY_DIR, 'worklog.jsonl');
const SESSION_FILE = join(BUDDY_DIR, 'session.json');

// Ensure .buddy directory exists
if (!existsSync(BUDDY_DIR)) mkdirSync(BUDDY_DIR, { recursive: true });

// ── Colors ──────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  white: '\x1b[37m', gray: '\x1b[90m',
};

function log(color, ...args) { console.log(color + args.join(' ') + c.reset); }
function logTool(name, detail) { log(c.cyan, `  ⚡ ${name}`, c.gray + (detail ? ` ${detail}` : '')); }

// ── Worklog — shared append-only log ────────────────────────────────────────

function logWork(entry) {
  const record = {
    agent: 'buddy',
    timestamp: new Date().toISOString(),
    ...entry,
  };
  appendFileSync(WORKLOG_FILE, JSON.stringify(record) + '\n');
}

function getRecentWorklog(n = 20) {
  if (!existsSync(WORKLOG_FILE)) return [];
  const lines = readFileSync(WORKLOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// ── Handoff — context passed between Claude ↔ Buddy ─────────────────────────

function readHandoff() {
  if (!existsSync(HANDOFF_FILE)) return null;
  const content = readFileSync(HANDOFF_FILE, 'utf8').trim();
  if (!content) return null;
  return content;
}

function writeHandoff(context) {
  const handoff = `# Buddy Handoff → Claude
Generated: ${new Date().toISOString()}
Agent: Buddy (${activeBackend ?? 'unknown'})

## What was done
${context.done || 'No changes made.'}

## Files modified
${context.filesModified?.join('\n') || 'None'}

## Current state
${context.currentState || 'Ready for next task.'}

## Pending / Next steps
${context.pending || 'No pending tasks.'}

## Recent conversation summary
${context.conversationSummary || 'No conversation.'}
`;
  writeFileSync(HANDOFF_FILE, handoff);
  logWork({ type: 'handoff', direction: 'buddy→claude', summary: context.done });
}

function saveSession(history, filesModified) {
  const session = {
    agent: 'buddy',
    backend: activeBackend,
    timestamp: new Date().toISOString(),
    messageCount: history.length,
    filesModified,
    lastMessages: history.slice(-6).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content.slice(0, 500) : '(tool call)',
    })),
  };
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

// ── Tool Implementations ────────────────────────────────────────────────────

const filesModifiedThisSession = new Set();

const tools = {
  read_file({ path }) {
    const fullPath = resolve(CWD, path);
    if (!existsSync(fullPath)) return `Error: File not found: ${path}`;
    try {
      const content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      if (lines.length > 300) {
        return `${lines.slice(0, 300).map((l, i) => `${i + 1}\t${l}`).join('\n')}\n\n... (${lines.length - 300} more lines truncated)`;
      }
      return lines.map((l, i) => `${i + 1}\t${l}`).join('\n');
    } catch (e) { return `Error reading file: ${e.message}`; }
  },

  write_file({ path, content }) {
    const fullPath = resolve(CWD, path);
    try {
      writeFileSync(fullPath, content, 'utf8');
      filesModifiedThisSession.add(path);
      logWork({ type: 'write_file', path, lines: content.split('\n').length });
      return `✓ Written ${content.split('\n').length} lines to ${path}`;
    } catch (e) { return `Error writing file: ${e.message}`; }
  },

  edit_file({ path, old_string, new_string }) {
    const fullPath = resolve(CWD, path);
    if (!existsSync(fullPath)) return `Error: File not found: ${path}`;
    try {
      const content = readFileSync(fullPath, 'utf8');
      if (!content.includes(old_string)) return `Error: old_string not found in ${path}`;
      const updated = content.replace(old_string, new_string);
      writeFileSync(fullPath, updated, 'utf8');
      filesModifiedThisSession.add(path);
      logWork({ type: 'edit_file', path });
      return `✓ Edited ${path}`;
    } catch (e) { return `Error editing file: ${e.message}`; }
  },

  run_command({ command }) {
    logWork({ type: 'run_command', command });
    try {
      const output = execSync(command, { cwd: CWD, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
      return output.trim().slice(0, 5000) || '(no output)';
    } catch (e) {
      return `Exit code ${e.status ?? 1}\n${(e.stdout ?? '').trim()}\n${(e.stderr ?? '').trim()}`.trim().slice(0, 5000);
    }
  },

  list_files({ path, pattern }) {
    const dir = resolve(CWD, path || '.');
    if (!existsSync(dir)) return `Error: Directory not found: ${path}`;
    try {
      const files = [];
      function walk(d, depth = 0) {
        if (depth > 4 || files.length > 200) return;
        const entries = readdirSync(d);
        for (const e of entries) {
          if (e.startsWith('.') || e === 'node_modules' || e === '.next' || e === 'dist') continue;
          const fp = join(d, e);
          const st = statSync(fp);
          const rel = relative(CWD, fp);
          if (st.isDirectory()) { files.push(rel + '/'); walk(fp, depth + 1); }
          else if (!pattern || rel.includes(pattern)) { files.push(rel); }
        }
      }
      walk(dir);
      return files.join('\n') || '(empty)';
    } catch (e) { return `Error: ${e.message}`; }
  },

  search_files({ pattern, path }) {
    const dir = resolve(CWD, path || '.');
    try {
      const output = execSync(
        `grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.css" --include="*.sql" "${pattern}" "${dir}" 2>/dev/null | head -50`,
        { encoding: 'utf8', timeout: 10000 }
      );
      return output.trim() || 'No matches found.';
    } catch { return 'No matches found.'; }
  },
};

// ── Tool definitions for the LLM ────────────────────────────────────────────

const TOOL_DEFS = [
  { type: 'function', function: { name: 'read_file', description: 'Read a file. Returns content with line numbers.', parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path relative to project root' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'write_file', description: 'Create or overwrite a file.', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'edit_file', description: 'Replace a string in a file. old_string must be an exact match.', parameters: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] } } },
  { type: 'function', function: { name: 'run_command', description: 'Run a shell command and return output.', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
  { type: 'function', function: { name: 'list_files', description: 'List files in a directory recursively.', parameters: { type: 'object', properties: { path: { type: 'string' }, pattern: { type: 'string' } } } } },
  { type: 'function', function: { name: 'search_files', description: 'Search for a pattern (regex) in files using grep.', parameters: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } }, required: ['pattern'] } } },
];

// ── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt() {
  let prompt = `You are Buddy, an expert AI coding assistant. You work in relay with Claude Code — when Claude hits its token limit, you take over seamlessly.

Working directory: ${CWD}
Project: ${basename(CWD)}

## Tools
read_file, write_file, edit_file, run_command, list_files, search_files

## How to work (IMPORTANT — follow this thinking process):

1. UNDERSTAND: Before acting, make sure you understand the full request. If unclear, ask.
2. EXPLORE: Always read relevant files first. Use list_files and search_files to find what you need. Never edit a file you haven't read.
3. PLAN: Think step by step. For multi-file changes, plan the order of operations.
4. EXECUTE: Make changes one file at a time. Use edit_file for targeted changes (never rewrite entire files unless creating new ones).
5. VERIFY: After changes, run the type checker (npx tsc --noEmit) or build to verify.
6. SUMMARIZE: Briefly explain what you did.

## Rules
- ALWAYS read a file before editing it
- Use edit_file with exact string matches — copy the exact text from the file
- For new files, use write_file
- Run commands to verify your work (git status, npm run build, npx tsc --noEmit)
- If a task is complex, break it into smaller steps
- When you finish, summarize what was done so Claude can continue later
- Never guess file contents — always read first
- If you encounter an error, read the error carefully, diagnose, then fix

## Tech stack
- Next.js 16 (App Router) with TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS (dark zinc theme)
- React Server Components + Client Components ('use client')
- Styling: const glass = 'rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm'`;

  // Add handoff context if available
  const handoff = readHandoff();
  if (handoff) {
    prompt += `\n\n## Handoff from previous session\nThe following context was passed from the previous agent (Claude or Buddy):\n\n${handoff}`;
  }

  // Add recent worklog
  const recentWork = getRecentWorklog(10);
  if (recentWork.length > 0) {
    const summary = recentWork.map(w => {
      if (w.type === 'write_file') return `[${w.agent}] wrote ${w.path}`;
      if (w.type === 'edit_file') return `[${w.agent}] edited ${w.path}`;
      if (w.type === 'run_command') return `[${w.agent}] ran: ${w.command}`;
      if (w.type === 'handoff') return `[${w.agent}] handoff: ${w.summary}`;
      return `[${w.agent}] ${w.type}`;
    }).join('\n');
    prompt += `\n\n## Recent activity log\n${summary}`;
  }

  // Add git status for context
  try {
    const status = execSync('git status --short 2>/dev/null', { cwd: CWD, encoding: 'utf8', timeout: 5000 }).trim();
    if (status) {
      prompt += `\n\n## Current git status\n${status}`;
    }
    const branch = execSync('git branch --show-current 2>/dev/null', { cwd: CWD, encoding: 'utf8', timeout: 5000 }).trim();
    if (branch) prompt += `\nBranch: ${branch}`;
  } catch {}

  return prompt;
}

// ── LLM Call ────────────────────────────────────────────────────────────────

let activeBackend = null;

async function callLLM(messages) {
  // Try Groq first (70B model, faster and smarter than local 7B)
  if (GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL, messages, tools: TOOL_DEFS,
          tool_choice: 'auto', temperature: 0.3, max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) {
        activeBackend = `groq/${GROQ_MODEL}`;
        return (await res.json()).choices[0].message;
      }
    } catch {}
  }

  // Fallback to Ollama (local, works offline)
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, messages, tools: TOOL_DEFS,
        stream: false, options: { temperature: 0.3, num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) {
      activeBackend = `ollama/${OLLAMA_MODEL}`;
      return (await res.json()).message;
    }
  } catch {}

  throw new Error('Both Groq and Ollama failed. Check your internet or run: ollama serve');
}

// ── Agent Loop ──────────────────────────────────────────────────────────────

async function agentLoop(userMessage, conversationHistory) {
  conversationHistory.push({ role: 'user', content: userMessage });
  logWork({ type: 'user_message', message: userMessage.slice(0, 200) });

  let iterations = 0;

  while (iterations < 20) {
    iterations++;

    const response = await callLLM([
      { role: 'system', content: buildSystemPrompt() },
      ...conversationHistory.slice(-30),
    ]);

    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length > 0) {
      conversationHistory.push(response);

      for (const tc of toolCalls) {
        const fn = tc.function;
        let args;
        try { args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments; }
        catch { args = {}; }

        logTool(fn.name, fn.name === 'run_command' ? args.command : (args.path ?? args.pattern ?? ''));

        const result = tools[fn.name]?.(args) ?? `Unknown tool: ${fn.name}`;
        const preview = result.split('\n').slice(0, 3).join('\n');
        if (preview.length < 200) log(c.dim, `  ${preview}`);
        else log(c.dim, `  ${preview.slice(0, 200)}...`);

        conversationHistory.push({ role: 'tool', tool_call_id: tc.id, content: result });
      }
      continue;
    }

    const text = response.content ?? '';
    if (text) {
      conversationHistory.push({ role: 'assistant', content: text });
      logWork({ type: 'response', summary: text.slice(0, 200) });
      // Auto-save session after each response
      saveSession(conversationHistory, [...filesModifiedThisSession]);
      return text;
    }
    break;
  }
  return '(No response)';
}

// ── Generate handoff for Claude ─────────────────────────────────────────────

function generateHandoff(history) {
  const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
  const assistantMessages = history.filter(m => m.role === 'assistant' && typeof m.content === 'string').map(m => m.content);

  writeHandoff({
    done: assistantMessages.slice(-3).join('\n\n---\n\n') || 'Session ended.',
    filesModified: [...filesModifiedThisSession],
    currentState: `Git status: ${(() => { try { return execSync('git status --short', { cwd: CWD, encoding: 'utf8' }).trim() || 'clean'; } catch { return 'unknown'; } })()}`,
    pending: 'Check the work done above and continue with any remaining tasks.',
    conversationSummary: userMessages.slice(-5).map((m, i) => `${i + 1}. ${m.slice(0, 100)}`).join('\n') || 'No conversation.',
  });
}

// ── REPL ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Banner
  console.log('');
  log(c.bold + c.yellow, '  🐕 Buddy — AI Coding Agent');
  log(c.dim, `  Working in: ${CWD}`);
  log(c.dim, `  Backend: Ollama (${OLLAMA_MODEL}) → Groq (${GROQ_MODEL})`);

  // Check for handoff
  const handoff = readHandoff();
  if (handoff) {
    console.log('');
    log(c.magenta, '  📋 Handoff received from previous session:');
    const preview = handoff.split('\n').slice(0, 5).map(l => `     ${l}`).join('\n');
    log(c.dim, preview);
  }

  console.log('');

  // Check connectivity
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) log(c.green, '  ✓ Ollama connected');
    else throw new Error();
  } catch {
    log(c.yellow, '  ⚠ Ollama not running — will use Groq');
    if (!GROQ_API_KEY) {
      log(c.red, '  ✗ GROQ_API_KEY not set. Run: export GROQ_API_KEY=gsk_...');
      process.exit(1);
    }
    log(c.green, '  ✓ Groq API key found');
  }

  console.log('');
  log(c.dim, '  Commands: /bye  /reset  /baton  /log  /resume  /status');
  console.log('');

  const history = [];

  // --continue flag: auto-read handoff and ask LLM to continue
  const continueMode = args.includes('--continue') || args.includes('-c');
  const promptArgs = args.filter(a => !a.startsWith('-'));

  if (continueMode && handoff) {
    log(c.blue, '  Continuing from handoff...');
    console.log('');
    try {
      const reply = await agentLoop('Continue from the handoff context. Read the handoff notes and pick up where the previous session left off. Summarize what was done before and what you will do next.', history);
      console.log('');
      log(c.white, reply);
    } catch (e) { log(c.red, `  Error: ${e.message}`); }
    console.log('');
    log(c.dim, `  [${activeBackend}]`);
    console.log('');
  }

  // One-shot mode
  if (promptArgs.length > 0 && !continueMode) {
    const prompt = promptArgs.join(' ');
    log(c.blue, `  You: ${prompt}`);
    console.log('');
    try {
      const reply = await agentLoop(prompt, history);
      console.log('');
      log(c.white, reply);
    } catch (e) { log(c.red, `  Error: ${e.message}`); }
    console.log('');
    log(c.dim, `  [${activeBackend}]`);
    generateHandoff(history);
    process.exit(0);
  }

  // Interactive REPL
  const rl = createInterface({
    input: process.stdin, output: process.stdout,
    prompt: `${c.yellow}buddy >${c.reset} `,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    if (input === '/bye' || input === '/b') {
      generateHandoff(history);
      log(c.yellow, '\n  👋 Baton saved. Claude can continue with: buddy --continue');
      process.exit(0);
    }

    if (input === '/reset') {
      history.length = 0;
      filesModifiedThisSession.clear();
      log(c.green, '  ✓ Conversation cleared');
      rl.prompt(); return;
    }

    if (input === '/baton') {
      generateHandoff(history);
      log(c.green, '  ✓ Baton saved to .buddy/handoff.md');
      log(c.dim, '  Claude will pick this up automatically on next session.');
      rl.prompt(); return;
    }

    if (input === '/log') {
      const recent = getRecentWorklog(15);
      if (!recent.length) { log(c.dim, '  No worklog entries.'); }
      else {
        recent.forEach(w => {
          const agent = w.agent === 'buddy' ? `${c.yellow}buddy${c.reset}` : `${c.blue}claude${c.reset}`;
          const time = new Date(w.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          log(c.dim, `  ${time} [${agent}${c.dim}] ${w.type}: ${w.path ?? w.command ?? w.summary ?? w.message ?? ''}`);
        });
      }
      rl.prompt(); return;
    }

    if (input === '/resume') {
      const h = readHandoff();
      if (!h) { log(c.dim, '  No baton found.'); rl.prompt(); return; }
      log(c.magenta, '  📋 Reading baton...');
      console.log('');
      try {
        const reply = await agentLoop('Continue from the handoff context. Read the handoff and pick up where the previous session left off.', history);
        console.log('');
        log(c.white, reply);
      } catch (e) { log(c.red, `  Error: ${e.message}`); }
      console.log('');
      log(c.dim, `  [${activeBackend}]`);
      console.log('');
      rl.prompt(); return;
    }

    if (input === '/status') {
      log(c.cyan, `  Backend: ${activeBackend ?? 'not connected'}`);
      log(c.dim, `  Messages: ${history.length}`);
      log(c.dim, `  Files modified: ${filesModifiedThisSession.size}`);
      if (filesModifiedThisSession.size > 0) {
        [...filesModifiedThisSession].forEach(f => log(c.dim, `    ${f}`));
      }
      const h = readHandoff();
      log(c.dim, `  Baton: ${h ? 'available' : 'none'}`);
      rl.prompt(); return;
    }

    if (input === '/help' || input === '/h' || input === '/?') {
      console.log('');
      log(c.bold + c.yellow, '  🐕 Buddy — Command Reference');
      console.log('');
      log(c.bold + c.white, '  SESSION COMMANDS');
      log(c.cyan, '  /bye');
      log(c.dim, '      Save the baton (handoff) and exit Buddy.');
      log(c.dim, '      Claude will automatically read the baton on next session.');
      log(c.gray, '      Alias: /b');
      console.log('');
      log(c.cyan, '  /reset');
      log(c.dim, '      Clear conversation history and start fresh.');
      log(c.dim, '      Does NOT delete the worklog or baton — only the current chat.');
      console.log('');
      log(c.bold + c.white, '  RELAY COMMANDS (Claude ↔ Buddy handoff)');
      log(c.cyan, '  /baton');
      log(c.dim, '      Save a baton (handoff file) for Claude without exiting.');
      log(c.dim, '      Writes .buddy/handoff.md with: what was done, files modified,');
      log(c.dim, '      git status, pending tasks, and conversation summary.');
      log(c.dim, '      Claude reads this automatically when it starts.');
      log(c.gray, '      Example: You\'re mid-task but want Claude to take over.');
      log(c.gray, '               Type /baton, then start Claude.');
      console.log('');
      log(c.cyan, '  /resume');
      log(c.dim, '      Continue from Claude\'s last handoff (or a previous Buddy session).');
      log(c.dim, '      Reads .buddy/handoff.md and tells the LLM to pick up where');
      log(c.dim, '      the last session left off.');
      log(c.gray, '      Example: Claude hit its limit. Run buddy, then type /resume.');
      console.log('');
      log(c.bold + c.white, '  INFO COMMANDS');
      log(c.cyan, '  /log');
      log(c.dim, '      Show the last 15 actions from both agents (Claude & Buddy).');
      log(c.dim, '      Reads from .buddy/worklog.jsonl — the shared activity log.');
      log(c.gray, '      Shows: timestamp, agent, action type, file/command affected.');
      console.log('');
      log(c.cyan, '  /status');
      log(c.dim, '      Show current session info:');
      log(c.dim, '        - LLM backend in use (Ollama or Groq)');
      log(c.dim, '        - Message count in current conversation');
      log(c.dim, '        - Files modified this session');
      log(c.dim, '        - Whether a baton is available from a previous session');
      console.log('');
      log(c.cyan, '  /help');
      log(c.dim, '      Show this help page.');
      log(c.gray, '      Alias: /h, /?');
      console.log('');
      log(c.bold + c.white, '  CLI USAGE');
      log(c.dim, '  buddy                    Interactive mode (REPL)');
      log(c.dim, '  buddy "fix the bug"      One-shot: run a single prompt and exit');
      log(c.dim, '  buddy --continue         Auto-resume from the last baton');
      log(c.dim, '  buddy -c                 Same as --continue');
      console.log('');
      log(c.bold + c.white, '  ENVIRONMENT VARIABLES');
      log(c.dim, '  OLLAMA_URL               Ollama server URL (default: http://localhost:11434)');
      log(c.dim, '  OLLAMA_MODEL             Ollama model (default: llama3.2:3b)');
      log(c.dim, '  GROQ_API_KEY             Groq API key (fallback when Ollama is down)');
      log(c.dim, '  GROQ_MODEL               Groq model (default: llama-3.1-8b-instant)');
      log(c.dim, '  BUDDY_MODEL              Override model for both backends');
      console.log('');
      log(c.bold + c.white, '  RELAY WORKFLOW');
      log(c.dim, '  ┌─────────────────────────────────────────────────────────────┐');
      log(c.dim, '  │  Claude working → hits limit → saves .buddy/handoff.md     │');
      log(c.dim, '  │  User runs: buddy --continue                               │');
      log(c.dim, '  │  Buddy reads baton → continues the work                    │');
      log(c.dim, '  │  User types: /bye                                          │');
      log(c.dim, '  │  Buddy saves baton → User starts Claude                    │');
      log(c.dim, '  │  Claude reads .buddy/handoff.md → continues seamlessly     │');
      log(c.dim, '  └─────────────────────────────────────────────────────────────┘');
      console.log('');
      log(c.bold + c.white, '  FILES');
      log(c.dim, '  .buddy/handoff.md        The "baton" — context for the next agent');
      log(c.dim, '  .buddy/worklog.jsonl      Shared log of all actions by both agents');
      log(c.dim, '  .buddy/session.json       Current session state snapshot');
      console.log('');
      rl.prompt(); return;
    }

    console.log('');
    try {
      const reply = await agentLoop(input, history);
      console.log('');
      log(c.white, reply);
    } catch (e) { log(c.red, `  Error: ${e.message}`); }
    console.log('');
    log(c.dim, `  [${activeBackend}]`);
    console.log('');
    rl.prompt();
  });

  rl.on('close', () => {
    generateHandoff(history);
    log(c.yellow, '\n  👋 Handoff saved for next session.');
    process.exit(0);
  });
}

main().catch(e => { log(c.red, `Fatal: ${e.message}`); process.exit(1); });
