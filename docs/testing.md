# Testing — TikTok Likes Tool

## Ringkasan perintah

| Perintah | Yang diuji |
|---|---|
| `npm test` | Unit test worker (node:test): regex token leofame, validasi URL TikTok, endpoint `/api/*` — fetch upstream di-mock |
| `npm run validate` | `check-links` (tautan lokal + file wajib) + `check-static` (gate anti-slop P0, sisa Vercel/axios, secret) |
| `npm run sweep` | Advisory sweep OSV batch (produksi saja; repo ini nol paket produksi) |
| `npx playwright test` | E2E desktop + mobile terhadap server lokal |
| `npm run smoke` | Verifikasi `dist/` (persis yang di-deploy): file wajib + respons `/`, `/api/status`, `/api/demo`, validasi `/api/likes` |
| `npm run screenshots` | Screenshot docs (butuh server di :8331 + Chromium cache) |
| `npm run make-video` | Rangkai screenshot jadi `docs/demo/demo.mp4` (butuh ffmpeg) |

## Alur lokal

```bash
npm ci
npm test                 # unit worker
npm run validate         # tautan + gate P0 + secret
npm run sweep            # OSV (butuh internet)
npm run build            # dist/
npm run smoke            # smoke dist/
npx playwright test      # e2e (Chromium diunduh di CI; di VM pakai cache)
```

## Yang TIDAK diuji otomatis

- **POST sungguhan ke leofame.com** — dari VM ini POST egress menggantung
  (pelajaran #29/docsumm) dan upstream adalah layanan pihak ketiga yang
  kuotanya bisa habis. Jalur ini diuji unit (fetch di-mock) + play-test
  live pasca-deploy lewat konsol di halaman. `/api/demo` adalah pengganti
  deterministiknya di semua tes otomatis.
- **Render live dari VM headless** — screenshot lokal memakai server
  lokal; render live diverifikasi lewat screenshot + cek HTTP pasca-deploy.

## CI

`.github/workflows/ci.yml` — 6 job: build, worker-test, static-checks,
advisory-sweep, playwright-e2e, smoke. Node 24. Semua harus hijau sebelum merge.
