(async () => {
  let C;
  try { C = await Store.load(); }
  catch (e) { console.error('Gagal memuat data video:', e); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const waUrl = (msg) => `https://wa.me/${C.brand.whatsapp}?text=${encodeURIComponent(msg || C.brand.waMessage)}`;

  // Brand / logo
  const [first, ...rest] = C.brand.name.split(' ');
  const logoHtml = C.brand.logo ? `<img src="${esc(safeUrl(C.brand.logo, ''))}" alt="${esc(C.brand.name)}">` : `${esc(first)}&nbsp;<b>${esc(rest.join(' '))}</b>`;
  if ($('logo')) $('logo').innerHTML = logoHtml;
  if ($('footerLogo')) $('footerLogo').innerHTML = logoHtml;
  document.querySelectorAll('.brandName').forEach((e) => (e.textContent = C.brand.name));
  document.querySelectorAll('.wa-link').forEach((a) => { a.href = waUrl(); a.target = '_blank'; a.rel = 'noopener'; });
  if ($('year')) $('year').textContent = new Date().getFullYear();

  // Header text
  if (C.videos) {
    if (C.videos.eyebrow && $('vEyebrow')) $('vEyebrow').textContent = C.videos.eyebrow;
    if (C.videos.title && $('vTitle')) $('vTitle').textContent = C.videos.title;
    if (C.videos.subtitle && $('vSub')) $('vSub').textContent = C.videos.subtitle;
  }

  // Parse video source helper (YouTube, YouTube Shorts, Vimeo, direct MP4)
  function parseVideo(raw = '') {
    let s = String(raw).trim();
    // Jika user paste kode embed iframe utuh
    const ifr = s.match(/src=["'](https:\/\/[^"']+)["']/i);
    if (ifr) s = ifr[1];

    // YouTube (watch, embed, shorts, youtu.be)
    const yt = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
    if (yt) {
      const origin = typeof location !== 'undefined' && location.origin ? `&origin=${encodeURIComponent(location.origin)}` : '';
      return {
        type: 'youtube',
        id: yt[1],
        embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&enablejsapi=1${origin}`,
        fallbackThumb: `https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`
      };
    }
    // Vimeo
    const vm = s.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
    if (vm) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vm[1]}?autoplay=1`,
        fallbackThumb: ''
      };
    }
    // Instagram (Reel, Post, IGTV)
    const ig = s.match(/(?:instagram\.com|instagr\.am)\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (ig) {
      return {
        type: 'instagram',
        id: ig[1],
        embedUrl: `https://www.instagram.com/reel/${ig[1]}/embed/`,
        directUrl: `https://www.instagram.com/reel/${ig[1]}/`,
        fallbackThumb: ''
      };
    }
    // Direct HTML5 Video
    return {
      type: 'html5',
      embedUrl: safeUrl(s, ''),
      fallbackThumb: ''
    };
  }

  const rawVideos = (C.videos && Array.isArray(C.videos.items)) ? C.videos.items : [];
  if (rawVideos.length === 0) {
    $('vGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted)">Belum ada video yang ditambahkan.</div>';
    return;
  }

  // Sinkronisasi categoryLabel fallback
  const CAT_LABELS = {
    process: 'Craftsmanship',
    tests: 'Uji Ketahanan',
    results: 'Hasil Akhir',
    shorts: 'Shorts & Reels'
  };
  rawVideos.forEach((v) => {
    if (!v.categoryLabel) v.categoryLabel = CAT_LABELS[v.category] || 'Video';
  });

  // Featured video (cari yang featured: true, prioritaskan yang terakhir jika ada beberapa)
  const featuredList = rawVideos.filter((v) => v.featured);
  const featured = featuredList.length > 0 ? featuredList[featuredList.length - 1] : rawVideos[0];

  if (featured && $('vFeaturedWrap')) {
    if ($('vFeatImg')) $('vFeatImg').src = safeUrl(featured.thumbnail, 'assets/hero.jpg');
    if ($('vFeatTitle')) $('vFeatTitle').textContent = featured.title;
    if ($('vFeatDesc')) $('vFeatDesc').textContent = featured.description || '';
    if ($('vFeatCar')) $('vFeatCar').textContent = featured.car || featured.categoryLabel || 'SPOTLIGHT';
    if ($('vFeatDuration')) $('vFeatDuration').textContent = featured.duration || 'Video';
    if ($('vFeatBadge')) $('vFeatBadge').textContent = featured.categoryLabel || 'Featured Premiere';

    $('vFeaturedCard')?.addEventListener('click', () => openCinema(featured));
    $('vFeaturedCard')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCinema(featured); }
    });
  }

  // Render Grid
  const grid = $('vGrid');
  let currentFilter = 'all';

  function renderGrid() {
    if (!grid) return;
    const filtered = currentFilter === 'all'
      ? rawVideos
      : rawVideos.filter((v) => v.category === currentFilter);

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted);font-size:1.05rem">Tidak ada video dalam kategori ini.</div>';
      return;
    }

    grid.innerHTML = filtered.map((v, i) => {
      const isShorts = v.category === 'shorts';
      const thumb = safeUrl(v.thumbnail, 'assets/hero.jpg');
      return `
        <article class="v-card ${isShorts ? 'is-shorts' : ''}" data-v-idx="${rawVideos.indexOf(v)}" tabindex="0" role="button" aria-label="Putar video: ${esc(v.title)}">
          <div class="v-card-media">
            <img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy">
            <div class="v-play-overlay">
              <div class="v-play-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22"><polygon points="6 4 20 12 6 20 6 4"/></svg>
              </div>
            </div>
            ${v.duration ? `<span class="v-duration">${esc(v.duration)}</span>` : ''}
            ${v.categoryLabel ? `<span class="v-badge">${esc(v.categoryLabel)}</span>` : ''}
          </div>
          <div class="v-card-body">
            ${v.car ? `<span class="v-card-car">${esc(v.car)}</span>` : ''}
            <h3 class="v-card-title">${esc(v.title)}</h3>
            ${v.description ? `<p class="v-card-desc">${esc(v.description)}</p>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  renderGrid();

  // Filter Tabs Event Listeners
  const tabs = document.querySelectorAll('.v-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      renderGrid();
    });
  });

  // Grid Click -> Cinema Modal
  grid?.addEventListener('click', (e) => {
    const card = e.target.closest('.v-card');
    if (!card) return;
    const idx = parseInt(card.getAttribute('data-v-idx'), 10);
    if (!isNaN(idx) && rawVideos[idx]) openCinema(rawVideos[idx]);
  });
  grid?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.v-card');
      if (!card) return;
      e.preventDefault();
      const idx = parseInt(card.getAttribute('data-v-idx'), 10);
      if (!isNaN(idx) && rawVideos[idx]) openCinema(rawVideos[idx]);
    }
  });

  // Cinema Modal Logic
  const cinema = $('cinemaModal');
  const playerBox = $('cinemaPlayerContainer');

  function openCinema(item) {
    if (!cinema || !item) return;
    const parsed = parseVideo(item.videoUrl);

    if (playerBox) {
      if (parsed.type === 'instagram') {
        playerBox.classList.add('is-instagram');
        playerBox.innerHTML = `
          <iframe src="${esc(parsed.embedUrl)}" allow="encrypted-media; fullscreen" allowtransparency="true" frameborder="0" scrolling="no" title="${esc(item.title)}"></iframe>
          <div class="ig-banner-link">
            <a href="${esc(parsed.directUrl || item.videoUrl)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              Buka Langsung di Instagram ↗
            </a>
          </div>`;
      } else {
        playerBox.classList.remove('is-instagram');
        if (parsed.type === 'youtube' || parsed.type === 'vimeo') {
          playerBox.innerHTML = `<iframe src="${esc(parsed.embedUrl)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="${esc(item.title)}"></iframe>`;
        } else if (parsed.type === 'html5' && parsed.embedUrl) {
          playerBox.innerHTML = `<video src="${esc(parsed.embedUrl)}" controls autoplay playsinline></video>`;
        } else {
          playerBox.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:var(--muted);padding:40px">Video tidak dapat dimuat.</div>`;
        }
      }
    }

    if ($('modalVideoTitle')) $('modalVideoTitle').textContent = item.title;
    if ($('modalVideoDesc')) $('modalVideoDesc').textContent = item.description || '';
    if ($('modalVideoBadge')) $('modalVideoBadge').textContent = item.categoryLabel || 'Video';
    if ($('modalVideoCar')) $('modalVideoCar').textContent = item.car ? `— ${item.car}` : '';
    if ($('modalVideoWa')) {
      $('modalVideoWa').href = waUrl(`Halo ${C.brand.name}, saya baru menonton video "${item.title}". Saya ingin konsultasi perlindungan PPF untuk mobil saya.`);
    }

    cinema.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCinema() {
    if (!cinema) return;
    cinema.classList.remove('open');
    document.body.style.overflow = '';
    // Hentikan video seketika saat ditutup (hemat RAM & bandwidth)
    if (playerBox) {
      playerBox.innerHTML = '';
      playerBox.classList.remove('is-instagram');
    }
  }

  $('cinemaClose')?.addEventListener('click', closeCinema);
  $('cinemaBackdrop')?.addEventListener('click', closeCinema);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cinema.classList.contains('open')) closeCinema();
  });

  // Footer dynamic content
  if ($('footerDesc')) $('footerDesc').textContent = C.footer?.desc || '';
  if ($('footerCopyright')) $('footerCopyright').textContent = C.footer?.copyright || 'All rights reserved.';
  if ($('footerAddress')) $('footerAddress').textContent = C.location.address;
  if ($('footerHours')) $('footerHours').textContent = C.location.hours;
  if ($('footerPhone')) {
    $('footerPhone').textContent = C.contact.phone;
    $('footerPhone').href = `tel:${C.contact.phone.replace(/[^0-9+]/g, '')}`;
  }
  if ($('footerEmail')) {
    $('footerEmail').textContent = C.contact.email;
    $('footerEmail').href = `mailto:${C.contact.email}`;
  }

  const fbVal = C.footer?.facebook || C.contact?.facebook || '';
  const igVal = C.footer?.instagram || C.contact?.instagram || '';
  const toUrl = (type, val) => {
    if (!val) return '#';
    if (val.startsWith('https://')) return safeUrl(val);
    const clean = val.replace(/^@/, '').trim();
    if (type === 'fb') return `https://facebook.com/${clean}`;
    if (type === 'ig') return `https://instagram.com/${clean}`;
    return val;
  };
  const fbBtn = $('footerFb');
  if (fbBtn) {
    if (fbVal) { fbBtn.href = toUrl('fb', fbVal); fbBtn.style.display = 'inline-flex'; }
    else { fbBtn.style.display = 'none'; }
  }
  const igBtn = $('footerIg');
  if (igBtn) {
    if (igVal) { igBtn.href = toUrl('ig', igVal); igBtn.style.display = 'inline-flex'; }
    else { igBtn.style.display = 'none'; }
  }

  // Navbar behavior
  const nav = $('navbar'), links = $('navLinks'), burger = $('burger'), backdrop = $('navBackdrop');
  const closeNav = () => {
    burger?.classList.remove('open');
    links?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.classList.remove('nav-open');
  };
  const toggleNav = () => {
    const isOpen = links?.classList.toggle('open');
    burger?.classList.toggle('open', isOpen);
    backdrop?.classList.toggle('open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
  };
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger?.addEventListener('click', toggleNav);
  backdrop?.addEventListener('click', closeNav);
})();
