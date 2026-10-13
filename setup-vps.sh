#!/bin/bash
set -e

# ========================================================
# Script Otomatis Setup & Sinkronisasi X-Project di VPS
# ========================================================

echo "=============================================="
echo "    🚀 Memulai Setup X-Project di VPS         "
echo "=============================================="

# 1. Pastikan dijalankan sebagai root / sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Jalankan script ini sebagai root atau dengan sudo: sudo bash setup-vps.sh"
  exit 1
fi

APP_DIR="/var/www/xproject"

# 2. Update sistem dan pasang dependensi yang diperlukan
echo "📦 1. Memeriksa paket sistem (Node.js, Nginx, Git, Certbot)..."
apt update -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Pasang Node.js 20 LTS jika belum ada
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo "📥 Memasang Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "✅ Node.js: $(node -v) | NPM: $(npm -v)"

# 3. Masuk ke direktori aplikasi
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 4. Install dependencies
echo "📦 2. Menginstal NPM packages..."
npm install --omit=dev

# 5. Konfigurasi .env dan Password Admin
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "🔐 3. Konfigurasi Password Admin Website"
  read -rsp "👉 Masukkan Password Admin Baru (min 10 karakter): " ADMIN_PW
  echo ""
  while [ ${#ADMIN_PW} -lt 10 ]; do
    echo "⚠️ Password terlalu pendek! Minimal 10 karakter."
    read -rsp "👉 Masukkan Password Admin Baru: " ADMIN_PW
    echo ""
  done

  # Buat hash password menggunakan script bawaan
  HASH_OUTPUT=$(node scripts/hash-password.js "$ADMIN_PW")
  
  cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
SESSION_HOURS=8
$HASH_OUTPUT
EOF
  chmod 600 "$APP_DIR/.env"
  echo "✅ File .env berhasil dibuat dengan aman."
else
  echo "ℹ️ File .env sudah ada, melewati pembuatan password baru."
fi

# 6. Direktori data dan hak akses
mkdir -p "$APP_DIR/data" "$APP_DIR/uploads"
chown -R www-data:www-data "$APP_DIR"

# 7. Konfigurasi Systemd Service
echo "⚙️ 4. Mengatur Systemd Service (xproject.service)..."
cat > /etc/systemd/system/xproject.service <<EOF
[Unit]
Description=X-Project Website Node.js Express App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
ProtectSystem=full
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable xproject
systemctl restart xproject
echo "✅ Service xproject berhasil aktif."

# 8. Pengaturan Nginx
echo ""
read -rp "🌐 Masukkan nama domain Anda (contoh: xproject.id) atau tekan Enter untuk IP: " DOMAIN_NAME

if [ -n "$DOMAIN_NAME" ]; then
  cat > /etc/nginx/sites-available/xproject <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
  cat > /etc/nginx/sites-available/xproject <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;
    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

ln -sf /etc/nginx/sites-available/xproject /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 9. Firewall UFW
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

# 10. Pasang SSL jika domain diisi
if [ -n "$DOMAIN_NAME" ]; then
  echo ""
  echo "🔒 Memasang sertifikat SSL (HTTPS) gratis dari Let's Encrypt..."
  certbot --nginx --non-interactive --agree-tos --redirect -d "$DOMAIN_NAME" || {
    echo "⚠️ Certbot otomatis belum selesai (pastikan DNS domain sudah mengarah ke IP ini)."
    echo "Anda bisa menjalankan manual nanti: certbot --nginx -d $DOMAIN_NAME"
  }
fi

echo ""
echo "=============================================="
echo "    🎉 SETUP SELESAI & WEBSITE AKTIF!         "
echo "=============================================="
if [ -n "$DOMAIN_NAME" ]; then
  echo "👉 Website: http://$DOMAIN_NAME"
  echo "👉 Pasang SSL gratis sekarang dengan perintah:"
  echo "   certbot --nginx -d $DOMAIN_NAME"
else
  SERVER_IP=$(curl -s ifconfig.me || echo "IP_VPS_ANDA")
  echo "👉 Website: http://$SERVER_IP"
fi
echo "👉 Admin Panel: /admin.html"
echo "=============================================="
