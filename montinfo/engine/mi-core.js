/* MontInfo core: every frame is a pure function of time t. Shots hang on narration words. */
(function () {
  const W = 1920, H = 1080;
  /* 9:16: the world stays 1920x1080 and the frame is its centre column. Plates are 2x, so the 1.78x crop stays sharp. Keep everything between x 676 and 1244. */
  const V = window.FORMAT === '9:16', VS = 1920 / 1080, VX = (W - 1080 / VS) / 2, OW = V ? 1080 : W, OH = V ? 1920 : H;
  const MI = window.MI = { COLUMN: V ? [VX, W - VX] : [0, W], W, H, shots: [], EV: [], words: [], END: 0, READY: false, plates: {}, rigs: {}, cfg: {}, ctx: null };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const inout = p => { p = clamp(p); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const outc = p => 1 - Math.pow(1 - clamp(p), 3);
  const inc = p => Math.pow(clamp(p), 3);
  const pop = p => { p = clamp(p); return 1 + 2.9 * Math.pow(p - 1, 3) + 1.9 * Math.pow(p - 1, 2); };
  const spring = d => d <= 0 ? 0 : 1 - Math.exp(-6.5 * d) * Math.cos(13 * d);
  const kick = d => d <= 0 ? 1 : 1 + .1 * Math.exp(-10 * d) * Math.cos(22 * d);
  const shake = (d, A) => d <= 0 ? [0, 0] : [A * Math.exp(-8 * d) * Math.sin(61 * d), A * Math.exp(-8 * d) * Math.cos(47 * d)];
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  Object.assign(MI, { clamp, lerp, inout, outc, inc, pop, spring, kick, shake, hash });

  /* ---------- narration words ---------- */
  const norm = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  MI.setWords = list => { MI.words = list.map(w => ({ ...w, k: norm(w.w).join('') })); };
  MI.find = (phrase, occ = 1) => {
    const toks = norm(phrase).map(x => x.replace(/ /g, '')); let seen = 0;
    for (let i = 0; i + toks.length <= MI.words.length; i++) {
      let ok = true; for (let j = 0; j < toks.length; j++) if (MI.words[i + j].k !== toks[j]) { ok = false; break; }
      if (ok && ++seen === occ) return { s: MI.words[i].s, e: MI.words[i + toks.length - 1].e, i };
    }
    throw new Error(`Narration phrase not found: "${phrase}" (occurrence ${occ})`);
  };
  /* time a phrase starts, 0.08 s early, as the brief's S() does */
  MI.at = (phrase, occ = 1) => MI.find(phrase, occ).s - .08;
  MI.endOf = (phrase, occ = 1) => MI.find(phrase, occ).e;

  /* S('exact words', fn, {occ, trans:'push'|'splat'|'cut'}) */
  MI.S = (phrase, fn, o = {}) => { MI.shots.push({ st: phrase === 0 ? 0 : MI.at(phrase, o.occ || 1), fn, trans: o.trans || 'push', same: !!o.same, name: o.name || String(phrase) }); };

  /* Q: a shot in reading order. Each phrase is searched forward from the last shot, so a repeated line can never land in the wrong place.
     Q('words', 'plateName', [z,fx,fy], [z,fx,fy], (g,T)=>{world}, (g,T)=>{screen}, {trans,name}). g.a('w') / g.b('w') = start / end of words at or after this shot. Same plate as the shot before: a planned cut. */
  let cursor = 0, lastPlate = null;
  const findFrom = (phrase, from) => { const toks = String(phrase).split(/\s+/).map(w => norm(w).join('')).filter(Boolean); for (let i = from; i + toks.length <= MI.words.length; i++) { let ok = true; for (let j = 0; j < toks.length; j++) if (MI.words[i + j].k !== toks[j]) { ok = false; break; } if (ok) return { s: MI.words[i].s, e: MI.words[i + toks.length - 1].e, i }; } throw new Error(`Narration phrase not found after word ${from}: "${phrase}"`); };
  MI.Q = (phrase, name, A, B, world, screen, o = {}) => {
    const f = phrase === 0 ? { s: .08, i: 0 } : findFrom(phrase, cursor); cursor = f.i + (phrase === 0 ? 0 : 1); const i0 = f.i, same = lastPlate === name; lastPlate = name;
    MI.shots.push({ st: f.s - .08, trans: o.trans || (same ? 'cut' : 'push'), same, name: o.name || String(phrase), sfx: o.sfx, place: name, i0, camKey: JSON.stringify([A, B]), fn: g => {
      g.a = (w, d = 0) => findFrom(w, i0).s - .08 + d; g.b = (w, d = 0) => findFrom(w, i0).e + d; const p = MI.getPlate(name); if (!p) throw new Error('No place named ' + name);
      MI.cam(g, p, A, B); if (world) world(g, p.blanks || {}); MI.uncam(g); if (screen) screen(g, p.blanks || {});
    } });
  };

  /* ---------- sound events: recorded by a dry pass over every shot ---------- */
  const seen = new Set();
  MI.ev = (name, t, o = {}) => { if (!MI._dry || t < 0 || (MI._cur && t < MI._cur.st - .3)) return;   /* something already on screen from earlier makes no new sound */
    const k = name + '@' + Math.round(t * 1000); if (seen.has(k)) return; seen.add(k); MI.EV.push({ name, t: +t.toFixed(3), ...(o.keep ? { keep: true } : {}) }); };   /* {keep:true}: the mix must not thin this one out */

  /* ---------- camera ---------- */
  /* camP keeps the view inside the plate. A, B = [zoom, fx, fy], fx/fy are 0..1 of the plate */
  MI.camP = (zoom, fx, fy) => {
    const vw = W / zoom, vh = H / zoom;
    return { zoom, x: clamp(fx * W - vw / 2, 0, W - vw), y: clamp(fy * H - vh / 2, 0, H - vh) };
  };
  MI.cam = (g, plate, A, B) => {
    const p = inout((g.t - g.st) / Math.max(.001, g.en - g.st)), ctx = MI.ctx;
    const c = MI.camP(lerp(A[0], B[0], p), lerp(A[1], B[1], p), lerp(A[2], B[2], p));
    ctx.save(); ctx.scale(c.zoom, c.zoom); ctx.translate(-c.x, -c.y);
    plate.draw(ctx); g.incam = true; g.view = c; MI._inCam = true;
    /* blanks nobody wrote on in this shot fill themselves */
    if (plate.blanks && !MI._dry) { const cur = MI.shots.find(q => q.st === g.st); for (const [k, b] of Object.entries(plate.blanks)) if (!(cur && cur.used && cur.used.has(k)) && MI.filler) MI.filler(k, b); } if (MI._dry && MI._cur) { MI._cur.plate = plate; MI._cur.zoom = Math.max(A[0], B[0]); MI._cur.floorY = plate.floorY; MI._cur.blanks = plate.blanks; }
  };
  MI.uncam = g => { if (g.incam) { MI.ctx.restore(); g.incam = false; MI._inCam = false; } };
  /* during the dry pass: anything typed or ticked on a blank marks it as used */
  MI.markUsed = (x, y) => { const c = MI._cur; if (!MI._dry || !c || !MI._inCam || !c.blanks) return; for (const [k, b] of Object.entries(c.blanks)) if (x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 40 && y <= b.y + b.h + 4) (c.used = c.used || new Set()).add(k); };

  /* ---------- transitions ---------- */
  const PUSH = .24, SPLAT = .2;
  function splat(ctx, cx, r) {
    ctx.fillStyle = '#f4f1fb'; ctx.beginPath(); ctx.arc(cx, H / 2, 1250 * r, 0, 7); ctx.fill();
    const GA = 2.39996;
    for (let i = 0; i < 12; i++) { const a = i * GA, d = 900 * r; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d * 1.05, H / 2 + Math.sin(a) * d * .85, (150 + 110 * hash(i)) * r, 0, 7); ctx.fill(); }
    for (let i = 0; i < 10; i++) { const a = i * GA + 1, d = 1180 * r; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, H / 2 + Math.sin(a) * d * .8, (26 + 30 * hash(i + 40)) * r, 0, 7); ctx.fill(); }
  }
  function drawShot(i, t, ctx) {
    const s = MI.shots[i], g = { t, st: s.st, en: s.en, d: t - s.st, dur: s.en - s.st, ctx };
    MI.ctx = ctx; MI.now = t; ctx.save();
    ctx.fillStyle = '#1f2a48'; ctx.fillRect(0, 0, W, H);
    s.fn(g); MI.uncam(g);
    ctx.restore();
  }

  /* ---------- one frame ---------- */
  MI.seek = (t, ctx = MI.main) => {
    t = clamp(t, 0, MI.END);
    let i = 0; for (let k = 0; k < MI.shots.length; k++) if (MI.shots[k].st <= t) i = k;
    const s = MI.shots[i], dt = t - s.st;
    if (i > 0 && s.trans === 'push' && dt < PUSH) {
      const p = inout(dt / PUSH);
      ctx.save(); ctx.translate(-p * W, 0); drawShot(i - 1, t, ctx); ctx.restore();
      ctx.save(); ctx.translate((1 - p) * W, 0); drawShot(i, t, ctx); ctx.restore();
    } else drawShot(i, t, ctx);
    /* chapter splat is drawn over the seam on both sides */
    const nx = MI.shots[i + 1];
    if (nx && nx.trans === 'splat' && nx.st - t < SPLAT) splat(ctx, W / 2 - 120, inout(1 - (nx.st - t) / SPLAT));
    if (i > 0 && s.trans === 'splat' && dt < SPLAT) splat(ctx, W / 2 + 140, inout(1 - dt / SPLAT));
    MI.t = t;
  };

  /* Render with 4 motion-blur subframes over half a frame; returns a data URL */
  let acc = null;
  MI.frame = (t, fps = 30, sub = 4, q = .97) => {
    if (sub <= 1) { MI.seek(t); return MI.main.canvas.toDataURL('image/jpeg', q); }
    if (!acc) { const c = document.createElement('canvas'); c.width = OW; c.height = OH; acc = c.getContext('2d'); }
    for (let i = 0; i < sub; i++) {
      MI.seek(t + (i / sub) * (.5 / fps));
      acc.globalAlpha = 1 / (i + 1); acc.drawImage(MI.main.canvas, 0, 0);
    }
    acc.globalAlpha = 1;
    return acc.canvas.toDataURL('image/jpeg', q);
  };

  /* ---------- pre-render checks: run on the dry pass, printed by the renderer ---------- */
  MI.report = [];
  const warn = (s, msg) => MI.report.push(`${s ? s.st.toFixed(1) + ' s [' + s.name + ']: ' : ''}${msg}`);
  MI.regRect = (kind, x, y, w, h, label) => {
    if (!MI._dry || !MI._cur) return; const m = MI.ctx.getTransform(), a = m.transformPoint(new DOMPoint(x, y)), b = m.transformPoint(new DOMPoint(x + w, y + h));
    (MI._cur.rects = MI._cur.rects || []).push({ kind, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y), label });
  };
  /* does a line cross a text box? sampled along its length */
  const segRect = (l, r) => { for (let i = 0; i <= 40; i++) { const x = l.x1 + (l.x2 - l.x1) * i / 40, y = l.y1 + (l.y2 - l.y1) * i / 40; if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true; } return false; };
  MI.regLine = (x1, y1, x2, y2, label) => { if (!MI._dry || !MI._cur) return; const m = MI.ctx.getTransform(), a = m.transformPoint(new DOMPoint(x1, y1)), b = m.transformPoint(new DOMPoint(x2, y2)); (MI._cur.lines = MI._cur.lines || []).push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, label: label.toUpperCase() }); };
  function runChecks() {
    const over = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    MI.shots.forEach((s, i) => {
      const d = s.en - s.st, rects = s.rects || [], faces = rects.filter(r => r.kind === 'face');
      if (d > 5) warn(s, `held ${d.toFixed(1)} s, nothing may hold this long`);
      if (i && s.plate && s.plate === MI.shots[i - 1].plate && !s.same) warn(s, 'same place as the previous shot (pass same:true if it is a planned angle change)');
      if (s.plate && s.plate.source === 'image' && s.zoom > 1.33) warn(s, `zoom ${s.zoom.toFixed(2)} on an image plate will look soft`);
      rects.filter(r => r.kind === 'text').forEach(r => {
        if (r.x < MI.COLUMN[0] || r.y < 0 || r.x + r.w > MI.COLUMN[1] || r.y + r.h > 1080) warn(s, `text off screen: "${r.label}"`);
        if (faces.some(f => over(r, f))) warn(s, `text over a face: "${r.label}"`);
        if (r.end > s.en + .05) warn(s, `text still typing when the shot ends: "${r.label}"`);
      });
      (s.lines || []).forEach(l => { const hit = rects.filter(r => r.kind === 'text' && r.label !== l.label && segRect(l, r)); hit.forEach(r => warn(s, `tag line for "${l.label}" crosses text "${r.label}"`)); });
      (s.floaters || []).forEach(y => warn(s, `feet at y ${y.toFixed(0)} are above the floor line ${s.floorY}`));
    });
    const tt = [0, ...[...MI.EV.map(e => e.t), ...MI.shots.map(s => s.st)].sort((a, b) => a - b), MI.END]; let last = 0;
    for (const x of tt) { if (x - last > 4) warn(null, `${last.toFixed(1)} to ${x.toFixed(1)} s: nothing new arrives for ${(x - last).toFixed(1)} s`); last = x; }
    const places = new Set(MI.shots.map(s => s.plate).filter(Boolean)).size, mins = MI.END / 60;
    /* The film must not read as a slideshow: one person beside one sign, shot after shot, passes every check above. */
    const S = MI.shots, lead = s => (s.cast || []).slice().sort((a, b) => b.h - a.h)[0];
    const runs = (same, n, say) => { let i = 0; while (i < S.length) { let j = i; while (j + 1 < S.length && same(S[j], S[j + 1])) j++; if (j - i + 1 >= n) warn(S[i], say(j - i + 1)); i = j + 1; } };
    runs((a, b) => { const p = lead(a), q = lead(b); return p && q && Math.abs(p.x - q.x) < 170 && Math.abs(p.h - q.h) < p.h * .2; }, 4, n => `${n} shots in a row with the main person in the same spot at the same size: move them, change the size, or use another angle`);
    runs((a, b) => a.camKey && a.camKey === b.camKey, 3, n => `${n} shots in a row with the same camera move`);
    if (S.length >= 10) {
      const thin = S.filter(s => (s.cast || []).length <= 1 && !(s.used && s.used.size)).length;
      if (thin / S.length > .35) warn(null, `${Math.round(100 * thin / S.length)}% of shots are at most one person plus text, with nothing happening (the limit is 35%). Act the line: props, other people, tags, stamps, things that move`);
      const sig = {}; S.forEach(s => { const k = [(s.cast || []).length, [...(s.used || [])].sort().join('+'), (lead(s) || {}).x > 960]; sig[k] = (sig[k] || 0) + 1; });
      const top = Math.max(...Object.values(sig)); if (top / S.length > .4) warn(null, `${Math.round(100 * top / S.length)}% of shots share one recipe. Shots are built from what each line says, not from one helper`);
    }
    if (MI.EV.length / mins < 30) warn(null, `${Math.round(MI.EV.length / mins)} sound events a minute, about 60+ is normal. Things arriving on screen should land with a sound`);
    /* Place names can differ while the picture does not: compare what each background actually looks like, very small. */
    const looks = []; let lookOf = new Map();
    [...new Set(S.map(s => s.plate).filter(p => p && p.thumb))].forEach(p => { const d = p.thumb(); let hit = looks.find(l => { let t = 0; for (let k = 0; k < d.length; k += 4) t += Math.abs(d[k] - l.d[k]) + Math.abs(d[k + 1] - l.d[k + 1]) + Math.abs(d[k + 2] - l.d[k + 2]); return t / (d.length / 4 * 3) < 18; }); if (!hit) looks.push(hit = { d, n: 0 }); lookOf.set(p, hit); });
    S.forEach(s => { const l = lookOf.get(s.plate); if (l) l.n++; });
    const topLook = looks.length ? Math.max(...looks.map(l => l.n)) / S.length : 0;
    const silent = S.filter(s => s.sfx === false).length / Math.max(1, S.length);
    const snd = {}; MI.EV.forEach(e => { if (!['tick', 'typing'].includes(e.name)) snd[e.name] = (snd[e.name] || 0) + 1; }); const sndN = Object.values(snd).reduce((a, b) => a + b, 0), topSnd = Object.entries(snd).sort((a, b) => b[1] - a[1])[0] || ['', 0];
    const cutMoves = S.filter((s, i) => i && !s.same && s.trans === 'cut' && s.place !== S[i - 1].place).length / Math.max(1, S.length);
    MI.stats = { minutes: +mins.toFixed(2), shots: MI.shots.length, places, perMinute: +(places / mins).toFixed(1), events: MI.EV.length, looks: looks.length, topLook: +topLook.toFixed(2), silent: +silent.toFixed(2), topSound: topSnd[0], topSoundShare: +(topSnd[1] / Math.max(1, sndN)).toFixed(2), cutMoves: +cutMoves.toFixed(2) };
    if (S.length >= 60) {
      if (looks.length < places * .5 || topLook > .2) warn(null, `${places} place names, but only ${looks.length} look different, and one look fills ${Math.round(topLook * 100)}% of shots. Options on one drawing function are one place to a viewer. Change the structure, the colours, the angle, the world: indoors, close-ups, night, other buildings, objects at giant size`);
      if (silent > .25) warn(null, `${Math.round(silent * 100)}% of shots switch sound off with sfx:false, which also removes the soft whoosh on scene changes. Use it only on the few moves that need silence`);
      if (cutMoves > .3) warn(null, `${Math.round(cutMoves * 100)}% of shots cut hard to a new place. Moves between places normally push; a cut is for a new angle or a deliberate shock`);
    }
    if (sndN >= 100 && topSnd[1] / sndN > .6) warn(null, `${Math.round(topSnd[1] / sndN * 100)}% of sounds are "${topSnd[0]}". One repeated sound becomes a tic, so give the things on screen their own sounds`);
    if (places / mins < 8) warn(null, `${(places / mins).toFixed(1)} places a minute, the budget is about 10`);
  }

  /* notes which drawing helpers a shot used, in the dry pass only */
  MI.counted = (k, f) => { const w = (...a) => { if (MI._dry && MI._cur) (MI._cur.used = MI._cur.used || new Set()).add(k); return f(...a); }; w._c = 1; return w; };

  /* ---------- boot ---------- */
  MI.boot = async (canvas, end) => {
    canvas.width = W; canvas.height = H; MI.main = canvas.getContext('2d');
    MI.shots.sort((a, b) => a.st - b.st);
    if (MI.shots.length) MI.shots[0].st = 0;
    const last = MI.words.length ? MI.words[MI.words.length - 1].e : 10;
    MI.END = end || last + .9;
    MI.shots.forEach((s, i) => { s.en = i + 1 < MI.shots.length ? MI.shots[i + 1].st : MI.END; });
    /* dry pass: every primitive registers its sound without needing the frame to be visible */
    const c = document.createElement('canvas'); c.width = 16; c.height = 9; const dry = c.getContext('2d');
    MI._dry = true;
    [[MI.prop, []], [MI.K, ['sign', 'click', 'face']]].forEach(([o, skip]) => Object.keys(o || {}).forEach(k => { if (!skip.includes(k) && !o[k]._c) o[k] = MI.counted(k, o[k]); }));
    MI.shots.forEach((s, i) => {
      MI._cur = s; try { drawShot(i, s.en - .001, dry); } catch (e) { MI._dry = false; throw new Error(`Shot at ${s.st.toFixed(1)} s [${s.name}]: ${e.message}`); }
      if (i > 0 && s.sfx) MI.ev(s.sfx, s.st - .02);   /* {sfx:'whoosh'} forces a sound on this move, {sfx:false} silences it */
      if (i > 0 && s.trans === 'splat') MI.ev('whoosh', s.st - .2);
    });
    /* Soft whoosh on the bigger scene changes only: a new place, at a pause in the voice, at least 14 s after the last one.
       A sound on every move became a tic (226 in 11 minutes); none felt empty. The user chose this by ear between the two. */
    { const base = s => String(s.place || '').split(':')[0].replace(/[A-Z]$/, ''), big = MI.EV.filter(e => e.name === 'whoosh').map(e => e.t); let last = -99;
      MI.shots.forEach((s, i) => { if (!i || s.sfx !== undefined || s.i0 === undefined || !s.place || !s.i0) return; const t = s.st - .02, gap = MI.words[s.i0].s - MI.words[s.i0 - 1].e;
        if (base(s) !== base(MI.shots[i - 1]) && gap >= .28 && t - last >= 14) { last = t; if (big.every(x => Math.abs(x - t) > 4)) { MI._cur = s; MI.ev('swish', t); } } }); }
    MI._dry = false;
    MI._cur = null; MI.EV.sort((a, b) => a.t - b.t); runChecks();
    if (V) { canvas.width = OW; canvas.height = OH; MI.main = canvas.getContext('2d'); MI.main.setTransform(VS, 0, 0, VS, -VX * VS, 0); }
    window.END = MI.END; window.EV = MI.EV; window.READY = MI.READY = true;
    window.seek = MI.seek;
  };
})();
