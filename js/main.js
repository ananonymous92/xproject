(async () => {
  let C;
  try { C = await Store.load(); }
  catch (e) { console.error(e); return; }
  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const waUrl = (msg) => `https://wa.me/${C.brand.whatsapp}?text=${encodeURIComponent(msg || C.brand.waMessage)}`;

  const ICONS = {
    shield: '<path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"/>',
    heal: '<path d="M12 21s-7-4.4-9.3-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9z"/>',
    gloss: '<path d="m12 2 2.5 7.5H22l-6 4.5 2.3 7.5L12 17l-6.3 4.5L8 14 2 9.5h7.5z"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  const icon = (k) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${ICONS[k] || ICONS.shield}</svg>`;

  // Brand / logo
  const [first, ...rest] = C.brand.name.split(' ');
  const logoHtml = C.brand.logo ? `<img src="${esc(safeUrl(C.brand.logo, ''))}" alt="${esc(C.brand.name)}">` : `${esc(first)}&nbsp;<b>${esc(rest.join(' '))}</b>`;
  $('logo').innerHTML = logoHtml; $('footerLogo').innerHTML = logoHtml;
  document.querySelectorAll('.brandName').forEach((e) => (e.textContent = C.brand.name));
  document.querySelectorAll('.wa-link').forEach((a) => { a.href = waUrl(); a.target = '_blank'; a.rel = 'noopener'; });
  $('year').textContent = new Date().getFullYear();

  // Hero
  $('heroBg').style.backgroundImage = `url("${safeUrl(C.hero.image, '').replace(/["\\]/g, '')}")`;
  $('heroEyebrow').textContent = C.hero.eyebrow;
  $('heroHeadline').textContent = C.hero.headline;
  $('heroSub').textContent = C.hero.subheadline;
  $('heroCta1').textContent = C.hero.cta1;
  $('heroCta2').textContent = C.hero.cta2;
  $('heroBadges').innerHTML = (C.hero.badges || '')
    .split(/[•·.|\n]+/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<span>${esc(b)}</span>`)
    .join('');

  // About
  $('aboutImg').src = safeUrl(C.about.image, '');
  $('aboutTitle').textContent = C.about.title;
  $('aboutText').textContent = C.about.text;
  $('benefits').innerHTML = C.about.benefits.map((b) => `<div class="benefit"><div class="ic">${icon(b.icon)}</div><h3>${esc(b.title)}</h3><p>${esc(b.text)}</p></div>`).join('');

  // Services
  $('services').innerHTML = C.services.map((s, i) => `<article class="service reveal"><span class="num">0${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('');

  // Gallery + lightbox
  $('galleryGrid').innerHTML = C.gallery.map((g) => `<figure class="g-item reveal"><img src="${esc(safeUrl(g.image, ''))}" alt="${esc(g.caption)}" loading="lazy"><figcaption>${esc(g.caption)}</figcaption></figure>`).join('');
  const lb = $('lightbox');
  $('galleryGrid').addEventListener('click', (e) => {
    const f = e.target.closest('.g-item'); if (!f) return;
    $('lbImg').src = f.querySelector('img').src; $('lbCap').textContent = f.querySelector('figcaption').textContent;
    lb.classList.add('open');
  });
  lb.addEventListener('click', () => lb.classList.remove('open'));
  $('lbClose')?.addEventListener('click', (e) => { e.stopPropagation(); lb.classList.remove('open'); });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && lb.classList.remove('open'));

  // Pricing
  $('pricing').innerHTML = C.pricing.map((p) => `
    <div class="price-card reveal ${p.featured ? 'featured' : ''}">
      <h3>${esc(p.name)}</h3><div class="price">${esc(p.price)}</div>
      <ul>${p.features.split('\n').filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <a class="btn ${p.featured ? 'btn-gold' : 'btn-ghost'}" target="_blank" rel="noopener" href="${waUrl(`Halo, saya tertarik dengan paket ${p.name}.`)}">Pilih Paket</a>
    </div>`).join('');
  $('fPkg').innerHTML = '<option value="">Pilih Paket (opsional)</option>' + C.pricing.map((p) => `<option>${esc(p.name)}</option>`).join('');

  // Location
  $('locAddress').textContent = C.location.address;
  $('locHours').textContent = C.location.hours;
  $('locMap').src = safeUrl(C.location.mapEmbed, 'about:blank');
  $('locDir').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.location.address)}`;

  // News
  const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  $('newsGrid').innerHTML = C.news.map((n) => `<article class="post reveal"><div class="thumb"><img src="${esc(safeUrl(n.image, ''))}" alt="${esc(n.title)}" loading="lazy"></div><div class="body"><time>${fmt(n.date)}</time><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div></article>`).join('');

  // Helpers for social media URLs
  const toUrl = (type, val) => {
    if (!val) return '#';
    if (val.startsWith('https://')) return safeUrl(val);
    const clean = val.replace(/^@/, '').trim();
    if (type === 'fb') return `https://facebook.com/${clean}`;
    if (type === 'ig') return `https://instagram.com/${clean}`;
    return val;
  };
  const toLabel = (val) => {
    if (!val) return '';
    return val.replace(/^https?:\/\/(www\.)?(instagram\.com|facebook\.com)\/?/, '@').replace(/\/$/, '');
  };

  const fbVal = C.footer?.facebook || C.contact?.facebook || '';
  const igVal = C.footer?.instagram || C.contact?.instagram || '';

  // Contact
  const igHtml = igVal ? `<a href="${esc(toUrl('ig', igVal))}" target="_blank" rel="noopener" style="color:var(--gold2)">${esc(toLabel(igVal))}</a>` : '-';
  const fbHtml = fbVal ? `<a href="${esc(toUrl('fb', fbVal))}" target="_blank" rel="noopener" style="color:var(--gold2)">${esc(toLabel(fbVal))}</a>` : '-';
  $('contactList').innerHTML = `
    <li><b>Telepon</b>${esc(C.contact.phone)}</li>
    <li><b>Email</b>${esc(C.contact.email)}</li>
    <li><b>Instagram</b>${igHtml}</li>
    <li><b>Facebook</b>${fbHtml}</li>
    <li><b>Alamat</b>${esc(C.location.address)}</li>
  `;
  $('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = `Halo ${C.brand.name}, saya ${$('fName').value}.\nMobil: ${$('fCar').value}\nPaket: ${$('fPkg').value || '-'}\n${$('fMsg').value}`;
    window.open(waUrl(msg), '_blank');
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

  // Social Links in Footer
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

  // Navbar behaviour
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

  // Smooth scroll dengan URL bersih (mencegah penumpukan hash #home dsb di address bar jika diinginkan)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href').slice(1);
      closeNav();
      if (!targetId || targetId === 'home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (location.hash) {
          history.replaceState(null, '', location.pathname);
        }
      } else {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', location.pathname);
        }
      }
    });
  });

  // Active link + reveal on scroll
  const navMap = {}; links.querySelectorAll('a[href^="#"]').forEach((a) => (navMap[a.getAttribute('href').slice(1)] = a));
  const spy = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { Object.values(navMap).forEach((a) => a.classList.remove('active')); navMap[en.target.id]?.classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach((s) => spy.observe(s));

  const io = new IntersectionObserver((ents) => ents.forEach((en, i) => {
    if (en.isIntersecting) { en.target.style.transitionDelay = `${(i % 3) * 0.1}s`; en.target.classList.add('visible'); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();

