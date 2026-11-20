# DESIGN.md — Kontrak Arah Desain Suka Video

> Ditulis SEBELUM coding (standar anti-slop P1 §4). Referensi dipilih dulu,
> palet dikunci dulu, baru bangun. Repo #35 — restructure ketiga di program P1
> (setelah #33 lokakos dan #34 simpanklip), sepasang dengan #34.

## 1. Produk & pengguna

Suka Video — alat tempel-tautan untuk mengirim likes gratis ke satu video. Pengguna: kreator kecil yang mau dorongan awal untuk satu
video — mereka butuh **tempel tautan, klik kirim, lihat status**, bukan
membaca brosur. Formulir kirim adalah produknya; landing adalah
pembungkusnya. Likes dikirim lewat uji coba gratis layanan pihak ketiga
(leofame.com) — tanpa login, tanpa kata sandi, tanpa bayar. Hasilnya
tergantung layanan itu; halaman ini jujur soal itu, bukan menjanjikan angka.

## 2. Referensi (3 kandidat, 1 pemenang)

| # | Referensi | URL | Kenapa cocok |
|---|---|---|---|
| 1 — **PEMENANG** | **Plumb Proof** (template Framer, SaaS landing page gratis) | https://www.framer.com/marketplace/templates/plumb-proof/ | Dibuka dengan **demo hidup di hero** — terminal live sebagai pusat halaman, bukan gambar mati. Struktur inilah yang di-clone: headline rata kiri, lalu panel alat yang benar-benar berfungsi sebagai pusat hero; di bawahnya cara pakai, daftar fitur berbaris, FAQ, dan ajakan akhir. |
| 2 | **Bloomix** (template Framer, agensi social media marketing) | https://yoframer.com/templates/bloomix/ | Bukti domain: situs untuk pemasaran sosial yang bersih dan cepat tanpa gradien biru generik. Pembenar copy yang jujur soal hasil dan tanpa statistik vanity. |
| 3 | **Grift** (template Framer, landing SaaS chatbot AI) | https://www.framer.com/marketplace/templates/grift/ | Hero memakai mock widget interaktif (bukan screenshot mati). Pembenar keputusan: panel alat di hero harus interaktif penuh — tempel tautan, kirim, lihat log — bukan pajangan. |

**Yang di-clone plek-ketiplek dari Plumb Proof:** headline rata kiri +
panel demo hidup sebagai pusat hero; cara pakai sebagai strip langkah;
fitur sebagai daftar berbaris (bukan kartu simetris); FAQ lipat; footer
satu baris. **Yang diubah:** isinya alat kirim likes (bukan
terminal SaaS), panel demo berbentuk "konsol kiriman" dengan log status
berjalan, palet kertas terang + merah aksen (bukan gelap Plumb),
bahasa Indonesia, contoh hasil dilabeli "contoh" dengan jujur, dan
penjelasan bahwa pengiriman lewat layanan pihak ketiga.

## 3. Palet (6 warna bernama — tiap warna punya tugas)

| Nama | Hex | Peran |
|---|---|---|
| Kertas | `#FBFAF6` | Background utama — kertas hangat terang, bukan putih klinik |
| Tinta | `#1C1B1A` | Teks utama & headline — hitam hangat, bukan slate/biru |
| Merah Hati | `#FE2C55` | CTA utama + hati + sorot merek — dipakai hemat (tombol kirim + aksen kecil saja) |
| Cyan Aksen | `#25F4EE` | Aksen dekoratif kecil saja (titik-titik di logo, garis sorot log) — pasangan Merah Hati; tidak pernah jadi teks di atas Kertas (kontrasnya tidak lolos AA) |
| Abu Teks | `#6E6B64` | Teks sekunder, label, penjelasan — kontras terhadap Kertas 5.9:1 (AA) |
| Abu Garis | `#E7E3DA` | Garis pemisah & border kartu — satu tingkat lebih gelap dari Kertas |

Catatan anti-klise: ini **bukan** krim + terracotta (tidak ada terracotta),
bukan near-black + lime asam (latarnya terang), bukan dark blue/slate,
bukan espresso + oranye. Tidak ada gradient apa pun di halaman.

## 4. Tipografi (maks 2 keluarga)

- **Display: Bricolage Grotesque** — headline, angka besar penghitung hati,
  judul seksi. Grotesque ekspresif, rasa "alat kreator" bukan "dashboard SaaS".
- **Body: Public Sans** — teks UI, label, tombol, langkah cara pakai, log.
- Angka penghitung pakai `font-variant-numeric: tabular-nums`.
- Body ≤ 75ch. Satu ukuran headline hero, tidak ada kata yang di-italic /
  diwarnai / digradient di tengah headline. Sorotan satu frasa memakai
  garis bawah tebal Merah Hati (bukan warna teks, bukan italic).

## 5. Layout (satu kalimat) + detail khas

**Satu kalimat:** "Navbar ramping di atas; hero rata kiri dengan headline
satu baris, lalu konsol kiriman lebar-penuh sebagai pusat; di bawahnya
strip cara pakai tiga langkah, daftar fitur berbaris, contoh hasil, FAQ
lipat, dan footer satu baris."

**Detail khas — konsol kiriman:** panel alat berbentuk konsol dengan tiga
zona: (1) baris tempel-tautan + tombol kirim, (2) log status yang berjalan
baris demi baris ("mengambil token…", "mengirim tautan…",
"menunggu jawaban…") dengan stempel waktu, (3) kartu hasil berupa
"struk kiriman" dengan tepi robek garis putus-putus. Log membuat proses
yang aslinya butuh belasan detik jadi terlihat, bukan spinner buta.

## 6. Beda dari repo sebelumnya (#34 simpanklip) — 5/5 sumbu

| Sumbu | #34 simpanklip | #35 sukavideo |
|---|---|---|
| Palet | Gelap: Panggung Hitam + Merah/Cyan aksen | Terang: Kertas + Tinta + Merah Hati |
| Tipografi | Sora + Figtree | Bricolage Grotesque + Public Sans |
| Layout | Hero split (alat kiri, ponsel 9:16 kanan) | Hero rata kiri + konsol lebar-penuh di bawah headline |
| Radius/spacing | Kartu 16px, permukaan gelap berlapis | Radius 10px, garis rambut tipis, ruang putih lega |
| Detail khas | Bingkai ponsel 9:16 + rel aksi vertikal | Konsol kiriman dengan log status berjalan |

## 7. Aturan produk (anti-slop §5)

- Satu aksi utama per viewport: tombol "Kirim likes gratis".
- Semua tombol/link berfungsi: tombol contoh memanggil `/api/demo`
  (hasil berlabel "contoh"); tautan GitHub ke repo; tautan leofame ke
  layanan upstream; FAQ memakai `<details>` asli.
- Tanpa statistik vanity: tidak ada klaim jumlah pengguna, uptime, atau
  "10x lebih cepat". Satu-satunya angka adalah penghitung hati pada
  contoh hasil — dan itu dilabeli "contoh".
- Mobile 390px: konsol menumpuk vertikal, tanpa scroll horizontal,
  target sentuh min 44px.
- Kontras teks lolos AA; `prefers-reduced-motion` mematikan animasi
  penghitung dan zoom.
