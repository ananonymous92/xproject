(async () => {
  if (typeof Store === 'undefined') return;

  let C;
  try { C = await Store.load(); }
  catch { return; }

  const p = C?.promoPopup;
  if (!p || p.enabled === false) return;

  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rootUrl = (u, fallback = '/assets/hero.jpg') => {
    const s = safeUrl(u, fallback);
    return /^(assets|uploads)\//i.test(s) ? `/${s}` : s;
  };
  const brandName = C.brand?.name || 'X-Project';
  const waMsg = p.waMessage || C.brand?.waMessage || 'Halo, saya ingin cek promo spesial PPF.';
  const waHref = `https://wa.me/${C.brand?.whatsapp || ''}?text=${encodeURIComponent(waMsg)}`;
  const perksList = String(p.perks || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const pushTag = (eventName, extra = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      promo_title: p.title || '',
      page_path: location.pathname,
      ...extra
    });
  };

  // Inject Modal DOM
  const modal = document.createElement('div');
  modal.className = 'xp-promo-modal';
  modal.id = 'xpPromoModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'xpPromoTitle');
  modal.innerHTML = `
    <div class="xp-promo-backdrop" id="xpPromoBackdrop"></div>
    <div class="xp-promo-card">
      <button type="button" class="xp-promo-close" id="xpPromoClose" aria-label="Tutup popup promo">&times;</button>
      <div class="xp-promo-media">
        <img src="${esc(rootUrl(p.image, '/assets/hero.jpg'))}" alt="${esc(p.title || 'Promo Spesial X-Project')}">
        <span class="xp-promo-brand-tag">${esc(brandName)}</span>
      </div>
      <div class="xp-promo-body">
        ${p.badge ? `<span class="xp-promo-badge">${esc(p.badge)}</span>` : ''}
        <h2 id="xpPromoTitle">${esc(p.title || 'Promo Spesial X-Project')}</h2>
        ${p.subtitle ? `<p class="xp-promo-sub">${esc(p.subtitle)}</p>` : ''}
        ${perksList.length ? `<ul class="xp-promo-perks">${perksList.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        <div class="xp-promo-actions">
          <a class="btn btn-gold btn-lg" id="xpPromoCta" href="${esc(waHref)}" target="_blank" rel="noopener">${esc(p.ctaText || 'Klaim Promo via WhatsApp')}</a>
          <button type="button" class="xp-promo-dismiss" id="xpPromoLater">Nanti saja, lanjut jelajahi website</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Inject Floating Re-open Trigger Pill
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'xp-promo-trigger';
  trigger.id = 'xpPromoTrigger';
  trigger.setAttribute('aria-label', 'Buka promo spesial X-Project');
  trigger.innerHTML = `<span class="xp-promo-trigger-dot" aria-hidden="true"></span><span>🎁 Promo Spesial</span>`;
  document.body.appendChild(trigger);

  const SEEN_KEY = 'xp_promo_seen';
  const markSeen = () => {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
  };
  const alreadySeen = () => {
    try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
  };

  const openPromo = (source = 'auto') => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    markSeen();
    pushTag('promo_popup_view', { trigger_source: source });
  };

  const closePromo = () => {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    markSeen();
  };

  modal.querySelector('#xpPromoBackdrop')?.addEventListener('click', closePromo);
  modal.querySelector('#xpPromoClose')?.addEventListener('click', closePromo);
  modal.querySelector('#xpPromoLater')?.addEventListener('click', closePromo);
  modal.querySelector('#xpPromoCta')?.addEventListener('click', () => {
    pushTag('promo_popup_click');
    closePromo();
  });
  trigger.addEventListener('click', () => openPromo('button'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closePromo();
    }
  });

  // First-time visitor auto-show
  if (!alreadySeen()) {
    const delaySec = Math.max(0.5, Math.min(15, parseFloat(p.delaySeconds) || 1.8));
    setTimeout(() => {
      if (!alreadySeen() && !document.body.classList.contains('nav-open')) {
        openPromo('auto');
      }
    }, delaySec * 1000);
  }
})();
