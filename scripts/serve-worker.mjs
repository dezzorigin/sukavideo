// Local dev server: sajikan dist/ statis + rute /api/* lewat worker/_worker.js
// dengan binding ASSETS dari filesystem. Pola docsumm serve-worker.mjs.
// Usage: npm run build && npm run serve  (port default 8331)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/_worker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 8331);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
};

const ASSETS = {
  async fetch(req) {
    const url = new URL(req.url);
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = path.join(DIST, p);
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
      return new Response('Not found', { status: 404 });
    }
    const ext = path.extname(file);
    return new Response(await readFile(file), {
      headers: { 'content-type': MIME[ext] || 'application/octet-stream' },
    });
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host}${req.url}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await new Response(req).arrayBuffer(),
      duplex: 'half',
    });
    const response = await worker.fetch(request, { ASSETS });
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (response.body) {
      for await (const chunk of response.body) res.write(chunk);
    }
    res.end();
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(`serve-worker error: ${e.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`sukavideo serve: http://127.0.0.1:${PORT}/`);
});
