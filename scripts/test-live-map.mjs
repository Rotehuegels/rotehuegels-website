#!/usr/bin/env node
/**
 * Headless repro for the Live Map crash.
 * Builds prod output, starts next start on port 3456, opens the recyclers
 * page, clicks the Live Map tab, and prints any console errors.
 *
 * Run: node scripts/test-live-map.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 3456;
const URL = `http://localhost:${PORT}/recycling/recyclers`;

function waitForServer(timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (async function poll() {
      try {
        const r = await fetch(URL);
        if (r.ok) return resolve();
      } catch { /* retry */ }
      if (Date.now() - start > timeoutMs) return reject(new Error('server never came up'));
      setTimeout(poll, 500);
    })();
  });
}

const server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env },
});
server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[server!] ${d}`));

const cleanup = () => { try { server.kill('SIGTERM'); } catch {} };
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

try {
  console.log('waiting for server …');
  await waitForServer();
  console.log('server up. launching chromium …');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push({ type: 'pageerror', msg: e.message, stack: e.stack }));
  page.on('console', (m) => { if (m.type() === 'error') errors.push({ type: 'console.error', msg: m.text() }); });
  page.on('requestfailed', (r) => errors.push({ type: 'requestfailed', msg: `${r.url()} — ${r.failure()?.errorText}` }));

  console.log('loading page …');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 });
  console.log('initial page load errors:', errors.length);

  console.log('clicking Live Map · Satellite …');
  await page.getByRole('button', { name: /Live Map/i }).click();
  await page.waitForTimeout(3_000);

  console.log('\n=== errors captured ===');
  if (!errors.length) console.log('(none — Live Map mounted cleanly)');
  for (const e of errors) {
    console.log(`[${e.type}] ${e.msg}`);
    if (e.stack) console.log(e.stack.split('\n').slice(0, 6).join('\n'));
    console.log();
  }

  const mapEl = await page.$('.leaflet-container');
  console.log('leaflet-container in DOM:', !!mapEl);
  if (mapEl) {
    const pins = await page.$$('.leaflet-marker-icon, .recycler-cluster');
    console.log('pin/cluster elements:', pins.length);
  }

  await browser.close();
  cleanup();
  process.exit(errors.length ? 1 : 0);
} catch (e) {
  console.error('test failed:', e.message);
  cleanup();
  process.exit(2);
}
