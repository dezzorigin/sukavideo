// smoke.mjs — verifikasi folder dist/ (persis yang di-deploy ke Pages):
// file wajib ada + server lokal merespons / (200, ada judul), /api/status
// (200 ok:true), /api/demo (200 demo:true), validasi /api/likes.
// Hanya GET + POST lokal — POST ke upstream TIDAK diuji dari VM ini
// (egress POST menggantung, pelajaran #29/docsumm; alur upstream
// diverifikasi lewat /api/demo + play-test live pasca-deploy).
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const failures = [];

for (const f of ['index.html', 'app.js', 'style.css', 'favicon.svg', '_worker.js']) {
  if (!existsSync(join(DIST, f))) failures.push(`dist/${f} hilang — jalankan npm run build dulu`);
}
if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

const PORT = 8392;
const srv = spawn(process.execPath, ['scripts/serve-worker.mjs'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return { status: res.status, text: await res.text() };
}

async function post(path, body) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

let code = 0;
try {
  let ok = false;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await get('/api/status');
      if (r.status === 200) { ok = true; break; }
    } catch { /* belum naik */ }
    await wait(500);
  }
  if (!ok) throw new Error('server tidak naik di :' + PORT);

  const checks = [
    ['/', 200, 'Kirim likes gratis'],
    ['/api/status', 200, '"ok":true'],
    ['/api/demo', 200, '"demo":true'],
    ['/api/likes', 405, 'POST'],
    ['/favicon.svg', 200, '<svg'],
    ['/style.css', 200, '--merah-hati'],
    ['/app.js', 200, 'api/likes'],
    ['/tidak-ada', 404, 'Not found'],
  ];
  for (const [path, wantStatus, wantText] of checks) {
    const r = await get(path);
    if (r.status !== wantStatus) failures.push(`${path}: status ${r.status}, mau ${wantStatus}`);
    else if (!r.text.includes(wantText)) failures.push(`${path}: tidak mengandung "${wantText}"`);
    else console.log(`ok ${path} (${r.status})`);
  }

  const posts = [
    [{}, 400, 'wajib diisi'],
    [{ url: 'https://example.com/x' }, 400, 'TikTok'],
  ];
  for (const [body, wantStatus, wantText] of posts) {
    const r = await post('/api/likes', body);
    if (r.status !== wantStatus) {
      failures.push(`POST /api/likes ${JSON.stringify(body)}: status ${r.status}, mau ${wantStatus}`);
    } else if (wantText && !r.text.includes(wantText)) {
      failures.push(`POST /api/likes ${JSON.stringify(body)}: tidak mengandung "${wantText}"`);
    } else console.log(`ok POST /api/likes ${JSON.stringify(body)} (${r.status})`);
  }

  // Kasus upstream: hasilnya tergantung lingkungan — dari VM, POST ke
  // leofame menggantung lalu timeout (worker menjawab 500); dari CI,
  // POST ke leofame bisa berhasil (worker menjawab 200 {ok:true}).
  // Keduanya sah asal worker menangani upstream tanpa crash: terima
  // 200 (ok:true) ATAU 500/502 (ok:false), dan tolak selain itu.
  {
    const r = await post('/api/likes', { url: 'https://www.tiktok.com/@tiktok/video/7400000000000000000' });
    let body = null;
    try { body = JSON.parse(r.text); } catch { /* bukan JSON */ }
    if (r.status === 200 && body?.ok === true) {
      console.log('ok POST /api/likes upstream menjawab 200 (ok:true)');
    } else if ([500, 502].includes(r.status) && body?.ok === false) {
      console.log(`ok POST /api/likes upstream-gagal-ditangani (${r.status}, ok:false)`);
    } else {
      failures.push(`POST /api/likes valid: status ${r.status}, body ${r.text.slice(0, 200)} — mau 200 ok:true atau 500/502 ok:false`);
    }
  }

  if (failures.length > 0) {
    console.error(failures.join('\n'));
    code = 1;
  } else {
    console.log('smoke OK');
  }
} catch (e) {
  console.error('smoke gagal:', e.message);
  code = 1;
} finally {
  srv.kill();
  process.exit(code);
}
