// Suka Video — Cloudflare Pages _worker.js (single-file, tanpa dependensi).
//
// Menggantikan api/tiktok.js era Vercel (axios, CommonJS). Worker ini:
//   - menyajikan situs statis lewat binding ASSETS (dist/ hasil build),
//   - GET  /api/status            -> kesehatan worker,
//   - POST /api/likes             -> kirim likes gratis ke satu video,
//   - POST /api/tiktok            -> alias kompatibilitas (endpoint lama),
//   - GET  /api/demo              -> hasil contoh berlabel demo:true.
//
// Alur /api/likes (sama persis dengan api/tiktok.js lama, hanya transportnya
// diganti fetch — tidak ada fitur baru yang dikarang):
//   1. GET https://leofame.com/free-tiktok-likes, ambil token dari halaman
//      (`var token = '...'`) dan cookies dari header set-cookie.
//   2. POST form ke https://leofame.com/free-tiktok-likes?api=1 dengan
//      token + timezone_offset=Asia/Jakarta + free_link=<url video>.
//   3. Teruskan jawaban upstream ke frontend (dinormalisasi).
//
// Likes dikirim lewat uji coba gratis layanan pihak ketiga (leofame.com).
// Worker ini BUKAN penyedia likes — kalau upstream berubah markup, habis
// kuota uji coba, atau menolak, worker menjawab 502 dengan pesan jujur
// (bukan angka palsu).
//
// Batas penyalahgunaan: hanya host yang didukung yang diterima (mencegah worker
// dipakai sebagai proxy terbuka), panjang URL dibatasi, timeout 15 detik,
// throttle ringan per IP (10 kirim/menit, best-effort per isolate).
// Catatan rebrand 20 Nov 2026: penyajian dibuat generik (Suka Video); fungsi
// tetap hanya menerima URL video TikTok karena upstream
// (leofame.com/free-tiktok-likes) hanya melayani itu — allowlist host +
// endpoint upstream dipertahankan apa adanya di sisi server.

const LEOFAME_ORIGIN = 'https://leofame.com';
const LEOFAME_PAGE = `${LEOFAME_ORIGIN}/free-tiktok-likes`;

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  Origin: LEOFAME_ORIGIN,
  Referer: LEOFAME_PAGE,
};

const TIKTOK_HOSTS = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vt.tiktok.com',
  'vm.tiktok.com',
]);

export function isTikTokUrl(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 2048) return false;
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  return TIKTOK_HOSTS.has(u.hostname.toLowerCase());
}

/** Ambil token dari HTML halaman leofame (`var token = '...'`), atau null. */
export function extractToken(html) {
  if (typeof html !== 'string') return null;
  const m = html.match(/var\s+token\s*=\s*'([^']+)'/);
  return m ? m[1] : null;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Throttle ringan per IP: 10 kirim/menit. Map per isolate (best-effort —
// isolate bisa didaur ulang, jadi ini pagar, bukan kuota keras).
const hits = new Map(); // ip -> [timestamp ms]
function throttled(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (list.length >= 10) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

/**
 * Langkah 1–2 ke upstream. `doFetch` bisa diganti di tes.
 * Mengembalikan jawaban upstream apa adanya (objek) + token dipakai.
 */
export async function sendLikes(videoUrl, doFetch = fetch) {
  const pageRes = await doFetch(LEOFAME_PAGE, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(15_000),
  });
  if (!pageRes.ok) {
    const err = new Error('Layanan pengirim likes sedang tidak bisa dihubungi.');
    err.code = 'UPSTREAM_DOWN';
    err.status = 502;
    throw err;
  }
  const html = await pageRes.text();
  const token = extractToken(html);
  if (!token) {
    const err = new Error(
      'Layanan pengirim likes berubah dan tokennya tidak ditemukan. Coba lagi nanti.',
    );
    err.code = 'TOKEN_MISSING';
    err.status = 502;
    throw err;
  }
  const setCookie = pageRes.headers.get('set-cookie') || '';
  const cookies = setCookie
    .split(/,(?=[^;]+=[^;]+;)/)
    .map((v) => v.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');

  const body = new URLSearchParams({
    token,
    timezone_offset: 'Asia/Jakarta',
    free_link: videoUrl,
  }).toString();

  const res = await doFetch(`${LEOFAME_PAGE}?api=1`, {
    method: 'POST',
    headers: {
      ...FETCH_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data === null) {
    const err = new Error('Layanan pengirim likes menolak kiriman ini.');
    err.code = 'UPSTREAM_REJECTED';
    err.status = 502;
    throw err;
  }
  return data;
}

function demoResult() {
  return {
    ok: true,
    demo: true,
    message: 'Contoh hasil — kiriman sungguhan akan menampilkan jawaban dari leofame.com di sini.',
    video: 'https://contoh.id/@contoh/video/7000000000000000000',
    result: {
      status: 'success',
      likes_sent: 25,
      note: 'Contoh: 25 likes terkirim (angka contoh, bukan hasil nyata).',
    },
  };
}

async function handleLikes(req) {
  let payload = null;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: 'Body harus JSON dengan field "url".' }, 400);
  }
  const url = typeof payload?.url === 'string' ? payload.url.trim() : '';
  if (!url) return json({ ok: false, error: 'URL video wajib diisi.' }, 400);
  if (!isTikTokUrl(url)) {
    return json(
      { ok: false, error: 'Tautan harus berupa URL video yang didukung.' },
      400,
    );
  }
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon';
  if (throttled(ip)) {
    return json(
      { ok: false, error: 'Terlalu banyak kiriman. Tunggu sebentar lalu coba lagi.' },
      429,
    );
  }
  try {
    const upstream = await sendLikes(url);
    return json({ ok: true, upstream });
  } catch (e) {
    const status = e.status || 500;
    return json({ ok: false, error: e.message || 'Terjadi kesalahan saat memproses.', code: e.code || 'ERROR' }, status);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === '/api/status' && req.method === 'GET') {
      return json({ ok: true, service: 'sukavideo', upstream: 'leofame.com/free-tiktok-likes', mode: 'live' });
    }
    if (path === '/api/demo' && req.method === 'GET') {
      return json(demoResult());
    }
    if ((path === '/api/likes' || path === '/api/tiktok') && req.method === 'POST') {
      return handleLikes(req);
    }
    if ((path === '/api/likes' || path === '/api/tiktok') && req.method === 'GET') {
      return json({ ok: false, error: 'Gunakan POST dengan body JSON {"url": "..."} untuk mengirim likes.' }, 405);
    }
    if (path.startsWith('/api/')) {
      return json({ ok: false, error: 'Endpoint tidak dikenal.' }, 404);
    }

    if (env?.ASSETS?.fetch) {
      const res = await env.ASSETS.fetch(req);
      return res;
    }
    return new Response('Not found', { status: 404 });
  },
};
