/* MontInfo code art: flat shapes, no outlines, one darker shade at most.
   Builds the same rig and plate objects that the image route produces. */
(function () {
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const parse = c => c[0] === '#' ? hex(c) : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const shade = (c, k) => { const v = parse(c).map(x => Math.min(255, Math.round(x * k))); return `rgb(${v.join(',')})`; };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rr = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const el = (c, x, y, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, 7); c.fill(); };
  const poly = (c, pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); };
  MI.draw = { rr, el, poly, shade, canvas };

  /* ---------- puppets ---------- */
  const W = 800, H = 1000, CX = 400;
  function hairBack(c, s) {
    const h = s.hair;
    if (s.hairStyle === 'bob') { c.fillStyle = h; c.beginPath(); c.moveTo(CX - 228, 310); c.bezierCurveTo(CX - 285, 150, CX - 170, 12, CX, 12); c.bezierCurveTo(CX + 170, 12, CX + 285, 150, CX + 228, 310); c.bezierCurveTo(CX + 214, 372, CX + 165, 392, CX + 120, 388); c.lineTo(CX - 120, 388); c.bezierCurveTo(CX - 165, 392, CX - 214, 372, CX - 228, 310); c.fill(); }
    if (s.hairStyle === 'long') { c.fillStyle = h; c.beginPath(); c.moveTo(CX - 215, 200); c.bezierCurveTo(CX - 215, 40, CX + 215, 40, CX + 215, 200); c.lineTo(CX + 225, 500); c.quadraticCurveTo(CX, 540, CX - 225, 500); c.fill(); }
    if (s.hairStyle === 'bun') el(c, CX, 16, 74, 62, h);
  }
  function hairFront(c, s) {
    const h = s.hair;
    c.fillStyle = h;
    if (s.hairStyle === 'bald') return;
    c.beginPath();
    if (s.hairStyle === 'short') {
      c.moveTo(CX - 172, 236); c.bezierCurveTo(CX - 196, 80, CX - 90, 26, CX + 10, 28); c.bezierCurveTo(CX + 130, 30, CX + 196, 100, CX + 172, 236);
      c.bezierCurveTo(CX + 150, 170, CX + 100, 138, CX + 40, 138); c.bezierCurveTo(CX - 40, 150, CX - 130, 148, CX - 172, 236);
    } else {
      c.moveTo(CX - 180, 250); c.bezierCurveTo(CX - 205, 90, CX - 90, 28, CX + 10, 30); c.bezierCurveTo(CX + 130, 32, CX + 210, 110, CX + 180, 250);
      c.bezierCurveTo(CX + 150, 200, CX + 90, 160, CX + 52, 98); c.bezierCurveTo(CX + 10, 160, CX - 120, 170, CX - 180, 250);
    }
    c.closePath(); c.fill();
  }
  const EXPR = {
    neutral: { eye: 19 }, smile: { eye: 19, mouth: 'smile' }, happy: { eye: 19, mouth: 'grin' },
    shocked: { eye: 25, brow: -18, mouth: 'o' }, worried: { eye: 19, brow: -12, tilt: -.28, mouth: 'wavy' },
    angry: { eye: 19, brow: 4, tilt: .34, mouth: 'frown' }, sad: { eye: 18, brow: -6, tilt: -.34, mouth: 'frown' },
    disgust: { eye: 16, brow: 0, tilt: .2, mouth: 'wavy' }, terrified: { eye: 26, brow: -20, tilt: -.25, mouth: 'wide' }, sleepy: { eye: 9, mouth: 'line' },
  };
  function face(c, s, name) {
    const e = EXPR[name] || EXPR.neutral, ink = '#3a2528', mouth = '#c2474a';
    const ey = 232, dx = 76, r = e.eye;
    el(c, CX - dx, ey, r, r, ink); el(c, CX + dx, ey, r, r, ink);
    if (e.brow !== undefined) {
      c.strokeStyle = s.brow || s.hair; c.lineWidth = 11; c.lineCap = 'round'; const by = ey - 42 + e.brow, t = (e.tilt || 0) * 44;
      c.beginPath(); c.moveTo(CX - dx - 28, by - t * .5); c.lineTo(CX - dx + 28, by + t * .5); c.stroke();
      c.beginPath(); c.moveTo(CX + dx - 28, by + t * .5); c.lineTo(CX + dx + 28, by - t * .5); c.stroke();
    }
    c.strokeStyle = mouth; c.fillStyle = mouth; c.lineWidth = 11; c.lineCap = 'round'; const my = 312;
    const m = e.mouth || 'line';
    c.beginPath();
    if (m === 'line') { c.moveTo(CX - 27, my); c.lineTo(CX + 27, my); c.stroke(); }
    if (m === 'smile') { c.moveTo(CX - 36, my - 6); c.quadraticCurveTo(CX, my + 26, CX + 36, my - 6); c.stroke(); }
    if (m === 'frown') { c.moveTo(CX - 34, my + 10); c.quadraticCurveTo(CX, my - 18, CX + 34, my + 10); c.stroke(); }
    if (m === 'wavy') { c.moveTo(CX - 38, my + 4); c.quadraticCurveTo(CX - 18, my - 12, CX, my + 2); c.quadraticCurveTo(CX + 18, my + 14, CX + 38, my - 2); c.stroke(); }
    if (m === 'o') { el(c, CX, my + 4, 25, 33, '#7c2d33'); el(c, CX, my + 22, 15, 12, '#d9666a'); }
    if (m === 'wide') { rr(c, CX - 52, my - 16, 104, 48, 22, '#7c2d33'); rr(c, CX - 40, my - 16, 80, 13, 5, '#fff'); }
    if (m === 'grin') { c.moveTo(CX - 48, my - 12); c.quadraticCurveTo(CX, my - 4, CX + 48, my - 12); c.quadraticCurveTo(CX, my + 52, CX - 48, my - 12); c.fillStyle = '#7c2d33'; c.fill(); rr(c, CX - 36, my - 9, 72, 11, 4, '#fff'); }
  }
  function drawHead(c, s, name) {
    hairBack(c, s);
    const sk = s.skin, skD = shade(sk, .9);
    el(c, CX - 172, 240, 32, 36, skD); el(c, CX + 172, 240, 32, 36, skD);
    c.fillStyle = sk; c.beginPath(); c.moveTo(CX - 172, 225); c.bezierCurveTo(CX - 172, 60, CX + 172, 60, CX + 172, 225); c.bezierCurveTo(CX + 172, 325, CX + 95, 392, CX, 392); c.bezierCurveTo(CX - 95, 392, CX - 172, 325, CX - 172, 225); c.fill();
    if (s.blush !== false) { el(c, CX - 112, 292, 30, 18, shade(sk, .94)); el(c, CX + 112, 292, 30, 18, shade(sk, .94)); }
    if (s.glasses) { c.strokeStyle = s.glasses; c.lineWidth = 9; c.beginPath(); c.arc(CX - 76, 232, 42, 0, 7); c.moveTo(CX + 118, 232); c.arc(CX + 76, 232, 42, 0, 7); c.moveTo(CX - 34, 228); c.lineTo(CX + 34, 228); c.stroke(); }
    if (s.beard) { c.fillStyle = s.hair; c.beginPath(); c.moveTo(CX - 168, 262); c.bezierCurveTo(CX - 150, 420, CX + 150, 420, CX + 168, 262); c.bezierCurveTo(CX + 90, 300, CX + 45, 282, CX, 280); c.bezierCurveTo(CX - 45, 282, CX - 90, 300, CX - 168, 262); c.fill(); }
    hairFront(c, s);
    face(c, s, name);
  }
  function drawBody(c, s) {
    const top = s.top, vest = s.vest, sk = s.skin;
    /* neck runs well up under the head so a nod never shows a gap */
    rr(c, CX - 44, 340, 88, 100, 18, shade(sk, .9));
    /* torso */
    c.fillStyle = top; c.beginPath(); c.moveTo(CX - 118, 454); c.quadraticCurveTo(CX - 112, 412, CX - 58, 408); c.lineTo(CX + 58, 408); c.quadraticCurveTo(CX + 112, 412, CX + 118, 454); c.lineTo(CX + 110, 700); c.lineTo(CX - 110, 700); c.closePath(); c.fill();
    if (vest) {
      c.fillStyle = vest; c.beginPath(); c.moveTo(CX - 106, 440); c.lineTo(CX - 50, 412); c.lineTo(CX, 520); c.lineTo(CX + 50, 412); c.lineTo(CX + 106, 440); c.lineTo(CX + 112, 690); c.lineTo(CX, 720); c.lineTo(CX - 112, 690); c.closePath(); c.fill();
      c.fillStyle = shade(vest, .84); c.beginPath(); c.moveTo(CX + 58, 450); c.lineTo(CX + 106, 440); c.lineTo(CX + 112, 690); c.lineTo(CX + 58, 704); c.closePath(); c.fill();
      el(c, CX, 590, 11, 11, shade(vest, 1.5)); el(c, CX, 645, 11, 11, shade(vest, 1.5));
    }
    /* collar + tie */
    if (s.collar !== false) { poly(c, [[CX - 52, 406], [CX, 462], [CX - 28, 492], [CX - 72, 424]], s.collar || '#fff'); poly(c, [[CX + 52, 406], [CX, 462], [CX + 28, 492], [CX + 72, 424]], s.collar || '#fff'); }
    if (s.tie) { poly(c, [[CX - 20, 448], [CX + 20, 448], [CX + 12, 478], [CX - 12, 478]], s.tie); poly(c, [[CX - 12, 478], [CX + 12, 478], [CX + 26, 580], [CX, 612], [CX - 26, 580]], s.tie); }
    if (s.logoDot) el(c, CX + 60, 500, 14, 14, s.logoDot);
    /* waist of the trousers over the hips */
    rr(c, CX - 110, 684, 220, 54, [6, 6, 20, 20], s.pants);
  }
  function drawSideHead(c, s) {
    const h = s.hair, sk = s.skin;
    if (s.hairStyle === 'bob' || s.hairStyle === 'long') { c.fillStyle = h; c.beginPath(); c.moveTo(CX + 110, 42); c.bezierCurveTo(CX - 60, -12, CX - 262, 60, CX - 262, 232); c.bezierCurveTo(CX - 262, 340, CX - 190, 396, CX - 90, 392); c.lineTo(CX + 40, 340); c.closePath(); c.fill(); }
    c.fillStyle = sk; c.beginPath(); c.moveTo(CX - 92, 225); c.bezierCurveTo(CX - 88, 70, CX + 175, 70, CX + 180, 225); c.bezierCurveTo(CX + 184, 340, CX + 92, 394, CX + 25, 392); c.bezierCurveTo(CX - 55, 390, CX - 92, 320, CX - 92, 225); c.fill();
    el(c, CX - 62, 246, 34, 38, shade(sk, .9));
    el(c, CX + 104, 232, 20, 20, '#3a2528');
    c.strokeStyle = '#c2474a'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(CX + 112, 318); c.quadraticCurveTo(CX + 150, 326, CX + 172, 310); c.stroke();
    c.fillStyle = h; c.beginPath();
    c.moveTo(CX - 100, 214); c.bezierCurveTo(CX - 92, 80, CX + 40, 26, CX + 118, 62); c.bezierCurveTo(CX + 172, 88, CX + 190, 140, CX + 184, 176);
    c.bezierCurveTo(CX + 130, 170, CX + 72, 138, CX + 50, 96); c.bezierCurveTo(CX + 30, 150, CX - 10, 186, CX - 36, 206); c.closePath(); c.fill();
  }
  function drawSideBody(c, s) {
    rr(c, CX - 42, 340, 84, 100, 18, shade(s.skin, .9));
    c.fillStyle = s.top; c.beginPath(); c.moveTo(CX - 92, 460); c.quadraticCurveTo(CX - 88, 410, CX - 30, 406); c.lineTo(CX + 44, 406); c.quadraticCurveTo(CX + 96, 420, CX + 98, 470); c.lineTo(CX + 92, 720); c.lineTo(CX - 92, 720); c.closePath(); c.fill();
    if (s.vest) { c.fillStyle = s.vest; c.beginPath(); c.moveTo(CX - 92, 450); c.lineTo(CX + 8, 412); c.lineTo(CX + 70, 520); c.lineTo(CX + 94, 560); c.lineTo(CX + 92, 700); c.lineTo(CX - 92, 700); c.closePath(); c.fill(); }
    if (s.collar !== false) poly(c, [[CX - 8, 402], [CX + 56, 404], [CX + 66, 452], [CX + 22, 440]], s.collar || '#fff');
    if (s.tie) poly(c, [[CX + 54, 444], [CX + 78, 462], [CX + 96, 570], [CX + 74, 548]], s.tie);
    rr(c, CX - 94, 690, 188, 54, [6, 6, 20, 20], s.pants);
  }
  function drawTyping(s) {
    /* seated at a desk with a laptop: a whole-image pose */
    const cv = canvas(1100, 1000), c = cv.getContext('2d'); const ox = 40;
    c.save(); c.translate(ox, 0);
    rr(c, 40, 700, 300, 42, 18, s.seat || '#8c78a8'); [[80, 742, 24, 258], [280, 742, 24, 258]].forEach(a => rr(c, a[0], a[1], a[2], a[3], 8, shade(s.seat || '#8c78a8', .85)));
    c.save(); c.translate(-210, 0); const CXo = 400; c.translate(CXo - 400 + 40, 0);
    c.restore();
    /* far leg, thigh, near leg */
    const pants = s.pants;
    c.strokeStyle = shade(pants, .85); c.lineCap = 'round'; c.lineWidth = 86; c.beginPath(); c.moveTo(200, 660); c.lineTo(450, 672); c.lineTo(470, 945); c.stroke();
    c.strokeStyle = pants; c.beginPath(); c.moveTo(190, 656); c.lineTo(420, 665); c.lineTo(430, 945); c.stroke();
    rr(c, 390, 948, 150, 52, [30, 34, 4, 4], s.shoes);
    /* body + head from the side drawings */
    const t = canvas(800, 1000), tc = t.getContext('2d'); drawSideBody(tc, { ...s, pants: pants });
    c.drawImage(t, -180, -40);
    const hd = canvas(800, 1000), hc = hd.getContext('2d'); drawSideHead(hc, s); c.drawImage(hd, -160, -30);
    /* desk */
    rr(c, 500, 700, 500, 46, 8, s.desk || '#c9a98a'); rr(c, 610, 746, 280, 254, 6, shade(s.desk || '#c9a98a', .86));
    /* laptop */
    c.fillStyle = '#2f3b5e'; c.save(); c.translate(780, 684); c.rotate(-.2); c.beginPath(); c.roundRect(0, -170, 18, 172, 8); c.fill(); c.restore(); rr(c, 590, 680, 205, 20, 8, '#3d4b75');
    /* near arm over the laptop */
    c.lineCap = 'round'; c.strokeStyle = s.top; c.lineWidth = 58; c.beginPath(); c.moveTo(240, 420); c.lineTo(350, 590); c.lineTo(590, 620); c.stroke();
    el(c, 620, 636, 40, 32, s.skin);
    c.restore();
    return cv;
  }

  MI.codeRig = (spec) => {
    const heads = {};
    for (const n of Object.keys(EXPR)) { const cv = canvas(W, H); drawHead(cv.getContext('2d'), spec, n); heads[n] = cv; }
    const body = canvas(W, H); drawBody(body.getContext('2d'), spec);
    const sb = canvas(W, H), sh = canvas(W, H); drawSideBody(sb.getContext('2d'), spec); drawSideHead(sh.getContext('2d'), spec);
    const sleeve = hex(spec.top), skin = hex(spec.skin);
    return {
      kind: 'code', H, cx: CX, seed: spec.seed || 3, heads, body, neck: { x: CX, y: 405 },
      socketL: { x: CX - 100, y: 448 }, socketR: { x: CX + 100, y: 448 }, L1: 130, L2: 120, armW: 50, handS: 1.8, cuff: spec.short ? .05 : .92,
      eyes: [{ x: CX - 76 - 22, y: 232 - 22, w: 44, h: 44 }, { x: CX + 76 - 22, y: 232 - 22, w: 44, h: 44 }],
      mouth: { x: CX, y: 314, w: 42, h: 34 }, skin, sleeve, lash: '#3a2528',
      legs: { hipY: 722, len: 228, w: 88, gap: 56, color: hex(spec.pants), shoe: hex(spec.shoes), shoeH: 42, shoeW: 128 },
      side: { body: sb, head: sh, neck: { x: CX, y: 405 }, socket: { x: CX - 18, y: 452 } },
      sprites: { typing: drawTyping(spec) }, spriteH: { typing: 1000 },
    };
  };

  /* Image route: same rig fields, loaded from tools/cutout.py output */
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Missing image ' + src)); i.src = src; });
  MI.loadImg = loadImg;
  MI.imageRig = async (data, base) => {
    const heads = {}; for (const [k, f] of Object.entries(data.heads)) heads[k] = await loadImg(base + f);
    const sprites = {}, spriteH = {}; for (const [k, f] of Object.entries(data.sprites || {})) { sprites[k] = await loadImg(base + f); spriteH[k] = data.H; }
    const walkSprite = data.walk ? await loadImg(base + data.walk) : null;
    return { ...data, kind: 'image', heads, body: await loadImg(base + data.bodyFile), sprites, spriteH, walkSprite };
  };

  /* A character is built the first time a shot uses it, so a film pays only for its own cast. */
  MI.rigs = new Proxy(MI.rigs || {}, { get(t, k) { if (!(k in t) && MI.PEOPLE && MI.PEOPLE[k]) t[k] = MI.codeRig(MI.PEOPLE[k]); return t[k]; } });
  /* 'laundry' or 'laundry:night' resolves to a kit place, made once */
  MI.getPlate = name => { const T = MI.plates; if (!T[name]) { const [pl, mood] = String(name).split(':'); if (MI.PLACES[pl]) T[name] = MI.PLACES[pl](mood); } return T[name]; };

  /* ---------- plates ---------- */
  /* Code plates are drawn once at 2x so zooms stay crisp; blanks are known by construction */
  const LRU = [];
  MI.place = (fn, extra = {}) => {
    /* A long video has 100+ places and each is 33 MB at 2x, so a plate is built when first drawn and only the last few stay in memory. */
    const t = canvas(4, 4).getContext('2d'); const blanks = fn(t) || {};
    const plate = { w: 1920, h: 1080, blanks, ...extra, thumb() { const c = canvas(32, 18), g = c.getContext('2d', { willReadFrequently: true }); g.scale(32 / 1920, 18 / 1080); fn(g); return g.getImageData(0, 0, 32, 18).data; }, draw(ctx) { if (MI._dry) return; let c = plate._c;
      if (!c) { c = canvas(3840, 2160); const g = c.getContext('2d'); g.scale(2, 2); fn(g); plate._c = c; LRU.push(plate); if (LRU.length > 5) LRU.shift()._c = null; }
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c, 0, 0, 1920, 1080); } };
    return plate;
  };
  MI.imagePlate = (img, blanks, extra = {}) => ({ w: 1920, h: 1080, blanks, source: 'image', ...extra, draw(ctx) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, 1920, 1080); } });

  /* ---------- reusable set pieces ---------- */
  const SET = MI.set = {
    skyline(c, x, y, w, h, mood) {
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.fillStyle = mood.sky; c.fillRect(x, y, w, h);
      for (let i = 0; i < 16; i++) {
        const bw = 52 + 70 * MI.hash(i + x), bh = h * (.22 + .5 * MI.hash(i + 9 + x)), bx = x + (i / 16) * w + 18 * MI.hash(i + 3), by = y + h - bh;
        c.fillStyle = i % 2 ? mood.city : mood.city2; c.fillRect(bx, by, bw, bh);
        c.fillStyle = mood.cityWin; for (let r = 0; r < bh / 34 - 1; r++) for (let q = 0; q < bw / 26 - 1; q++) if (MI.hash(i * 7 + r * 3 + q) > .35) c.fillRect(bx + 10 + q * 24, by + 12 + r * 32, 11, 16);
      }
      for (let i = 0; i < 12; i++) el(c, x + (i / 11) * w, y + h - 8, 62 + 40 * MI.hash(i + 2), 46 + 30 * MI.hash(i + 11), i % 2 ? mood.tree : shade(mood.tree, .9));
      c.restore();
    },
    window(c, x, y, w, h, n, mood) {
      SET.skyline(c, x, y, w, h, mood);
      c.fillStyle = mood.frame; c.fillRect(x - 12, y - 12, w + 24, 14); c.fillRect(x - 12, y + h - 2, w + 24, 16);
      for (let i = 0; i <= n; i++) c.fillRect(x - 8 + (w * i) / n, y - 8, 16, h + 16);
    },
    pendant(c, x, topY, len, r, mood) {
      c.fillStyle = mood.dark; c.fillRect(x - 4, topY, 8, len); c.beginPath(); c.arc(x, topY + len + r * .72, r, Math.PI, 0); c.closePath(); c.fill();
      c.fillStyle = mood.lamp; c.beginPath(); c.ellipse(x, topY + len + r * .72, r * .9, r * .1, 0, 0, Math.PI); c.fill();
    },
    plant(c, x, y, s, mood) {
      c.save(); c.translate(x, y); c.scale(s, s);
      const leaf = (a, l, w, col) => { c.save(); c.rotate(a); c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w, -l * .55, 0, -l); c.quadraticCurveTo(-w, -l * .55, 0, 0); c.fill(); c.restore(); };
      const g1 = mood.leaf, g2 = shade(mood.leaf, .78);
      leaf(-1.0, 200, 52, g2); leaf(1.0, 200, 52, g2); leaf(-.5, 270, 60, g1); leaf(.5, 265, 60, g2); leaf(0, 300, 62, g1);
      poly(c, [[-88, -16], [88, -16], [66, 130], [-66, 130]], mood.dark); poly(c, [[20, -16], [88, -16], [66, 130], [20, 130]], shade(mood.dark, .82));
      c.restore();
    },
    barrier(c, x, y, s, mood) { c.fillStyle = mood.dark; c.fillRect(x - 10 * s, y - 170 * s, 20 * s, 170 * s); rr(c, x - 16 * s, y - 188 * s, 32 * s, 34 * s, 5 * s, mood.dark); el(c, x, y, 50 * s, 11 * s, mood.dark); },
    rope(c, x1, x2, y, mood) { c.fillStyle = mood.accent2; c.fillRect(x1, y, x2 - x1, 22); c.fillStyle = shade(mood.accent2, .84); c.fillRect(x1, y + 14, x2 - x1, 8); },
    door(c, x, y, w, h, mood) { rr(c, x - 12, y - 12, w + 24, h + 12, 3, mood.dark); c.fillStyle = shade(mood.dark, 1.2); c.fillRect(x, y, w, h); c.fillStyle = shade(mood.dark, 1.08); c.fillRect(x + w * .14, y + h * .08, w * .72, h * .36); c.fillRect(x + w * .14, y + h * .52, w * .72, h * .4); rr(c, x + w - 62, y + h * .52, 46, 14, 7, '#c6cad6'); },
    monitor(c, x, y, w, h, mood, screen = '#e7f1fb') { rr(c, x - 12, y - 12, w + 24, h + 24, 8, mood.dark); c.fillStyle = screen; c.fillRect(x, y, w, h); c.fillStyle = mood.dark; c.fillRect(x + w / 2 - 15, y + h + 12, 30, 30); rr(c, x + w / 2 - 60, y + h + 40, 120, 12, 5, mood.dark); return { x, y, w, h }; },
    clock(c, x, y, r, mood) { el(c, x, y, r, r, mood.dark); el(c, x, y, r * .84, r * .84, '#f5f3ee'); c.strokeStyle = mood.dark; c.lineWidth = r * .1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - r * .6); c.moveTo(x, y); c.lineTo(x - r * .42, y); c.stroke(); },
    lightShaft(c, x, topW, y1, y2, skew, col) { poly(c, [[x, y1], [x + topW, y1], [x + topW + skew, y2], [x + skew, y2]], col); },
  };

  /* ---------- moods: the plate's own light ---------- */
  MI.MOODS = {
    day: { wall: '#c3c6cf', wallD: '#b2b5c0', ceil: '#d6d6dc', floor: '#e4cdb7', floorD: '#d5bda6', dark: '#2c3e63', sky: '#b4dcf5', city: '#a4c2de', city2: '#92b3d3', cityWin: '#cfe2f3', tree: '#7fb09b', frame: '#59749c', lamp: '#f7ecc9', leaf: '#3f7468', counter: '#52807d', counterD: '#3f6768', trim: '#9ea2ae', accent2: '#8b78a8', board: '#fbfafd', shaft: 'rgba(255,250,225,.2)' },
    night: { wall: '#3a4668', wallD: '#2f3a59', ceil: '#2a3350', floor: '#46506f', floorD: '#3b4562', dark: '#141c33', sky: '#1b2547', city: '#27345d', city2: '#202c50', cityWin: '#f3d68a', tree: '#233c4f', frame: '#141c33', lamp: '#ffe8a6', leaf: '#2c5552', counter: '#2f5358', counterD: '#264347', trim: '#2a3350', accent2: '#5a4c86', board: '#dfe3f0', shaft: 'rgba(255,232,170,.13)' },
    warm: { wall: '#d9b99b', wallD: '#c9a78a', ceil: '#b98f70', floor: '#a9785a', floorD: '#986a4f', dark: '#4a3145', sky: '#2d3a64', city: '#3b4a78', city2: '#33406c', cityWin: '#f2cf8c', tree: '#2e4a55', frame: '#5b3f46', lamp: '#ffe6ad', leaf: '#4b7560', counter: '#7a5a6e', counterD: '#654a5b', trim: '#b3876b', accent2: '#8b5f7f', board: '#f7efe2', shaft: 'rgba(255,225,165,.2)' },
  };

  /* ---------- the first place: a bank lobby. New places follow this shape. ---------- */
  MI.PLACES = MI.PLACES || {};
  MI.PLACES.bank_lobby = (mood = 'day') => {
    const m = MI.MOODS[mood];
    return MI.place(c => {
      /* ceiling and wall */
      c.fillStyle = m.ceil; c.fillRect(0, 0, 1920, 96); c.fillStyle = m.wall; c.fillRect(0, 96, 1920, 620);
      c.fillStyle = m.wallD; c.fillRect(0, 96, 1920, 16);
      /* left corner window in perspective */
      SET.skyline(c, 0, 0, 330, 720, m);
      c.fillStyle = m.frame; poly(c, [[320, 0], [340, 0], [340, 716], [320, 730]], m.frame); poly(c, [[160, 0], [186, 0], [186, 744], [160, 748]], m.frame); poly(c, [[30, 0], [58, 0], [58, 764], [30, 768]], m.frame); poly(c, [[0, 40], [340, 92], [340, 110], [0, 62]], m.frame);
      /* notice board */
      rr(c, 396, 150, 560, 324, 6, shade(m.wall, .82)); c.fillStyle = m.board; c.fillRect(408, 162, 536, 300);
      /* windows behind counter */
      SET.window(c, 1000, 110, 640, 360, 3, m);
      /* door */
      /* wainscot and skirting */
      c.fillStyle = m.wallD; c.fillRect(340, 560, 1580, 156); c.fillStyle = m.trim; c.fillRect(340, 552, 1580, 10); c.fillRect(340, 700, 1580, 20);
      SET.door(c, 1716, 236, 164, 480, m);
      /* clock */
      SET.clock(c, 1680, 170, 44, m);
      /* counter */
      rr(c, 980, 508, 700, 34, 4, m.counter); c.fillStyle = m.counterD; c.fillRect(994, 542, 672, 178);
      c.fillStyle = shade(m.counterD, .9); for (let i = 0; i < 4; i++) c.fillRect(1020 + i * 166, 566, 140, 134);
      /* things on the counter */
      rr(c, 1040, 440, 92, 68, 4, m.accent2); rr(c, 1132, 468, 70, 40, 4, shade(m.accent2, .86));
      const screen = SET.monitor(c, 1440, 358, 164, 96, m);
      c.fillStyle = shade(m.counter, 1.2); c.fillRect(1250, 498, 120, 10);
      /* floor with a soft band, window light falling across it */
      c.fillStyle = m.floor; c.fillRect(0, 716, 1920, 364);
      c.fillStyle = m.floorD; c.fillRect(0, 716, 1920, 12);
      c.fillStyle = shade(m.floor, .975); for (let i = 0; i < 7; i++) c.fillRect(0, 760 + i * i * 8, 1920, 2 + i);
      SET.lightShaft(c, 40, 120, 728, 1080, 190, m.shaft); SET.lightShaft(c, 200, 110, 728, 1080, 260, m.shaft);
      SET.lightShaft(c, 1040, 180, 728, 1080, -70, m.shaft); SET.lightShaft(c, 1270, 180, 728, 1080, -50, m.shaft);
      /* lamps, plant, queue barrier */
      SET.pendant(c, 1180, 0, 130, 70, m); SET.pendant(c, 1490, 0, 130, 70, m);
      SET.plant(c, 262, 610, 1.02, m);
      SET.barrier(c, 860, 740, 1, m); SET.barrier(c, 1210, 740, 1, m); SET.barrier(c, 1560, 740, 1, m);
      SET.rope(c, 860, 1210, 572, m); SET.rope(c, 1210, 1560, 572, m);
      return { board: { x: 408, y: 162, w: 536, h: 300 }, screen };
    }, { floorY: 730, mood });
  };
})();
