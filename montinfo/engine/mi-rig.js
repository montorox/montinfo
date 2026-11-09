/* MontInfo rig: one puppet format, fed by code art or by cut-up images.
   A rig holds sprites and joints in a shared sprite space where the feet sit at y = H. */
(function () {
  const { clamp, lerp, inout, spring, hash } = MI;
  const POSES = {
    down: { l: [-.04, .97], r: [.04, .97] },
    rest: { l: [-.07, .93], r: [.07, .93] },
    hips: { l: [-.42, .55, 'fist'], r: [.42, .55, 'fist'] },
    point: { l: [-.07, .93], r: [.86, -.32, 'point'] },
    pointl: { l: [-.86, -.32, 'point'], r: [.07, .93] },
    pointdown: { l: [-.07, .93], r: [.8, .45, 'point'] },
    present: { l: [-.07, .93], r: [.75, .25, 'open'] },
    presentl: { l: [-.75, .25, 'open'], r: [.07, .93] },
    shrug: { l: [-.62, .12, 'open'], r: [.62, .12, 'open'] },
    up: { l: [-.32, -.9, 'open'], r: [.32, -.9, 'open'] },
    head: { l: [-.3, -.8, 'open'], r: [.3, -.8, 'open'] },
    chin: { l: [-.07, .93], r: [-.42, -.14, 'fist'] },
    hold: { l: [.42, .45], r: [-.42, .45] },
    wave: { l: [-.07, .93], r: [.5, -.75, 'open'] },
    stop: { l: [-.07, .93], r: [.55, -.1, 'open'] },
    cheer: { l: [-.55, -.75, 'fist'], r: [.55, -.75, 'fist'] },
    typing: { l: [.42, .3], r: [-.42, .3] },
  };
  MI.POSES = POSES;
  const darker = (rgb, k) => `rgb(${rgb.map(v => Math.round(v * k)).join(',')})`;
  const css = rgb => `rgb(${rgb.join(',')})`;

  /* two-bone IK; bend = +1 elbow to the outside-below for that side */
  function ik(sx, sy, tx, ty, L1, L2, bend, side) {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const max = (L1 + L2) * .995, min = Math.abs(L1 - L2) + 1;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; } if (d < min) { dx *= min / d; dy *= min / d; d = min; }
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const mx = sx + dx * a / d, my = sy + dy * a / d;
    /* with a side given, the elbow takes whichever solution sits outward and low: arms never cross the chest by accident */
    if (side) { const score = b => side * (mx - b * h * dy / d) + .55 * (my + b * h * dx / d); bend = score(1) >= score(-1) ? 1 : -1; }
    return { ex: mx - bend * h * dy / d, ey: my + bend * h * dx / d, hx: sx + dx, hy: sy + dy };
  }
  function capsule(ctx, x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  /* Hands: mitt, open, fist, point */
  function hand(ctx, x, y, ang, kind, s, col, shade) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s); ctx.fillStyle = col;
    if (kind === 'fist') { ctx.beginPath(); ctx.arc(4, 0, 15, 0, 7); ctx.fill(); ctx.fillStyle = shade; ctx.beginPath(); ctx.ellipse(8, 7, 7, 4, .4, 0, 7); ctx.fill(); }
    else if (kind === 'point') {
      ctx.beginPath(); ctx.arc(2, 0, 14, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(4, -6, 32, 11, 5.5); ctx.fill();
      ctx.fillStyle = shade; ctx.beginPath(); ctx.ellipse(5, 8, 7, 4, .2, 0, 7); ctx.fill();
    } else if (kind === 'open') {
      ctx.beginPath(); ctx.roundRect(-4, -13, 22, 26, 9); ctx.fill();
      [-10, -3.5, 3, 9.5].forEach(o => { ctx.beginPath(); ctx.roundRect(12, o - 2.8, 16 - Math.abs(o + .5) * .35, 6.4, 3.2); ctx.fill(); });
      ctx.save(); ctx.translate(5, 12); ctx.rotate(.9); ctx.beginPath(); ctx.roundRect(0, -3.5, 15, 7.5, 3.7); ctx.fill(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.roundRect(-5, -13, 30, 26, 13); ctx.fill();
      ctx.save(); ctx.translate(4, 11); ctx.rotate(.8); ctx.beginPath(); ctx.roundRect(0, -4, 15, 8, 4); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  /* value of a [[t,value],...] track at time t, plus when it last changed */
  function trackAt(tr, t, dflt) { let v = dflt, prev = dflt, at = -99; if (tr) for (const [k, val] of tr) if (t >= k) { prev = v; v = val; at = k; } return { v, prev, at }; }
  function inRanges(rs, t) { if (rs) for (const r of rs) if (t >= r[0] && t <= r[1]) return r; return null; }
  /* piecewise x from [[t0,x0,t1,x1],...]; returns x, walking?, direction, distance walked */
  function pathAt(walk, t, x0) {
    let x = x0, walking = false, dir = 1, dist = 0;
    for (const [a, xa, b, xb] of walk || []) {
      if (t >= b) { x = xb; dist += Math.abs(xb - xa); dir = Math.sign(xb - xa) || dir; }
      else if (t >= a) { const p = (t - a) / (b - a); x = xa + (xb - xa) * p; walking = true; dir = Math.sign(xb - xa) || 1; dist += Math.abs(x - xa); break; }
      else { if (dist === 0) x = xa; break; }
    }
    return { x, walking, dir, dist };
  }

  /* Draw one living figure. o = {x, y(feet), h, poses:[[t,'point']], say:[[a,b]], expr:[[t,'shocked']],
     enter:t, hop:bool, walk:[[t0,x0,t1,x1]], fear:[[a,b]], jump:[t,...], sprite:[[t,'typing']], dark:k, flip:bool} */
  MI.actor = (rig, o) => {
    if (MI._dry && MI._cur) { const w = o.walk && o.walk[o.walk.length - 1]; (MI._cur.cast = MI._cur.cast || []).push({ x: w ? w[3] : o.x, h: o.h }); }
    const ctx = MI.ctx, t = MI.now, s = o.h / rig.H, seed = rig.seed || 1;
    const path = pathAt(o.walk, t, o.x); let x = path.x, y = o.y;
    if (o.enter !== undefined && t < o.enter) return { x, y };
    const entered = o.enter !== undefined ? spring(t - o.enter) : 1;
    if (o.enter !== undefined) MI.ev('pop', o.enter);
    if (o.hop && o.enter !== undefined) { const d = t - o.enter; if (d < .4) y -= Math.sin(clamp(d / .4) * Math.PI) * o.h * .12; }
    const jr = (o.jump || []).find(j => t >= j && t < j + .42);
    if (jr !== undefined) y -= Math.sin(((t - jr) / .42) * Math.PI) * o.h * .13;
    (o.jump || []).forEach(j => MI.ev('pop', j));
    if (inRanges(o.fear, t)) x += Math.sin(t * 34) * o.h * .0035;   /* fast enough to read as fear, slow enough that motion blur keeps her sharp */
    if (MI._dry && MI._cur) {
      MI.regRect('face', x - o.h * .17, y - o.h * .9, o.h * .34, o.h * .33);
      if (MI._cur.floorY && !o.raised && o.y < MI._cur.floorY - 2) (MI._cur.floaters = MI._cur.floaters || []).push(o.y);
    }
    /* contact shadow */
    ctx.save(); ctx.fillStyle = `rgba(25,28,55,${.22 * entered})`; const lift = clamp((o.y - y) / (o.h * .15));
    ctx.beginPath(); ctx.ellipse(x, o.y, o.h * .19 * (1 - .3 * lift), o.h * .03 * (1 - .3 * lift), 0, 0, 7); ctx.fill(); ctx.restore();

    const sprName = trackAt(o.sprite, t, null).v;
    ctx.save(); if (o.dark) ctx.filter = `brightness(${1 - o.dark})`;
    ctx.translate(x, y);
    const breathe = 1 + .009 * Math.sin(2.3 * t + seed);
    /* whole-image poses: only the jitter of a working hand and the breathing are added */
    if (sprName && rig.sprites && rig.sprites[sprName]) {
      const im = rig.sprites[sprName], k = o.h / (rig.spriteH?.[sprName] || im.height) * (rig.spriteScale?.[sprName] || 1), jit = o.jitter ? Math.sin(t * 24) * 3 : 0;
      ctx.scale((o.flip ? -1 : 1) * entered * k, entered * breathe * k); ctx.drawImage(im, -im.width / 2 + jit / k, -im.height); ctx.restore(); return { x, y };
    }
    /* walk */
    if (path.walking && rig.walkSprite) {
      const im = rig.walkSprite, k = o.h / im.height, bob = Math.abs(Math.sin(path.dist / (o.h * .24))) * o.h * .022, rock = .035 * Math.sin(path.dist / (o.h * .24));
      ctx.translate(0, -bob); ctx.rotate(rock); ctx.scale(path.dir * k * (rig.walkFlip ? -1 : 1), k); ctx.drawImage(im, -im.width / 2, -im.height); ctx.restore(); return { x, y };
    }
    const side = path.walking && rig.side;
    const phase = path.dist / (o.h * .24);
    if (path.walking) { ctx.translate(0, -Math.abs(Math.sin(phase)) * o.h * .022); ctx.rotate(.035 * Math.sin(phase)); }
    const dirx = side ? path.dir : (o.flip ? -1 : 1);
    ctx.scale(s * entered * dirx, s * entered * breathe); ctx.translate(-rig.cx, -rig.H);

    const say = inRanges(o.say, t);
    const nod = o.still ? 0 : say ? .025 * Math.sin(7 * t) + .02 * Math.sin(11.3 * t) : .025 * Math.sin(2.1 * t + seed);
    const R = side ? rig.side : rig;

    /* pose blend */
    const pt = trackAt(o.poses, t, o.pose0 || 'rest'), bl = inout((t - pt.at) / (o.blend || .4));
    const A = POSES[pt.prev] || POSES.rest, B = POSES[pt.v] || POSES.rest;
    const L = rig.L1 + rig.L2;
    const armPose = (sideK, sock, sd) => {
      const a = A[sideK], b = B[sideK], tx = lerp(a[0], b[0], bl) * L, ty = lerp(a[1], b[1], bl) * L;
      return { ...ik(sock.x, sock.y, sock.x + tx, sock.y + ty, rig.L1, rig.L2, 1, sd), kind: (bl > .5 ? b[2] : a[2]) || 'mitt' };
    };
    const drawArm = (arm, sock, back) => {
      const sl = back ? darker(rig.sleeve, .82) : css(rig.sleeve), skin = back ? darker(rig.skin, .92) : css(rig.skin), th = rig.armW;
      capsule(ctx, sock.x, sock.y, arm.ex, arm.ey, th, sl);
      const mx = lerp(arm.ex, arm.hx, rig.cuff ?? .55), my = lerp(arm.ey, arm.hy, rig.cuff ?? .55);
      capsule(ctx, arm.ex, arm.ey, arm.hx, arm.hy, th * .86, skin);
      capsule(ctx, arm.ex, arm.ey, mx, my, th * .96, sl);
      hand(ctx, arm.hx, arm.hy, Math.atan2(arm.hy - arm.ey, arm.hx - arm.ex), arm.kind, rig.handS, skin, darker(rig.skin, .84));
    };

    /* legs (code puppets draw them; image puppets have them in the body sprite) */
    if (rig.legs) {
      const lg = rig.legs, hipY = lg.hipY, pants = css(lg.color), pantsD = darker(lg.color, .85), shoe = css(lg.shoe);
      const leg = (hx, ph, col) => {
        const swing = path.walking ? Math.sin(ph) : 0, liftf = path.walking ? Math.max(0, Math.cos(ph)) : 0;
        const fx = hx + swing * lg.len * (side ? .8 : .36), fy = rig.H - lg.shoeH - liftf * lg.len * .16;
        const k = ik(hx, hipY, fx, fy, lg.len / 2, lg.len / 2, side ? -1 : (hx < rig.cx ? -.2 : .2));
        capsule(ctx, hx, hipY, k.ex, k.ey, lg.w, col); capsule(ctx, k.ex, k.ey, k.hx, k.hy, lg.w, col);
        ctx.fillStyle = shoe; const fw = lg.shoeW; ctx.beginPath();
        if (side) ctx.roundRect(k.hx - fw * .3, k.hy - lg.shoeH * .1, fw, lg.shoeH * 1.1, [lg.shoeH * .6, lg.shoeH * .8, 4, 4]);
        else ctx.roundRect(k.hx - fw * (hx < rig.cx ? .62 : .38), k.hy - lg.shoeH * .1, fw, lg.shoeH * 1.1, [lg.shoeH * .7, lg.shoeH * .7, 4, 4]);
        ctx.fill();
      };
      if (side) { leg(rig.cx - lg.gap * .3, phase + Math.PI, pantsD); leg(rig.cx + lg.gap * .3, phase, pants); }
      else { leg(rig.cx - lg.gap, phase, pants); leg(rig.cx + lg.gap, phase + Math.PI, pants); }
    }

    if (side) {
      /* side walk: far arm, body, near arm, all swinging */
      const sock = R.socket; const sw = Math.sin(phase);
      const far = ik(sock.x, sock.y, sock.x - sw * L * .62, sock.y + L * .78, rig.L1, rig.L2, -1);
      drawArm({ ...far, kind: 'mitt' }, sock, true);
      ctx.drawImage(R.body, 0, 0);
      ctx.save(); ctx.translate(R.neck.x, R.neck.y); ctx.rotate(nod); ctx.translate(-R.neck.x, -R.neck.y); ctx.drawImage(R.head, 0, 0); ctx.restore();
      const near = ik(sock.x, sock.y, sock.x + sw * L * .62, sock.y + L * .78, rig.L1, rig.L2, -1);
      drawArm({ ...near, kind: 'mitt' }, sock, false);
      ctx.restore(); return { x, y };
    }

    const armL = armPose('l', rig.socketL, -1), armR = armPose('r', rig.socketR, 1);
    const behind = o.behind || [];
    if (behind.includes('l')) drawArm(armL, rig.socketL, true);
    if (behind.includes('r')) drawArm(armR, rig.socketR, true);
    ctx.drawImage(rig.body, 0, 0);

    /* head with nod, expression, blink and talking mouth */
    const ex = trackAt(o.expr, t, 'neutral').v; const headIm = rig.heads[ex] || rig.heads.neutral;
    ctx.save(); ctx.translate(rig.neck.x, rig.neck.y); ctx.rotate(nod); ctx.translate(-rig.neck.x, -rig.neck.y);
    ctx.drawImage(headIm, 0, 0);
    const skin = css(rig.skin);
    /* blink: every 2.7-4.2 s, seeded per figure, 0.14 s */
    const per = 2.7 + 1.5 * hash(seed), ph = (t + hash(seed + 5) * per) % per;
    if (ph < .14 && !['shocked'].includes(ex)) for (const e of rig.eyes) {
      ctx.fillStyle = skin; ctx.fillRect(e.x - 3, e.y - 3, e.w + 6, e.h + 6);
      ctx.strokeStyle = rig.lash || '#2b2d42'; ctx.lineWidth = Math.max(4, e.h * .28); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x, e.y + e.h * .45); ctx.quadraticCurveTo(e.x + e.w / 2, e.y + e.h * .9, e.x + e.w, e.y + e.h * .45); ctx.stroke();
    }
    /* mouth flap while speaking: opens and closes on the voice */
    if (say && rig.mouth) {
      const m = rig.mouth, open = Math.abs(Math.sin(t * 13) * .6 + Math.sin(t * 7.7) * .4);
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(m.x, m.y + m.h * .25, m.w * .8, m.h * 1.35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = m.color || '#7a2f2f'; ctx.beginPath(); ctx.ellipse(m.x, m.y + m.h * .2, m.w * (.4 + .14 * open), m.h * (.12 + .78 * open), 0, 0, 7); ctx.fill();
    }
    ctx.restore();

    if (!behind.includes('l')) drawArm(armL, rig.socketL, false);
    if (!behind.includes('r')) drawArm(armR, rig.socketR, false);
    ctx.restore();
    return { x, y, head: { x, y: y - o.h * (rig.H - rig.neck.y) / rig.H - o.h * .24 } };
  };
})();
