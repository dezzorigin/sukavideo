# Deploy — Suka Video

## Target

Cloudflare Pages, proyek **`sukavideo`**, URL live:

- https://sukavideo.pages.dev

Nama proyek dicoba urut: `tiktok-likes-tool` → `tiktoklikestool` →
`suka-tiktok`. (Nama Pages adalah namespace global — ketersediaan baru
ketahuan saat create; GET 404 bukan bukti tersedia.)

## Cara deploy (helper `~/workspace/github-actions/cf_pages.py`)

```bash
# 1. Build
npm run build          # menghasilkan dist/ (+ dist/_worker.js)

# 2. Buat proyek (sekali saja; kalau 409 berarti sudah ada — lanjut deploy)
python3 ~/workspace/github-actions/cf_pages.py create-project sukavideo

# 3. Deploy dist/ sebagai production
python3 ~/workspace/github-actions/cf_pages.py deploy sukavideo dist
```

Catatan dari repo sebelumnya:

- `deploy` bisa 404 sesaat setelah `create-project` — retry setelah
  ~20 detik, bukan error nama (pelajaran #33).
- `dist/_worker.js` dikemas sebagai worker Pages oleh `cf_pages.py`
  (bukan aset statis) — tanpanya `/api/*` tidak jalan.
- Deploy lama di `https://f0ea5b7d.tiktok-likes-tool.pages.dev` (dari era
  sebelum restructure) tetap hidup sebagai deployment lama; deployment
  baru menjadi production di `https://tiktok-likes-tool.pages.dev`.

## Verifikasi live (setelah deploy)

```bash
curl -s https://sukavideo.pages.dev/ | grep -o "Kirim likes gratis" | head -1
curl -s https://sukavideo.pages.dev/api/status
curl -s https://sukavideo.pages.dev/api/demo
# POST sungguhan hanya dari browser / curl di luar VM (POST dari VM
# menggantung di egress proxy — pelajaran #29). Di live, uji lewat
# konsol di halaman: tempel tautan video lalu klik kirim.
```

## About repo

Setelah live terverifikasi, pasang link live di About repo via
PATCH homepage (`https://sukavideo.pages.dev`) dan verifikasi
homepage terpasang.
