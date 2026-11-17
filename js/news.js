(async () => {
  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  if ($('year')) $('year').textContent = new Date().getFullYear();

  /* ---------------- Navbar & Scroll Progress ---------------- */
  const nav = $('navbar');
  const links = $('navLinks');
  const burger = $('burger');
  const backdrop = $('navBackdrop');

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
  const syncNavbar = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', syncNavbar, { passive: true });
  syncNavbar();
  burger?.addEventListener('click', toggleNav);
  backdrop?.addEventListener('click', closeNav);

  const progressBar = $('nwProgress');
  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    progressBar.style.setProperty('--p', p.toFixed(4));
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  /* ---------------- Helpers ---------------- */
  const slugify = (str = '') => String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'artikel';

  const withSlugs = (items = []) => {
    const used = new Set();
    return items.map((item, idx) => {
      const base = slugify(item.title || `artikel-${idx + 1}`);
      let slug = base;
      let n = 2;
      while (used.has(slug)) { slug = `${base}-${n++}`; }
      used.add(slug);
      return { ...item, slug, idx };
    });
  };

  const rootUrl = (u, fallback = '/assets/ppf.jpg') => {
    const s = safeUrl(u, fallback);
    return /^(assets|uploads)\//i.test(s) ? `/${s}` : s;
  };

  const fmtDate = (d) => {
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  const estimateReadMin = (text = '') => {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  };

  const formatArticleHtml = (raw = '') => {
    const blocks = String(raw || '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    if (blocks.length === 0) return '';
    return blocks.map((block) => {
      const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2 && /^\d+\.\s+/.test(lines[0]) && lines[0].length < 90) {
        const heading = esc(lines[0]);
        const body = lines.slice(1).map((l) => esc(l)).join('<br>');
        return `<h3>${heading}</h3><p>${body}</p>`;
      }
      if (lines.length === 1 && /^\d+\.\s+/.test(lines[0]) && lines[0].length < 80) {
        return `<h3>${esc(lines[0])}</h3>`;
      }
      return `<p>${lines.map((l) => esc(l)).join('<br>')}</p>`;
    }).join('');
  };

  const getSlugFromLocation = () => {
    const m = location.pathname.match(/^\/news\/([^/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]);
    const q = new URLSearchParams(location.search).get('artikel');
    return q ? q.trim() : '';
  };

  /* ---------------- Load Data ---------------- */
  let C;
  try { C = await Store.load(); }
  catch (e) { console.error('Gagal memuat artikel:', e); return; }

  const brandName = C.brand?.name || 'X-Project';
  const waUrl = (msg) => `https://wa.me/${C.brand.whatsapp}?text=${encodeURIComponent(msg || C.brand.waMessage)}`;
  const [first, ...rest] = brandName.split(' ');
  const logoHtml = C.brand?.logo
    ? `<img src="${esc(rootUrl(C.brand.logo, '/assets/logo.png'))}" alt="${esc(brandName)}">`
    : `${esc(first)}&nbsp;<b>${esc(rest.join(' '))}</b>`;

  if ($('logo')) $('logo').innerHTML = logoHtml;
  if ($('footerLogo')) $('footerLogo').innerHTML = logoHtml;
  document.querySelectorAll('.brandName').forEach((e) => (e.textContent = brandName));
  document.querySelectorAll('.wa-link').forEach((a) => { a.href = waUrl(); a.target = '_blank'; a.rel = 'noopener'; });

  if ($('footerDesc')) $('footerDesc').textContent = C.footer?.desc || '';
  if ($('footerCopyright')) $('footerCopyright').textContent = C.footer?.copyright || 'All rights reserved.';
  if ($('footerAddress') && C.location?.address) $('footerAddress').textContent = C.location.address;
  if ($('footerHours') && C.location?.hours) $('footerHours').textContent = C.location.hours;
  if ($('footerPhone') && C.contact?.phone) {
    $('footerPhone').textContent = C.contact.phone;
    $('footerPhone').href = `tel:${C.contact.phone.replace(/[^0-9+]/g, '')}`;
  }
  if ($('footerEmail') && C.contact?.email) {
    $('footerEmail').textContent = C.contact.email;
    $('footerEmail').href = `mailto:${C.contact.email}`;
  }

  const toUrl = (type, val) => {
    if (!val) return '#';
    if (val.startsWith('https://')) return safeUrl(val);
    const clean = val.replace(/^@/, '').trim();
    if (type === 'fb') return `https://facebook.com/${clean}`;
    if (type === 'ig') return `https://instagram.com/${clean}`;
    return val;
  };
  const fbVal = C.footer?.facebook || C.contact?.facebook || '';
  const igVal = C.footer?.instagram || C.contact?.instagram || '';
  if ($('footerFb')) {
    if (fbVal) { $('footerFb').href = toUrl('fb', fbVal); $('footerFb').style.display = 'inline-flex'; }
    else { $('footerFb').style.display = 'none'; }
  }
  if ($('footerIg')) {
    if (igVal) { $('footerIg').href = toUrl('ig', igVal); $('footerIg').style.display = 'inline-flex'; }
    else { $('footerIg').style.display = 'none'; }
  }

  const articles = withSlugs(Array.isArray(C.news) ? C.news : []);
  const indexView = $('nwIndexView');
  const readerView = $('nwReader');
  const featuredBox = $('nwFeatured');
  const featuredWrap = $('nwFeaturedWrap');
  const gridBox = $('nwGrid');
  const searchInput = $('nwSearch');
  const countEl = $('nwCount');

  const renderCard = (a) => {
    const mins = estimateReadMin(a.content || a.text);
    return `
      <a class="nw-card" href="/news/${esc(a.slug)}" data-slug="${esc(a.slug)}">
        <div class="nw-card-thumb">
          <img src="${esc(rootUrl(a.image, '/assets/ppf.jpg'))}" alt="${esc(a.title)}" loading="lazy">
        </div>
        <div class="nw-card-body">
          <div class="nw-meta-row">
            <time datetime="${esc(a.date || '')}">${fmtDate(a.date)}</time>
            <span>•</span>
            <span>${mins} menit baca</span>
          </div>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.text)}</p>
          <span class="nw-read-more">Baca Selengkapnya <span>&rarr;</span></span>
        </div>
      </a>
    `;
  };

  const renderIndexList = (query = '') => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? articles.filter((a) => `${a.title} ${a.text} ${a.content || ''}`.toLowerCase().includes(q))
      : articles;

    if (countEl) {
      countEl.textContent = filtered.length ? `${filtered.length} artikel` : '0 hasil';
    }

    if (featuredWrap && featuredBox) {
      if (!q && articles.length > 0) {
        const feat = articles[0];
        const mins = estimateReadMin(feat.content || feat.text);
        featuredWrap.hidden = false;
        featuredBox.innerHTML = `
          <a class="nw-featured-card" href="/news/${esc(feat.slug)}" data-slug="${esc(feat.slug)}">
            <div class="nw-featured-media">
              <img src="${esc(rootUrl(feat.image, '/assets/ppf.jpg'))}" alt="${esc(feat.title)}">
              <span class="nw-featured-badge">Artikel Utama</span>
            </div>
            <div class="nw-featured-body">
              <div class="nw-meta-row">
                <span class="badge-cat">Edukasi &amp; Tips PPF</span>
                <time datetime="${esc(feat.date || '')}">${fmtDate(feat.date)}</time>
                <span>•</span>
                <span>${mins} menit baca</span>
              </div>
              <h2>${esc(feat.title)}</h2>
              <p>${esc(feat.text)}</p>
              <span class="nw-read-more">Baca Artikel Lengkap <span>&rarr;</span></span>
            </div>
          </a>
        `;
      } else {
        featuredWrap.hidden = true;
      }
    }

    if (gridBox) {
      if (filtered.length === 0) {
        gridBox.innerHTML = `<div class="nw-empty">Tidak ditemukan artikel untuk kata kunci "<strong>${esc(query)}</strong>".</div>`;
      } else {
        gridBox.innerHTML = filtered.map(renderCard).join('');
      }
    }
  };

  const pushTagEvent = (payload) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  };

  const setHeadMeta = (title, desc, canonicalUrl, ogImage) => {
    document.title = title;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && desc) descMeta.setAttribute('content', desc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonicalUrl) canonical.setAttribute('href', canonicalUrl);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && desc) ogDesc.setAttribute('content', desc);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl && canonicalUrl) ogUrl.setAttribute('content', canonicalUrl);
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && ogImage) ogImg.setAttribute('content', ogImage);
  };

  const showView = (slug, { pushHistory = false, trackPageview = false } = {}) => {
    const matched = slug ? articles.find((a) => a.slug === slug) : null;

    if (matched && readerView && indexView) {
      const targetPath = `/news/${matched.slug}`;
      if (pushHistory && location.pathname !== targetPath) {
        history.pushState({ slug: matched.slug }, '', targetPath);
      }
      indexView.hidden = true;
      readerView.hidden = false;

      const bodyRaw = matched.content || matched.text || '';
      const mins = estimateReadMin(bodyRaw);
      const absUrl = `https://www.xprojectppf.id${targetPath}`;
      const imgPath = rootUrl(matched.image, '/assets/ppf.jpg');
      const absImg = imgPath.startsWith('http') ? imgPath : `https://www.xprojectppf.id${imgPath}`;

      if ($('nwBreadcrumbTitle')) $('nwBreadcrumbTitle').textContent = matched.title;
      if ($('nwReaderDate')) {
        $('nwReaderDate').textContent = fmtDate(matched.date);
        $('nwReaderDate').setAttribute('datetime', matched.date || '');
      }
      if ($('nwReadTime')) $('nwReadTime').textContent = `• ${mins} menit baca`;
      if ($('nwReaderTitle')) $('nwReaderTitle').textContent = matched.title;
      if ($('nwReaderLead')) $('nwReaderLead').textContent = matched.text || '';
      if ($('nwReaderImg')) {
        $('nwReaderImg').src = imgPath;
        $('nwReaderImg').alt = matched.title;
      }
      if ($('nwReaderContent')) {
        $('nwReaderContent').innerHTML = formatArticleHtml(bodyRaw);
      }
      if ($('nwReaderWa')) {
        $('nwReaderWa').href = waUrl(`Halo ${brandName}, saya baru membaca artikel "${matched.title}". Saya ingin cek paket & promo spesial.`);
      }
      if ($('nwShareWa')) {
        $('nwShareWa').href = `https://wa.me/?text=${encodeURIComponent(`${matched.title} — ${absUrl}`)}`;
      }
      if ($('nwRelatedGrid')) {
        const related = articles.filter((a) => a.slug !== matched.slug).slice(0, 3);
        $('nwRelatedGrid').innerHTML = related.map(renderCard).join('');
      }

      setHeadMeta(
        `${matched.title} — ${brandName}`,
        matched.text || bodyRaw.slice(0, 155),
        absUrl,
        absImg
      );

      if (trackPageview) {
        pushTagEvent({
          event: 'virtual_pageview',
          page_path: targetPath,
          page_title: document.title,
          article_slug: matched.slug,
          article_title: matched.title
        });
      }
      pushTagEvent({
        event: 'article_view',
        article_slug: matched.slug,
        article_title: matched.title,
        article_date: matched.date || ''
      });
      window.scrollTo({ top: 0, behavior: pushHistory ? 'smooth' : 'auto' });
    } else if (indexView && readerView) {
      if (pushHistory && location.pathname !== '/news') {
        history.pushState({ slug: '' }, '', '/news');
      }
      readerView.hidden = true;
      indexView.hidden = false;
      setHeadMeta(
        `News & Artikel — ${brandName} Paint Protection Film`,
        'Wawasan seputar perawatan mobil, edukasi Paint Protection Film (PPF), tips self-healing, dan perbandingan proteksi cat dari studio X-Project PIK 2.',
        'https://www.xprojectppf.id/news',
        'https://www.xprojectppf.id/assets/ppf.jpg'
      );
      if (trackPageview) {
        pushTagEvent({
          event: 'virtual_pageview',
          page_path: '/news',
          page_title: document.title
        });
      }
      if (pushHistory) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    updateProgress();
  };

  renderIndexList();
  showView(getSlugFromLocation(), { pushHistory: false, trackPageview: false });

  /* ---------------- Event Listeners ---------------- */
  searchInput?.addEventListener('input', (e) => {
    renderIndexList(e.target.value);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-slug]');
    if (link && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      showView(link.dataset.slug, { pushHistory: true, trackPageview: true });
      return;
    }
    if (e.target.closest('#nwBackBtn, #nwBreadcrumbNews, #nwRelatedAll') && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      showView('', { pushHistory: true, trackPageview: true });
    }
  });

  window.addEventListener('popstate', () => {
    showView(getSlugFromLocation(), { pushHistory: false, trackPageview: true });
  });

  const copyBtn = $('nwCopyLink');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Tautan Disalin ✓';
      setTimeout(() => { copyBtn.textContent = orig; }, 2000);
    } catch {}
  });
})();
