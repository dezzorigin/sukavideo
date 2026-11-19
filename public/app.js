// TikTok Likes Tool — logika konsol kiriman.
// POST /api/likes (alias lama /api/tiktok) dengan log status berjalan,
// struk hasil yang bisa dibaca manusia + jawaban mentah di <details>.
// Tombol "Lihat contoh hasil" memanggil GET /api/demo (hasil berlabel contoh).
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vt.tiktok.com', 'vm.tiktok.com']);

const form = document.getElementById('likeForm');
const urlInput = document.getElementById('url');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const demoBtn = document.getElementById('demoBtn');
const formError = document.getElementById('formError');
const logEl = document.getElementById('log');
const receiptEl = document.getElementById('receipt');
const receiptBadge = document.getElementById('receiptBadge');
const receiptRows = document.getElementById('receiptRows');
const receiptRaw = document.getElementById('receiptRaw');
const consoleStatus = document.getElementById('consoleStatus');

function isTikTokUrl(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 2048) return false;
  try {
    const u = new URL(raw.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') && TIKTOK_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function stamp() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function logLine(text, kind = '') {
  logEl.classList.add('has-lines');
  const li = document.createElement('li');
  if (kind) li.className = kind;
  const time = document.createElement('time');
  time.textContent = stamp();
  const span = document.createElement('span');
  span.textContent = text;
  li.append(time, span);
  logEl.append(li);
}

function setStatus(text, kind = '') {
  consoleStatus.textContent = text;
  consoleStatus.className = 'console-status' + (kind ? ` ${kind}` : '');
}

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
  urlInput.setAttribute('aria-invalid', 'true');
}

function clearError() {
  formError.hidden = true;
  formError.textContent = '';
  urlInput.removeAttribute('aria-invalid');
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  demoBtn.disabled = busy;
  const heart = submitBtn.querySelector('svg');
  const oldSpinner = submitBtn.querySelector('.spinner');
  if (busy) {
    if (heart) heart.style.display = 'none';
    if (!oldSpinner) {
      const s = document.createElement('span');
      s.className = 'spinner';
      s.setAttribute('aria-hidden', 'true');
      submitBtn.prepend(s);
    }
    btnText.textContent = 'Mengirim…';
  } else {
    if (heart) heart.style.display = '';
    if (oldSpinner) oldSpinner.remove();
    btnText.textContent = 'Kirim likes gratis';
  }
}

function row(label, value, isNum = false) {
  const div = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  if (isNum) dd.className = 'num';
  dd.textContent = value;
  div.append(dt, dd);
  receiptRows.append(div);
}

function showReceipt({ badge, badgeKind, rows, raw }) {
  receiptRows.innerHTML = '';
  for (const [label, value, isNum] of rows) row(label, value, isNum);
  receiptBadge.textContent = badge;
  receiptBadge.className = 'receipt-badge' + (badgeKind ? ` ${badgeKind}` : '');
  receiptRaw.textContent = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
  receiptEl.hidden = false;
  receiptEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function pickMessage(data) {
  if (!data || typeof data !== 'object') return '—';
  return data.message || data.msg || data.status || '—';
}

async function sendLikes(videoUrl) {
  logEl.innerHTML = '';
  receiptEl.hidden = true;
  setStatus('mengirim…', 'busy');
  logLine('Tautan diterima, memeriksa format…');
  if (!videoUrl) {
    logLine('Tautan masih kosong.', 'error-line');
    setStatus('gagal', 'err');
    showError('URL TikTok wajib diisi.');
    return;
  }
  if (!isTikTokUrl(videoUrl)) {
    logLine('Tautan bukan URL video TikTok.', 'error-line');
    setStatus('gagal', 'err');
    showError('Tautan harus berupa URL video TikTok (tiktok.com / vt.tiktok.com).');
    return;
  }
  setBusy(true);
  try {
    logLine('Mengambil token dari layanan pengirim…');
    const res = await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl }),
    });
    logLine('Mengirim tautan ke layanan…');
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      const msg = data?.error || `Layanan menjawab HTTP ${res.status}.`;
      logLine(`Gagal: ${msg}`, 'error-line');
      setStatus('gagal', 'err');
      showReceipt({
        badge: 'gagal',
        badgeKind: 'err',
        rows: [
          ['Video', videoUrl],
          ['Status', `HTTP ${res.status}`],
          ['Pesan', msg],
        ],
        raw: data ?? { error: msg },
      });
      return;
    }
    logLine('Jawaban diterima.');
    setStatus('selesai', 'ok');
    const upstream = data.upstream ?? data;
    const likes = upstream.likes_sent ?? upstream.likes ?? upstream.count;
    showReceipt({
      badge: 'terkirim',
      badgeKind: '',
      rows: [
        ['Video', videoUrl],
        ...(likes !== undefined ? [['Likes (menurut layanan)', String(likes), true]] : []),
        ['Pesan layanan', pickMessage(upstream)],
      ],
      raw: data,
    });
  } catch (err) {
    logLine('Gagal menghubungi server. Periksa koneksi lalu coba lagi.', 'error-line');
    setStatus('gagal', 'err');
    showReceipt({
      badge: 'gagal',
      badgeKind: 'err',
      rows: [
        ['Video', videoUrl],
        ['Pesan', 'Gagal menghubungi server.'],
      ],
      raw: { error: String(err?.message || err) },
    });
  } finally {
    setBusy(false);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearError();
  sendLikes(urlInput.value.trim());
});

urlInput.addEventListener('input', () => {
  if (!formError.hidden) clearError();
});

demoBtn.addEventListener('click', async () => {
  logEl.innerHTML = '';
  receiptEl.hidden = true;
  setStatus('contoh', '');
  logLine('Memuat contoh hasil (tanpa mengirim apa pun)…');
  try {
    const res = await fetch('/api/demo');
    const data = await res.json();
    logLine('Contoh hasil dimuat.');
    showReceipt({
      badge: 'contoh',
      badgeKind: 'demo',
      rows: [
        ['Video', data.video],
        ['Likes (menurut layanan)', String(data.result.likes_sent), true],
        ['Catatan', data.result.note],
      ],
      raw: data,
    });
  } catch {
    logLine('Contoh hasil gagal dimuat.', 'error-line');
    setStatus('gagal', 'err');
  }
});
