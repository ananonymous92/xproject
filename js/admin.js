(() => {
  let data = null;
  const $ = (id) => document.getElementById(id);
  const escHtml = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ICON_OPTIONS = [
    { value: 'star', label: '⭐ Bintang (Poles & Detailing / Unggulan)' },
    { value: 'gloss', label: '✨ Kilau / Sparkle (High Gloss Finish 8.5 mil)' },
    { value: 'heal', label: '🔄 Self-Healing (Pemulihan Baret Otomatis)' },
    { value: 'shield', label: '🛡️ Perisai (Perlindungan Cat / Anti Baret)' },
    { value: 'shield_check', label: '🔰 Perisai Ceklis (Garansi & Proteksi Teruji)' },
    { value: 'towing', label: '🚚 Truk Towing (Antar Jemput Gratis)' },
    { value: 'wrench', label: '🔧 Kunci Pas (Certified Applicator / Teknisi Ahli)' },
    { value: 'gift', label: '🎁 Hadiah / Bonus (FREE Karpet / Bonus Maintenance)' },
    { value: 'heart', label: '💖 Hati (Pelayanan Ramah / Terfavorit)' },
    { value: 'layers', label: '📑 Lapisan Film (Ketebalan PPF 8.5 mil)' },
    { value: 'diamond', label: '💎 Berlian (High Clarity & Kilap Ekstrem)' },
    { value: 'droplet', label: '💧 Tetesan Air (Hidrofobik / Efek Daun Talas)' },
    { value: 'flame', label: '🔥 Tahan Panas (Heat Activation Suhu Tinggi)' },
    { value: 'sun', label: '☀️ Matahari (Anti UV / Tahan Cuaca Panas)' },
    { value: 'car', label: '🚗 Mobil (Detailing / Full Unit)' },
    { value: 'award', label: '🏆 Piala / Penghargaan Resmi' },
    { value: 'check', label: '✔️ Ceklis (Presisi & Teruji)' },
    { value: 'medal', label: '🎖️ Medali (Garansi 10+ Tahun)' },
    { value: 'time', label: '⏱️ Jam / Waktu (Layanan Cepat / Tahan Lama)' }
  ];

  const RATING_OPTIONS = [
    { value: '5', label: '⭐⭐⭐⭐⭐ (5 Bintang - Sangat Puas)' },
    { value: '4', label: '⭐⭐⭐⭐ (4 Bintang - Puas)' },
    { value: '3', label: '⭐⭐⭐ (3 Bintang - Cukup)' },
    { value: '2', label: '⭐⭐ (2 Bintang)' },
    { value: '1', label: '⭐ (1 Bintang)' }
  ];

  // Field schema per tab. type: text | textarea | image | bool | select
  const SCHEMA = {
    brand: { title: 'Brand & Logo', fields: [['name', 'Nama Bisnis'], ['logo', 'Logo (kosongkan untuk logo teks)', 'image'], ['whatsapp', 'Nomor WhatsApp (format 628xxx)'], ['waMessage', 'Pesan Default WhatsApp', 'textarea']] },
    hero: { title: 'Hero / Banner', fields: [['image', 'Gambar Hero', 'image'], ['eyebrow', 'Label Kecil'], ['headline', 'Headline', 'textarea'], ['subheadline', 'Subheadline', 'textarea'], ['cta1', 'Teks Tombol 1'], ['cta2', 'Teks Tombol 2'], ['badges', 'Badge (pisahkan dengan •)']] },
    about: { title: 'Apa Itu PPF', fields: [['image', 'Gambar', 'image'], ['title', 'Judul'], ['text', 'Deskripsi', 'textarea']],
      list: { key: 'benefits', label: 'Benefit', fields: [['icon', 'Pilihan Ikon', 'select', ICON_OPTIONS], ['title', 'Judul'], ['text', 'Deskripsi', 'textarea']] } },
    services: { title: 'Layanan', list: { label: 'Layanan', fields: [['title', 'Judul'], ['text', 'Deskripsi', 'textarea']] } },
    gallery: { title: 'Gallery', list: { label: 'Foto', fields: [['image', 'Gambar', 'image'], ['caption', 'Keterangan']] } },
    pricing: { title: 'Harga', list: { label: 'Paket', fields: [['name', 'Nama Paket'], ['price', 'Harga Promo / Sekarang (cth: Rp 18.000.000)'], ['originalPrice', 'Harga Coret / Normal (opsional, cth: Rp 23.000.000)'], ['features', 'Fitur (satu per baris)', 'textarea'], ['featured', 'Tandai Paling Populer', 'bool']] } },
    reviews: {
      title: 'Review / Testimonial',
      fields: [
        ['title', 'Judul Section Review'],
        ['subtitle', 'Subjudul / Keterangan', 'textarea']
      ],
      list: {
        key: 'items',
        label: 'Review',
        fields: [
          ['avatar', 'Foto Pelanggan (disarankan foto serah terima / bersama mobil, rasio kotak 1:1 — kosongkan untuk inisial nama)', 'image'],
          ['name', 'Nama Pelanggan'],
          ['car', 'Mobil / Paket (tampil sebagai: Customer — PORSCHE 911 FULL PPF)'],
          ['rating', 'Rating Bintang', 'select', RATING_OPTIONS],
          ['comment', 'Isi Testimoni', 'textarea']
        ]
      }
    },
    location: {
      title: 'Location',
      fields: [
        ['address', 'Alamat', 'textarea'],
        ['hours', 'Jam Operasional'],
        ['mapEmbed', 'URL Embed Google Maps (iframe src https://www.google.com/maps...)'],
        ['mapUrl', 'Link Google Maps / Petunjuk Arah (opsional, cth: https://maps.app.goo.gl/... atau link Buka di Maps)']
      ]
    },
    news: { title: 'News', list: { label: 'Artikel', fields: [['image', 'Gambar', 'image'], ['date', 'Tanggal', 'date'], ['title', 'Judul'], ['text', 'Ringkasan', 'textarea']] } },
    contact: { title: 'Contact', fields: [['phone', 'Telepon'], ['email', 'Email'], ['instagram', 'Instagram (Username / URL https)'], ['facebook', 'Facebook (Username / URL https)']] },
    footer: {
      title: 'Footer & Sosial Media',
      fields: [
        ['desc', 'Deskripsi Singkat Footer', 'textarea'],
        ['facebook', 'Facebook (URL https atau Username)'],
        ['instagram', 'Instagram (URL https atau @Username)'],
        ['copyright', 'Teks Hak Cipta / Copyright']
      ]
    }
  };
  let current = 'brand';

  const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); };
  const showLogin = () => { $('app').style.display = 'none'; $('login').style.display = 'grid'; };

  async function uploadImage(file) {
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { showLogin(); throw new Error('Sesi berakhir, silakan login ulang'); }
    if (!r.ok) throw new Error(j.error || 'Upload gagal');
    return j.url;
  }

  function fieldEl(obj, [key, label, type = 'text', opts]) {
    const wrap = document.createElement('div'); wrap.className = 'field';
    const lbl = document.createElement('label'); lbl.textContent = label; wrap.append(lbl);
    let input;
    if (type === 'textarea') { input = document.createElement('textarea'); input.rows = 3; }
    else if (type === 'select') {
      input = document.createElement('select');
      input.innerHTML = opts.map((o) => {
        const val = typeof o === 'object' ? o.value : o;
        const txt = typeof o === 'object' ? o.label : o;
        return `<option value="${escHtml(val)}">${escHtml(txt)}</option>`;
      }).join('');
      const firstVal = typeof opts[0] === 'object' ? opts[0].value : opts[0];
      input.value = obj[key] || firstVal;
      obj[key] = input.value;
      input.onchange = input.oninput = () => { obj[key] = input.value; };
    }
    else if (type === 'bool') { input = document.createElement('input'); input.type = 'checkbox'; input.style.width = 'auto'; input.checked = !!obj[key]; input.onchange = () => (obj[key] = input.checked); wrap.append(input); return wrap; }
    else { input = document.createElement('input'); input.type = type === 'date' ? 'date' : 'text'; }
    if (type !== 'select') input.value = obj[key] ?? '';
    let prev;
    if (type !== 'select') {
      input.oninput = () => {
        if (key === 'mapEmbed' && input.value.includes('<iframe')) {
          const m = input.value.match(/src=["'](https:\/\/[^"']+)["']/i);
          if (m) input.value = m[1];
        }
        obj[key] = input.value;
        if (prev) prev.src = safeUrl(input.value, '');
      };
    }
    wrap.append(input);
    if (type === 'image') {
      input.placeholder = 'Path (uploads/...) / URL https, atau upload file';
      const row = document.createElement('div'); row.className = 'row'; row.style.marginTop = '8px';
      const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/jpeg,image/png,image/webp,image/gif';
      file.onchange = async () => {
        const f = file.files[0]; if (!f) return;
        if (f.size > 3 * 1024 * 1024) { toast('Ukuran maksimal 3 MB'); file.value = ''; return; }
        try { toast('Mengupload...'); const url = await uploadImage(f); obj[key] = url; input.value = url; prev.src = url; toast('Upload berhasil — jangan lupa Simpan'); }
        catch (e) { toast(e.message); }
        file.value = '';
      };
      row.append(file); wrap.append(row);
      prev = document.createElement('img'); prev.className = 'preview'; if (obj[key]) prev.src = safeUrl(obj[key], ''); wrap.append(prev);
    }
    return wrap;
  }

  function render() {
    const s = SCHEMA[current], ed = $('editor'); ed.innerHTML = '';
    $('tabTitle').textContent = s.title;
    document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.k === current));
    if (s.fields) {
      if (!data[current]) data[current] = {};
      const box = document.createElement('div');
      box.className = 'item';
      s.fields.forEach((f) => box.append(fieldEl(data[current], f)));
      ed.append(box);
    }
    if (s.list) {
      if (s.list.key) {
        if (!data[current]) data[current] = {};
        if (!Array.isArray(data[current][s.list.key])) data[current][s.list.key] = [];
      } else {
        if (!Array.isArray(data[current])) data[current] = [];
      }
      const arr = s.list.key ? data[current][s.list.key] : data[current];
      arr.forEach((it, i) => {
        const box = document.createElement('div'); box.className = 'item';
        box.innerHTML = `<div class="item-head"><span>${escHtml(s.list.label)} #${i + 1}</span><span class="row"></span></div>`;
        const ctr = box.querySelector('.row');
        const mk = (txt, fn) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = txt; b.style.padding = '4px 12px'; b.onclick = fn; ctr.append(b); };
        mk('↑', () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; render(); } });
        mk('↓', () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; render(); } });
        mk('Hapus', () => { if (confirm('Hapus item ini?')) { arr.splice(i, 1); render(); } });
        s.list.fields.forEach((f) => box.append(fieldEl(it, f)));
        ed.append(box);
      });
      const add = document.createElement('button'); add.className = 'ghost'; add.textContent = `+ Tambah ${s.list.label}`;
      add.onclick = () => {
        const n = {};
        s.list.fields.forEach(([k, , t, o]) => {
          if (t === 'bool') n[k] = false;
          else if (t === 'select') n[k] = typeof o[0] === 'object' ? o[0].value : o[0];
          else n[k] = '';
        });
        arr.push(n);
        render();
      };
      ed.append(add);
    }
  }

  let tabsBuilt = false;
  async function boot() {
    try { data = await Store.load(); } catch { toast('Gagal memuat konten'); return; }
    $('login').style.display = 'none'; $('app').style.display = 'grid';
    if (!tabsBuilt) {
      Object.entries(SCHEMA).forEach(([k, s]) => { const a = document.createElement('a'); a.textContent = s.title; a.dataset.k = k; a.onclick = () => { current = k; render(); }; $('tabs').append(a); });
      tabsBuilt = true;
    }
    render();
  }

  $('saveBtn').onclick = async () => {
    if (current === 'footer') { data.contact.facebook = data.footer.facebook; data.contact.instagram = data.footer.instagram; }
    else if (current === 'contact') { data.footer.facebook = data.contact.facebook; data.footer.instagram = data.contact.instagram; }
    try { data = await Store.save(data); render(); toast('Perubahan tersimpan ✓'); }
    catch (e) { if (e.status === 401) { showLogin(); alert('Sesi berakhir, silakan login ulang.'); } else alert('Gagal menyimpan: ' + e.message); }
  };
  $('resetBtn').onclick = async () => {
    if (!confirm('Kembalikan semua konten ke default?')) return;
    try { data = await Store.reset(); render(); toast('Konten direset'); }
    catch (e) { if (e.status === 401) showLogin(); else alert(e.message); }
  };
  $('logoutBtn').onclick = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    data = null; $('pw').value = ''; showLogin();
  };

  $('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.submitter; if (btn) btn.disabled = true;
    try {
      const r = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('pw').value }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { alert(j.error || 'Login gagal'); return; }
      $('pw').value = '';
      boot();
    } finally { if (btn) btn.disabled = false; }
  };

  // Cek sesi yang masih aktif
  fetch('/api/me', { credentials: 'same-origin' }).then((r) => { if (r.ok) boot(); }).catch(() => {});
})();
