#!/usr/bin/env node
/* MontInfo renderer. Serves the engine and a project over local http and drives Chromium.
   render.mjs --project P --art code|image --stills 1,2,3 --dir OUT       single frames
   render.mjs --project P --art code --contact 2 --dir OUT                one frame every 2 s plus a sheet (uses ffmpeg)
   render.mjs --project P --art code --out film.mp4 [--workers 6] [--audio a.wav] [--crf 17] [--from a --to b]
   Add --format 9:16 to any of these for a vertical Short.
   Chunks live in the system caches folder, survive a crash (rerun the same command to resume; --fresh to restart), removed after the join. */
import { createRequire } from 'node:module'; import { createHash } from 'node:crypto';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ENGINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'engine');
/* The studio holds node modules and .venv. MONTINFO_HOME wins. */
const STUDIO = process.env.MONTINFO_HOME || path.join(os.homedir(), 'MontInfoStudio');
const require = createRequire(path.join(STUDIO, 'package.json'));
/* Temp chunks: the system caches folder keeps them out of cloud-synced folders. A sandbox that blocks it falls back to the project. */
const cacheRoot = key => { const base = process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Caches') : (process.env.LOCALAPPDATA || process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache')); const d = path.join(base, 'MontInfo', key); try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch { return path.join(P, '.render-tmp', key); } };
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const P = path.resolve(arg('project')), ART = arg('art', 'code'), FPS = +arg('fps', 30);
const FORMAT = arg('format', '16:9'); if (!['16:9', '9:16'].includes(FORMAT)) { console.error('--format is 16:9 or 9:16'); process.exit(2); }
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
/* one shots file per chapter: shots/*.js, each does (window.SHOTFILES=window.SHOTFILES||[]).push(()=>{...}); or a single shots.js */
const CHAPTERS = fs.existsSync(path.join(P, 'shots')) ? fs.readdirSync(path.join(P, 'shots')).filter(f => f.endsWith('.js')).sort().map(f => 'shots/' + f) : ['shots.js'];
const INDEX = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:Montserrat;font-weight:800;src:url(/engine/fonts/montserrat-latin-800-normal.woff2)}
@font-face{font-family:Montserrat;font-weight:900;src:url(/engine/fonts/montserrat-latin-900-normal.woff2)}
html,body{margin:0;background:#000}canvas{display:block}</style><canvas id=c></canvas>
<script>window.ART=${JSON.stringify(ART)};window.FORMAT=${JSON.stringify(FORMAT)}</script>
<script src=/engine/mi-core.js></script><script src=/engine/mi-gfx.js></script><script src=/engine/mi-rig.js></script><script src=/engine/mi-art.js></script><script src=/engine/mi-places.js></script><script src=/engine/mi-kit.js></script><script src=/engine/mi-film.js></script>${['mi-places2.js', 'mi-places3.js'].filter(f => fs.existsSync(path.join(ENGINE, f))).map(f => `<script src=/engine/${f}></script>`).join('')}
${fs.existsSync(path.join(P, 'clips/manifest.js')) ? '<script src=/p/clips/manifest.js></script>' : ''}<script src=/p/words.js></script>${fs.existsSync(path.join(P, 'art.js')) ? '<script src=/p/art.js></script>' : ''}${CHAPTERS.map(f => `<script src=/p/${f}></script>`).join('')}
<script>(async()=>{await Promise.all([document.fonts.load('900 40px Montserrat'),document.fonts.load('800 40px Montserrat')]);
try{await MI.loadClips();if(window.setupArt)await window.setupArt();(window.SHOTFILES||[window.defineShots]).forEach(f=>f());await MI.boot(document.getElementById('c'))}catch(e){window.BOOTERR=String(e.stack||e)}})()</script>`;
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/') { r.writeHead(200, { 'content-type': 'text/html' }); return r.end(INDEX); }
  let f = null;
  if (u.startsWith('/engine/')) f = path.join(ENGINE, u.slice(8)); else if (u.startsWith('/p/')) f = path.join(P, u.slice(3));
  if (!f || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok)); const URL_ = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('page error:', e.message)); page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(URL_);
  await page.waitForFunction(() => window.READY || window.BOOTERR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.BOOTERR); if (err) { console.error(err); await browser.close(); server.close(); process.exit(2); }
  return page;
}
const b64 = u => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
let code = 0;
try {
  const dir = arg('dir');
  const page = await openPage();
  const info = await page.evaluate(() => ({ END: window.END, EV: window.EV, report: MI.report, stats: MI.stats }));
  fs.writeFileSync(path.join(P, 'events.json'), JSON.stringify({ END: info.END, EV: info.EV }));
  console.log(`stats ${JSON.stringify(info.stats)}`);
  info.report.forEach(r => console.log('CHECK ' + r)); console.log(`${info.report.length} checks to look at`);
  const stills = arg('stills'); const contact = arg('contact');
  if (stills || contact) {
    fs.mkdirSync(dir, { recursive: true });
    const times = stills ? stills.split(',').map(Number) : Array.from({ length: Math.floor(info.END / +contact) + 1 }, (_, i) => i * +contact);
    for (const t of times) { const u = await page.evaluate(t => MI.frame(t, 30, 1, .93), t); fs.writeFileSync(path.join(dir, `f${t.toFixed(2).padStart(7, '0')}.jpg`), b64(u)); }
    if (contact) { const list = path.join(dir, 'list.txt'); fs.writeFileSync(list, times.map(t => `file '${path.join(path.resolve(dir), `f${t.toFixed(2).padStart(7, '0')}.jpg`)}'`).join('\n'));
      spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-r', '1', '-i', list, '-vf', FORMAT === '9:16' ? 'scale=240:-1,tile=8x3' : 'scale=384:-1,tile=5x5', '-fps_mode', 'passthrough', '-q:v', '3', path.join(dir, 'sheet-%02d.jpg')]); fs.rmSync(list); console.log(`sheets: ${dir}/sheet-*.jpg, 25 frames each, ${contact} s apart, left to right`); }
    console.log(`${times.length} frames, END ${info.END.toFixed(2)} s, ${info.EV.length} sound events`);
  }
  const out = arg('out');
  if (out) {
    /* chunks of 20 s, pulled by parallel pages. A finished chunk stays until the join, so a crash reruns only what is left. */
    const from = +arg('from', 0), to = +arg('to', info.END), n = Math.ceil((to - from) * FPS), W = +arg('workers', 6), crf = arg('crf', '17'), CH = 600;
    /* The key includes a hash of everything that draws, so resuming can never reuse chunks made before an edit. */
    const sum = createHash('sha1'); const feed = d => { if (fs.existsSync(d)) for (const n of fs.readdirSync(d).sort()) { const f = path.join(d, n); if (fs.statSync(f).isFile() && /\.js$/.test(n)) sum.update(fs.readFileSync(f)); } };
    feed(ENGINE); feed(P); feed(path.join(P, 'shots')); sum.update(String(arg('crf', '17')) + from + to + FORMAT);
    const base = path.basename(P) + '-' + ART + '-' + path.basename(out, '.mp4'), key = base + '-' + sum.digest('hex').slice(0, 10), tmp = cacheRoot(key);
    try { const up = path.dirname(tmp); for (const n of fs.readdirSync(up)) if (n.startsWith(base + '-') && n !== key) fs.rmSync(path.join(up, n), { recursive: true, force: true }); } catch {}
    fs.mkdirSync(tmp, { recursive: true });
    if (arg('fresh') !== undefined || process.argv.includes('--fresh')) { fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true }); }
    const count = Math.ceil(n / CH), names = Array.from({ length: count }, (_, i) => path.join(tmp, `c${String(i).padStart(4, '0')}.mp4`));
    const todo = names.map((f, i) => i).filter(i => !fs.existsSync(names[i])); if (todo.length < count) console.log(`resuming: ${count - todo.length} of ${count} chunks already done`);
    const t0 = Date.now(); let done = 0;
    await Promise.all(Array.from({ length: Math.min(W, Math.max(1, todo.length)) }, async (_, w) => {
      const pg = w === 0 ? page : await openPage();
      for (;;) {
        const k = todo.shift(); if (k === undefined) break;
        const a = k * CH, b = Math.min(n, a + CH), part = names[k] + '.part.mp4';
        const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p', part], { stdio: ['pipe', 'inherit', 'inherit'] });
        for (let i = a; i < b; i++) {
          const u = await pg.evaluate(([t, f]) => MI.frame(t, f, 4, .97), [from + i / FPS, FPS]);
          if (!ff.stdin.write(b64(u))) await new Promise(ok => ff.stdin.once('drain', ok));
          if (++done % 300 === 0) console.log(`${done} frames, ${((Date.now() - t0) / done).toFixed(0)} ms each`);
        }
        ff.stdin.end(); await new Promise(ok => ff.on('close', ok)); fs.renameSync(part, names[k]);
      }
    }));
    const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, names.map(f => `file '${f}'`).join('\n'));
    const aud = arg('audio'); const args = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (aud) args.push('-i', aud, '-c:a', 'aac', '-b:a', '256k', '-shortest'); args.push('-c:v', 'copy', '-movflags', '+faststart', out);
    const r = spawnSync('ffmpeg', args, { stdio: 'inherit' }); fs.rmSync(tmp, { recursive: true, force: true });
    if (r.status) throw new Error('join failed');
    console.log(`wrote ${out} (${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
} catch (e) { console.error(e); code = 1; }
await browser.close(); server.close(); process.exit(code);
