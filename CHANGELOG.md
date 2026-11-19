# CHANGELOG — TikTok Likes Tool

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
