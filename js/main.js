/* ── ANALYTICS / GOALS ── */
const METRIKA_ID = 108694990;

function trackGoal(goal, params = {}) {
  try {
    if (typeof ym === 'function') ym(METRIKA_ID, 'reachGoal', goal, params);
  } catch (e) {}
}

function getTrackingData() {
  const params = new URLSearchParams(window.location.search);
  const data = {
    page: window.location.href,
    referrer: document.referrer || '',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
    yclid: params.get('yclid') || '',
  };

  try {
    const hasUtm = Object.values(data).some(Boolean);
    if (hasUtm) sessionStorage.setItem('protendery_tracking', JSON.stringify(data));
    const saved = JSON.parse(sessionStorage.getItem('protendery_tracking') || '{}');
    return { ...saved, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v)) };
  } catch (e) {
    return data;
  }
}

/* ── TELEGRAM via /api/send (Vercel serverless) ── */
async function sendToTelegram(fields) {
  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fields, tracking: getTrackingData() }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('HTTP error', res.status, text);
      return false;
    }

    const data = await res.json();
    if (!data.ok) {
      console.error('API error:', data);
      return false;
    }
    return true;

  } catch (e) {
    console.error('Network error:', e);
    return false;
  }
}
/* ── POPUP ── */
function openPopup(interest) {
  trackGoal('open_popup', interest ? { interest } : {});
  const sel = document.getElementById('popup-interest');
  if (interest && sel) {
    for (let o of sel.options) {
      if (o.value === interest || o.text.toLowerCase().includes(interest.toLowerCase())) {
        sel.value = o.value; break;
      }
    }
  }
  document.getElementById('popup-form-wrap').style.display = '';
  document.getElementById('popup-success').style.display = 'none';
  const ov = document.getElementById('contact-popup');
  ov.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('open')));
}
function closePopup() {
  const ov = document.getElementById('contact-popup');
  ov.classList.remove('open');
  setTimeout(() => ov.style.display = 'none', 280);
}
/* ── ПЕРЕКЛЮЧАТЕЛЬ СПОСОБА СВЯЗИ ── */
const placeholders = { phone: '+7 (___) ___-__-__', tg: '@username', max: 'Номер MAX или @username' };
function switchTab(form, mode, btn) {
  const input = document.getElementById(form + '-contact');
  const tabs  = document.getElementById(form + '-tabs');
  if (!input || !tabs) return;

  input.placeholder = placeholders[mode] || placeholders.phone;
  input.dataset.mode = mode;
  input.value = '';
  input.focus();

  tabs.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

/* ── АНТИСПАМ ── */
const FORM_LOAD_TIME = Date.now();
function isSpam(hpId) {
  if (document.getElementById(hpId)?.value) return true;
  if (Date.now() - FORM_LOAD_TIME < 1000) return true;
  return false;
}

/* ── POPUP ── */
async function submitPopup() {
  if (isSpam('popup-hp')) { closePopup(); return; }
  const name     = document.getElementById('popup-name').value.trim();
  const contact  = document.getElementById('popup-contact').value.trim();
  const mode     = document.getElementById('popup-contact').dataset.mode || 'phone';
  const interest = document.getElementById('popup-interest').value;
  const btn      = document.getElementById('popup-submit-btn');
  if (!name || !contact) { alert('Пожалуйста, заполните имя и контакт'); return; }
  btn.textContent = 'Отправляю…'; btn.disabled = true;
  const ok = await sendToTelegram({ name, contact, mode, interest });
  if (ok) {
    document.getElementById('popup-form-wrap').style.display = 'none';
    document.getElementById('popup-success').style.display   = 'block';
    trackGoal('submit_popup_form', { interest, mode });
  } else {
    btn.textContent = 'Ошибка — попробуйте ещё раз';
    btn.style.background = '#c0392b';
    btn.disabled = false;
  }
}

async function submitHeroForm(btn) {
  if (isSpam('hero-hp')) return;
  const name     = document.getElementById('hero-name').value.trim();
  const contact  = document.getElementById('hero-contact').value.trim();
  const mode     = document.getElementById('hero-contact').dataset.mode || 'phone';
  const interest = document.getElementById('hero-interest').value;
  if (!name || !contact) { alert('Пожалуйста, заполните имя и контакт'); return; }
  btn.textContent = 'Отправляю…'; btn.disabled = true;
  const ok = await sendToTelegram({ name, contact, mode, interest });
  if (ok) {
    btn.textContent = 'Заявка отправлена ✓';
    btn.style.background = '#1A7A4A';
    trackGoal('submit_hero_form', { interest, mode });
  } else {
    btn.textContent = 'Ошибка — попробуйте ещё раз';
    btn.style.background = '#c0392b';
    btn.disabled = false;
  }
}

/* ── DOCUMENT SLIDER ── */
const docPhotos = [
  { src: 'docs/cert1.jpg', caption: 'Сертификат / документ 1' },
  { src: 'docs/cert2.jpg', caption: 'Сертификат / документ 2' },
  { src: 'docs/cert3.jpg', caption: 'Сертификат / документ 3' },
  { src: 'docs/doc4.jpg', caption: 'Подтверждающий документ 4' },
  { src: 'docs/doc5.jpg', caption: 'Подтверждающий документ 5' },
  { src: 'docs/doc6.jpg', caption: 'Подтверждающий документ 6' },
  { src: 'docs/doc7.jpg', caption: 'Подтверждающий документ 7' },
  { src: 'docs/doc8.jpg', caption: 'Подтверждающий документ 8' },
  { src: 'docs/doc9.jpg', caption: 'Подтверждающий документ 9' },
  { src: 'docs/doc10.jpg', caption: 'Подтверждающий документ 10' },
  { src: 'docs/doc11.jpg', caption: 'Подтверждающий документ 11' },
  { src: 'docs/doc12.jpg', caption: 'Подтверждающий документ 12' },
  { src: 'docs/doc13.jpg', caption: 'Подтверждающий документ 13' },
];

let sliderIdx = 0;
let lbIdx = 0;

function getVisible() {
  const w = window.innerWidth;
  if (w <= 400) return 1;
  if (w <= 600) return 2;
  if (w <= 900) return 3;
  return 4;
}
function getMaxIdx() { return Math.max(0, docPhotos.length - getVisible()); }

function sliderGo(idx) {
  sliderIdx = Math.max(0, Math.min(idx, getMaxIdx()));
  const track = document.getElementById('docs-track');
  const gap = 16;
  const slideW = track.parentElement.offsetWidth;
  const vis = getVisible();
  const w = (slideW - gap * (vis - 1)) / vis;
  track.style.transform = `translateX(${-sliderIdx * (w + gap)}px)`;
  document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === sliderIdx));
  document.querySelector('.slider-arrow.prev').classList.toggle('disabled', sliderIdx === 0);
  document.querySelector('.slider-arrow.next').classList.toggle('disabled', sliderIdx >= getMaxIdx());
}

function buildSlider() {
  const track = document.getElementById('docs-track');
  const dotsEl = document.getElementById('slider-dots');
  track.innerHTML = '';
  dotsEl.innerHTML = '';
  docPhotos.forEach((p, i) => {
    const caption = p.caption || `Документ ${i + 1}`;
    const slide = document.createElement('div');
    slide.className = 'doc-slide';
    slide.innerHTML = `
      <div class="doc-thumb" onclick="openLightbox(${i})">
        <img src="${p.src}" alt="${caption}" loading="lazy">
        <div class="doc-thumb-overlay">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/></svg>
        </div>
        <div class="doc-caption">${caption}</div>
      </div>`;
    track.appendChild(slide);
    const dot = document.createElement('div');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => sliderGo(i);
    dotsEl.appendChild(dot);
  });

  // Touch / mouse drag
  let startX = 0, startIdx = 0, isDragging = false, moved = false;
  track.addEventListener('mousedown', e => {
    isDragging = true; moved = false; startX = e.clientX; startIdx = sliderIdx;
    track.classList.add('dragging');
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 5) moved = true;
  });
  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');
    if (moved) {
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 50) sliderGo(startIdx + (diff > 0 ? 1 : -1));
    }
  });
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startIdx = sliderIdx; moved = false; }, {passive:true});
  track.addEventListener('touchmove', e => {
    const diff = Math.abs(e.touches[0].clientX - startX);
    if (diff > 5) moved = true;
  }, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (moved && Math.abs(diff) > 40) sliderGo(startIdx + (diff > 0 ? 1 : -1));
  });

  sliderGo(0);
  window.addEventListener('resize', () => sliderGo(Math.min(sliderIdx, getMaxIdx())));
}

/* ── LIGHTBOX ── */
function openLightbox(idx) {
  trackGoal('click_docs', { index: idx + 1 });
  lbIdx = idx;
  updateLb();
  const lb = document.getElementById('lightbox');
  lb.style.display = 'flex';
  requestAnimationFrame(() => lb.classList.add('open'));
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  setTimeout(() => lb.style.display = 'none', 200);
}
function lbNav(dir) { lbIdx = (lbIdx + dir + docPhotos.length) % docPhotos.length; updateLb(); }
function updateLb() {
  const p = docPhotos[lbIdx];
  document.getElementById('lb-img').src = p.src;
  document.getElementById('lb-caption').textContent = p.caption || `Документ ${lbIdx + 1}`;
  document.getElementById('lb-counter').textContent = `${lbIdx + 1} / ${docPhotos.length}`;
}

document.addEventListener('keydown', e => {
  const popup = document.getElementById('contact-popup');
  if (e.key === 'Escape' && popup && popup.classList.contains('open')) closePopup();
  if (document.getElementById('lightbox').classList.contains('open')) {
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'Escape')     closeLightbox();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  buildSlider();

  document.querySelectorAll('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => trackGoal('click_phone')));
  document.querySelectorAll('a[href*="t.me"]').forEach(a => a.addEventListener('click', () => trackGoal('click_telegram')));
});
/* delayed mobile sticky CTA */
function initDelayedStickyCta() {
  const sticky = document.querySelector('.mobile-sticky-cta');
  if (!sticky) return;

  const showAfterPx = 520;

  function updateStickyCta() {
    const isMobile = window.innerWidth <= 600;
    const shouldShow = isMobile && window.scrollY > showAfterPx;
    sticky.classList.toggle('is-visible', shouldShow);
  }

  updateStickyCta();
  window.addEventListener('scroll', updateStickyCta, { passive: true });
  window.addEventListener('resize', updateStickyCta);
}

document.addEventListener('DOMContentLoaded', initDelayedStickyCta);
