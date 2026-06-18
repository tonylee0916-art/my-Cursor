/**
 * immersive-engine.js
 * 耀德植研生醫 · Phase 3 · Immersive 3D Engine
 * Three.js WebGL · 粒子系統 · 產品 3D 展示 · 成分互動
 */

/* ═══════════════════════════════════════════
   1. PARTICLE FIELD ENGINE
═══════════════════════════════════════════ */
class ParticleField {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.opts    = {
      count:      options.count     || 120,
      color:      options.color     || '#00E5CC',
      colorAlt:   options.colorAlt  || '#FFD54F',
      maxSize:    options.maxSize   || 2.5,
      speed:      options.speed     || 0.4,
      connected:  options.connected !== false,
      linkDist:   options.linkDist  || 140,
      mouseEffect: options.mouseEffect !== false,
    };
    this.particles = [];
    this.mouse     = { x: null, y: null };
    this.raf       = null;
    this._resize   = this._resize.bind(this);
    this._onMouse  = this._onMouse.bind(this);
    this._init();
  }

  _init() {
    this._resize();
    window.addEventListener('resize', this._resize);
    this.canvas.addEventListener('mousemove', this._onMouse);
    for (let i = 0; i < this.opts.count; i++) {
      this.particles.push(this._mkParticle());
    }
    this._loop();
  }

  _resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = r.width;
    this.canvas.height = r.height;
    this.W = r.width;
    this.H = r.height;
  }

  _onMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - r.left;
    this.mouse.y = e.clientY - r.top;
  }

  _mkParticle(x, y) {
    return {
      x:     x  !== undefined ? x  : Math.random() * this.W,
      y:     y  !== undefined ? y  : Math.random() * this.H,
      vx:    (Math.random() - .5) * this.opts.speed,
      vy:    (Math.random() - .5) * this.opts.speed,
      r:     Math.random() * this.opts.maxSize + .5,
      a:     Math.random() * .6 + .2,
      gold:  Math.random() < .15,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  _loop() {
    this.raf = requestAnimationFrame(() => this._loop());
    const { ctx, W, H, opts, particles, mouse } = this;
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.pulse += .02;
      p.a = (.3 + Math.sin(p.pulse) * .2);
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      if (opts.mouseEffect && mouse.x !== null) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          p.vx -= dx / dist * .04;
          p.vy -= dy / dist * .04;
          const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
          if (spd > opts.speed * 3) { p.vx /= spd / opts.speed * 3; p.vy /= spd / opts.speed * 3; }
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(255,213,79,${p.a})`
        : `rgba(0,229,204,${p.a})`;
      ctx.fill();
    }

    if (opts.connected) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < opts.linkDist) {
            const alpha = (1 - dist / opts.linkDist) * .25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,229,204,${alpha})`;
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._resize);
  }
}

/* ═══════════════════════════════════════════
   2. PRODUCT 3D VIEWER (Three.js)
═══════════════════════════════════════════ */
class Product3DViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this._ready = false;
    this._loadThree();
  }

  _loadThree() {
    if (typeof THREE !== 'undefined') {
      this._init();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => this._init();
    document.head.appendChild(s);
  }

  _init() {
    const c = this.canvas;
    const W = c.offsetWidth, H = c.offsetHeight;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    /* Scene & Camera */
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, W / H, .1, 100);
    this.camera.position.set(0, 0, 4);

    /* Lights */
    const amb = new THREE.AmbientLight(0x00E5CC, .4);
    this.scene.add(amb);

    const key = new THREE.PointLight(0x00E5CC, 2, 20);
    key.position.set(3, 3, 3);
    this.scene.add(key);

    const fill = new THREE.PointLight(0xFFD54F, 1, 20);
    fill.position.set(-3, -1, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, .8);
    rim.position.set(0, 5, -5);
    this.scene.add(rim);

    /* Product Mesh — stylised supplement bottle */
    this._buildBottle();

    /* Floating molecules */
    this._buildMolecules();

    /* Orbit interaction */
    this._drag = false;
    this._prev = { x: 0, y: 0 };
    this._rotTarget = { x: 0, y: 0 };
    this._rot       = { x: 0, y: 0 };
    this._addInteraction();

    /* Resize */
    window.addEventListener('resize', () => {
      const nW = c.offsetWidth, nH = c.offsetHeight;
      this.camera.aspect = nW / nH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nW, nH);
    });

    this._ready = true;
    this._animate();
  }

  _buildBottle() {
    const group = new THREE.Group();

    /* Body */
    const bodyGeo = new THREE.CylinderGeometry(.55, .55, 1.8, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00897B, metalness: .3, roughness: .5,
      transparent: true, opacity: .9,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    /* Cap */
    const capGeo = new THREE.CylinderGeometry(.58, .55, .25, 32);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x004D40, metalness: .5, roughness: .3,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.025;
    group.add(cap);

    /* Label ring (emissive glow) */
    const labelGeo = new THREE.CylinderGeometry(.56, .56, .8, 32, 1, true);
    const labelMat = new THREE.MeshStandardMaterial({
      color: 0x00E5CC, emissive: 0x00E5CC,
      emissiveIntensity: .15, transparent: true, opacity: .6,
      side: THREE.DoubleSide,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = .1;
    group.add(label);

    /* Gold stripe */
    const stripeGeo = new THREE.TorusGeometry(.56, .02, 8, 64);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xFFD54F, emissive: 0xFFD54F, emissiveIntensity: .3,
      metalness: .8, roughness: .2,
    });
    [-0.5, 0.5].forEach(y => {
      const t = new THREE.Mesh(stripeGeo, stripeMat);
      t.rotation.x = Math.PI / 2;
      t.position.y = y;
      group.add(t);
    });

    /* Base disc */
    const baseGeo = new THREE.CylinderGeometry(.55, .52, .06, 32);
    const base = new THREE.Mesh(baseGeo, capMat);
    base.position.y = -.93;
    group.add(base);

    this.bottleGroup = group;
    this.scene.add(group);
    this.label = label;
  }

  _buildMolecules() {
    this.molecules = new THREE.Group();
    const colors = [0x00E5CC, 0xFFD54F, 0x69F0AE, 0x7C4DFF];

    for (let i = 0; i < 18; i++) {
      const geo = new THREE.SphereGeometry(.04 + Math.random() * .06, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: .5,
        transparent: true, opacity: .7,
      });
      const m = new THREE.Mesh(geo, mat);
      const angle = (i / 18) * Math.PI * 2;
      const r = 1.2 + Math.random() * .6;
      m.position.set(
        Math.cos(angle) * r,
        (Math.random() - .5) * 2.5,
        Math.sin(angle) * r
      );
      m.userData = {
        angleOffset: angle,
        radius: r,
        speedY: (Math.random() - .5) * .003,
        speedOrbit: .005 + Math.random() * .008,
      };
      this.molecules.add(m);
    }
    this.scene.add(this.molecules);
  }

  _addInteraction() {
    const c = this.canvas;
    const onStart = (x, y) => { this._drag = true; this._prev = { x, y }; };
    const onMove  = (x, y) => {
      if (!this._drag) return;
      this._rotTarget.y += (x - this._prev.x) * .008;
      this._rotTarget.x += (y - this._prev.y) * .006;
      this._rotTarget.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, this._rotTarget.x));
      this._prev = { x, y };
    };
    const onEnd = () => { this._drag = false; };

    c.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    c.addEventListener('touchstart', e => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });
    c.addEventListener('touchmove', e => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    c.addEventListener('touchend', onEnd);
  }

  _animate() {
    if (!this._ready) return;
    requestAnimationFrame(() => this._animate());

    const t = Date.now() * .001;

    /* Smooth rotation */
    if (!this._drag) this._rotTarget.y += .004;
    this._rot.x += (this._rotTarget.x - this._rot.x) * .08;
    this._rot.y += (this._rotTarget.y - this._rot.y) * .08;

    if (this.bottleGroup) {
      this.bottleGroup.rotation.y = this._rot.y;
      this.bottleGroup.rotation.x = this._rot.x;
      this.bottleGroup.position.y = Math.sin(t * .8) * .06;
    }

    /* Molecule orbit */
    if (this.molecules) {
      this.molecules.children.forEach(m => {
        m.userData.angleOffset += m.userData.speedOrbit;
        m.position.x = Math.cos(m.userData.angleOffset) * m.userData.radius;
        m.position.z = Math.sin(m.userData.angleOffset) * m.userData.radius;
        m.position.y += m.userData.speedY;
        if (Math.abs(m.position.y) > 1.5) m.userData.speedY *= -1;
      });
      this.molecules.rotation.y = t * .12;
    }

    /* Label pulse */
    if (this.label) {
      this.label.material.emissiveIntensity = .1 + Math.sin(t * 2) * .08;
    }

    this.renderer.render(this.scene, this.camera);
  }

  explode() {
    if (!this.molecules) return;
    this.molecules.children.forEach(m => {
      m.userData.radius += 1.2;
    });
    setTimeout(() => {
      this.molecules.children.forEach(m => { m.userData.radius -= 1.2; });
    }, 800);
  }
}

/* ═══════════════════════════════════════════
   3. INGREDIENT MAP (SVG-based, no Three.js needed)
═══════════════════════════════════════════ */
class IngredientMap {
  constructor(containerId) {
    this.el = document.getElementById(containerId);
    if (!this.el) return;
    this.data  = this._getIngredients();
    this.active = null;
    this._render();
  }

  _getIngredients() {
    return [
      {
        id: 'antrodia', icon: '🍄', label: '牛樟芝子實體', x: 50, y: 50,
        color: '#00E5CC',
        title: '段木栽培牛樟芝子實體',
        desc: '台灣原生特有種，段木仿野生栽培，三萜類含量達野生等級，比液態菌絲體高 8–12 倍。',
        stats: [
          { val: '15%+', lbl: '三萜類含量' },
          { val: '20年', lbl: '深耕研究' },
        ],
        papers: 'SCI 收錄論文 47 篇',
      },
      {
        id: 'triterpenoid', icon: '⚗️', label: '三萜類化合物', x: 72, y: 30,
        color: '#7C4DFF',
        title: '三萜類化合物',
        desc: '牛樟芝最核心的活性物，具有調節免疫、護肝保肝、抗氧化等多重功效，研究最為充分。',
        stats: [
          { val: '47', lbl: 'SCI 論文' },
          { val: '70+', lbl: '已知化合物' },
        ],
        papers: '免疫調節機制驗證',
      },
      {
        id: 'maca', icon: '🌿', label: '馬卡萃取', x: 28, y: 72,
        color: '#FFD54F',
        title: '秘魯有機馬卡',
        desc: '源自安地斯山脈高原，富含馬卡醯胺與芐基葡萄糖苷，協同提升體能耐力與精力活化。',
        stats: [
          { val: '4:1', lbl: '濃縮萃取比' },
          { val: '有機', lbl: '秘魯認證' },
        ],
        papers: '體能活化協同效應',
      },
      {
        id: 'redshen', icon: '🌱', label: '韓國紅參', x: 72, y: 72,
        color: '#FF6D00',
        title: '6年根高麗紅參',
        desc: '韓國 KGC 認證 6 年根高麗紅參，人參皂苷 Rg1/Rb1 黃金比例，強化氣血循環。',
        stats: [
          { val: '6年', lbl: '參齡年份' },
          { val: 'KGC', lbl: '韓國認證' },
        ],
        papers: '氣血循環強化認證',
      },
      {
        id: 'taurine', icon: '⚡', label: '牛磺酸', x: 28, y: 30,
        color: '#69F0AE',
        title: '高純度牛磺酸',
        desc: '醫藥級純度牛磺酸，調節神經傳導、保護心臟細胞、促進膽汁代謝，加速代謝效率。',
        stats: [
          { val: '99%+', lbl: '純度等級' },
          { val: '醫藥級', lbl: '品質標準' },
        ],
        papers: '心臟保護機制研究',
      },
    ];
  }

  _render() {
    this.el.style.position = 'relative';
    this.el.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    this.el.appendChild(canvas);
    this._drawLines(canvas);

    this.data.forEach(ing => {
      const node = document.createElement('div');
      node.className = 'ingredient-node';
      node.style.cssText = `left:${ing.x}%;top:${ing.y}%;`;
      node.innerHTML = `
        <div class="node-ring" style="border-color:${ing.color};background:${ing.color}1a">
          <span class="node-icon">${ing.icon}</span>
        </div>
        <div class="node-label" style="color:${ing.color};border-color:${ing.color}33">${ing.label}</div>
      `;
      node.addEventListener('click', () => this._showTooltip(node, ing));
      this.el.appendChild(node);
    });

    this._tooltip = document.createElement('div');
    this._tooltip.className = 'tooltip-panel';
    this.el.appendChild(this._tooltip);

    document.addEventListener('click', e => {
      if (!e.target.closest('.ingredient-node')) {
        this._tooltip.classList.remove('show');
        this.active = null;
      }
    });
  }

  _drawLines(canvas) {
    const ro = new ResizeObserver(() => {
      const W = this.el.offsetWidth, H = this.el.offsetHeight;
      canvas.width  = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const cx = W * .5, cy = H * .5;
      this.data.forEach(ing => {
        const x = W * ing.x / 100, y = H * ing.y / 100;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = ing.color + '33';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,204,.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,204,.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ro.observe(this.el);
  }

  _showTooltip(node, ing) {
    this.active = ing.id;
    const tp = this._tooltip;
    tp.innerHTML = `
      <div class="corner-bracket tl"></div>
      <div class="corner-bracket br"></div>
      <div class="neon-label" style="color:${ing.color}">${ing.papers}</div>
      <h4 style="color:${ing.color};margin-top:6px">${ing.title}</h4>
      <p>${ing.desc}</p>
      ${ing.stats.map(s => `
        <div class="tp-stat">
          <div><div class="tp-stat-val" style="color:${ing.color}">${s.val}</div><div class="tp-stat-lbl">${s.lbl}</div></div>
        </div>
      `).join('')}
    `;
    const nr = node.getBoundingClientRect();
    const er = this.el.getBoundingClientRect();
    let left = nr.left - er.left + 24;
    let top  = nr.top  - er.top  - 20;
    if (left + 260 > this.el.offsetWidth) left = nr.left - er.left - 260;
    if (top < 0) top = nr.top - er.top + 60;
    tp.style.left = left + 'px';
    tp.style.top  = top  + 'px';
    tp.classList.add('show');
  }
}

/* ═══════════════════════════════════════════
   4. SCROLL ANIMATOR
═══════════════════════════════════════════ */
class ScrollAnimator {
  constructor() {
    this.io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            if (e.target.dataset.once !== 'false') this.io.unobserve(e.target);
          }
        });
      },
      { threshold: .12, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.imm-reveal, .timeline-item').forEach(el => this.io.observe(el));

    /* Arc progress bars */
    this._arcIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const fill = e.target.querySelector('.arc-fill');
          const pct  = parseFloat(e.target.dataset.pct || 75);
          if (fill) fill.style.strokeDashoffset = 283 * (1 - pct / 100);
          this._arcIO.unobserve(e.target);
        }
      });
    }, { threshold: .3 });
    document.querySelectorAll('.arc-progress').forEach(el => this._arcIO.observe(el));

    /* Metric bars */
    this._barIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const fill = e.target.querySelector('.mc-fill');
          if (fill) {
            const w = fill.dataset.w || '70%';
            setTimeout(() => { fill.style.width = w; }, 200);
          }
          this._barIO.unobserve(e.target);
        }
      });
    }, { threshold: .2 });
    document.querySelectorAll('.metric-card').forEach(el => this._barIO.observe(el));

    /* Count-up numbers */
    document.querySelectorAll('[data-countup]').forEach(el => {
      const cio = new IntersectionObserver(es => {
        if (es[0].isIntersecting) {
          this._countUp(el);
          cio.disconnect();
        }
      }, { threshold: .5 });
      cio.observe(el);
    });
  }

  _countUp(el) {
    const target = parseFloat(el.dataset.countup);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = parseFloat(el.dataset.duration || 2000);
    const start  = Date.now();
    const step = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const val = target * ease;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

/* ═══════════════════════════════════════════
   5. SPATIAL TILT (mouse parallax)
═══════════════════════════════════════════ */
class SpatialTilt {
  constructor(selector, maxTilt = 8) {
    this.els = document.querySelectorAll(selector);
    this.max = maxTilt;
    this._bind();
  }
  _bind() {
    this.els.forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - .5;
        const y = (e.clientY - r.top)  / r.height - .5;
        el.style.transform = `
          perspective(800px)
          rotateY(${x * this.max}deg)
          rotateX(${-y * this.max}deg)
          translateZ(10px)
        `;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
      });
    });
  }
}

/* ═══════════════════════════════════════════
   6. IMMERSIVE HERO BACKGROUND (Three.js)
═══════════════════════════════════════════ */
class ImmersiveHero {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this._loadThree();
  }

  _loadThree() {
    if (typeof THREE !== 'undefined') { this._init(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => this._init();
    document.head.appendChild(s);
  }

  _init() {
    const c = this.canvas;
    const W = window.innerWidth, H = window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x020D08, 1);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, W/H, .1, 1000);
    this.camera.position.z = 5;

    /* Fog */
    this.scene.fog = new THREE.FogExp2(0x020D08, .05);

    /* Floating DNA helix strands */
    this._buildHelix();

    /* Star particles */
    this._buildStars();

    /* Mouse parallax */
    this.mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth  - .5) * .4;
      this.mouse.y = (e.clientY / window.innerHeight - .5) * .3;
    });

    window.addEventListener('resize', () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      this.camera.aspect = nW / nH;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nW, nH);
    });

    this._animate();
  }

  _buildHelix() {
    this.helixGroup = new THREE.Group();
    const curve = [];
    for (let i = 0; i < 200; i++) {
      const t = (i / 200) * Math.PI * 8 - Math.PI * 4;
      curve.push(new THREE.Vector3(Math.cos(t) * 1.5, t * .6, Math.sin(t) * 1.5));
    }
    const strand1Geo = new THREE.BufferGeometry().setFromPoints(curve);
    const strand1Mat = new THREE.LineBasicMaterial({ color: 0x00E5CC, opacity: .5, transparent: true });
    this.helixGroup.add(new THREE.Line(strand1Geo, strand1Mat));

    const curve2 = curve.map(p => new THREE.Vector3(-p.x, p.y, -p.z));
    const strand2Geo = new THREE.BufferGeometry().setFromPoints(curve2);
    const strand2Mat = new THREE.LineBasicMaterial({ color: 0xFFD54F, opacity: .35, transparent: true });
    this.helixGroup.add(new THREE.Line(strand2Geo, strand2Mat));

    /* Rung spheres */
    for (let i = 0; i < 200; i += 12) {
      const p1 = curve[i], p2 = curve2[i];
      const midGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const midMat = new THREE.LineBasicMaterial({ color: 0x00897B, opacity: .3, transparent: true });
      this.helixGroup.add(new THREE.Line(midGeo, midMat));

      const sGeo = new THREE.SphereGeometry(.06, 6, 6);
      const sMat = new THREE.MeshBasicMaterial({ color: 0x00E5CC });
      const s1 = new THREE.Mesh(sGeo, sMat);
      s1.position.copy(p1);
      this.helixGroup.add(s1);
    }

    this.helixGroup.scale.set(.5, .2, .5);
    this.scene.add(this.helixGroup);
  }

  _buildStars() {
    const geo = new THREE.BufferGeometry();
    const N = 1200;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - .5) * 40;
      pos[i*3+1] = (Math.random() - .5) * 40;
      pos[i*3+2] = (Math.random() - .5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00E5CC, size: .04, transparent: true, opacity: .6 });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const t = Date.now() * .001;
    if (this.helixGroup) {
      this.helixGroup.rotation.y  = t * .12;
      this.helixGroup.position.y  = Math.sin(t * .3) * .3;
    }
    if (this.stars) {
      this.stars.rotation.y = t * .015;
      this.stars.rotation.x = t * .008;
    }
    this.camera.position.x += (this.mouse.x - this.camera.position.x) * .04;
    this.camera.position.y += (-this.mouse.y - this.camera.position.y) * .04;
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }
}

/* ═══════════════════════════════════════════
   7. AUTO-INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Scroll animator (always) */
  window._scrollAnimator = new ScrollAnimator();

  /* Spatial tilt */
  window._spatialTilt = new SpatialTilt('.holo-card, .product-card-3d', 6);

  /* Particle fields */
  document.querySelectorAll('[data-particle-field]').forEach(canvas => {
    const opts = {};
    const d = canvas.dataset;
    if (d.count)    opts.count    = +d.count;
    if (d.color)    opts.color    = d.color;
    if (d.linkDist) opts.linkDist = +d.linkDist;
    new ParticleField(canvas, opts);
  });

  /* Product 3D viewer */
  if (document.getElementById('product-3d-canvas')) {
    window._viewer3D = new Product3DViewer('product-3d-canvas');
  }

  /* Ingredient map */
  if (document.getElementById('ingredient-map')) {
    window._ingredientMap = new IngredientMap('ingredient-map');
  }

  /* Immersive hero */
  if (document.getElementById('hero-3d-canvas')) {
    window._heroScene = new ImmersiveHero('hero-3d-canvas');
  }
});

/* Export */
window.ImmersiveEngine = {
  ParticleField,
  Product3DViewer,
  IngredientMap,
  ScrollAnimator,
  SpatialTilt,
  ImmersiveHero,
};
