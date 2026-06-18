/* mobile-ux.js — 全站手機版互動 */
(function () {
  const mq = window.matchMedia('(max-width: 768px)');

  function initHomeSticky() {
    const bar = document.getElementById('mobStickyCta');
    const hero = document.getElementById('hero');
    if (!bar || !hero) return;

    const io = new IntersectionObserver(([entry]) => {
      if (!mq.matches) {
        bar.classList.remove('visible');
        document.body.classList.remove('has-mob-sticky');
        return;
      }
      const show = !entry.isIntersecting;
      bar.classList.toggle('visible', show);
      document.body.classList.toggle('has-mob-sticky', show);
    }, { threshold: 0, rootMargin: '0px' });

    io.observe(hero);
    mq.addEventListener('change', () => {
      if (!mq.matches) {
        bar.classList.remove('visible');
        document.body.classList.remove('has-mob-sticky');
      }
    });
  }

  function initPdpStickyClass() {
    const sticky = document.getElementById('pdpStickyCta');
    if (!sticky) return;
    new MutationObserver(() => {
      document.body.classList.toggle('has-pdp-sticky', sticky.classList.contains('visible'));
    }).observe(sticky, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('#mobStickyCta [data-track-cta]').forEach(el => {
    el.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cta_click',
        cta_name: el.dataset.trackCta,
        cta_label: el.textContent.trim(),
        page: 'homepage_mobile_sticky'
      });
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHomeSticky();
      initPdpStickyClass();
    });
  } else {
    initHomeSticky();
    initPdpStickyClass();
  }
})();
