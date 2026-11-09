/* MontInfo place kit: full illustrated places in the plate's own light.
   Each returns a plate with named blanks. Every blank is known by construction, so text always lands on it.
   Add new places in the project's art.js the same way: MI.PLACES.name = mood => MI.place(c => {...; return blanks}, {floorY}) */
(function () {
  const { rr, el, poly, shade } = MI.draw; const S = MI.set;
  const room = (c, m, floorY = 716) => {
    c.fillStyle = m.ceil; c.fillRect(0, 0, 1920, 90); c.fillStyle = m.wall; c.fillRect(0, 90, 1920, floorY - 90);
    c.fillStyle = m.wallD; c.fillRect(0, 90, 1920, 14); c.fillStyle = m.trim; c.fillRect(0, floorY - 18, 1920, 18);
    c.fillStyle = m.floor; c.fillRect(0, floorY, 1920, 1080 - floorY); c.fillStyle = m.floorD; c.fillRect(0, floorY, 1920, 10);
    c.fillStyle = shade(m.floor, .975); for (let i = 0; i < 7; i++) c.fillRect(0, floorY + 40 + i * i * 8, 1920, 2 + i);
  };
  const shelf = (c, x, y, w, h, m, seed = 1) => {
    rr(c, x, y, w, h, 4, shade(m.dark, 1.1)); const rows = Math.max(2, Math.round(h / 110)), rh = (h - 16) / rows; const pal = [m.accent2, m.counter, '#d9c7a8', '#c9786a', '#7f93b5'];
    for (let r = 0; r < rows; r++) { c.fillStyle = shade(m.dark, .8); c.fillRect(x + 8, y + 8 + r * rh, w - 16, rh - 8); let bx = x + 14, i = 0; while (bx < x + w - 28) { const bw = 14 + 20 * MI.hash(seed + r * 9 + i), bh = (rh - 18) * (.65 + .35 * MI.hash(seed + i * 3 + r)); c.fillStyle = pal[(i + r + seed) % pal.length]; c.fillRect(bx, y + 8 + r * rh + rh - 8 - bh, bw, bh); bx += bw + 3; i++; } }
  };
  const picture = (c, x, y, w, h, m) => { rr(c, x, y, w, h, 3, m.dark); c.fillStyle = shade(m.wall, 1.12); c.fillRect(x + 8, y + 8, w - 16, h - 16); poly(c, [[x + 8, y + h - 8], [x + w * .4, y + h * .4], [x + w * .62, y + h * .66], [x + w * .78, y + h * .5], [x + w - 8, y + h - 8]], m.counter); };
  const desk = (c, x, y, w, m, col) => { const d = col || '#c9a98a'; rr(c, x, y, w, 26, 4, d); c.fillStyle = shade(d, .84); c.fillRect(x + 12, y + 26, w - 24, 8); c.fillRect(x + 22, y + 26, 22, 170); c.fillRect(x + w - 44, y + 26, 22, 170); };
  const P = MI.PLACES; Object.assign(S, { room, shelf, picture, desk });

  P.open_office = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); S.window(c, 110, 130, 520, 330, 3, m); S.window(c, 1300, 130, 520, 330, 3, m);
    rr(c, 700, 130, 520, 300, 5, shade(m.wall, .82)); c.fillStyle = m.board; c.fillRect(712, 142, 496, 276);
    S.pendant(c, 420, 0, 70, 58, m); S.pendant(c, 960, 0, 50, 58, m); S.pendant(c, 1540, 0, 70, 58, m);
    [[60, 560], [640, 560], [1240, 560]].forEach(([x, y], i) => { rr(c, x, y, 520, 150, 8, shade(m.counter, 1.1)); c.fillStyle = shade(m.counter, .94); c.fillRect(x + 260, y + 12, 8, 138); S.monitor(c, x + 60, y - 92, 130, 74, m); S.monitor(c, x + 340, y - 92, 130, 74, m, '#cfe0f0'); });
    S.plant(c, 1860, 620, .7, m); S.lightShaft(c, 200, 200, 726, 1080, 180, m.shaft); S.lightShaft(c, 1400, 200, 726, 1080, -120, m.shaft);
    return { board: { x: 712, y: 142, w: 496, h: 276 } };
  }, { floorY: 730, mood }); };

  P.desk_close = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    c.fillStyle = m.wall; c.fillRect(0, 0, 1920, 1080); c.fillStyle = m.wallD; c.fillRect(0, 0, 1920, 40);
    S.window(c, 60, 90, 390, 500, 2, m);
    /* wall calendar with a blank page */
    rr(c, 1580, 120, 270, 310, 8, '#f6f3ec'); rr(c, 1580, 120, 270, 74, [8, 8, 0, 0], '#d62828'); el(c, 1650, 120, 10, 18, m.dark); el(c, 1780, 120, 10, 18, m.dark);
    /* monitor */
    rr(c, 400, 90, 1120, 680, 22, m.dark); c.fillStyle = '#eef3fa'; c.fillRect(428, 118, 1064, 624); rr(c, 860, 770, 200, 90, 6, shade(m.dark, .85)); rr(c, 730, 850, 460, 28, 10, m.dark);
    c.fillStyle = '#dbe4f2'; c.fillRect(428, 118, 1064, 58); el(c, 462, 147, 12, 12, '#d62828'); el(c, 500, 147, 12, 12, '#f6b93b'); el(c, 538, 147, 12, 12, '#2fb37a');
    /* desk top with bits on it */
    c.fillStyle = '#c9a98a'; c.fillRect(0, 870, 1920, 210); c.fillStyle = '#b5947a'; c.fillRect(0, 870, 1920, 16);
    rr(c, 560, 930, 800, 80, 12, '#454f70'); c.fillStyle = '#5d688c'; for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) c.fillRect(578 + i * 48, 942 + r * 20, 40, 15);
    rr(c, 150, 800, 112, 96, [6, 6, 26, 26], '#f4efe6'); c.lineWidth = 16; c.strokeStyle = '#f4efe6'; c.beginPath(); c.arc(270, 845, 24, -1.3, 1.3); c.stroke(); el(c, 206, 806, 44, 10, '#6b4a3a');
    rr(c, 1600, 800, 240, 18, 3, '#7f93b5'); rr(c, 1612, 820, 216, 18, 3, '#c9786a'); rr(c, 1596, 840, 250, 26, 3, '#3f6768');
    return { screen: { x: 428, y: 176, w: 1064, h: 566 }, calendar: { x: 1596, y: 200, w: 238, h: 215 }, calTop: { x: 1590, y: 128, w: 250, h: 62 } };
  }, { floorY: 1000, mood }); };

  P.document_close = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    c.fillStyle = '#b5947a'; c.fillRect(0, 0, 1920, 1080); c.fillStyle = '#a98a70'; for (let i = 0; i < 6; i++) c.fillRect(0, 120 + i * 190, 1920, 8);
    rr(c, 480, 60, 960, 1000, 12, shade('#fbfafd', .84)); rr(c, 460, 40, 960, 1000, 10, '#fbfafd');
    rr(c, 1500, 180, 26, 620, 10, m.dark); poly(c, [[1500, 800], [1526, 800], [1513, 850]], '#f4efe6');
    el(c, 180, 240, 110, 110, '#f4efe6'); el(c, 180, 240, 84, 84, '#6b4a3a');
    return { page: { x: 520, y: 100, w: 840, h: 880 } };
  }, { floorY: 1000, mood }); };

  P.phone_close = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    c.fillStyle = m.wall; c.fillRect(0, 0, 1920, 1080); S.window(c, 120, 80, 520, 620, 2, m); shelf(c, 1420, 80, 420, 620, m, 3);
    c.fillStyle = '#c9a98a'; c.fillRect(0, 760, 1920, 320); c.fillStyle = '#b5947a'; c.fillRect(0, 760, 1920, 14);
    rr(c, 720, 40, 480, 1000, 62, m.dark); c.fillStyle = '#f2f6fc'; c.beginPath(); c.roundRect(744, 66, 432, 948, 44); c.fill(); rr(c, 890, 80, 140, 24, 12, m.dark);
    return { screen: { x: 760, y: 130, w: 400, h: 860 } };
  }, { floorY: 1000, mood }); };

  P.street = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    S.skyline(c, 0, 0, 1920, 716, m);
    /* big stone bank front with columns, blank name band */
    poly(c, [[430, 180], [960, 60], [1490, 180]], shade(m.wall, 1.08)); c.fillStyle = shade(m.wall, 1.08); c.fillRect(450, 180, 1020, 90); c.fillStyle = m.wall; c.fillRect(470, 270, 980, 410);
    for (let i = 0; i < 6; i++) { rr(c, 500 + i * 178, 280, 60, 400, 4, shade(m.wall, 1.14)); c.fillStyle = shade(m.wall, .94); c.fillRect(540 + i * 178, 280, 20, 400); } rr(c, 870, 440, 180, 240, 4, m.dark);
    c.fillStyle = shade(m.wall, .88); c.fillRect(430, 680, 1060, 20); c.fillRect(410, 698, 1100, 20);
    /* pavement and road */
    c.fillStyle = '#b6b3b0'; c.fillRect(0, 716, 1920, 150); c.fillStyle = '#9e9c9d'; c.fillRect(0, 716, 1920, 8); c.fillStyle = m === MI.MOODS.night ? '#2a3047' : '#59607a'; c.fillRect(0, 866, 1920, 214); c.fillStyle = '#e8e4d8'; for (let i = 0; i < 10; i++) c.fillRect(i * 210 + 40, 968, 120, 12);
    /* street lamps and trees */
    [[150, 716], [1760, 716]].forEach(([x, y]) => { c.fillStyle = m.dark; c.fillRect(x - 6, y - 330, 12, 330); rr(c, x - 8, y - 340, 100, 12, 4, m.dark); el(c, x + 92, y - 324, 26, 12, m.lamp); });
    [[300, 716], [1630, 716]].forEach(([x, y]) => { c.fillStyle = '#6a5245'; c.fillRect(x - 10, y - 170, 20, 170); el(c, x, y - 240, 96, 110, m.leaf); el(c, x + 34, y - 210, 70, 80, shade(m.leaf, .84)); });
    return { band: { x: 480, y: 190, w: 960, h: 70 } };
  }, { floorY: 760, mood }); };

  P.skyline = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    c.fillStyle = m.sky; c.fillRect(0, 0, 1920, 1080);
    if (mood === 'night') { c.fillStyle = '#f4eecf'; for (let i = 0; i < 70; i++) c.fillRect(1920 * MI.hash(i), 500 * MI.hash(i + 70), 3, 3); el(c, 1560, 170, 74, 74, '#f4eecf'); }
    else { el(c, 1560, 170, 76, 76, '#fdf1bf'); [[300, 180, 1], [820, 110, .8], [1240, 240, .7]].forEach(([x, y, s]) => { const col = '#eef6fb'; el(c, x, y, 120 * s, 34 * s, col); el(c, x - 40 * s, y - 20 * s, 56 * s, 36 * s, col); el(c, x + 44 * s, y - 28 * s, 66 * s, 44 * s, col); }); }
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 26 - layer * 6; i++) {
      const w = 90 + 110 * MI.hash(i + layer * 30), h = (280 + layer * 90) + (340 - layer * 40) * MI.hash(i * 2 + layer), x = (i / (26 - layer * 6)) * 2040 - 60 + 40 * MI.hash(i + 5), y = 980 - h;
      const col = shade(layer === 0 ? m.city2 : m.city, 1 - layer * .16); c.fillStyle = col; c.fillRect(x, y, w, h + 100);
      c.fillStyle = shade(col, mood === 'night' ? 1 : 1.16); if (mood === 'night') c.fillStyle = m.cityWin;
      for (let r = 0; r < h / 40; r++) for (let q = 0; q < w / 30 - 1; q++) if (MI.hash(i * 11 + r * 5 + q + layer) > (mood === 'night' ? .62 : .3)) c.fillRect(x + 12 + q * 28, y + 16 + r * 38, 14, 20);
      if (MI.hash(i + layer + 8) > .75) { c.fillStyle = col; c.fillRect(x + w / 2 - 4, y - 70, 8, 70); }
    }
    c.fillStyle = m.dark; c.fillRect(0, 980, 1920, 100); c.fillStyle = m.city2; c.fillRect(0, 980, 1920, 10);
    return { sky: { x: 300, y: 80, w: 1000, h: 200 } };
  }, { floorY: 1040, mood }); };

  P.courtroom = (mood = 'day') => { const m = { ...MI.MOODS[mood] }; const wood = mood === 'night' ? '#4d3a4c' : '#8b6547', woodD = shade(wood, .8), woodL = shade(wood, 1.16); return MI.place(c => {
    room(c, m); c.fillStyle = woodD; c.fillRect(0, 100, 1920, 620);
    for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? wood : shade(wood, .92); c.fillRect(i * 160, 104, 150, 600); }
    /* tall windows, flags, round blank seal */
    [130, 1560].forEach(x => S.window(c, x, 140, 230, 400, 2, m));
    [[640, '#c9403f'], [1240, '#2c3e63']].forEach(([x, col]) => { c.fillStyle = m.dark; c.fillRect(x, 170, 10, 390); poly(c, [[x + 10, 180], [x + 118, 200], [x + 104, 380], [x + 10, 360]], col); });
    /* the bench */
    rr(c, 560, 380, 800, 40, 6, woodL); c.fillStyle = wood; c.fillRect(580, 420, 760, 300); c.fillStyle = woodD; for (let i = 0; i < 5; i++) c.fillRect(604 + i * 148, 444, 128, 250);
    /* rail and benches in front */
    rr(c, 0, 790, 480, 30, 6, woodL); rr(c, 1440, 790, 480, 30, 6, woodL); for (let i = 0; i < 7; i++) { rr(c, 30 + i * 66, 820, 18, 120, 3, wood); rr(c, 1470 + i * 66, 820, 18, 120, 3, wood); }
    return {};
  }, { floorY: 960, mood, benchY: 720 }); };

  P.boardroom = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); S.window(c, 60, 120, 1140, 450, 5, m);
    rr(c, 1270, 130, 600, 340, 6, shade(m.wall, .8)); c.fillStyle = m.board; c.fillRect(1282, 142, 576, 316);
    S.pendant(c, 400, 0, 60, 62, m); S.pendant(c, 800, 0, 60, 62, m);
    return { board: { x: 1282, y: 142, w: 576, h: 316 } };
  }, { floorY: 730, mood, tableY: 780 }); };
  /* a table for the front of a boardroom: call after the actors */
  MI.prop = MI.prop || {};
  MI.prop.table = (x, y, w, col = '#6b4a3f') => { const c = MI.ctx; rr(c, x, y, w, 34, 8, shade(col, 1.2)); c.fillStyle = col; c.fillRect(x + 20, y + 34, w - 40, 26); c.fillStyle = shade(col, .8); c.fillRect(x + 60, y + 60, 40, 240); c.fillRect(x + w - 100, y + 60, 40, 240); };

  P.vault = (mood = 'night') => { const m = MI.MOODS[mood]; return MI.place(c => {
    const st = mood === 'night' ? '#39435f' : '#7d8797', stL = shade(st, 1.2), stD = shade(st, .8);
    c.fillStyle = st; c.fillRect(0, 0, 1920, 1080); c.fillStyle = stD; for (let r = 0; r < 9; r++) c.fillRect(0, r * 90, 1920, 5);
    for (let i = 0; i < 16; i++) { c.fillRect((i % 2) * 90 + i * 150, 0, 5, 760); }
    /* deposit box wall */
    [[60, 220], [1400, 220]].forEach(([x, y]) => { rr(c, x, y, 460, 500, 8, stD); for (let r = 0; r < 5; r++) for (let q = 0; q < 4; q++) { rr(c, x + 18 + q * 110, y + 16 + r * 96, 98, 84, 5, stL); el(c, x + 67 + q * 110, y + 58 + r * 96, 8, 8, '#d8b76a'); } });
    /* open round door */
    el(c, 960, 410, 330, 330, stD); el(c, 960, 410, 290, 290, m.dark); el(c, 960, 410, 240, 240, shade(m.dark, .7));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; el(c, 960 + Math.cos(a) * 310, 410 + Math.sin(a) * 310, 22, 22, '#d8b76a'); }
    c.fillStyle = '#4a4f63'; c.fillRect(720, 500, 480, 150); c.fillStyle = shade('#4a4f63', .8); c.fillRect(720, 500, 480, 10); for (let i = 0; i < 5; i++) c.fillRect(726 + i * 96, 510, 10, 140);
    c.fillStyle = shade(st, .62); c.fillRect(0, 760, 1920, 320); c.fillStyle = stD; c.fillRect(0, 760, 1920, 12);
    return { shelf: { x: 730, y: 510, w: 460, h: 130 } };
  }, { floorY: 780, mood }); };

  P.living_room = (mood = 'warm') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); S.window(c, 110, 120, 460, 400, 2, m);
    c.fillStyle = m.accent2; poly(c, [[80, 110], [160, 110], [140, 560], [70, 560]], m.accent2); poly(c, [[520, 110], [600, 110], [610, 560], [540, 560]], m.accent2);
    shelf(c, 1500, 180, 340, 530, m, 7); picture(c, 760, 170, 230, 170, m); picture(c, 1030, 200, 150, 120, m);
    /* sofa */
    rr(c, 660, 500, 720, 180, 40, m.counter); rr(c, 680, 590, 680, 110, 22, shade(m.counter, 1.14)); rr(c, 620, 560, 90, 150, 30, m.counterD); rr(c, 1330, 560, 90, 150, 30, m.counterD);
    el(c, 500, 700, 60, 12, m.dark); c.fillStyle = m.dark; c.fillRect(495, 440, 10, 262); poly(c, [[446, 440], [554, 440], [526, 340], [474, 340]], m.lamp);
    rr(c, 300, 870, 1300, 170, 40, shade(m.accent2, .95));
    return { pic: { x: 770, y: 180, w: 210, h: 150 } };
  }, { floorY: 750, mood }); };

  P.factory = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m, 700); c.fillStyle = m.ceil; c.fillRect(0, 0, 1920, 90);
    for (let i = 0; i < 7; i++) { c.fillStyle = m.frame; c.fillRect(i * 300 + 40, 0, 20, 700); }
    for (let i = 0; i < 3; i++) { S.window(c, 130 + i * 620, 120, 480, 170, 3, m); }
    /* conveyor */
    c.fillStyle = m.dark; c.fillRect(0, 560, 1920, 40); for (let i = 0; i < 25; i++) el(c, 40 + i * 80, 580, 16, 16, '#9ea2ae'); [200, 900, 1600].forEach(x => { c.fillStyle = shade(m.dark, 1.15); c.fillRect(x, 600, 50, 110); });
    [320, 720, 1120, 1520].forEach((x, i) => { rr(c, x, 460, 130, 100, 4, i % 2 ? '#c49a6c' : '#b08a60'); c.fillStyle = '#e3c9a5'; c.fillRect(x + 56, 460, 18, 100); });
    /* machine + hopper */
    rr(c, 40, 320, 230, 240, 8, m.counterD); rr(c, 70, 350, 120, 80, 4, '#cfe0f0'); el(c, 225, 390, 18, 18, '#d62828');
    rr(c, 1660, 320, 230, 240, 8, m.counterD); rr(c, 1690, 350, 170, 90, 4, '#f6b93b');
    return { panel: { x: 1690, y: 350, w: 170, h: 90 }, screen: { x: 70, y: 350, w: 120, h: 80 } };
  }, { floorY: 740, mood }); };

  P.classroom = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); rr(c, 480, 130, 960, 430, 8, '#8b6547'); c.fillStyle = '#3f6355'; c.fillRect(496, 146, 928, 398); rr(c, 500, 548, 200, 12, 3, '#d9d4c7');
    S.window(c, 60, 140, 360, 390, 2, m); S.window(c, 1500, 140, 360, 390, 2, m); S.clock(c, 960, 100, 26, m);
    [260, 720, 1180, 1640].forEach(x => { rr(c, x - 110, 800, 220, 24, 4, '#c9a98a'); c.fillStyle = '#9ea2ae'; c.fillRect(x - 96, 824, 14, 130); c.fillRect(x + 82, 824, 14, 130); });
    return { board: { x: 496, y: 146, w: 928, h: 398, chalk: true } };
  }, { floorY: 760, mood }); };

  P.hospital = (mood = 'day') => { const m = { ...MI.MOODS[mood], wall: mood === 'night' ? '#35506a' : '#cfe0e0', wallD: mood === 'night' ? '#2c4259' : '#bdd2d2', floor: mood === 'night' ? '#3d5067' : '#d9dde0', floorD: mood === 'night' ? '#334459' : '#c7ccd1' }; return MI.place(c => {
    room(c, m); S.window(c, 80, 130, 420, 340, 2, m); rr(c, 1500, 140, 340, 230, 6, m.dark); c.fillStyle = '#132a3a'; c.fillRect(1514, 154, 312, 202);
    c.strokeStyle = '#2fb37a'; c.lineWidth = 5; c.beginPath(); c.moveTo(1520, 260); [[1600, 260], [1625, 200], [1650, 310], [1670, 260], [1820, 260]].forEach(p => c.lineTo(p[0], p[1])); c.stroke();
    /* bed */
    rr(c, 620, 610, 780, 60, 12, '#f4f6f8'); rr(c, 620, 580, 240, 60, 22, '#ffffff'); rr(c, 840, 590, 560, 62, 16, '#8fb4c4'); c.fillStyle = '#9ea2ae'; c.fillRect(640, 670, 18, 110); c.fillRect(1360, 670, 18, 110); rr(c, 600, 500, 26, 190, 8, '#9ea2ae');
    c.fillStyle = '#9ea2ae'; c.fillRect(1440, 240, 8, 480); rr(c, 1410, 240, 60, 90, 16, '#dcecf2');
    return { screen: { x: 1514, y: 154, w: 312, h: 202 } };
  }, { floorY: 760, mood }); };

  P.shop = (mood = 'day') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); [60, 500, 1400].forEach((x, i) => shelf(c, x, 150, 400, 540, m, i + 2)); rr(c, 950, 180, 400, 220, 6, m.dark); c.fillStyle = m.board; c.fillRect(964, 194, 372, 192);
    rr(c, 930, 540, 440, 30, 5, m.counter); c.fillStyle = m.counterD; c.fillRect(945, 570, 410, 150); rr(c, 1190, 460, 130, 80, 5, m.dark); c.fillStyle = '#cfe0f0'; c.fillRect(1200, 470, 110, 54);
    return { board: { x: 964, y: 194, w: 372, h: 192 }, till: { x: 1200, y: 470, w: 110, h: 54 } };
  }, { floorY: 740, mood }); };

  P.data_center = (mood = 'night') => { const m = MI.MOODS[mood]; return MI.place(c => {
    room(c, m); for (let i = 0; i < 8; i++) { const x = 60 + i * 230; rr(c, x, 150, 190, 580, 6, shade(m.dark, 1.25)); for (let r = 0; r < 9; r++) { c.fillStyle = shade(m.dark, .85); c.fillRect(x + 14, 168 + r * 60, 162, 46); for (let q = 0; q < 5; q++) { c.fillStyle = MI.hash(i * 7 + r * 3 + q) > .7 ? '#f6b93b' : MI.hash(i + r * 9 + q) > .4 ? '#2fb37a' : '#5a6b8f'; c.fillRect(x + 24 + q * 16, 180 + r * 60, 8, 8); } } }
    return {};
  }, { floorY: 760, mood }); };

  /* ---------- props drawn live, in the current context ---------- */
  Object.assign(MI.prop, {
    desk(x, y, w, col) { desk(MI.ctx, x, y, w, MI.MOODS.day, col); },
    bench(x, y, w) { const c = MI.ctx; rr(c, x, y, w, 26, 6, '#a57f5f'); c.fillStyle = '#8b6547'; c.fillRect(x + 14, y + 26, w - 28, 240); },
    gavel(x, y, ang) { const c = MI.ctx; c.save(); c.translate(x, y); c.rotate(ang); rr(c, -8, -100, 16, 110, 6, '#6b4a3a'); rr(c, -50, -130, 100, 46, 10, '#7f5a42'); c.restore(); },
    block(x, y) { rr(MI.ctx, x - 60, y, 120, 20, 5, '#6b4a3a'); },
    mug(x, y) { const c = MI.ctx; rr(c, x - 22, y - 44, 44, 46, [4, 4, 12, 12], '#f4efe6'); c.lineWidth = 8; c.strokeStyle = '#f4efe6'; c.beginPath(); c.arc(x + 24, y - 22, 12, -1.3, 1.3); c.stroke(); },
    moneyBag(x, y, s = 1) { const c = MI.ctx; c.save(); c.translate(x, y); c.scale(s, s); el(c, 0, -52, 62, 56, '#b9a173'); poly(c, [[-22, -100], [22, -100], [14, -122], [-14, -122]], '#b9a173'); rr(c, -26, -106, 52, 12, 5, '#7c6a48'); c.fillStyle = '#6d8a5a'; c.font = MI.fontOf(52); c.textAlign = 'center'; c.fillText('$', 0, -32); c.restore(); },
    bills(x, y, n = 6, s = 1) { const c = MI.ctx; for (let i = 0; i < n; i++) { rr(c, x - 70 * s, y - i * 12 * s, 140 * s, 11 * s, 2, i % 2 ? '#7fae86' : '#6c9c74'); } rr(c, x - 12 * s, y - n * 12 * s + 8, 24 * s, n * 12 * s - 6, 3, '#e8e2c8'); },
    phone(x, y, s = 1, ang = 0) { const c = MI.ctx; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s); rr(c, -24, -46, 48, 92, 8, '#2c3e63'); c.fillStyle = '#cfe0f0'; c.fillRect(-19, -38, 38, 72); c.restore(); },
    arrow(x1, y1, x2, y2, p, col = '#d62828') { const c = MI.ctx, a = Math.atan2(y2 - y1, x2 - x1), ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p; c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 18; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.stroke(); c.translate(ex, ey); c.rotate(a); c.beginPath(); c.moveTo(38, 0); c.lineTo(-14, -30); c.lineTo(-14, 30); c.closePath(); c.fill(); c.restore(); },
  });
  /* a tick box that ticks itself */
  MI.tickBox = (x, y, size, label, tick, o = {}) => {
    const c = MI.ctx, t = MI.now; MI.markUsed(x, y); rr(c, x, y, size, size, size * .14, o.empty ? '#ffffff' : '#ffffff'); c.lineWidth = size * .08; c.strokeStyle = o.color || '#2b2d42'; c.beginPath(); c.roundRect(x, y, size, size, size * .14); c.stroke();
    if (tick !== undefined) { MI.ev('ding', tick); if (t > tick) { const p = MI.outc((t - tick) / .18); c.lineWidth = size * .16; c.lineCap = 'round'; c.strokeStyle = '#2fb37a'; c.beginPath(); c.moveTo(x + size * .2, y + size * .52); if (p < .4) c.lineTo(x + size * (.2 + .22 * p / .4), y + size * (.52 + .24 * p / .4)); else { c.lineTo(x + size * .42, y + size * .76); c.lineTo(x + size * (.42 + .42 * (p - .4) / .6), y + size * (.76 - .58 * (p - .4) / .6)); } c.stroke(); } }
    if (label) MI.type(label, x + size * 1.35, y + size * .74, { size: size * .56, start: o.start ?? 0, cps: 34, sound: false, color: '#2b2d42' });
  };

  /* ---------- signs the script does not write on fill themselves, so nothing sits blank ---------- */
  MI.filler = (name, b, seed = 1) => {
    const c = MI.ctx, kind = /board|panel/.test(name) ? 'board' : /screen|till/.test(name) ? 'screen' : /calendar/.test(name) ? 'calendar' : /page/.test(name) ? 'page' : null;
    if (!kind) return; const h = MI.hash;
    if (kind === 'board') {
      const cols = ['#f6d77a', '#f2a7a0', '#a9d6c4', '#b7c6ea']; const nw = b.w * .15;
      for (let i = 0; i < 4; i++) { const x = b.x + b.w * .07 + (i % 2) * nw * 1.25, y = b.y + b.h * .1 + (i >> 1) * b.h * .4; c.save(); c.translate(x + nw / 2, y + nw / 2); c.rotate((h(i + seed) - .5) * .14); rr(c, -nw / 2, -nw / 2, nw, nw, 3, cols[(i + seed) % 4]); c.fillStyle = 'rgba(40,40,70,.28)'; c.fillRect(-nw * .36, -nw * .2, nw * .72, 3); c.fillRect(-nw * .36, 0, nw * .5, 3); c.restore(); }
      const bx = b.x + b.w * .46, bw = b.w * .46, by = b.y + b.h * .86, bh = b.h * .66; c.fillStyle = '#c9cede'; c.fillRect(bx, by, bw, 3);
      for (let i = 0; i < 6; i++) { const hh = bh * (.25 + .7 * h(i * 3 + seed)); c.fillStyle = i === 3 ? '#e2552f' : '#7f93b5'; c.fillRect(bx + i * bw / 6 + 4, by - hh, bw / 6 - 8, hh); }
    }
    if (kind === 'screen') {
      c.fillStyle = '#c7d6ea'; c.fillRect(b.x, b.y, b.w, b.h * .14);
      const rows = Math.max(3, Math.round(b.h / Math.max(16, b.h * .14)));
      for (let i = 0; i < rows - 1; i++) { const y = b.y + b.h * .2 + i * (b.h * .76 / (rows - 1)); c.fillStyle = '#b6c3d8'; c.fillRect(b.x + b.w * .06, y, b.w * (.28 + .5 * h(i + seed)), Math.max(2, b.h * .045)); c.fillStyle = i % 3 ? '#9fd3bc' : '#f0b8a8'; c.fillRect(b.x + b.w * .84, y, b.w * .1, Math.max(2, b.h * .045)); }
    }
    if (kind === 'calendar') { const q = b.w / 7; for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) { rr(c, b.x + i * q + 3, b.y + r * (b.h / 4) + 3, q - 6, b.h / 4 - 6, 3, (r * 7 + i) === 9 ? '#d62828' : '#e4e1d8'); } }
    if (kind === 'page') { c.fillStyle = '#d6d7e0'; for (let i = 0; i < 14; i++) c.fillRect(b.x + b.w * .06, b.y + b.h * .06 + i * b.h * .065, b.w * (.5 + .38 * h(i + seed)), Math.max(3, b.h * .014)); }
  };
  /* ---------- a cast ---------- */
  MI.PEOPLE = {
    clerk: { skin: '#f7a48d', hair: '#54302b', hairStyle: 'bob', top: '#f2f2f4', vest: '#2c3a63', tie: '#d9423a', pants: '#606778', shoes: '#22242e', seed: 3 },
    boss: { skin: '#f4a78f', hair: '#6f6a70', hairStyle: 'short', top: '#2c3a63', collar: '#fff', tie: '#d9423a', pants: '#2c3a63', shoes: '#22242e', seed: 7, glasses: '#2b2d42' },
    analyst: { skin: '#c98567', hair: '#2b2224', hairStyle: 'short', top: '#7f93b5', collar: '#fff', pants: '#3a4560', shoes: '#3a2a2a', seed: 11 },
    officer: { skin: '#8d5a42', hair: '#201a1c', hairStyle: 'bun', top: '#f6f3ec', vest: '#5b3fa6', pants: '#3a3550', shoes: '#22242e', seed: 13 },
    lender: { skin: '#f7ac94', hair: '#2f2a30', hairStyle: 'short', top: '#3a4052', collar: '#fff', tie: '#f6b93b', pants: '#3a4052', shoes: '#16181f', seed: 17 },
    lender2: { skin: '#e6a07f', hair: '#7a4b2c', hairStyle: 'bald', top: '#514766', collar: '#fff', tie: '#2fb37a', pants: '#514766', shoes: '#16181f', seed: 19, beard: true },
    judge: { skin: '#e8a389', hair: '#d9d6d2', hairStyle: 'short', top: '#20222e', collar: '#fff', pants: '#20222e', shoes: '#16181f', seed: 23, glasses: '#2b2d42' },
    judge2: { skin: '#9a6449', hair: '#2a2024', hairStyle: 'bob', top: '#20222e', collar: '#fff', pants: '#20222e', shoes: '#16181f', seed: 29 },
    passer: { skin: '#f3b096', hair: '#b86b3a', hairStyle: 'long', top: '#c9786a', collar: false, pants: '#39506a', shoes: '#f2f2f4', seed: 31 },
    passer2: { skin: '#a56f50', hair: '#1f1a1c', hairStyle: 'short', top: '#4f8a78', collar: false, pants: '#c9a98a', shoes: '#3a2a2a', seed: 37 },
    /* generic extras */
    maker: { skin: '#a8714f', hair: '#1d1719', hairStyle: 'short', top: '#3f6f8f', collar: '#fff', pants: '#2f3a55', shoes: '#22242e', seed: 41 },
    checker: { skin: '#b57d5c', hair: '#221a1c', hairStyle: 'short', top: '#f2f2f4', tie: '#2c6e7f', pants: '#454b60', shoes: '#22242e', seed: 43, glasses: '#2b2d42' },
    approver: { skin: '#f0a98e', hair: '#5a4034', hairStyle: 'short', top: '#2c3a63', collar: '#fff', tie: '#d9423a', pants: '#2c3a63', shoes: '#22242e', seed: 47 },
    headops: { skin: '#e8a389', hair: '#8e8a8f', hairStyle: 'short', top: '#343a4e', collar: '#fff', tie: '#f6b93b', pants: '#343a4e', shoes: '#16181f', seed: 53, glasses: '#2b2d42' },
    rep: { skin: '#f3b096', hair: '#7d2f3f', hairStyle: 'bob', top: '#c23b5a', collar: '#fff', pants: '#3a2a3f', shoes: '#16181f', seed: 59 },
    lawyer: { skin: '#d59a78', hair: '#2a2024', hairStyle: 'bun', top: '#26293a', collar: '#fff', pants: '#26293a', shoes: '#101218', seed: 61 },
    lawyer2: { skin: '#7c4f3a', hair: '#141012', hairStyle: 'short', top: '#3d3048', collar: '#fff', tie: '#c9a02f', pants: '#3d3048', shoes: '#101218', seed: 67 },
    postman: { skin: '#c98567', hair: '#2b2224', hairStyle: 'short', top: '#2f5fa8', collar: '#f6b93b', pants: '#203c70', shoes: '#16181f', seed: 71 },
    you: { skin: '#e6b08f', hair: '#3a2a22', hairStyle: 'long', top: '#4f8a78', collar: false, pants: '#39445f', shoes: '#f2f2f4', seed: 73 },
  };
})();
