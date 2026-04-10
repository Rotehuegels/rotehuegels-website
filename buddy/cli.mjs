#!/usr/bin/env node

// ── Buddy — AI Coding Agent ─────────────────────────────────────────────────
// A CLI coding assistant powered by Ollama (local) / Groq (cloud).
// Similar to Claude Code but runs on free, open-source models.
//
// Usage:
//   buddy              — Interactive REPL
//   buddy "fix the bug" — One-shot prompt
//
// Environment:
//   OLLAMA_URL      — Ollama server (default: http://localhost:11434)
//   OLLAMA_MODEL    — Model name (default: llama3.2:3b)
//   GROQ_API_KEY    — Groq API key (fallback when Ollama is down)
//   GROQ_MODEL      — Groq model (default: llama-3.1-8b-instant)
//   BUDDY_MODEL     — Override model for both (takes priority)

import { createInterface } from 'readline';
import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, relative, join, basename } from 'path';
import { homedir } from 'os';

// ── Config ──────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.BUDDY_MODEL  ?? process.env.OLLAMA_MODEL ?? 'llama3.2:3b';
const GROQ_MODEL   = process.env.BUDDY_MODEL  ?? process.env.GROQ_MODEL   ?? 'llama-3.1-8b-instant';
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const CWD = process.cwd();

// ── Colors ──────────────────────────────────────────────────────────────────

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

function log(color, ...args) { console.log(color + args.join(' ') + c.reset); }
function logTool(name, detail) { log(c.cyan, `  ⚡ ${name}`, c.gray + (detail ? ` ${detail}` : '')); }

// ── Tool Implementations ────────────────────────────────────────────────────

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
      return `✓ Edited ${path}`;
    } catch (e) { return `Error editing file: ${e.message}`; }
  },

  run_command({ command }) {
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
          if (st.isDirectory()) {
            files.push(rel + '/');
            walk(fp, depth + 1);
          } else if (!pattern || rel.includes(pattern)) {
            files.push(rel);
          }
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
  {
    type: 'function', function: {
      name: 'read_file',
      description: 'Read a file. Returns content with line numbers.',
      parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path relative to project root' } }, required: ['path'] },
    }
  },
  {
    type: 'function', function: {
      name: 'write_file',
      description: 'Create or overwrite a file.',
      parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    }
  },
  {
    type: 'function', function: {
      name: 'edit_file',
      description: 'Replace a string in a file. old_string must be an exact match.',
      parameters: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] },
    }
  },
  {
    type: 'function', function: {
      name: 'run_command',
      description: 'Run a shell command and return output. Use for git, npm, build, test, etc.',
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
    }
  },
  {
    type: 'function', function: {
      name: 'list_files',
      description: 'List files in a directory recursively (max depth 4).',
      parameters: { type: 'object', properties: { path: { type: 'string', description: 'Directory path (default: .)' }, pattern: { type: 'string', description: 'Filter by filename pattern' } } },
    }
  },
  {
    type: 'function', function: {
      name: 'search_files',
      description: 'Search for a pattern (regex) in files using grep.',
      parameters: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string', description: 'Directory to search (default: .)' } }, required: ['pattern'] },
    }
  },
];

// ── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Buddy, an AI coding assistant. You help developers with software engineering tasks by reading, editing, and writing code files, running commands, and answering questions.

Working directory: ${CWD}
Project: ${basename(CWD)}

You have these tools:
- read_file: Read a file's contents
- write_file: Create or overwrite a file
- edit_file: Replace a specific string in a file (must be exact match)
- run_command: Run shell commands (git, npm, build, test, etc.)
- list_files: List files in a directory
- search_files: Search for patterns in code

Guidelines:
- Read files before editing them
- Make targeted edits (use edit_file) instead of rewriting entire files
- Run tests after making changes
- Explain what you're doing briefly
- Ask for clarification when the request is ambiguous
- Be concise in responses`;

// ── LLM Call ────────────────────────────────────────────────────────────────

let activeBackend = null;

async function callLLM(messages) {
  // Try Ollama first
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        tools: TOOL_DEFS,
        stream: false,
        options: { temperature: 0.3, num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      activeBackend = `ollama/${OLLAMA_MODEL}`;
      const data = await res.json();
      return data.message;
    }
  } catch {}

  // Fallback to Groq
  if (!GROQ_API_KEY) {
    throw new Error('Ollama is not running and GROQ_API_KEY is not set. Start Ollama or set GROQ_API_KEY.');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      tools: TOOL_DEFS,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  activeBackend = `groq/${GROQ_MODEL}`;
  const data = await res.json();
  return data.choices[0].message;
}

// ── Agent Loop ──────────────────────────────────────────────────────────────

async function agentLoop(userMessage, conversationHistory) {
  conversationHistory.push({ role: 'user', content: userMessage });

  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    iterations++;

    const response = await callLLM([
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-30), // keep last 30 messages
    ]);

    // Handle tool calls
    const toolCalls = response.tool_calls ?? [];

    if (toolCalls.length > 0) {
      // Add assistant message with tool calls
      conversationHistory.push(response);

      for (const tc of toolCalls) {
        const fn = tc.function;
        let args;
        try {
          args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
        } catch {
          args = {};
        }

        logTool(fn.name, fn.name === 'run_command' ? args.command : (args.path ?? args.pattern ?? ''));

        const result = tools[fn.name]?.(args) ?? `Unknown tool: ${fn.name}`;

        // Show result snippet
        const preview = result.split('\n').slice(0, 3).join('\n');
        if (preview.length < 200) log(c.dim, `  ${preview}`);
        else log(c.dim, `  ${preview.slice(0, 200)}...`);

        conversationHistory.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }

      continue; // let the LLM process tool results
    }

    // No tool calls — just a text response
    const text = response.content ?? '';
    if (text) {
      conversationHistory.push({ role: 'assistant', content: text });
      return text;
    }

    break;
  }

  return '(No response)';
}

// ── REPL ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Banner
  console.log('');
  log(c.bold + c.yellow, '  🐕 Buddy — AI Coding Agent');
  log(c.dim, `  Working in: ${CWD}`);
  log(c.dim, `  Backend: Ollama (${OLLAMA_MODEL}) → Groq (${GROQ_MODEL})`);
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
  log(c.dim, '  Type your request. Use /quit to exit, /clear to reset.');
  console.log('');

  const history = [];

  // One-shot mode
  if (args.length > 0) {
    const prompt = args.join(' ');
    log(c.blue, `  You: ${prompt}`);
    console.log('');
    try {
      const reply = await agentLoop(prompt, history);
      console.log('');
      log(c.white, reply);
    } catch (e) {
      log(c.red, `  Error: ${e.message}`);
    }
    console.log('');
    log(c.dim, `  [${activeBackend}]`);
    process.exit(0);
  }

  // Interactive REPL
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.yellow}buddy >${c.reset} `,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    if (input === '/quit' || input === '/exit' || input === '/q') {
      log(c.yellow, '\n  👋 See you later!');
      process.exit(0);
    }

    if (input === '/clear') {
      history.length = 0;
      log(c.green, '  ✓ Conversation cleared');
      rl.prompt();
      return;
    }

    if (input === '/history') {
      log(c.dim, `  ${history.length} messages in history`);
      rl.prompt();
      return;
    }

    if (input === '/backend') {
      log(c.cyan, `  Backend: ${activeBackend ?? 'not yet connected'}`);
      rl.prompt();
      return;
    }

    console.log('');

    try {
      const reply = await agentLoop(input, history);
      console.log('');
      log(c.white, reply);
    } catch (e) {
      log(c.red, `  Error: ${e.message}`);
    }

    console.log('');
    log(c.dim, `  [${activeBackend}]`);
    console.log('');
    rl.prompt();
  });

  rl.on('close', () => {
    log(c.yellow, '\n  👋 See you later!');
    process.exit(0);
  });
}

main().catch(e => {
  log(c.red, `Fatal: ${e.message}`);
  process.exit(1);
});
