/* MontInfo film tools: real clips from your own films, a robot for stories about AI agents, a code window, a score chip. */
(function () {
  const { rr, el, poly, shade } = MI.draw, K = MI.K;
  const clamp = MI.clamp, lerp = MI.lerp;

  /* Clips come from tools/clips.py: clips/<name>/0000.jpg and clips/manifest.js, loaded before setupArt. Each clip is also a place, film_<name>. */
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Missing ' + src)); i.src = src; });
  MI.clipFrames = {}; MI.clipFps = {};
  MI.loadClips = async () => {
    await Promise.all(Object.entries(window.CLIPS || {}).map(async ([n, v]) => { const m = typeof v === 'number' ? { n: v, fps: 15 } : v; MI.clipFps[n] = m.fps; MI.clipFrames[n] = await Promise.all(Array.from({ length: m.n }, (_, i) => load(`/p/clips/${n}/${String(i).padStart(4, '0')}.jpg`))); }));
    Object.keys(MI.clipFrames).forEach(n => { MI.plates['film_' + n] = MI.place(c => { c.drawImage(MI.clipFrames[n][0], 0, 0, 1920, 1080); return {}; }, { floorY: 1080, mood: 'day' }); });
  };
  /* o.speed plays slower or faster; o.frame pins one frame. Past its end a clip holds its last frame. */
  const frameOf = (name, st, o = {}) => { const f = MI.clipFrames[name]; if (!f) throw new Error('No clip named ' + name + '. Add it with tools/clips.py'); const i = o.frame !== undefined ? o.frame : Math.floor((MI.now - st) * (MI.clipFps[name] || 15) * (o.speed || 1)); return f[clamp(i, 0, f.length - 1)]; };
  /* K.film('name', st) in world space, on the place film_name: the clip fills the frame. */
  K.film = (name, st, o = {}) => { const f = frameOf(name, st, o); if (!MI._dry) MI.ctx.drawImage(f, 0, 0, 1920, 1080); };
  /* K.clipIn('name', x, y, w, h, st): the clip plays inside any rectangle, such as a monitor or a cinema screen. */
  K.clipIn = (name, x, y, w, h, st, o = {}) => { const f = frameOf(name, st, o); if (MI._dry) return; const c = MI.ctx; c.save(); c.beginPath(); c.roundRect(x, y, w, h, o.r ?? 4); c.clip(); c.drawImage(f, x, y, w, h); c.restore(); };
  /* K.tv(x, y, w, 'name', st): a monitor playing a clip. Height follows 16:9. {stand:false} hides the stand. */
  K.tv = (x, y, w, name, st, o = {}) => { const c = MI.ctx, h = w * 9 / 16, p = Math.max(10, w * .018); if (o.stand !== false) { rr(c, x + w / 2 - w * .05, y + h, w * .1, w * .07, 4, '#39405a'); rr(c, x + w / 2 - w * .16, y + h + w * .065, w * .32, w * .022, 6, '#2b3147'); } rr(c, x - p, y - p, w + p * 2, h + p * 2, 14, o.col || '#23283c'); K.clipIn(name, x, y, w, h, st, o); };

  /* ---------- a small friendly robot with a face on a screen, for stories about AI agents ---------- */
  /* K.robot(x, y, s, {mood, pose, say:[[a,b]], enter, hop, walk:[[t0,x0,t1,x1]], flip})
     x,y = feet. s = 1 is about 300 px tall. mood: happy, proud, neutral, oops, thinking, sleepy. pose: rest, wave, up, point, pointl, shrug, type */
  K.robot = (x, y, s = 1, o = {}) => {
    const c = MI.ctx, t = MI.now; if (o.enter !== undefined && t < o.enter) return;
    let walking = false; (o.walk || []).forEach(([a, x0, b, x1]) => { if (t <= a) { if (a === o.walk[0][0]) x = x0; } else if (t >= b) x = x1; else { x = lerp(x0, x1, MI.inout((t - a) / (b - a))); walking = true; } });
    const moods = Array.isArray(o.mood) ? o.mood : [[0, o.mood || 'happy']]; const mood = moods.filter(m => m[0] <= t).pop()?.[1] || moods[0][1];
    const poses = Array.isArray(o.pose) ? o.pose : [[0, o.pose || 'rest']]; const pose = poses.filter(m => m[0] <= t).pop()?.[1] || poses[0][1];
    const talk = (o.say || []).some(([a, b]) => t >= a && t <= b);
    const e = o.enter !== undefined ? MI.pop((t - o.enter) / .35) : 1;
    const bob = Math.sin(t * 3.1 + (o.seed || 0)) * 3 + (walking ? Math.abs(Math.sin(t * 9)) * 10 : 0) + (o.hop ? Math.abs(Math.sin(t * 5)) * 26 : 0);
    c.save(); c.translate(x, y); c.scale(s * e * (o.flip ? -1 : 1), s * e);
    el(c, 0, 4, 70, 12, 'rgba(0,0,0,.14)');
    const lp = walking ? Math.sin(t * 9) * 12 : 0; rr(c, -38, -46 - Math.max(0, lp), 24, 46, 8, '#8d97ad'); rr(c, 14, -46 - Math.max(0, -lp), 24, 46, 8, '#8d97ad'); rr(c, -44, -14 - Math.max(0, lp), 36, 16, 7, '#3a4258'); rr(c, 8, -14 - Math.max(0, -lp), 36, 16, 7, '#3a4258');
    c.translate(0, -bob);
    /* arms: pairs of hand offsets from the shoulders */
    const arms = { rest: [[-84, -66], [84, -66]], wave: [[-84, -66], [96, -196 + Math.sin(t * 9) * 16]], up: [[-74, -204], [74, -204]], point: [[-84, -66], [130, -134]], pointl: [[-130, -134], [84, -66]], shrug: [[-104, -128], [104, -128]], type: [[-40 + Math.sin(t * 15) * 8, -72], [40 - Math.sin(t * 15) * 8, -72]] }[pose] || [[-84, -66], [84, -66]];
    [[-60, -116], [60, -116]].forEach(([sx, sy], i) => { const [hx, hy] = arms[i]; c.strokeStyle = '#8d97ad'; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke(); el(c, hx, hy, 15, 15, '#3a4258'); });
    rr(c, -62, -142, 124, 100, 24, '#eef2f8'); rr(c, -62, -68, 124, 26, 13, '#d6dce8'); el(c, 0, -104, 15, 15, '#2fb49a');
    rr(c, -14, -160, 28, 24, 6, '#8d97ad');
    rr(c, -92, -274, 184, 124, 34, '#eef2f8'); rr(c, -78, -260, 156, 96, 24, '#1f2740');
    c.strokeStyle = '#8d97ad'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, -274); c.lineTo(0, -304); c.stroke(); el(c, 0, -310, 11, 11, mood === 'oops' ? '#e4572e' : '#2fb49a');
    const fc = mood === 'oops' ? '#ffc46a' : '#6ff0d0', ey = -222; c.fillStyle = fc; c.strokeStyle = fc; c.lineWidth = 7; c.lineCap = 'round';
    const blink = (t * .37 + (o.seed || 0)) % 1 < .025;
    if (mood === 'proud' || mood === 'happy') { [-34, 34].forEach(d => { c.beginPath(); c.arc(d, ey + 8, 15, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }); }
    else if (mood === 'oops') { [-34, 34].forEach(d => el(c, d, ey, 13, 15, fc)); c.lineWidth = 6; [[-52, -18], [52, 18]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a, ey - 20); c.lineTo(b, ey - 33); c.stroke(); }); }
    else if (mood === 'sleepy') { [-34, 34].forEach(d => { c.beginPath(); c.moveTo(d - 13, ey); c.lineTo(d + 13, ey); c.stroke(); }); }
    else if (mood === 'thinking') { el(c, -34, ey, 11, 11, fc); c.beginPath(); c.moveTo(21, ey - 3); c.lineTo(47, ey - 3); c.stroke(); }
    else { [-34, 34].forEach(d => blink ? (c.beginPath(), c.moveTo(d - 11, ey), c.lineTo(d + 11, ey), c.stroke()) : el(c, d, ey, 11, 13, fc)); }
    const open = talk ? .4 + .6 * Math.abs(Math.sin(t * 13)) : 0;
    if (talk) el(c, 0, ey + 40, 15, 3 + 11 * open, fc);
    else if (mood === 'oops') { c.beginPath(); c.arc(0, ey + 52, 14, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    else if (mood === 'neutral' || mood === 'thinking' || mood === 'sleepy') { c.beginPath(); c.moveTo(-12, ey + 40); c.lineTo(12, ey + 40); c.stroke(); }
    else { c.beginPath(); c.arc(0, ey + 26, 22, Math.PI * .15, Math.PI * .85); c.stroke(); }
    c.restore();
  };

  /* ---------- a code window: lines appear as if typed ---------- */
  /* K.term(x, y, w, h, lines, st, {title, size, rate}) lines = strings, or [string, colour]. Colours default by rotation. rate = lines a second. */
  const CODE = ['#6ff0d0', '#ffd479', '#9fc5ff', '#ff9d8a', '#e5e9f2'];
  K.term = (x, y, w, h, lines, st, o = {}) => {
    const c = MI.ctx, t = MI.now, e = MI.pop((t - st) / .3); if (t < st) return;
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(e, e); c.translate(-x - w / 2, -y - h / 2);
    rr(c, x, y, w, h, 18, '#141a2e'); rr(c, x, y, w, 46, 18, '#222a44'); c.fillStyle = '#222a44'; c.fillRect(x, y + 28, w, 18);
    ['#ef6a5a', '#f6c04f', '#5fc77a'].forEach((col, i) => el(c, x + 28 + i * 26, y + 23, 8, 8, col));
    if (o.title) { c.font = `800 22px Montserrat`; c.fillStyle = '#aab4cf'; c.textAlign = 'center'; c.fillText(o.title, x + w / 2, y + 31); }
    const size = o.size || 32, gap = size * 1.5, rate = o.rate || 5, n = lines.length; c.font = `800 ${size}px Montserrat`; c.textAlign = 'left';
    const shown = Math.min(n, (t - st - .15) * rate); let yy = y + 46 + size * 1.5;
    for (let i = 0; i < n && i < shown; i++) { const l = Array.isArray(lines[i]) ? lines[i] : [lines[i], CODE[i % CODE.length]], frac = clamp(shown - i); c.fillStyle = l[1]; c.fillText(l[0].slice(0, Math.ceil(l[0].length * frac)), x + 34, yy); yy += gap; }
    if (Math.floor(t * 3) % 2 === 0 && shown < n + 2) { rr(c, x + 34, Math.min(yy, y + h - 34) - size * .8, size * .5, size, 3, '#6ff0d0'); }
    c.restore();
    if (MI._dry) for (let i = 0; i < Math.min(n, 12); i++) MI.ev('tick', st + .15 + i / rate);
  };

  /* A big check mark or score chip, for when the agent grades itself. */
  K.score = (x, y, text, st, o = {}) => { const c = MI.ctx, e = MI.pop((MI.now - st) / .3); if (MI.now < st) return; c.save(); c.translate(x, y); c.rotate(o.ang ?? -.06); c.scale(e, e); rr(c, -190, -74, 380, 148, 24, o.col || '#2fa66f'); c.fillStyle = '#fff'; c.font = `900 ${o.size || 84}px Montserrat`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 4); c.textBaseline = 'alphabetic'; c.restore(); if (MI._dry) MI.ev('pop', st); };
})();
