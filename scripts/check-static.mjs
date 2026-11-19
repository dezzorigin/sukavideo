// check-static.mjs — gate anti-slop P0 + penjaga restructure, dipakai
// `npm run validate` dan job `static-checks` di CI:
//   1. Tanpa gradient ungu/biru, tanpa headline gradient, tanpa font Inter /
//      Roboto / system font untuk semuanya, tanpa rounded-2xl/3xl +
//      shadow-lg di UI.
//   2. Tanpa emoji mentah sebagai ikon fungsi.
//   3. Tanpa sisa Vercel/axios (api/tiktok.js lama sudah diganti
//      worker/_worker.js); tanpa subfolder tiktok-like-main.
//   4. Tanpa file .env yang ter-commit; tanpa secret kasar.
// Keluar 1 bila ada satu saja temuan.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const fail = (msg) => failures.push(msg);

const SRC_FILES = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'test-results', 'playwright-report'].includes(e.name)) walk(p);
    } else if (/\.(html|css|js|mjs)$/.test(e.name)) {
      SRC_FILES.push(p);
    }
  }
};
walk(join(ROOT, 'public'));
walk(join(ROOT, 'worker'));
walk(join(ROOT, 'scripts'));

const P0_CHECKS = [
  [/linear-gradient\([^)]*(violet|purple|indigo|blue|#6366f1|#818cf8)/i, 'gradient ungu/biru'],
  [/bg-clip-text/, 'headline gradient (bg-clip-text)'],
  [/\bfont-family:[^;]*\bInter\b/, 'font Inter'],
  [/\bfont-family:[^;]*\bRoboto\b/, 'font Roboto'],
  [/rounded-2xl|rounded-3xl/, 'rounded-2xl/3xl (radius template)'],
  [/shadow-lg|shadow-2xl/, 'shadow-lg/2xl di permukaan'],
];
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
// Gate P0 hanya untuk public/ + worker/ — skrip pemeriksa sendiri mengandung
// literal pola P0 di regex-nya, jadi scripts/ dikecualikan dari gate ini
// (tetap diperiksa secret + leofame di bawah).
const P0_FILES = SRC_FILES.filter((f) => !f.includes('/scripts/'));
for (const f of P0_FILES) {
  const content = readFileSync(f, 'utf-8');
  const rel = f.replace(ROOT + '/', '');
  for (const [re, label] of P0_CHECKS) {
    if (re.test(content)) fail(`${rel}: pelanggaran P0 — ${label}`);
  }
  for (const m of content.matchAll(EMOJI_RE)) {
    fail(`${rel}: emoji mentah terdeteksi (${m[0]}) — pakai ikon SVG`);
  }
}

// ── 3. Sisa restructure / stack lama ───────────────────────────────────────
if (existsSync(join(ROOT, 'tiktok-like-main'))) {
  fail('subfolder tiktok-like-main masih ada — restructure belum bersih');
}
for (const f of SRC_FILES) {
  const content = readFileSync(f, 'utf-8');
  const rel = f.replace(ROOT + '/', '');
  if (/require\(['"]axios['"]\)|require\(['"]cheerio['"]\)|from ['"]axios['"]|from ['"]cheerio['"]/.test(content)) {
    fail(`${rel}: sisa axios/cheerio — worker harus tanpa dependensi`);
  }
  if (/leofame\.com\/free-tiktok-likes\?api=1/.test(content) && !rel.endsWith('_worker.js') && !rel.endsWith('_worker.test.mjs')) {
    fail(`${rel}: pemanggilan API upstream leofame hanya boleh di worker (+ tes) — tautan href biasa ke leofame.com boleh`);
  }
}

// ── 4. Secret kasar ────────────────────────────────────────────────────────
const SECRET_RE = /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i;
for (const f of SRC_FILES) {
  const content = readFileSync(f, 'utf-8');
  const rel = f.replace(ROOT + '/', '');
  if (SECRET_RE.test(content)) fail(`${rel}: kemungkinan secret ter-commit`);
}
if (existsSync(join(ROOT, '.env'))) fail('.env ter-commit di root');

if (failures.length > 0) {
  console.error('check-static GAGAL:');
  for (const m of failures) console.error(` - ${m}`);
  process.exit(1);
}
console.log('check-static OK');
