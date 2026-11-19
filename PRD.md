# PRD — TikTok Likes Tool

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | TikTok Likes Tool |
| Tech Stack | Situs statis (HTML/CSS/JS) + Cloudflare Pages Worker (tanpa dependensi produksi) |
| Status | Proper (v1.1.0) — restructure + rebuild, 19 Nov 2026 |
| Penanggung Jawab | Nabil Aulia Dika |
| Live Demo | https://tiktok-likes-tool.pages.dev |
| Versi Dokumen | 2.0 |
| Tanggal | 19 Nov 2026 |

## 2. Latar Belakang

Kreator kecil butuh dorongan awal untuk satu video TikTok. Layanan uji
coba gratis (leofame.com) sudah menyediakan pengiriman likes gratis tanpa
login — tapi tidak punya antarmuka yang jelas dan jujur. Repo ini
membungkus layanan itu dengan konsol kiriman yang memperlihatkan tiap
langkah prosesnya, tanpa menjanjikan angka yang bukan miliknya.

## 3. Tujuan

- Satu alat tempel-tautan yang benar-benar jalan: tempel, kirim, lihat status.
- Jujur soal sumber likes dan batasnya (jumlah mengikuti kuota upstream).
- Tanpa login, tanpa kata sandi, tanpa data pribadi yang dikumpulkan.
- Deploy live di Cloudflare Pages dengan CI hijau.

## 4. Ruang Lingkup

- Fitur inti: kirim likes ke satu video TikTok via upstream leofame.com.
- Konsol kiriman: validasi URL, log status berjalan, struk hasil +
  jawaban mentah, mode contoh (`/api/demo`).
- Landing ala SaaS: navbar + tautan GitHub, hero dengan konsol hidup,
  cara pakai, fitur, FAQ, footer.
- Dokumentasi: README, PRD, DESIGN.md, ARCHITECTURE.md, deploy.md,
  testing.md, diagrams.html, screenshot + video demo.
- Di luar ruang lingkup: akun pengguna, riwayat kiriman, pembayaran,
  jaminan jumlah likes, dan layanan pengirim likes milik sendiri.

## 5. Fitur & Persyaratan Fungsional

| ID | Fitur | Kriteria |
|---|---|---|
| F-01 | Tempel tautan + kirim likes | `POST /api/likes {"url"}`; URL harus host TikTok; jawaban upstream diteruskan apa adanya |
| F-02 | Alias endpoint lama | `POST /api/tiktok` berperilaku sama dengan `/api/likes` |
| F-03 | Log status berjalan | Konsol menulis baris log dengan stempel waktu di tiap tahap (terima → token → kirim → jawaban) |
| F-04 | Struk kiriman | Menampilkan video, pesan layanan, dan jumlah (bila ada) + jawaban mentah di `<details>` |
| F-05 | Mode contoh | `GET /api/demo` + tombol "Lihat contoh hasil" — hasil berlabel "contoh", tanpa mengirim apa pun |
| F-06 | Validasi inline | URL kosong / bukan TikTok ditolak di browser sebelum request, dengan pesan yang jelas |
| F-07 | Penanganan gagal jujur | Upstream berubah/sibuk/menolak → 502 + pesan penyebab, struk "gagal" |
| F-08 | Kesehatan worker | `GET /api/status` → `{"ok": true, ...}` |
| F-09 | Throttle ringan | Maks 10 kirim/menit/IP (best-effort) → 429 |
| F-10 | Landing | Navbar + GitHub, hero + konsol, cara pakai, fitur, FAQ, footer — semua tautan/tombol berfungsi |

## 6. Persyaratan Non-Fungsional

- **Performa:** halaman statis + satu worker; timeout upstream 15 detik.
- **Keamanan:** hanya host TikTok diterima (bukan proxy terbuka);
  rahasia (`.env`) tidak boleh ter-commit; nol secret di repo.
- **Kejujuran:** tidak ada statistik vanity; data contoh dilabeli "contoh".
- **Aksesibilitas:** kontras AA, focus-visible, `aria-live` pada log,
  `prefers-reduced-motion` dihormati, mobile 390px tanpa overflow.
- **Maintainability:** nol dependensi produksi; CI 6 job hijau.

## 7. Arsitektur & Tech Stack

Situs statis `public/` + `worker/_worker.js` (fetch, tanpa axios —
axios era Vercel tidak jalan di Workers). Build `scripts/build.mjs`
menyalin keduanya ke `dist/`; `cf_pages.py` mengemas `dist/_worker.js`
sebagai worker Pages. Detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 8. Milestone

| Fase | Status |
|---|---|
| Inisialisasi & scaffolding | ✅ (repo lama, subfolder `tiktok-like-main`) |
| Restructure ke root | ✅ (PR #1, 19 Nov 2026) |
| Rebuild total (UI + worker) | ✅ (PR #1, 19 Nov 2026) |
| Testing & QA | ✅ (unit + e2e + smoke + validate + sweep) |
| Deployment | ✅ (https://tiktok-likes-tool.pages.dev) |
| Dokumentasi | ✅ |

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Upstream leofame.com berubah markup / habis kuota | Token diambil lewat regex + 502 jujur; `/api/demo` tetap jalan |
| Upstream dipakai berlebihan | Throttle per IP + validasi host TikTok |
| Konfigurasi env bocor | `.gitignore` + `check-static` (secret kasar) |
| Dependency usang | Nol dependensi produksi; sweep OSV di CI (devDeps saja) |

## 10. Kriteria Keberhasilan

- Aplikasi berjalan tanpa error di lingkungan dev maupun live.
- Kirim likes sungguhan berhasil end-to-end lewat konsol live (atau,
  bila upstream sedang tidak bisa, gagal dengan pesan jujur).
- README & PRD lengkap dan up-to-date; screenshot asli + video demo ada.
- CI hijau (6 job) dan gate anti-slop 7 sumbu lolos (≥4 tiap sumbu).

## 11. Lisensi

MIT (LICENSE)
