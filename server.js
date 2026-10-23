'use strict';
/**
 * X-Project server: static site + secure admin API.
 * Konten disimpan di data/content.json (dibagikan ke semua pengunjung).
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const DEFAULT_FILE = path.join(DATA_DIR, 'default-content.json');

// Otomatis muat file .env jika ada
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.trim();
    if (!m || m.startsWith('#')) continue;
    const eq = m.indexOf('=');
    if (eq !== -1) {
      const k = m.slice(0, eq).trim();
      const v = m.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || '127.0.0.1'; // di VPS: tetap 127.0.0.1, akses publik lewat Nginx
const IS_PROD = process.env.NODE_ENV === 'production';
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const SESSION_HOURS = Number(process.env.SESSION_HOURS) || 8;
const COOKIE = IS_PROD ? '__Host-xp_sid' : 'xp_sid';

if (!/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/.test(PASSWORD_HASH)) {
  console.error('\n[FATAL] ADMIN_PASSWORD_HASH belum diatur / tidak valid di file .env');
  console.error('Buat dengan:  npm run hash-password -- "PasswordKuatAnda"\n');
  process.exit(1);
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const DEFAULTS = JSON.parse(fs.readFileSync(DEFAULT_FILE, 'utf8'));

/* ---------------- Content storage ---------------- */
function readContent() {
  try { return sanitize(JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')), DEFAULTS); }
  catch { return structuredClone(DEFAULTS); }
}
function writeContent(data) {
  const tmp = CONTENT_FILE + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, CONTENT_FILE); // atomic replace
}

/* ---------------- Sanitizer (whitelist berdasarkan struktur default) ---------------- */
const MAX_STR = 5000, MAX_ITEMS = 60;
const LOCAL_IMG = /^(assets|uploads)\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif)$/i;
const LOCAL_MEDIA = /^(assets|uploads)\/[A-Za-z0-9._-]+\.(jpe?g|png|webp|gif|mp4|webm)$/i;
const HANDLE = /^@?[A-Za-z0-9._]{1,60}$/;
const isHttps = (s) => { try { return new URL(s).protocol === 'https:'; } catch { return false; } };
const ALLOWED_ICONS = new Set([
  'shield', 'shield_check', 'heal', 'heart', 'gloss', 'sparkle',
  'diamond', 'gift', 'flame', 'magic', 'time', 'clock',
  'star', 'towing', 'car', 'award', 'check', 'wrench',
  'layers', 'droplet', 'sun', 'medal'
]);

function cleanField(key, val, fallback) {
  const s = String(val).slice(0, MAX_STR).trim();
  switch (key) {
    case 'image': case 'logo': case 'avatar': case 'thumbnail':
      if (s === '' && (key === 'logo' || key === 'avatar')) return '';
      return LOCAL_MEDIA.test(s) || isHttps(s) ? s : fallback;
    case 'video': case 'videoUrl':
      if (s === '') return '';
      return LOCAL_MEDIA.test(s) || isHttps(s) ? s : fallback;
    case 'mapEmbed': {
      let raw = s;
      const m = raw.match(/src=["'](https:\/\/[^"']+)["']/i);
      if (m) raw = m[1];
      try { const u = new URL(raw); return u.protocol === 'https:' && /(^|\.)google\.[a-z.]+$/.test(u.hostname) ? raw : fallback; }
      catch { return fallback; }
    }
    case 'mapUrl':
      if (s === '') return '';
      return isHttps(s) ? s : fallback;
    case 'facebook': case 'instagram':
      return s === '' || HANDLE.test(s) || isHttps(s) ? s : fallback;
    case 'whatsapp':
      return /^[0-9]{8,16}$/.test(s) ? s : fallback;
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fallback;
    case 'rating':
      return ['1', '2', '3', '4', '5'].includes(s) ? s : fallback;
    case 'icon':
      return ALLOWED_ICONS.has(s) ? s : fallback;
    default:
      return s;
  }
}

function sanitize(input, tpl, key = '') {
  if (Array.isArray(tpl)) {
    if (!Array.isArray(input)) return structuredClone(tpl);
    const itemTpl = tpl[0];
    return input.slice(0, MAX_ITEMS).map((it) => sanitize(it, itemTpl, key));
  }
  if (tpl && typeof tpl === 'object') {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const out = {};
    for (const k of Object.keys(tpl)) out[k] = k in src ? sanitize(src[k], tpl[k], k) : structuredClone(tpl[k]);
    return out;
  }
  if (typeof tpl === 'boolean') return input === true;
  if (typeof tpl === 'string') return typeof input === 'string' || typeof input === 'number' ? cleanField(key, input, tpl) : tpl;
  return tpl;
}

/* ---------------- Auth ---------------- */
function verifyPassword(pw) {
  const [, salt, hash] = PASSWORD_HASH.split('$');
  const test = crypto.scryptSync(String(pw), Buffer.from(salt, 'hex'), 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

const sessions = new Map(); // token -> expiresAt
const newSession = () => { const t = crypto.randomBytes(32).toString('hex'); sessions.set(t, Date.now() + SESSION_HOURS * 3600e3); return t; };
setInterval(() => { const now = Date.now(); for (const [t, e] of sessions) if (e < now) sessions.delete(t); }, 10 * 60e3).unref();

function getCookie(req, name) {
  const m = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function setSessionCookie(res, token, maxAgeSec) {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSec}`];
  if (IS_PROD) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function requireAuth(req, res, next) {
  const t = getCookie(req, COOKIE);
  const exp = t && sessions.get(t);
  if (!exp || exp < Date.now()) { if (t) sessions.delete(t); return res.status(401).json({ error: 'Tidak terautentikasi' }); }
  req.sessionToken = t;
  next();
}
// CSRF: tolak request yang mengubah data jika Origin bukan dari situs ini
function sameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next(); // non-browser / same-origin lama; cookie SameSite=Strict tetap melindungi
  try { if (new URL(origin).host === req.headers.host) return next(); } catch {}
  return res.status(403).json({ error: 'Origin tidak diizinkan' });
}

/* ---------------- App ---------------- */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // di belakang Nginx

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:'],
      'media-src': ["'self'", 'https:', 'blob:', 'data:'],
      'frame-src': ['https://www.google.com', 'https://maps.google.com', 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com', 'https://www.instagram.com', 'https://instagram.com'],
      'connect-src': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'upgrade-insecure-requests': IS_PROD ? [] : null
    }
  },
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true } : false,
  crossOriginEmbedderPolicy: false
}));

app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

const loginLimiter = rateLimit({ windowMs: 15 * 60e3, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' } });
const writeLimiter = rateLimit({ windowMs: 60e3, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });

app.get('/api/content', (req, res) => res.json(readContent()));

app.post('/api/login', loginLimiter, sameOrigin, (req, res) => {
  const pw = req.body && req.body.password;
  if (typeof pw !== 'string' || pw.length > 200 || !verifyPassword(pw)) return res.status(401).json({ error: 'Password salah' });
  setSessionCookie(res, newSession(), SESSION_HOURS * 3600);
  res.json({ ok: true });
});
app.post('/api/logout', sameOrigin, (req, res) => {
  const t = getCookie(req, COOKIE); if (t) sessions.delete(t);
  setSessionCookie(res, '', 0);
  res.json({ ok: true });
});
app.get('/api/me', requireAuth, (req, res) => res.json({ ok: true }));

app.put('/api/content', writeLimiter, sameOrigin, requireAuth, (req, res) => {
  const clean = sanitize(req.body, DEFAULTS);
  writeContent(clean);
  res.json(clean);
});
app.post('/api/content/reset', writeLimiter, sameOrigin, requireAuth, (req, res) => {
  try { fs.unlinkSync(CONTENT_FILE); } catch {}
  res.json(structuredClone(DEFAULTS));
});

// Upload gambar: hanya JPG/PNG/WEBP/GIF, cek magic bytes, nama file acak
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024, files: 1 } });
function imageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return null;
}
app.post('/api/upload', writeLimiter, sameOrigin, requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran maksimal 3 MB' : 'Upload gagal' });
    if (!req.file) return res.status(400).json({ error: 'File tidak ada' });
    const ext = imageExt(req.file.buffer);
    if (!ext) return res.status(400).json({ error: 'Hanya JPG, PNG, WEBP, atau GIF' });
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), req.file.buffer, { mode: 0o644 });
    res.json({ url: `uploads/${name}` });
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- Static: HANYA folder/file publik yang di-whitelist ---------- */
const staticOpts = { dotfiles: 'deny', index: false, maxAge: IS_PROD ? '7d' : 0 };
app.use('/css', express.static(path.join(ROOT, 'css'), staticOpts));
app.use('/js', express.static(path.join(ROOT, 'js'), staticOpts));
app.use('/assets', express.static(path.join(ROOT, 'assets'), staticOpts));
app.use('/uploads', express.static(UPLOAD_DIR, staticOpts));
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(ROOT, 'assets', 'favicon.ico')));
app.get('/robots.txt', (req, res) => res.sendFile(path.join(ROOT, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => { res.setHeader('Content-Type', 'application/xml'); res.sendFile(path.join(ROOT, 'sitemap.xml')); });
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/video.html', (req, res) => res.redirect(301, '/video'));
app.get('/video', (req, res) => res.sendFile(path.join(ROOT, 'video.html')));
app.get('/admin.html', (req, res) => { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.sendFile(path.join(ROOT, 'admin.html')); });

app.use((req, res) => res.status(404).send('Not found'));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: 'Terjadi kesalahan' }); });

app.listen(PORT, HOST, () => console.log(`X-Project berjalan di http://${HOST}:${PORT} (${IS_PROD ? 'production' : 'development'})`));
