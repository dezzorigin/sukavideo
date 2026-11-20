# Arsitektur — Suka Video

## Ringkasan

Situs statis + satu Cloudflare Pages Worker tanpa dependensi produksi.
Frontend (`public/`) adalah halaman HTML/CSS/JS biasa; semua logika
server tinggal di `worker/_worker.js`. Build menyalin keduanya ke `dist/`,
dan `cf_pages.py` mengemas `dist/_worker.js` sebagai worker Pages.

```
pengguna ──► Pages (dist/) ──► _worker.js
                                  ├─ GET  /api/status   (kesehatan)
                                  ├─ POST /api/likes    (kirim likes)
                                  ├─ POST /api/tiktok   (alias lama)
                                  ├─ GET  /api/demo     (contoh hasil)
                                  └─ GET  https://leofame.com/free-tiktok-likes
                                     (ambil token + cookies)
                                     POST https://leofame.com/free-tiktok-likes?api=1
                                     (kirim tautan video)
```

## Asal-usul (restructure #35)

Repo lama menyimpan aplikasi di subfolder `tiktok-like-main/`:

| Lama (`tiktok-like-main/`) | Baru (root) | Keputusan |
|---|---|---|
| `public/index.html` | `public/index.html` | Naik ke root, dibangun ulang total (desain baru, lihat `DESIGN.md`) |
| `public/script.js` | `public/app.js` | Naik ke root, ditulis ulang: log status berjalan + struk hasil + mode contoh |
| `public/style.css` | `public/style.css` | Naik ke root, ditulis ulang total (palet Kertas/Tinta/Merah Hati) |
| `api/tiktok.js` (Vercel + axios) | `worker/_worker.js` | Logika **dipertahankan** (GET halaman → regex token → POST form), transport diganti `fetch` — axios tidak bisa jalan di Workers dan dihapus dari dependensi |
| `package.json` (hanya `axios`) | `package.json` | Diganti: nol dependensi produksi, devDeps hanya Playwright + puppeteer-core |
| `README.md` (stub `# tiktok-like`) | — | Dihapus, diganti README root yang ditulis ulang |
| — | `scripts/`, `e2e/`, `docs/`, `.github/` | Baru, mengikuti pola repo #34 |

Keputusan konflik: tidak ada konflik isi — root lama hanya berisi
`README.md`, `LICENSE`, `PRD.md`, `.gitignore` (tidak ada file aplikasi di
root). `LICENSE` (MIT 2026) dan `.gitignore` dipertahankan (gitignore
ditambah `dist/`, `.wrangler/`, artefak tes).

## Alur kirim likes

1. Worker memvalidasi format URL (host yang didukung) sebelum mengirim; frontend hanya memeriksa kolom tidak kosong.
2. `POST /api/likes {"url"}` → worker memeriksa host, panjang, throttle
   per IP (10/menit, best-effort).
3. Worker `GET leofame.com/free-tiktok-likes` (timeout 15 dtk), mengambil
   token lewat regex `var token = '...'` dan cookies dari `set-cookie`.
4. Worker `POST leofame.com/free-tiktok-likes?api=1` dengan body form
   (`token`, `timezone_offset=Asia/Jakarta`, `free_link=<url>`).
5. Jawaban upstream diteruskan apa adanya sebagai `{"ok": true, "upstream": …}`.
   Frontend menampilkannya sebagai struk + jawaban mentah di `<details>`.

Kegagalan upstream (halaman berubah, token hilang, upstream menolak,
timeout) dijawab 502 dengan pesan jujur — bukan angka palsu.

## Batas & kejujuran

- Worker ini **bukan** penyedia likes. Likes berasal dari uji coba gratis
  leofame.com; jumlahnya ditentukan layanan itu dan bisa berubah/habis.
- Tidak ada login, kata sandi, atau data pribadi yang dikumpulkan.
  Satu-satunya input adalah tautan video publik.
- Throttle 10 kirim/menit/IP adalah pagar best-effort per isolate Workers,
  bukan kuota keras.
- Tidak ada secret yang ter-commit (dicek `scripts/check-static.mjs`).

## File penting

| File | Peran |
|---|---|
| `public/index.html` | Landing + konsol kiriman (navbar, hero, cara pakai, fitur, FAQ, footer) |
| `public/app.js` | Logika konsol: validasi, log berjalan, struk, mode contoh |
| `public/style.css` | Satu-satunya stylesheet (palet di `docs/DESIGN.md`) |
| `worker/_worker.js` | Worker Pages: statis via `ASSETS` + `/api/*` |
| `worker/_worker.test.mjs` | Unit test (token, validasi, endpoint) — `npm test` |
| `scripts/build.mjs` | `public/*` + worker → `dist/` |
| `scripts/serve-worker.mjs` | Server dev lokal (port 8331) |
| `scripts/smoke.mjs` | Verifikasi `dist/` persis yang di-deploy |
| `scripts/check-links.mjs`, `scripts/check-static.mjs` | `npm run validate` |
| `scripts/advisory-sweep.py` | Sweep OSV batch (produksi saja, tanpa auth) |
| `scripts/screenshot.mjs`, `scripts/make-video.mjs` | Screenshot docs + video demo |
| `e2e/app.spec.js` | Playwright e2e (desktop + mobile) |
| `docs/diagrams.html` | Diagram arsitektur + alur (HTML+SVG) |
