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
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  /* ---------------- Scroll Progress Bar ---------------- */
  const progressBar = $('abProgress');
  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    progressBar.style.setProperty('--p', p.toFixed(4));
  };

  /* ---------------- Hero Interactive Effects ---------------- */
  const heroTitle = document.querySelector('.ab-title');
  if (heroTitle) {
    setTimeout(() => heroTitle.classList.add('ready'), 1200);
  }

  const hero = $('abHero');
  const heroX = $('abHeroX');
  if (hero && canHover && !prefersReduced) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      hero.style.setProperty('--mx', `${(nx * 100).toFixed(2)}%`);
      hero.style.setProperty('--my', `${(ny * 100).toFixed(2)}%`);
      if (heroX) {
        const dx = (nx - 0.5) * 32;
        const dy = (ny - 0.5) * 26;
        const rot = (nx - 0.5) * 6;
        heroX.style.setProperty('--xx', `${dx.toFixed(1)}px`);
        heroX.style.setProperty('--xy', `${dy.toFixed(1)}px`);
        heroX.style.setProperty('--xr', `${rot.toFixed(2)}deg`);
      }
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.removeProperty('--mx');
      hero.style.removeProperty('--my');
      if (heroX) {
        heroX.style.setProperty('--xx', '0px');
        heroX.style.setProperty('--xy', '0px');
        heroX.style.setProperty('--xr', '0deg');
      }
    });
  }

  /* ---------------- Philosophy Compare Toggle ---------------- */
  const compare = $('abCompare');
  if (compare) {
    const cmpBtns = compare.querySelectorAll('.ab-cmp-btn');
    const cmpPanels = compare.querySelectorAll('.ab-compare-panel');
    const setCompare = (side) => {
      compare.setAttribute('data-side', side);
      cmpBtns.forEach((btn) => {
        const isActive = btn.dataset.side === side;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });
      cmpPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.panel === side);
      });
    };
    cmpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.side) setCompare(btn.dataset.side);
      });
    });
  }

  /* ---------------- Infinite Marquee ---------------- */
  const marquee = $('abMarquee');
  const marqueeGroup = marquee?.querySelector('.ab-marquee-group');
  if (marquee && marqueeGroup) {
    const clone = marqueeGroup.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marquee.appendChild(clone);
  }

  /* ---------------- Word-by-Word Scroll Reveal ---------------- */
  const wordEls = Array.from(document.querySelectorAll('[data-words]'));
  const HIGHLIGHT_WORDS = new Set(['ruang', 'pribadi', 'selera', 'sikap', 'hidup', 'anda']);
  const wordSets = wordEls.map((el) => {
    const raw = el.textContent.trim();
    const tokens = raw.split(/\s+/).filter(Boolean);
    el.innerHTML = tokens.map((tok) => {
      const normalized = tok.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
      const cls = HIGHLIGHT_WORDS.has(normalized) ? 'w hl' : 'w';
      return `<span class="${cls}">${esc(tok)}</span>`;
    }).join(' ');
    return { el, spans: Array.from(el.querySelectorAll('.w')) };
  });

  const updateWords = () => {
    if (prefersReduced) {
      wordSets.forEach(({ spans }) => spans.forEach((s) => s.classList.add('on')));
      return;
    }
    const vh = window.innerHeight || 800;
    const start = vh * 0.88;
    const end = vh * 0.32;
    wordSets.forEach(({ el, spans }) => {
      const rect = el.getBoundingClientRect();
      const progress = clamp((start - rect.top) / Math.max(1, start - end), 0, 1);
      const count = progress >= 0.99 ? spans.length : Math.floor(progress * spans.length);
      spans.forEach((span, i) => {
        span.classList.toggle('on', i < count);
      });
    });
  };

  let scrollRaf = 0;
  const onScrollFrame = () => {
    scrollRaf = 0;
    updateProgress();
    updateWords();
  };
  const scheduleScrollUpdate = () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScrollFrame);
  };
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
  window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
  updateProgress();
  updateWords();

  /* ---------------- Makna Nama Accordion / Split ---------------- */
  const abName = $('abName');
  if (abName) {
    const namePanels = Array.from(abName.querySelectorAll('.ab-name-panel'));
    const setNameActive = (key) => {
      if (!key || abName.getAttribute('data-active') === key) return;
      abName.setAttribute('data-active', key);
      namePanels.forEach((panel) => {
        const isActive = panel.dataset.key === key;
        panel.classList.toggle('active', isActive);
        const head = panel.querySelector('.ab-name-head');
        if (head) head.setAttribute('aria-expanded', String(isActive));
      });
    };
    namePanels.forEach((panel) => {
      const key = panel.dataset.key;
      const head = panel.querySelector('.ab-name-head');
      head?.addEventListener('click', () => setNameActive(key));
      panel.addEventListener('click', (e) => {
        if (!e.target.closest('.ab-name-head') && !panel.classList.contains('active')) {
          setNameActive(key);
        }
      });
      if (canHover) {
        panel.addEventListener('mouseenter', () => setNameActive(key));
      }
      head?.addEventListener('focus', () => setNameActive(key));
    });
  }

  /* ---------------- 4 Core Values 3D Tilt Cards ---------------- */
  if (canHover && !prefersReduced) {
    document.querySelectorAll('.ab-value').forEach((card) => {
      const inner = card.querySelector('.ab-value-in');
      if (!inner) return;
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const rect = inner.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nx = x / rect.width;
        const ny = y / rect.height;
        inner.style.setProperty('--mx', `${x.toFixed(1)}px`);
        inner.style.setProperty('--my', `${y.toFixed(1)}px`);
        inner.style.setProperty('--rx', `${((0.5 - ny) * 12).toFixed(2)}deg`);
        inner.style.setProperty('--ry', `${((nx - 0.5) * 12).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        inner.style.setProperty('--rx', '0deg');
        inner.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------- Khusus Pasar Indonesia Stage ---------------- */
  const rainBox = $('abRain');
  if (rainBox && rainBox.childElementCount === 0) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 28; i++) {
      const drop = document.createElement('i');
      const left = ((i * 3.6) + (i % 3) * 0.7) % 100;
      const dur = 0.68 + ((i * 19) % 10) * 0.055;
      const delay = -((i * 0.23) % 1.4);
      drop.style.left = `${left.toFixed(1)}%`;
      drop.style.animationDuration = `${dur.toFixed(2)}s`;
      drop.style.animationDelay = `${delay.toFixed(2)}s`;
      frag.appendChild(drop);
    }
    rainBox.appendChild(frag);
  }

  const abId = $('abId');
  if (abId) {
    const idTabs = Array.from(abId.querySelectorAll('.ab-id-item'));
    const idScenes = Array.from(abId.querySelectorAll('.ab-scene'));
    const stageNo = $('abStageNo');
    const stageLabel = $('abStageLabel');
    const CYCLE_MS = 7000;

    let currentIdx = 0;
    let inViewport = false;
    let isHovered = false;
    let isFocused = false;
    let timerId = 0;
    let startedAt = 0;
    let remaining = CYCLE_MS;

    const triggerSwap = (el) => {
      if (!el) return;
      el.classList.remove('swap');
      void el.offsetWidth;
      el.classList.add('swap');
    };

    const clearCycle = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = 0;
      }
    };

    const scheduleCycle = () => {
      clearCycle();
      if (prefersReduced || !inViewport || isHovered || isFocused || idTabs.length < 2) return;
      startedAt = Date.now();
      timerId = setTimeout(() => {
        timerId = 0;
        remaining = CYCLE_MS;
        selectScene((currentIdx + 1) % idTabs.length);
      }, Math.max(50, remaining));
    };

    const pauseCycle = () => {
      if (timerId) {
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        clearCycle();
      }
      abId.classList.add('paused');
    };

    const resumeCycle = () => {
      if (!isHovered && !isFocused) {
        abId.classList.remove('paused');
        scheduleCycle();
      }
    };

    function selectScene(idx) {
      const targetIdx = ((idx % idTabs.length) + idTabs.length) % idTabs.length;
      currentIdx = targetIdx;
      remaining = CYCLE_MS;

      idTabs.forEach((tab, i) => {
        const active = i === targetIdx;
        tab.classList.remove('active');
        if (active) {
          void tab.offsetWidth; // restart progress bar cleanly
          tab.classList.add('active');
        }
        tab.setAttribute('aria-selected', String(active));
      });

      idScenes.forEach((scene) => {
        scene.classList.toggle('active', Number(scene.dataset.scene) === targetIdx);
      });

      const activeTab = idTabs[targetIdx];
      if (stageNo) {
        stageNo.textContent = String(targetIdx + 1).padStart(2, '0');
        triggerSwap(stageNo);
      }
      if (stageLabel && activeTab) {
        stageLabel.textContent = activeTab.dataset.label || '';
        triggerSwap(stageLabel);
      }

      scheduleCycle();
    }

    idTabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectScene(i));
    });

    abId.addEventListener('mouseenter', () => {
      isHovered = true;
      pauseCycle();
    });
    abId.addEventListener('mouseleave', () => {
      isHovered = false;
      resumeCycle();
    });
    abId.addEventListener('focusin', () => {
      isFocused = true;
      pauseCycle();
    });
    abId.addEventListener('focusout', (e) => {
      if (!abId.contains(e.relatedTarget)) {
        isFocused = false;
        resumeCycle();
      }
    });

    if ('IntersectionObserver' in window) {
      const idObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inViewport = entry.isIntersecting;
          if (inViewport) resumeCycle();
          else pauseCycle();
        });
      }, { threshold: 0.25 });
      idObserver.observe(abId);
    } else {
      inViewport = true;
      scheduleCycle();
    }
  }

  /* ---------------- Reveal on Scroll ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        const delay = (i % 3) * 80;
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('visible');
        setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1050 + delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
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
        if (fbVal) {
          fbBtn.href = toUrl('fb', fbVal);
          fbBtn.style.display = 'inline-flex';
        } else {
          fbBtn.style.display = 'none';
        }
      }
      const igBtn = $('footerIg');
      if (igBtn) {
        if (igVal) {
          igBtn.href = toUrl('ig', igVal);
          igBtn.style.display = 'inline-flex';
        } else {
          igBtn.style.display = 'none';
        }
      }
    } catch (e) {
      console.error('Gagal memuat data Tentang X-Project:', e);
    }
  })();
})();
