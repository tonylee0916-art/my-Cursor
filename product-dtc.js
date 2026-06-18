/* product-dtc.js — DTC 商品頁共用腳本 */
(function () {
  const nav = document.getElementById('nav');
  if (nav && !nav.classList.contains('solid')) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
  }

  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('up'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

  const buybox = document.getElementById('pdpBuybox');
  const sticky = document.getElementById('pdpStickyCta');
  if (buybox && sticky) {
    new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0 }).observe(buybox);
  }

  window.dataLayer = window.dataLayer || [];
  document.querySelectorAll('[data-track-cta]').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.trackCta;
      const label = el.textContent.trim().replace(/\s+/g, ' ');
      const page = document.body.dataset.pdpPage || 'product';
      window.dataLayer.push({ event: 'cta_click', cta_name: name, cta_label: label, page });
      if (typeof gtag === 'function') gtag('event', 'cta_click', { cta_name: name, cta_label: label });
    });
  });

  const backTop = document.getElementById('backTop');
  if (backTop) {
    window.addEventListener('scroll', () => {
      const show = window.scrollY > 300;
      backTop.style.opacity = show ? '1' : '0';
      backTop.style.visibility = show ? 'visible' : 'hidden';
      backTop.style.transform = show ? 'translateY(0)' : 'translateY(12px)';
    }, { passive: true });
  }
})();

function toggleMenu() { document.getElementById('mobMenu').classList.toggle('open'); }

function switchImg(el, src) {
  document.getElementById('mainImg').src = src;
  document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function switchTab(btn, id) {
  const wrap = btn.closest('.pdp-spec-tabs') || document;
  wrap.querySelectorAll('.pdp-tab-btn').forEach(b => b.classList.remove('act'));
  wrap.querySelectorAll('.pdp-tab-pane').forEach(p => p.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById(id).classList.add('act');
}

function toggleFaq(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.pdp-faq-item').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.pdp-faq-q').setAttribute('aria-expanded', 'false');
    i.querySelector('.pdp-faq-a').style.maxHeight = '0';
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    const answer = item.querySelector('.pdp-faq-a');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

function renderStars(count, max) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += `<svg viewBox="0 0 16 16" style="${i > count ? 'opacity:.3' : ''}"><path d="M8 1.5l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 5.8l4-.6L8 1.5z"/></svg>`;
  }
  return html;
}
