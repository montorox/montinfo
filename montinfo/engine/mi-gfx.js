/* MontInfo graphics kit. All text lives on things in the world, typed letter by letter. */
(function () {
  const { clamp, lerp, inout, outc, inc, pop, spring, kick } = MI;
  const C = MI.C = { ink: '#2b2d42', red: '#d62828', orange: '#f4a261', gold: '#f6b93b', green: '#2fb37a', navy: '#1f2a48', tomato: '#e2552f', purple: '#5b3fa6', grey: '#8a8c9c', white: '#ffffff' };
  const F = (s, w = 900) => `${w} ${s}px Montserrat, sans-serif`;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const scaleAt = (ctx, x, y, s, rot = 0) => { ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-x, -y); };

  /* ---------- type: 28 letters/s (34 for tags); each letter starts 1.45x and 0.7 em right, settles in .18 s ---------- */
  const widths = new Map();
  const mw = (ctx, s) => { const k = ctx.font + '|' + s; let v = widths.get(k); if (v === undefined) { v = ctx.measureText(s).width; widths.set(k, v); } return v; };
  MI.typeDur = (str, cps = 28) => str.length / cps + .18;
  MI.type = (str, x, y, o = {}) => {
    const ctx = MI.ctx, t = MI.now, size = o.size || 44, cps = o.cps || 28, st = o.start ?? 0, sound = o.sound !== false;
    if (o.caps !== false) str = str.toUpperCase();
    ctx.save(); ctx.font = F(size, o.weight || 900); ctx.fillStyle = o.color || C.ink; ctx.textBaseline = o.base || 'alphabetic';
    const total = mw(ctx, str); let x0 = x;
    if (o.align === 'center') x0 = x - total / 2; else if (o.align === 'right') x0 = x - total;
    ctx.textAlign = 'left';
    MI.markUsed(x0, y); if (MI._dry) { MI.regRect('text', x0, y - size, total, size * 1.2, str); const rs = MI._cur && MI._cur.rects; if (rs && rs.length) rs[rs.length - 1].end = st + str.length / cps; }
    for (let i = 0; i < str.length; i++) {
      const ts = st + i / cps;
      if (sound && str[i] !== ' ' && i % 2 === 0) MI.ev('tick', ts);
      const p = (t - ts) / .18; if (p <= 0) continue;
      const e = outc(p), s = lerp(1.45, 1, e), dx = lerp(.7 * size, 0, e);
      const lx = x0 + mw(ctx, str.slice(0, i));
      ctx.save(); ctx.translate(lx + dx, y); ctx.scale(s, s); ctx.fillText(str[i], 0, 0); ctx.restore();
    }
    ctx.restore(); return st + str.length / cps + .18;
  };
  MI.fontOf = F;
  /* Greedy line break that also picks the largest size that fits a box */
  MI.fit = (str, w, h, o = {}) => {
    const ctx = MI.ctx; str = str.toUpperCase(); ctx.save();
    let size = o.max || 64, lines = [];
    for (; size >= (o.min || 16); size -= 2) {
      ctx.font = F(size); lines = []; let line = '';
      for (const word of str.split(' ')) { const tr = line ? line + ' ' + word : word; if (ctx.measureText(tr).width > w && line) { lines.push(line); line = word; } else line = tr; }
      lines.push(line);
      const lh = size * 1.18;
      if (lines.length * lh <= h && lines.every(l => ctx.measureText(l).width <= w)) break;
    }
    ctx.restore(); return { size, lines, lh: size * 1.18 };
  };
  /* Write typed lines onto a blank rect of the plate. Throws if the text cannot fit. */
  MI.write = (blank, str, o = {}) => {
    const pad = o.pad ?? Math.min(blank.w * .08, blank.h * .14), f = MI.fit(str, blank.w - pad * 2, blank.h - pad * 1.2, o);
    if (!MI._dry && f.size < (o.min || 16)) throw new Error('Text too long for blank: ' + str);
    const y0 = blank.y + blank.h / 2 - (f.lines.length * f.lh) / 2 + f.size * .82; let st = o.start ?? 0;
    f.lines.forEach((l, i) => { const end = MI.type(l, blank.x + blank.w / 2, y0 + i * f.lh, { ...o, size: f.size, align: 'center', start: st, cps: o.cps || 28 }); st = end + .12; });
    return st;
  };

  /* ---------- cards & signs ---------- */
  const softShadow = (ctx, blur = 22, y = 8, a = .22) => { ctx.shadowColor = `rgba(20,20,40,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = y; };
  const noShadow = ctx => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

  function infoCard(label, value, icon, st, o = {}) {
    const ctx = MI.ctx, t = MI.now, x = o.x ?? 70, y = o.y ?? 70, h = 120;
    if (t < st) { if (MI._dry) MI.ev('pop', st); return; }
    MI.ev('pop', st); ctx.save(); ctx.font = F(44); const wv = ctx.measureText(value.toUpperCase()).width;
    const w = Math.max(330, wv + 150), s = pop((t - st) / .32); scaleAt(ctx, x + 60, y + h / 2, s);
    softShadow(ctx); ctx.fillStyle = C.white; rr(ctx, x, y, w, h, 18); ctx.fill(); noShadow(ctx);
    icon(ctx, x + 56, y + 60);
    ctx.font = F(26); ctx.fillStyle = C.grey; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, x + 108, y + 46);
    MI.type(value, x + 108, y + 94, { size: 44, start: st + .22, cps: 28 });
    ctx.restore();
  }
  MI.dateCard = (value, st, o) => infoCard('DATE:', value, (c, x, y) => {
    c.fillStyle = C.orange; rr(c, x - 30, y - 30, 60, 60, 10); c.fill();
    c.fillStyle = C.white; rr(c, x - 22, y - 12, 44, 34, 5); c.fill();
    c.fillStyle = C.orange; [-12, 2, 14].forEach(d => { c.fillRect(x + d - 4, y - 4, 8, 8); c.fillRect(x + d - 4, y + 8, 8, 8); });
    c.fillStyle = '#c9783d'; c.fillRect(x - 14, y - 38, 8, 16); c.fillRect(x + 6, y - 38, 8, 16);
  }, st, o);
  MI.placeCard = (value, st, o) => infoCard('PLACE:', value, (c, x, y) => {
    c.fillStyle = C.red; c.beginPath(); c.arc(x, y - 8, 24, Math.PI, 0); c.lineTo(x, y + 32); c.closePath(); c.fill();
    c.fillStyle = C.white; c.beginPath(); c.arc(x, y - 8, 9, 0, 7); c.fill();
  }, st, o);

  /* Board: drops 420 px on the spring and swings .25 rad; or stands on a post and swings up */
  MI.board = (x, y, w, h, lines, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st) return;
    const d = t - st, sp = spring(d);
    ctx.save();
    if (o.post) {
      const base = y + h; ctx.fillStyle = '#8a6a4a'; ctx.translate(x + w / 2, base + (o.postH || 240));
      ctx.rotate(lerp(-1, 0, sp)); ctx.translate(-x - w / 2, -base - (o.postH || 240));
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x + w / 2 - 12, base - 6, 24, (o.postH || 240) + 6);
    } else { ctx.translate(x + w / 2, y); ctx.rotate(lerp(.25, 0, sp)); ctx.translate(-x - w / 2, -y); ctx.translate(0, lerp(-420, 0, sp)); }
    softShadow(ctx); ctx.fillStyle = C.white; rr(ctx, x, y, w, h, 20); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = 'rgba(40,40,70,.08)'; rr(ctx, x, y + h - 14, w, 14, [0, 0, 20, 20]); ctx.fill();
    const f = MI.fit(lines.join(' '), w * .84, h * .8, { max: o.max || 60 });
    let ly = y + h / 2 - f.lines.length * f.lh / 2 + f.size * .82, ts = st + .35;
    f.lines.forEach(l => { const end = MI.type(l, x + w / 2, ly, { size: f.size, align: 'center', start: ts, color: o.color }); ts = end + .3; ly += f.lh; });
    ctx.restore();
  };

  /* Tag: a 6 px line with a dot at the thing, drawn in .2 s, then a pill pops on its end */
  MI.tag = (tx, ty, ex, ey, text, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now, col = o.color || C.ink; MI.ev('pop', st + .2); MI.regLine(tx, ty, ex, ey, text); if (t < st) return;
    const p = inout((t - st) / .2), mx = lerp(tx, ex, p), my = lerp(ty, ey, p);
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(mx, my); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, ty, 10 * outc(p * 3), 0, 7); ctx.fill();
    if (t > st + .2) {
      const s = pop((t - st - .2) / .3), size = o.size || 40; ctx.font = F(size);
      const up = text.toUpperCase(), w = ctx.measureText(up).width + 56, h = size + 34;
      const cx = ex + (o.side === 'left' ? -w / 2 : o.side === 'right' ? w / 2 : 0), cy = ey + (o.side ? 0 : (ey < ty ? -h / 2 : h / 2));
      scaleAt(ctx, ex, ey, s);
      ctx.fillStyle = col; rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
      MI.type(up, cx - w / 2 + 28, cy + size * .36, { size, cps: 34, start: st + .24, color: o.textColor || C.white, sound: false });
    }
    ctx.restore();
  };

  /* Number card: small grey label, big red number that rolls up with ease-out */
  MI.numberCard = (x, y, label, value, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st) return;
    const size = o.size || 88, prefix = o.prefix || '', suffix = o.suffix || '', dur = o.roll ?? .9;
    const show = prefix + Math.round(value * outc((t - st) / dur)).toLocaleString('en-US') + suffix;
    ctx.save(); ctx.font = F(size); const w = Math.max(ctx.measureText(prefix + value.toLocaleString('en-US') + suffix).width + 70, 300), h = size + 92;
    scaleAt(ctx, x + w / 2, y + h / 2, pop((t - st) / .32));
    softShadow(ctx); ctx.fillStyle = C.white; rr(ctx, x, y, w, h, 18); ctx.fill(); noShadow(ctx);
    ctx.font = F(26); ctx.fillStyle = C.grey; ctx.textAlign = 'center'; ctx.fillText(label.toUpperCase(), x + w / 2, y + 46);
    ctx.font = F(size); ctx.fillStyle = o.color || C.red; ctx.fillText(show, x + w / 2, y + 46 + size * .98); ctx.restore();
  };

  /* Red X: two round 30 px strokes, .11 s each, .01 s apart, soft shadow */
  MI.redX = (x, y, size, st) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('hit', st); if (t < st) return;
    ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 30; ctx.lineCap = 'round'; softShadow(ctx, 12, 5, .3);
    const a = outc((t - st) / .11), b = outc((t - st - .12) / .11), s = size / 2;
    ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s + 2 * s * a, y - s + 2 * s * a); ctx.stroke();
    if (b > 0) { ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s - 2 * s * b, y - s + 2 * s * b); ctx.stroke(); }
    ctx.restore();
  };

  /* Stamp: red, double rounded border, -0.12 rad, slams 2.1x to 1x in .14 s, then kicks */
  MI.stamp = (x, y, text, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('thud', st + .14); if (t < st) return;
    const d = t - st, s = d < .14 ? lerp(2.1, 1, inc(d / .14)) : kick(d - .14), size = o.size || 72, col = o.color || C.red, up = text.toUpperCase();
    ctx.save(); scaleAt(ctx, x, y, s, -.12); ctx.font = F(size); const w = ctx.measureText(up).width + 70, h = size + 46;
    ctx.globalAlpha = clamp(d / .05);
    if (o.back !== false) { ctx.fillStyle = 'rgba(255,255,255,.93)'; rr(ctx, x - w / 2, y - h / 2, w, h, 16); ctx.fill(); }
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = 8; rr(ctx, x - w / 2, y - h / 2, w, h, 16); ctx.stroke();
    ctx.lineWidth = 3; rr(ctx, x - w / 2 + 11, y - h / 2 + 11, w - 22, h - 22, 9); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(up, x, y + size * .36); MI.regRect('text', x - w / 2, y - h / 2, w, h, up); ctx.restore();
  };

  /* Banner: full-width headline band, 92 px white caps on tomato or purple, -0.02 rad, slides in .22 s */
  MI.banner = (y, text, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('whoosh', st); if (t < st) return;
    const p = outc((t - st) / .22); ctx.save(); ctx.translate(lerp(-2100, 0, p), 0); ctx.translate(960, y); ctx.rotate(-.02); ctx.translate(-960, -y);
    ctx.fillStyle = o.color || C.tomato; ctx.fillRect(-60, y - 78, 2040, 156);
    ctx.font = F(92); ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.fillText(text.toUpperCase(), 960, y + 33); ctx.restore();
  };

  MI.bubble = (x, y, w, h, text, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st) return;
    const tx = o.tailX ?? x + w * .25, ty = o.tailY ?? y + h + 44;
    ctx.save(); scaleAt(ctx, tx, ty, pop((t - st) / .3)); softShadow(ctx, 16, 6, .18); ctx.fillStyle = C.white;
    rr(ctx, x, y, w, h, 36); ctx.fill(); noShadow(ctx);
    const base = clamp(tx, x + 50, x + w - 50);
    ctx.beginPath(); ctx.moveTo(base - 28, y + h - 4); ctx.lineTo(tx, ty); ctx.lineTo(base + 28, y + h - 4); ctx.closePath(); ctx.fill();
    const f = MI.fit(text, w * .86, h * .8, { max: o.max || 44 }); let ly = y + h / 2 - f.lines.length * f.lh / 2 + f.size * .82, ts = st + .2;
    f.lines.forEach(l => { const e = MI.type(l, x + w / 2, ly, { size: f.size, align: 'center', start: ts, cps: 34, sound: false }); ts = e; ly += f.lh; });
    ctx.restore();
  };
  MI.thought = (x, y, w, h, text, st, o = {}) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st) return;
    ctx.save(); scaleAt(ctx, x + w / 2, y + h / 2, pop((t - st) / .3)); ctx.fillStyle = C.white; softShadow(ctx, 14, 5, .16);
    rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.tailX ?? x + w * .3, y + h + 26, 20, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc((o.tailX ?? x + w * .3) - 12, y + h + 66, 12, 0, 7); ctx.fill(); noShadow(ctx);
    const f = MI.fit(text, w * .82, h * .72, { max: 40 }); let ly = y + h / 2 - f.lines.length * f.lh / 2 + f.size * .82;
    f.lines.forEach(l => { MI.type(l, x + w / 2, ly, { size: f.size, align: 'center', start: st + .2, cps: 34, sound: false }); ly += f.lh; });
    ctx.restore();
  };
  /* Orange ? that bobs and sways, orange ! pop */
  MI.qmark = (x, y, st, en = 1e9, size = 110) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st || t > en) return;
    ctx.save(); ctx.translate(x, y + 8 * Math.sin(t * 4)); ctx.rotate(.13 * Math.sin(t * 2.6)); ctx.scale(pop((t - st) / .3), pop((t - st) / .3));
    ctx.font = F(size); ctx.textAlign = 'center'; ctx.fillStyle = C.orange; ctx.fillText('?', 0, 0); ctx.restore();
  };
  MI.bang = (x, y, st, dur = 1, size = 130) => {
    const ctx = MI.ctx, t = MI.now; MI.ev('pop', st); if (t < st || t > st + dur + .25) return;
    const s = t > st + dur ? 1 - inc((t - st - dur) / .25) : pop((t - st) / .3);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(.06); ctx.font = F(size); ctx.textAlign = 'center'; ctx.fillStyle = C.orange; ctx.fillText('!', 0, 0); ctx.restore();
  };
  MI.puff = (x, y, st, size = 90, o = {}) => {
    const ctx = MI.ctx, t = MI.now, d = t - st; if (d < 0 || d > .55) return;
    ctx.save(); ctx.fillStyle = o.color || '#fff'; const p = outc(d / .55);
    for (let i = 0; i < 7; i++) { const a = i * 2.39996 + 1, r = size * (.35 + .75 * p); ctx.globalAlpha = 1 - inc(d / .55); ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * .65, size * (.34 - .18 * p) * (.7 + .5 * MI.hash(i)), 0, 7); ctx.fill(); }
    ctx.restore();
  };
  MI.speedLines = (x, y, w, h, dir = 1, a = .5) => {
    const ctx = MI.ctx, t = MI.now; ctx.save(); ctx.fillStyle = `rgba(255,255,255,${a})`;
    for (let i = 0; i < 7; i++) { const yy = y + h * MI.hash(i), l = w * (.4 + .6 * MI.hash(i + 9)), o = ((t * 900 + i * 300) % (w + l)) - l; ctx.fillRect(x + dir * o, yy, l, 5); }
    ctx.restore();
  };
  MI.sweat = (x, y, st, en) => {
    const ctx = MI.ctx, t = MI.now; if (t < st || t > en) return; ctx.save(); ctx.fillStyle = '#9fd6ee';
    for (let i = 0; i < 3; i++) { const p = ((t - st) * 1.5 + i * .33) % 1, xx = x + (i - 1) * 34 + 40 * p * (i - 1), yy = y + 70 * p * p; ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.moveTo(xx, yy - 18); ctx.quadraticCurveTo(xx + 12, yy + 2, xx, yy + 8); ctx.quadraticCurveTo(xx - 12, yy + 2, xx, yy - 18); ctx.fill(); }
    ctx.restore();
  };
  MI.coins = (x, y, st, n = 10, o = {}) => {
    const ctx = MI.ctx, t = MI.now; if (t < st) return; if (n) MI.ev('ding', st);
    for (let i = 0; i < n; i++) {
      const d = t - st - i * .05; if (d < 0) continue; const vx = (MI.hash(i) - .5) * (o.spread || 700), vy = -500 - 400 * MI.hash(i + 3), g = 1300;
      const yy = y + vy * d + .5 * g * d * d; if (yy > (o.floor || 1200)) continue;
      ctx.save(); ctx.translate(x + vx * d, yy); ctx.scale(Math.abs(Math.cos(d * 9 + i)) * .8 + .2, 1); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 7); ctx.fill(); ctx.fillStyle = '#d99a22'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.restore();
    }
  };
  MI.vignette = (a = .22) => { const ctx = MI.ctx, g = ctx.createRadialGradient(960, 540, 500, 960, 540, 1180); g.addColorStop(0, 'rgba(15,18,40,0)'); g.addColorStop(1, `rgba(15,18,40,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); };
  MI.tint = (col, a) => { const ctx = MI.ctx; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, 1920, 1080); ctx.restore(); };
})();
