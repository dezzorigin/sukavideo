# CHANGELOG — Suka Video

## [1.2.0] — 2026-11-20

Rebrand total + rename ke **Suka Video** (repo `dezzorigin/sukavideo`,
live `sukavideo.pages.dev`). PR #3.

Alasan: nama/merek lama memakai "TikTok" di semua copy user-visible —
pola yang sama dengan yang dikomplain PhishLabs ke repo #34
(unduh-tiktok → simpanklip, 20 Nov 2026).

### Rebrand

- Brand `TikTok Likes Tool` → `Suka Video` di semua copy user-visible
  (title, hero, logo, footer, README, docs, OG tags); `og-image.png` +
  screenshot + video demo digambar ulang dari halaman baru.
- Validasi host pindah ke server saja: frontend tidak lagi menyimpan
  daftar host (dulu `TIKTOK_HOSTS` + `isTikTokUrl` di `app.js`) —
  worker menolak host tak didukung dengan 400 + pesan generik.
- Gate baru di `scripts/check-static.mjs`: `public/` tidak boleh
  mengandung "tiktok" (case-insensitive).
- Yang TIDAK berubah (fungsi): worker tetap hanya menerima URL video
  TikTok karena upstream (leofame.com/free-tiktok-likes) hanya melayani
  itu; allowlist host + endpoint upstream + alias `POST /api/tiktok`
  dipertahankan apa adanya di sisi server. URL TikTok sebagai data uji
  di worker test + e2e + smoke dipertahankan.

## [1.1.0] — 2026-11-19

Rebuild proper repo #35 (program P1). PR #1.

### Restructure (subfolder `tiktok-like-main/` → root)

- Isi aplikasi naik ke root repo; subfolder lama dihapus dari tree.
  Tidak ada konflik isi — root lama hanya berisi README, LICENSE, PRD,
  `.gitignore` (tidak ada file aplikasi di root).
- `api/tiktok.js` (Vercel + axios) → `worker/_worker.js` (fetch, tanpa
  dependensi). Logika dipertahankan: GET halaman leofame → regex token →
  POST form. `package.json` lama (hanya `axios`) diganti: nol dependensi
  produksi.
- `README.md` stub subfolder (`# tiktok-like`) dihapus; README root
  ditulis ulang. `LICENSE` MIT dan `.gitignore` dipertahankan (ditambah
  `dist/`, `.wrangler/`, artefak tes).

### Ditambahkan

- Landing ala SaaS (desain baru, kontrak di `docs/DESIGN.md`): navbar +
  tautan GitHub, hero rata kiri + konsol kiriman hidup, cara pakai,
  fitur berbaris, FAQ, footer satu baris.
- Konsol kiriman: validasi URL inline, log status berjalan dengan stempel
  waktu, struk hasil + jawaban mentah, mode contoh (`GET /api/demo`).
- Endpoint: `POST /api/likes` (+ alias `POST /api/tiktok`), `GET /api/status`,
  `GET /api/demo`; throttle 10 kirim/menit/IP; timeout upstream 15 dtk.
- CI 6 job (build, worker-test, static-checks, advisory-sweep OSV,
  playwright-e2e, smoke), Node 24.
- Docs: DESIGN.md, ARCHITECTURE.md, deploy.md, testing.md, diagrams.html
  (HTML+SVG), screenshot desktop/mobile + video demo.

### Diperbaiki

- Aplikasi kini bisa jalan dari root (`npm run build && npm run serve`).
- Pesan gagal kini jujur (502 + penyebab) — sebelumnya JSON mentah tanpa
  konteks.

## [1.0.0] — 2026

- Rilis awal: aplikasi di subfolder `tiktok-like-main/` (Vercel + axios),
  README 587 karakter, LICENSE, PRD.
