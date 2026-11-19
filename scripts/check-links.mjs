#!/usr/bin/env node
// check-links.mjs — pemeriksaan statis (tanpa browser):
//   1. Tautan file lokal di README.md + docs/*.md benar-benar ada di disk.
//   2. Tautan lokal di public/index.html (href/src) benar-benar ada di public/.
//   3. File wajib ada.
// Keluar 1 bila ada satu saja temuan.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);

const mdFiles = ['README.md', 'PRD.md', 'CHANGELOG.md'];
if (existsSync(join(ROOT, 'docs'))) {
  for (const f of readdirSync(join(ROOT, 'docs'))) {
    if (f.endsWith('.md')) mdFiles.push(`docs/${f}`);
  }
}
for (const rel of mdFiles) {
  if (!existsSync(join(ROOT, rel))) continue;
  const content = readFileSync(join(ROOT, rel), 'utf-8');
  for (const m of content.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    const target = clean.startsWith('/')
      ? join(ROOT, 'public', clean.slice(1))
      : join(ROOT, dirname(rel), clean);
    if (!existsSync(target)) fail(`${rel}: tautan lokal hilang: ${ref}`);
  }
}

// Tautan lokal di public/index.html
const html = readFileSync(join(ROOT, 'public', 'index.html'), 'utf-8');
for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const ref = m[1];
  if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
  const clean = ref.split(/[?#]/)[0];
  if (!clean) continue;
  if (!existsSync(join(ROOT, 'public', clean.replace(/^\//, '')))) {
    fail(`public/index.html: aset lokal hilang: ${ref}`);
  }
}

for (const f of [
  'LICENSE', 'README.md', 'PRD.md', 'CHANGELOG.md',
  'docs/README.md', 'docs/DESIGN.md', 'docs/ARCHITECTURE.md', 'docs/deploy.md',
  'docs/testing.md', 'docs/diagrams.html',
  'docs/demo/sample-likes.json',
  'scripts/advisory-sweep.py', 'scripts/check-links.mjs', 'scripts/check-static.mjs',
  'scripts/build.mjs', 'scripts/serve-worker.mjs', 'scripts/screenshot.mjs',
  'scripts/make-video.mjs', 'scripts/smoke.mjs',
  'e2e/app.spec.js', 'playwright.config.js',
  '.github/workflows/ci.yml',
  'public/index.html', 'public/app.js', 'public/style.css', 'public/favicon.svg',
  'worker/_worker.js', 'worker/_worker.test.mjs',
]) {
  if (!existsSync(join(ROOT, f))) fail(`${f} hilang`);
}

if (failures.length > 0) {
  console.error('check-links GAGAL:');
  for (const m of failures) console.error(` - ${m}`);
  process.exit(1);
}
console.log('check-links OK');
