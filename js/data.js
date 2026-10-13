/* Content store: konten diambil dari server (/api/content) agar sama untuk semua pengunjung. */
const Store = {
  async load() {
    const r = await fetch('/api/content', { cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw new Error('Gagal memuat konten');
    return r.json();
  },
  async save(data) {
    const r = await fetch('/api/content', {
      method: 'PUT', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw Object.assign(new Error((await r.json().catch(() => ({}))).error || 'Gagal menyimpan'), { status: r.status });
    return r.json();
  },
  async reset() {
    const r = await fetch('/api/content/reset', { method: 'POST', credentials: 'same-origin' });
    if (!r.ok) throw Object.assign(new Error('Gagal reset'), { status: r.status });
    return r.json();
  }
};

/* Hanya izinkan URL aman (https / path lokal) untuk href & src */
function safeUrl(u, fallback = '#') {
  const s = String(u || '').trim();
  if (/^(assets|uploads)\/[\w.-]+$/i.test(s)) return s;
  try { const p = new URL(s, location.origin); return ['https:', 'http:', 'tel:', 'mailto:'].includes(p.protocol) ? s : fallback; }
  catch { return fallback; }
}
