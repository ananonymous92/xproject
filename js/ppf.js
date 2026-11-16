(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

  if ($('year')) $('year').textContent = new Date().getFullYear();

  /* ---------------- Navbar & Smooth Scroll ---------------- */
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

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href').slice(1);
      closeNav();
      if (!targetId) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          const offset = 136;
          const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      }
    });
  });

  /* ---------------- Scroll Progress & Hero Glow ---------------- */
  const progressBar = $('pfProgress');
  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    progressBar.style.setProperty('--p', p.toFixed(4));
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  const hero = $('pfHero');
  if (hero && canHover && !prefersReduced) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      hero.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
      hero.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
    });
  }

  /* ---------------- Sticky Subnav Scroll-Spy ---------------- */
  const subLinks = Array.from(document.querySelectorAll('.pf-sub-link'));
  const subMap = {};
  subLinks.forEach((a) => { subMap[a.dataset.section] = a; });
  if ('IntersectionObserver' in window && subLinks.length > 0) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        subLinks.forEach((a) => a.classList.remove('active'));
        subMap[en.target.id]?.classList.add('active');
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(subMap).forEach((id) => {
      const sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------------- Interactive 3-Layer Film Anatomy ---------------- */
  const LAYER_VISUAL_DATA = {
    xp: {
      '0': {
        img: 'assets/xp-ppf-substrat.jpg',
        badge: '✓ Standar X-Project · Lapisan 01 Substrat',
        title: 'X-Project PPF · TPU Alifatik PCL Bening Kristal',
        desc: 'Tetap jernih 100% tanpa menguning meski terpapar UV tropis bertahun-tahun, menjaga warna asli cat pabrik tetap murni.'
      },
      '1': {
        img: 'assets/xp-ppf-adhesive.jpg',
        badge: '✓ Standar X-Project · Lapisan 02 Perekat',
        title: 'X-Project PPF · Perekat Ashland® Dilepas Tanpa Residu',
        desc: 'Daya rekat awal terukur dan saat dilepas tidak meninggalkan sisa lem sedikit pun—cat orisinal pabrik tetap utuh 100%.'
      },
      '2': {
        img: 'assets/xp-ppf-topcoat.jpg',
        badge: '✓ Standar X-Project · Lapisan 03 Top Coat',
        title: 'X-Project PPF · Nano Self-Healing & Super Hidrofobik',
        desc: 'Permukaan sehalus cermin dengan efek daun talas (hydrophobic) serta kemampuan memulihkan baret halus saat terkena panas.'
      }
    },
    cheap: {
      '0': {
        img: 'assets/cheap-ppf-yellowing.jpg',
        badge: '⚠️ Dampak PPF Murah · Lapisan 01 Substrat',
        title: 'Contoh PPF murah · Film menguning saat dikelupas',
        desc: 'Substrat non-PCL cepat teroksidasi sinar UV, berubah kuning kusam dan merusak estetika warna asli mobil.'
      },
      '1': {
        img: 'assets/cheap-ppf-adhesive.jpg',
        badge: '⚠️ Dampak PPF Murah · Lapisan 02 Perekat',
        title: 'Contoh PPF murah · Sisa lem dan cat terkelupas',
        desc: 'Perekat murah meninggalkan kerak lem lengket dan menarik lapisan pernis/cat pabrik saat film dikelupas.'
      },
      '2': {
        img: 'assets/cheap-ppf-cracked.jpg',
        badge: '⚠️ Dampak PPF Murah · Lapisan 03 Top Coat',
        title: 'Contoh PPF murah · Permukaan retak dan kusam',
        desc: 'Lapisan atas PPF murah mengering, pecah seribu (retak rambut), kusam, dan tidak mampu pulih dari baret.'
      }
    }
  };

  const pfLb = $('pfLightbox');
  const pfLbImg = $('pfLbImg');
  const pfLbCap = $('pfLbCap');
  const openPfLightbox = (src, cap) => {
    if (!pfLb || !pfLbImg) return;
    pfLbImg.src = src;
    if (pfLbCap) pfLbCap.textContent = cap || '';
    pfLb.classList.add('open');
  };
  pfLb?.addEventListener('click', () => pfLb.classList.remove('open'));
  $('pfLbClose')?.addEventListener('click', (e) => { e.stopPropagation(); pfLb.classList.remove('open'); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pfLb?.classList.remove('open');
  });

  const layersWrap = $('pfLayers');
  if (layersWrap) {
    const modeBtns = layersWrap.querySelectorAll('.pf-mode-btn');
    const slices = layersWrap.querySelectorAll('.pf-slice');
    const cards = layersWrap.querySelectorAll('.pf-layer-card');
    const defectImg = $('pfDefectImg');
    const defectBadge = $('pfDefectBadge');
    const defectTitle = $('pfDefectTitle');
    const defectDesc = $('pfDefectDesc');
    const defectStage = $('pfDefectStage');

    const syncVisualStage = () => {
      const mode = layersWrap.getAttribute('data-mode') || 'xp';
      const key = layersWrap.getAttribute('data-layer') || '0';
      const d = (LAYER_VISUAL_DATA[mode] || LAYER_VISUAL_DATA.xp)[key];
      if (!d) return;
      if (defectImg) {
        defectImg.src = d.img;
        defectImg.alt = d.title;
      }
      if (defectBadge) {
        defectBadge.textContent = d.badge;
        defectBadge.classList.toggle('is-xp', mode === 'xp');
      }
      if (defectTitle) defectTitle.textContent = d.title;
      if (defectDesc) defectDesc.textContent = d.desc;
    };

    const setMode = (mode) => {
      layersWrap.setAttribute('data-mode', mode);
      modeBtns.forEach((b) => {
        const active = b.dataset.mode === mode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      syncVisualStage();
    };

    const setLayer = (idx) => {
      const key = String(idx);
      layersWrap.setAttribute('data-layer', key);
      slices.forEach((s) => s.classList.toggle('active', s.dataset.layer === key));
      cards.forEach((c) => c.classList.toggle('active', c.dataset.layer === key));
      syncVisualStage();
    };

    modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    slices.forEach((s) => s.addEventListener('click', () => setLayer(s.dataset.layer)));
    cards.forEach((c) => {
      c.addEventListener('click', () => setLayer(c.dataset.layer));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setLayer(c.dataset.layer);
        }
      });
    });

    layersWrap.querySelectorAll('.pf-defect-thumb').forEach((thumb) => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = String(thumb.getAttribute('data-zoom-layer') || '0');
        const mode = thumb.getAttribute('data-zoom-mode') || (layersWrap.getAttribute('data-mode') || 'xp');
        setLayer(key);
        setMode(mode);
        const d = (LAYER_VISUAL_DATA[mode] || LAYER_VISUAL_DATA.xp)[key];
        if (d) openPfLightbox(d.img, `${d.title} — ${d.desc}`);
      });
    });

    defectStage?.addEventListener('click', () => {
      const mode = layersWrap.getAttribute('data-mode') || 'xp';
      const key = layersWrap.getAttribute('data-layer') || '0';
      const d = (LAYER_VISUAL_DATA[mode] || LAYER_VISUAL_DATA.xp)[key];
      if (d) openPfLightbox(d.img, `${d.title} — ${d.desc}`);
    });
    defectStage?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        defectStage.click();
      }
    });
  }

  /* ---------------- Interactive Micron Thickness Visualizer ---------------- */
  const thickWrap = $('pfThickness');
  if (thickWrap) {
    const thickBtns = thickWrap.querySelectorAll('.pf-thick-btn');
    const barEl = $('pfThickBar');
    const valEl = $('pfThickVal');
    const seriesEl = $('pfThickSeries');
    const totalEl = $('pfThickTotal');

    thickBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mil = btn.dataset.mil;
        const um = Number(btn.dataset.um) || 216;
        const series = btn.dataset.series || '';
        const pct = clamp(Math.round((um / 250) * 100), 50, 98);
        const total = 120 + um;
        const ratio = (total / 120).toFixed(1);

        thickBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        if (barEl) barEl.style.width = `${pct}%`;
        if (valEl) valEl.textContent = `${um} μm (${mil} mil)`;
        if (seriesEl) seriesEl.textContent = series;
        if (totalEl) totalEl.textContent = `${total} μm (~${ratio}× ketebalan cat pabrik)`;
      });
    });
  }

  /* ---------------- Series Filter & Technical Table Sync ---------------- */
  const filterWrap = $('pfSeriesFilter');
  const lineGroups = document.querySelectorAll('.pf-line-group');
  const filmCards = document.querySelectorAll('.pf-film-card');
  const specRows = document.querySelectorAll('#pfSpecTable tbody tr');

  if (filterWrap) {
    const filterBtns = filterWrap.querySelectorAll('.pf-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        filterBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        lineGroups.forEach((g) => {
          g.classList.toggle('is-hidden', filter !== 'all' && g.dataset.line !== filter);
        });
        specRows.forEach((row) => {
          row.style.display = (filter === 'all' || row.dataset.line === filter) ? '' : 'none';
        });
      });
    });
  }

  const highlightSeries = (seriesKey) => {
    filmCards.forEach((c) => c.classList.toggle('highlighted', c.dataset.series === seriesKey));
    specRows.forEach((r) => r.classList.toggle('highlighted', r.dataset.series === seriesKey));
  };

  filmCards.forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.dataset.series;
      highlightSeries(key);
    });
  });

  specRows.forEach((row) => {
    row.addEventListener('click', () => highlightSeries(row.dataset.series));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        highlightSeries(row.dataset.series);
      }
    });
  });

  /* ---------------- 3D Tilt Warranty Card ---------------- */
  const wcard = $('pfWarrantyCard');
  if (wcard && canHover && !prefersReduced) {
    wcard.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const rect = wcard.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = x / rect.width;
      const ny = y / rect.height;
      wcard.style.setProperty('--mx', `${x.toFixed(1)}px`);
      wcard.style.setProperty('--my', `${y.toFixed(1)}px`);
      wcard.style.setProperty('--rx', `${((0.5 - ny) * 10).toFixed(2)}deg`);
      wcard.style.setProperty('--ry', `${((nx - 0.5) * 10).toFixed(2)}deg`);
    });
    wcard.addEventListener('pointerleave', () => {
      wcard.style.setProperty('--rx', '0deg');
      wcard.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------------- Interactive Care Checklist ---------------- */
  const careGrid = $('pfCareGrid');
  if (careGrid) {
    careGrid.querySelectorAll('.pf-care-card').forEach((card) => {
      const badge = card.querySelector('.pf-care-type');
      const origLabel = badge ? badge.textContent : '';
      card.addEventListener('click', () => {
        const checked = card.classList.toggle('checked');
        card.setAttribute('aria-pressed', String(checked));
        if (badge) badge.textContent = checked ? 'Dipahami ✓' : origLabel;
      });
    });
  }

  /* ---------------- Reveal on Scroll ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const delay = (i % 3) * 75;
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('visible');
        setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1050 + delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---------------- Store Content & Footer Binding ---------------- */
  (async () => {
    try {
      const C = await Store.load();
      if (!C) return;

      const waUrl = (msg) => `https://wa.me/${C.brand.whatsapp}?text=${encodeURIComponent(msg || C.brand.waMessage)}`;
      const [first, ...rest] = (C.brand?.name || 'X-Project').split(' ');
      const logoHtml = C.brand?.logo
        ? `<img src="${esc(safeUrl(C.brand.logo, ''))}" alt="${esc(C.brand.name)}">`
        : `${esc(first)}&nbsp;<b>${esc(rest.join(' '))}</b>`;

      if ($('logo')) $('logo').innerHTML = logoHtml;
      if ($('footerLogo')) $('footerLogo').innerHTML = logoHtml;
      document.querySelectorAll('.brandName').forEach((el) => {
        el.textContent = C.brand?.name || 'X-Project';
      });
      document.querySelectorAll('.wa-link').forEach((a) => {
        a.href = waUrl();
        a.target = '_blank';
        a.rel = 'noopener';
      });

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
    } catch (e) {
      console.error('Gagal memuat data Produk PPF:', e);
    }
  })();
})();
