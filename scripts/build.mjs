// Build: salin public/* ke dist/ + worker/_worker.js ke dist/_worker.js
// (pola #34: cf_pages.py mengemas dist/_worker.js sebagai worker Pages).
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'public'), DIST, { recursive: true });
cpSync(join(ROOT, 'worker', '_worker.js'), join(DIST, '_worker.js'));
console.log(`build: dist/ siap (${join(DIST, '_worker.js')} + public/*)`);
