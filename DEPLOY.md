# Panduan Deployment X-Project ke VPS

Panduan lengkap untuk mempublikasikan website **X-Project** ke VPS (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Persiapan VPS & Keamanan Dasar

Login ke VPS Anda via SSH:
```bash
ssh root@IP_VPS_ANDA
```

Update sistem dan pasang paket yang dibutuhkan:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx
```

Atur Firewall (UFW) agar hanya port yang aman yang terbuka:
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Pasang Node.js v20 atau v22 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # Pastikan versi 20+ sudah muncul
```

---

## 2. Salin Kode ke VPS

Buat direktori proyek dan atur hak akses:
```bash
mkdir -p /var/www/xproject
cd /var/www/xproject
```

Upload file website Anda ke folder ini (bisa menggunakan Git clone, SCP, atau rsync):
```bash
# Contoh upload dari komputer lokal via scp:
# scp -r * root@IP_VPS_ANDA:/var/www/xproject/
```

Setelah file berada di `/var/www/xproject`, install dependencies:
```bash
npm install --omit=dev
```

---

## 3. Konfigurasi Password Admin & File `.env`

Buat hash password admin baru yang kuat:
```bash
npm run hash-password -- "GantiDenganPasswordKuatAnda!"
```
Perintah di atas akan mengeluarkan output seperti:
```text
ADMIN_PASSWORD_HASH=scrypt$xxxxxxxx...
```

Buat file `.env` di `/var/www/xproject/.env`:
```bash
nano .env
```
Isi dengan:
```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SESSION_HOURS=8
ADMIN_PASSWORD_HASH=scrypt$xxxxxxxx... (hasil dari langkah di atas)
```
Simpan (`Ctrl + O`, `Enter`, `Ctrl + X`).

Kunci permission file `.env` agar hanya bisa dibaca oleh pemilik:
```bash
chmod 600 .env
```

Pastikan folder uploads dan data dapat ditulis:
```bash
mkdir -p data uploads
chown -R www-data:www-data /var/www/xproject
```

---

## 4. Jalankan Aplikasi Otomatis (Systemd)

Salin file service:
```bash
cp xproject.service.example /etc/systemd/system/xproject.service
```

Reload systemd dan aktifkan service:
```bash
systemctl daemon-reload
systemctl enable xproject
systemctl start xproject
systemctl status xproject
```

> **Alternatif jika memakai PM2:**
> ```bash
> npm install -g pm2
> pm2 start server.js --name "xproject"
> pm2 startup
> pm2 save
> ```

---

## 5. Konfigurasi Nginx & Domain

Salin template konfigurasi Nginx:
```bash
cp nginx.conf.example /etc/nginx/sites-available/xproject
nano /etc/nginx/sites-available/xproject
```
Ganti semua tulisan `domainanda.com` dengan nama domain Anda yang sebenarnya.

Aktifkan konfigurasi Nginx:
```bash
ln -s /etc/nginx/sites-available/xproject /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 6. Pasang SSL Gratis (HTTPS / Let's Encrypt)

Jalankan Certbot untuk menginstal sertifikat SSL otomatis:
```bash
certbot --nginx -d domainanda.com -d www.domainanda.com
```
Pilih opsi **Redirect all HTTP traffic to HTTPS**.

Sertifikat SSL akan diperbarui secara otomatis oleh Certbot.

---

## 7. Checklist Keamanan Setelah Publikasi

- [x] Password tersimpan dalam bentuk hash `scrypt` (bukan plain text).
- [x] File `config.js` sudah dihapus, tidak ada data sensitif yang bisa dibuka via browser.
- [x] Endpoint login dilindungi **Rate Limiting** (mencegah serangan brute force).
- [x] Sesi admin menggunakan cookie `HttpOnly`, `SameSite=Strict`, dan `Secure` (di production).
- [x] Proteksi CSRF (Same-Origin validation).
- [x] Header keamanan aktif via `Helmet` (CSP, HSTS, X-Frame-Options, No-Sniff).
- [x] Upload file dibatasi 3MB dan divalidasi ke format gambar asli (JPG, PNG, WEBP, GIF).
- [x] Konten website disimpan di server (`data/content.json`), sehingga setiap perubahan admin langsung tampil ke semua pengunjung.
