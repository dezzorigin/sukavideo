// Unit test worker (node:test, tanpa dependensi). Jalankan: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import worker, { isTikTokUrl, extractToken, sendLikes } from './_worker.js';

const ASSETS = {
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};

function req(path, opts = {}) {
  return new Request(`https://sukavideo.pages.dev${path}`, opts);
}

describe('isTikTokUrl', () => {
  it('menerima URL video yang didukung', () => {
    assert.equal(isTikTokUrl('https://www.tiktok.com/@kreator/video/7000000000000000000'), true);
    assert.equal(isTikTokUrl('https://vt.tiktok.com/ZSabc123/'), true);
    assert.equal(isTikTokUrl('https://vm.tiktok.com/ZSabc123/'), true);
    assert.equal(isTikTokUrl('https://m.tiktok.com/v/7000000000000000000.html'), true);
  });
  it('menolak host lain', () => {
    assert.equal(isTikTokUrl('https://example.com/x'), false);
    assert.equal(isTikTokUrl('https://tiktok.com.evil.com/video/1'), false);
    assert.equal(isTikTokUrl('not-a-url'), false);
    assert.equal(isTikTokUrl(''), false);
    assert.equal(isTikTokUrl('x'.repeat(3000)), false);
  });
});

describe('extractToken', () => {
  it('mengambil token dari HTML leofame', () => {
    // Token contoh pendek (bukan token asli): token asli diambil segar
    // dari halaman leofame tiap request dan bukan kredensial.
    const html = "<script>var token = 'tok-contoh-1';</script>";
    assert.equal(extractToken(html), 'tok-contoh-1');
  });
  it('null bila token tidak ada', () => {
    assert.equal(extractToken('<html></html>'), null);
    assert.equal(extractToken(null), null);
  });
});

describe('sendLikes (fetch di-mock)', () => {
  const pageHtml = "var token = 'tok123';";
  const fakeFetch = async (url, opts = {}) => {
    if (opts.method === 'POST') {
      assert.equal(url, 'https://leofame.com/free-tiktok-likes?api=1');
      assert.match(opts.body, /token=tok123/);
      assert.match(opts.body, /timezone_offset=Asia%2FJakarta/);
      assert.match(opts.body, /free_link=/);
      assert.equal(opts.headers['Content-Type'], 'application/x-www-form-urlencoded');
      return new Response(JSON.stringify({ status: 'success', message: 'Likes sent' }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    assert.equal(url, 'https://leofame.com/free-tiktok-likes');
    return new Response(pageHtml, {
      headers: { 'set-cookie': 'sess=abc; Path=/', 'content-type': 'text/html' },
    });
  };

  it('mengembalikan jawaban upstream', async () => {
    const data = await sendLikes('https://www.tiktok.com/@a/video/1', fakeFetch);
    assert.equal(data.status, 'success');
  });

  it('502 TOKEN_MISSING bila halaman tanpa token', async () => {
    const noToken = async (url, opts = {}) =>
      opts.method === 'POST'
        ? new Response('{}', { headers: { 'content-type': 'application/json' } })
        : new Response('<html></html>');
    await assert.rejects(() => sendLikes('https://www.tiktok.com/@a/video/1', noToken), (e) => {
      assert.equal(e.code, 'TOKEN_MISSING');
      assert.equal(e.status, 502);
      return true;
    });
  });

  it('502 UPSTREAM_DOWN bila halaman gagal', async () => {
    const down = async () => new Response('err', { status: 503 });
    await assert.rejects(() => sendLikes('https://www.tiktok.com/@a/video/1', down), (e) => {
      assert.equal(e.code, 'UPSTREAM_DOWN');
      return true;
    });
  });
});

describe('endpoint /api/*', () => {
  it('GET /api/status -> ok:true', async () => {
    const res = await worker.fetch(req('/api/status'), { ASSETS });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.upstream, 'leofame.com/free-tiktok-likes');
  });

  it('GET /api/demo -> demo:true dan likes contoh', async () => {
    const res = await worker.fetch(req('/api/demo'), { ASSETS });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.demo, true);
    assert.equal(body.result.likes_sent, 25);
  });

  it('POST /api/likes tanpa url -> 400', async () => {
    const res = await worker.fetch(
      req('/api/likes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
      { ASSETS },
    );
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /wajib diisi/);
  });

  it('POST /api/likes host tak didukung -> 400', async () => {
    const res = await worker.fetch(
      req('/api/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/x' }),
      }),
      { ASSETS },
    );
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /didukung/);
  });

  it('GET /api/likes -> 405 (harus POST)', async () => {
    const res = await worker.fetch(req('/api/likes'), { ASSETS });
    assert.equal(res.status, 405);
  });

  it('GET /api/tidak-ada -> 404', async () => {
    const res = await worker.fetch(req('/api/tidak-ada'), { ASSETS });
    assert.equal(res.status, 404);
  });

  it('jalur non-API diteruskan ke ASSETS', async () => {
    const res = await worker.fetch(req('/'), { ASSETS });
    assert.equal(res.status, 404);
    assert.equal(await res.text(), 'Not found');
  });
});
