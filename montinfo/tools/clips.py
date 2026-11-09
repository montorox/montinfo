#!/usr/bin/env python3
"""Real footage from your own finished films, ready to play on screens inside a shot.
  clips.py --project P name=SOURCE.mp4@START+SECONDS [more...]
  clips.py --project P swan=old/film.mp4@541+5 first=old/film.mp4@0+0
Seconds of 0 gives one sharp full-size frame. Writes clips/<name>/0000.jpg and clips/manifest.js. Keep the total to about 1,000 frames.
Only use footage you own. Read the frames first: a clip that runs into a transition looks blurred at the end."""
import argparse, json, os, re, shutil, subprocess, sys
ap = argparse.ArgumentParser(); ap.add_argument('--project', required=True); ap.add_argument('clips', nargs='+'); ap.add_argument('--fps', type=int, default=15); a = ap.parse_args()
root = os.path.join(a.project, 'clips'); os.makedirs(root, exist_ok=True); man = os.path.join(root, 'manifest.js'); M = {}
if os.path.exists(man): t = open(man).read(); M = json.loads(t[t.index('{'):t.rindex('}') + 1])
for c in a.clips:
    m = re.fullmatch(r'([A-Za-z0-9_]+)=(.+)@([\d.]+)\+([\d.]+)', c)
    if not m: sys.exit(f'Expected name=file.mp4@START+SECONDS, got: {c}')
    n, src, st, d = m[1], m[2], m[3], float(m[4])
    if not os.path.exists(src): sys.exit(f'No file: {src}')
    out = os.path.join(root, n); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', st, '-i', src]
    cmd += ['-frames:v', '1', '-vf', 'scale=1920:-2', '-q:v', '2'] if d == 0 else ['-t', str(d), '-vf', f'fps={a.fps},scale=1280:-2', '-q:v', '3']
    subprocess.run(cmd + ['-start_number', '0', os.path.join(out, '%04d.jpg')], check=True)
    k = len(os.listdir(out))
    if not k: sys.exit(f'{n}: no frames at {st} s in {src}')
    M[n] = {'n': k, 'fps': a.fps}; print(f'{n}: {k} frames')
open(man, 'w').write('window.CLIPS=' + json.dumps(M) + ';\n'); print(f'{sum(v["n"] for v in M.values())} frames in {len(M)} clips. In a shot: K.film, K.clipIn or K.tv')
