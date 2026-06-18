/**
 * YAODER Analytics — 耀德植研生醫全站統一事件追蹤
 * Phase 2 · AI Wellness Funnel
 *
 * 支援：GA4 gtag | dataLayer (GTM) | 本地 Debug Console
 *
 * 追蹤分類：
 *   1. Page View (增強型)
 *   2. CTA 點擊追蹤
 *   3. Quiz / AI 分析 Funnel
 *   4. 產品互動 (PDP 頁)
 *   5. Bundle / Add All to Cart
 *   6. 訂閱意圖
 *   7. Email 捕獲
 *   8. 分享行為
 *   9. Scroll Depth
 *  10. 內容互動 (FAQ / Tab)
 */

(function () {
  'use strict';

  /* ── 工具 ── */
  const push = (event, params) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (typeof gtag === 'function') {
      gtag('event', event, params);
    }
    if (window.YAO_DEBUG) {
      console.groupCollapsed(`%c[YAO Analytics] ${event}`, 'color:#00C9A0;font-weight:700');
      console.table(params);
      console.groupEnd();
    }
  };

  const getPageType = () => {
    const p = location.pathname;
    if (p.includes('quiz'))        return 'quiz';
    if (p.includes('wellness'))    return 'wellness';
    if (p.includes('member'))      return 'member';
    if (p.includes('product-'))    return 'pdp';
    if (p.includes('health-hub'))  return 'content_hub';
    if (p.includes('shop'))        return 'shop';
    if (p === '/' || p.includes('index')) return 'home';
    return 'other';
  };

  const pageType = getPageType();
  const productId = document.body.dataset.pdpPage || null;

  /* ── 1. Page View 增強型 ── */
  push('page_view_enhanced', {
    page_type: pageType,
    product_id: productId,
    referrer: document.referrer || 'direct',
    utm_source: new URLSearchParams(location.search).get('utm_source') || '',
    utm_medium: new URLSearchParams(location.search).get('utm_medium') || '',
    utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
  });

  /* ── 2. CTA 點擊追蹤（全站 data-track-cta） ── */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track-cta]');
    if (!el) return;
    push('cta_click', {
      cta_id: el.dataset.trackCta,
      cta_text: el.textContent.trim().slice(0, 80),
      page_type: pageType,
      product_id: productId,
      destination: el.href || null,
    });
  });

  /* ── 3. Quiz Funnel 追蹤 ── */
  if (pageType === 'quiz') {
    // Quiz step transitions (caught by quiz.html inline, mirrored here for GTM)
    window.addEventListener('quiz_step_event', e => {
      push('quiz_step', { step: e.detail.step, question: e.detail.question });
    });

    // Quiz completion (enhanced)
    window.addEventListener('quiz_complete_event', e => {
      push('quiz_complete', {
        profile: e.detail.profile,
        solution: e.detail.solution,
        quiz_duration_s: Math.round((Date.now() - window._quizStartTime) / 1000),
      });
      // GA4 purchase funnel: treat quiz complete as lead
      push('generate_lead', { source: 'quiz', value: 1, currency: 'TWD' });
    });

    window._quizStartTime = Date.now();
    push('quiz_start', { source: document.referrer || 'direct' });
  }

  /* ── 4. PDP 互動 ── */
  if (pageType === 'pdp') {
    // Gallery image switch
    document.addEventListener('click', e => {
      if (e.target.closest('.pdp-thumb')) {
        push('pdp_image_view', { product_id: productId, action: 'thumb_click' });
      }
    });

    // Tab switch
    document.addEventListener('click', e => {
      const tab = e.target.closest('[onclick*="switchTab"]');
      if (tab) push('pdp_tab_view', { product_id: productId, tab: tab.textContent.trim().slice(0,30) });
    });

    // FAQ expand
    document.addEventListener('click', e => {
      const faq = e.target.closest('[onclick*="toggleFaq"]');
      if (faq) push('faq_expand', { product_id: productId, question: faq.textContent.trim().slice(0,80) });
    });

    // Sticky CTA visibility
    const sticky = document.getElementById('pdpStickyCta');
    if (sticky) {
      const stickyObs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          push('pdp_sticky_visible', { product_id: productId });
          stickyObs.disconnect();
        }
      });
      stickyObs.observe(sticky);
    }

    // View item (GA4 standard)
    push('view_item', {
      currency: 'TWD',
      items: [{ item_id: productId, item_name: document.title.split(' — ')[0] }],
    });
  }

  /* ── 5. Bundle / Add All to Cart ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-track-cta^="bundle_add_all"]');
    if (!btn) return;
    const plan = btn.dataset.trackCta.replace('bundle_add_all_', '');
    push('add_to_cart', {
      currency: 'TWD',
      source: 'bundle',
      plan,
      items: [{ item_id: `bundle_${plan}`, item_name: `Bundle ${plan}`, quantity: 1 }],
    });
  });

  /* ── 6. 訂閱意圖 ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-track-cta^="bundle_monthly"], [href*="member.html"]');
    if (!btn) return;
    push('subscribe_intent', {
      source: pageType,
      plan: btn.dataset.trackCta?.replace('bundle_monthly_', '') || 'general',
    });
  });

  /* ── 7. Email 捕獲 ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-email-submit');
    if (!btn) return;
    const input = document.getElementById('emailInput');
    if (input && input.value.includes('@')) {
      push('email_capture', {
        source: pageType,
        email_domain: input.value.split('@')[1],
      });
    }
  });

  /* ── 8. 分享行為 ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.share-btn');
    if (!btn) return;
    const platform = btn.textContent.includes('LINE') ? 'line' :
                     btn.textContent.includes('複製') ? 'copy_link' : 'other';
    push('share', { method: platform, content_type: pageType, content_id: productId || 'quiz' });
  });

  /* ── 9. Scroll Depth ── */
  const scrollMilestones = [25, 50, 75, 90];
  let firedMilestones = new Set();
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const pct = Math.round((window.scrollY / total) * 100);
    scrollMilestones.forEach(m => {
      if (pct >= m && !firedMilestones.has(m)) {
        firedMilestones.add(m);
        push('scroll_depth', { depth: m, page_type: pageType });
      }
    });
  }, { passive: true });

  /* ── 10. FAQ 全站 ── */
  document.addEventListener('click', e => {
    const faqQ = e.target.closest('.faq-q, .wl-faq-q, .pdp-faq-q');
    if (!faqQ) return;
    const question = faqQ.textContent.trim().slice(0, 100);
    push('faq_interaction', { question, page_type: pageType });
  });

  /* ── 11. 搜尋意圖（未來擴展） ── */
  // Reserved for site search integration

  /* ── Debug mode ── */
  if (location.search.includes('yao_debug=1')) {
    window.YAO_DEBUG = true;
    console.log('%c[YAO Analytics] Debug mode ON', 'color:#FFCA28;font-weight:700;font-size:14px');
    console.log('Page Type:', pageType, '| Product ID:', productId);
  }

  /* ── Expose API for inline scripts ── */
  window.YAO = window.YAO || {};
  window.YAO.track = push;
  window.YAO.pageType = pageType;

})();
