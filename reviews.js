/* reviews.js — 評價系統渲染與互動 */
(function () {
  const STAR = '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 5.8l4-.6L8 1.5z"/></svg>';
  const CHECK = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8l4 4L14 4"/></svg>';

  function stars(rating, max) {
    let html = '';
    for (let i = 1; i <= max; i++) {
      html += STAR.replace('<svg', `<svg style="${i > rating ? 'opacity:.3' : ''}"`);
    }
    return `<span class="pdp-stars" aria-label="${rating} 星">${html}</span>`;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
    if (typeof gtag === 'function') gtag('event', event, data);
  }

  function renderBars(dist) {
    return [5, 4, 3, 2, 1].map(n =>
      `<div class="pdp-bar-row"><span>${n}★</span><div class="pdp-bar-track"><div class="pdp-bar-fill" style="width:${dist[n] || 0}%"></div></div><span>${dist[n] || 0}%</span></div>`
    ).join('');
  }

  function renderReviewCard(r, opts) {
    const product = opts.product;
    const showProduct = opts.showProduct && product;
    const ba = r.before && r.after
      ? `<div class="rv-ba-inline"><span class="rv-ba-before">Before：${esc(r.before)}</span><span class="rv-ba-arrow">→</span><span class="rv-ba-after">After：${esc(r.after)}</span></div>`
      : '';
    const tags = (r.tags || []).map(t => `<span class="rv-tag">${esc(t)}</span>`).join('');
    const helpfulKey = `rv-helpful-${r.id}`;
    const voted = localStorage.getItem(helpfulKey);

    const delay = (opts.index != null) ? opts.index * 100 : 0;
    return `<article class="pdp-review-card" data-rating="${r.rating}" data-date="${r.date}" data-id="${r.id}" data-aos="fade-up" data-aos-delay="${delay}">
      <div class="pdp-review-header">
        <div class="pdp-review-avatar">${esc(r.name.charAt(0))}</div>
        <div class="pdp-review-meta">
          <strong>${esc(r.name)}</strong>
          <span>${esc(r.role)} · ${esc(r.date)}${showProduct ? ` · ${esc(product.name)}` : ''}</span>
        </div>
      </div>
      ${stars(r.rating, 5).replace('pdp-stars', 'pdp-stars rv-card-stars')}
      ${tags ? `<div class="rv-tags">${tags}</div>` : ''}
      <p class="pdp-review-text">${esc(r.text)}</p>
      ${ba}
      <div class="rv-card-footer">
        ${r.verified ? `<span class="pdp-review-verified">${CHECK}已驗證購買</span>` : ''}
        <button type="button" class="rv-helpful-btn${voted ? ' voted' : ''}" data-id="${r.id}" data-key="${helpfulKey}" aria-label="覺得有幫助">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5z"/></svg>
          有幫助 (<span class="rv-helpful-count">${r.helpful + (voted ? 1 : 0)}</span>)
        </button>
      </div>
    </article>`;
  }

  function initProduct(root) {
    const id = root.dataset.productId;
    const data = window.YAODER_REVIEWS[id];
    if (!data) return;

    let filter = 0;
    let sort = 'newest';
    let visible = 4;

    function getFiltered() {
      let list = [...data.reviews];
      if (filter > 0) list = list.filter(r => r.rating === filter);
      if (sort === 'newest') list.sort((a, b) => b.date.localeCompare(a.date));
      else if (sort === 'helpful') list.sort((a, b) => b.helpful - a.helpful);
      else if (sort === 'highest') list.sort((a, b) => b.rating - a.rating);
      return list;
    }

    function render() {
      const list = getFiltered();
      const shown = list.slice(0, visible);
      root.innerHTML = `
        <div class="pdp-reviews-summary reveal up">
          <div class="pdp-reviews-score">
            <div class="big">${data.rating}</div>
            ${stars(Math.round(data.rating), 5)}
            <span style="font-size:13px;color:var(--muted)">${data.count} 則評價 · ${window.YAODER_REVIEWS.brand.verifiedRate}% 已驗證</span>
          </div>
          <div class="pdp-reviews-bars">${renderBars(data.distribution)}</div>
        </div>
        <div class="rv-toolbar reveal up">
          <div class="rv-filters" role="group" aria-label="星等篩選">
            ${[0, 5, 4, 3].map(n => `<button type="button" class="rv-filter-btn${filter === n ? ' act' : ''}" data-filter="${n}">${n === 0 ? '全部' : n + '★'}</button>`).join('')}
          </div>
          <select class="rv-sort" aria-label="排序方式">
            <option value="newest"${sort === 'newest' ? ' selected' : ''}>最新評價</option>
            <option value="helpful"${sort === 'helpful' ? ' selected' : ''}>最有幫助</option>
            <option value="highest"${sort === 'highest' ? ' selected' : ''}>評分最高</option>
          </select>
        </div>
        <div class="pdp-reviews-list rv-list">${shown.map((r, i) => renderReviewCard(r, { product: data, index: i })).join('')}</div>
        ${visible < list.length ? `<div class="rv-load-wrap"><button type="button" class="rv-load-more">載入更多評價（${list.length - visible} 則）</button></div>` : ''}
        <p class="rv-disclaimer">※ 以上為消費者個人使用心得，效果因人而異，不代表產品功效之保證。</p>
      `;

      setTimeout(() => { if (window.AOS) AOS.refresh(); }, 50);

      root.querySelectorAll('.rv-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filter = parseInt(btn.dataset.filter, 10);
          visible = 4;
          render();
          track('review_filter', { filter, product: id });
        });
      });

      const sortEl = root.querySelector('.rv-sort');
      if (sortEl) sortEl.addEventListener('change', e => {
        sort = e.target.value;
        visible = 4;
        render();
        track('review_sort', { sort, product: id });
      });

      const loadBtn = root.querySelector('.rv-load-more');
      if (loadBtn) loadBtn.addEventListener('click', () => {
        visible += 4;
        render();
        track('review_load_more', { product: id });
      });

      root.querySelectorAll('.rv-helpful-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('voted')) return;
          btn.classList.add('voted');
          localStorage.setItem(btn.dataset.key, '1');
          const cnt = btn.querySelector('.rv-helpful-count');
          cnt.textContent = parseInt(cnt.textContent, 10) + 1;
          track('review_helpful', { review_id: btn.dataset.id, product: id });
        });
      });
    }

    render();
  }

  function initHome(root) {
    const brand = window.YAODER_REVIEWS.brand;
    const featured = window.YAODER_REVIEWS.featured;

    root.innerHTML = `
      <div class="rv-home-grid">
        ${featured.map((r, i) => {
          const p = window.YAODER_REVIEWS[r.productId];
          return renderReviewCard(r, { product: p, showProduct: true, index: i });
        }).join('')}
      </div>
      <div class="rv-home-cta" data-aos="fade-up" data-aos-delay="400">
        <a href="product-bigbull.html#pdp-reviews" class="btn-gold btn-sm" data-track-cta="home_reviews_cta">查看所有評價</a>
      </div>
    `;

    setTimeout(() => { if (window.AOS) AOS.refresh(); }, 50);

    root.querySelectorAll('.rv-helpful-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('voted')) return;
        btn.classList.add('voted');
        localStorage.setItem(btn.dataset.key, '1');
        btn.querySelector('.rv-helpful-count').textContent = parseInt(btn.querySelector('.rv-helpful-count').textContent, 10) + 1;
      });
    });
  }

  function init() {
    document.querySelectorAll('.rv-root[data-product-id]').forEach(initProduct);
    const home = document.getElementById('rvHomeRoot');
    if (home) initHome(home);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
