/* Pixel-block autumn leaf falling animation.
 * Attaches a crisp canvas inside the main site header (Starlight `header.header`)
 * only — not in post cards. Rains pixel-art leaves.
 * No dependencies. Respects prefers-reduced-motion. */
(() => {
  const SPRITES = [
    // diamond leaf 5x5
    ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'],
    // wide leaf 5x4
    ['.X.X.', 'XXXXX', '.XXX.', '..X..'],
    // small chunky leaf 3x4
    ['.X.', 'XXX', 'XXX', '.X.'],
    // maple-ish 7x5
    ['X..X..X', 'XXXXXXX', '.XXXXX.', '..XXX..', '..X.X..'],
  ];

  const COLORS = [
    '#fe8019', // gruvbox bright orange
    '#fabd2f', // yellow
    '#fb4934', // bright red
    '#d65d0e', // burnt orange
    '#cc241d', // dark red
    '#d79921', // autumn gold
    '#98971a', // fading green
  ];

  function attachTo(el, density) {
    if (el.dataset.pixelLeaves) return;
    el.dataset.pixelLeaves = '1';

    // On the home page (hero present / root path) let leaves fall past
    // the header and cut just below the "Posts" (h1) line.
    const isHome =
      document.querySelector('.hero-section') !== null ||
      window.location.pathname === '/' ||
      window.location.pathname.endsWith('/index.html');
    let spill = 0;

    function computeSpill() {
      if (!isHome) return 0;
      // Only measure near the top; once scrolled the sticky header
      // stays but the title moves, so keep the initial measurement.
      if (window.scrollY > 100) return spill;
      const title = document.querySelector('main h1');
      if (!title) return spill || 220; // fallback if title not found yet
      const headerRect = el.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      // Align canvas bottom just below the title line (+16px for the divider gap).
      const total = Math.round(titleRect.bottom - headerRect.top + 16);
      return Math.max(0, total - Math.round(headerRect.height));
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'pixel-leaves-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    el.prepend(canvas);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let w = 0;
    let h = 0;
    let leaves = [];

    function resize() {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      spill = computeSpill();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height)) + spill;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      const max = spill > 0 ? 42 : 28;
      const count = Math.max(6, Math.min(max, Math.floor(w / density)));
      leaves = Array.from({ length: count }, () => spawn(true));
    }

    function spawn(randomY) {
      const sprite = SPRITES[(Math.random() * SPRITES.length) | 0];
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -12 - Math.random() * 20,
        vy: 18 + Math.random() * 42, // px/sec
        swayAmp: 6 + Math.random() * 18,
        swayFreq: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        unit: 2 + ((Math.random() * 2) | 0), // pixel block size: 2-3px
        sprite,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        tumbleSpeed: 1 + Math.random() * 3,
        tumble: Math.random() * Math.PI * 2,
        alpha: 0.55 + Math.random() * 0.45,
      };
    }

    function drawLeaf(leaf, t) {
      const swayX = Math.sin(t * leaf.swayFreq + leaf.phase) * leaf.swayAmp;
      const flip = Math.cos(t * leaf.tumbleSpeed + leaf.phase); // -1..1 tumble
      const x = leaf.x + swayX;
      const y = leaf.y;
      const u = leaf.unit;
      const rows = leaf.sprite.length;
      const cols = leaf.sprite[0].length;
      const ox = x - (cols * u) / 2;
      const oy = y - (rows * u) / 2;

      ctx.save();
      ctx.globalAlpha = leaf.alpha;
      // Squash X to simulate 3D tumble while keeping blocks crisp.
      ctx.translate(x, y);
      ctx.scale(Math.max(0.2, Math.abs(flip)), 1);
      ctx.translate(-x, -y);
      ctx.fillStyle = leaf.color;
      for (let r = 0; r < rows; r++) {
        const row = leaf.sprite[r];
        for (let c = 0; c < cols; c++) {
          if (row[c] === 'X') {
            ctx.fillRect(Math.round(ox + c * u), Math.round(oy + r * u), u, u);
          }
        }
      }
      ctx.restore();
    }

    let last = performance.now();
    let t = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        leaf.y += leaf.vy * dt;
        leaf.tumble += dt * leaf.tumbleSpeed;
        if (leaf.y > h + 16) leaves[i] = spawn(false);
        else drawLeaf(leaf, t);
      }
      // draw newly spawned too
      for (const leaf of leaves) {
        if (leaf.y < 0) drawLeaf(leaf, t);
      }
      requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const titleEl = document.querySelector('main h1');
    if (titleEl) ro.observe(titleEl);
    window.addEventListener('load', resize);
    window.addEventListener('resize', resize);
    // Recompute after fonts/layout settle (title position shifts).
    setTimeout(resize, 500);
    setTimeout(resize, 1500);
    resize();
    requestAnimationFrame(frame);
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Main site header only (Starlight top nav) — no post cards.
    document.querySelectorAll('header.header').forEach((el) => attachTo(el, 90));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
