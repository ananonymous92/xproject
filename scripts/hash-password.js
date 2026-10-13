'use strict';
// Pemakaian: npm run hash-password -- "PasswordKuatAnda"
const crypto = require('crypto');
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Password minimal 10 karakter.  Contoh: npm run hash-password -- "Rahasia-Kuat-2026!"');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(pw, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);
