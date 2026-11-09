#!/usr/bin/env python3
"""Sound stage, made entirely in code: SFX per event, an original music bed, ducking, loudness.
  sound.py --project P --voice VO.wav --out mix.wav [--music own.mp3] [--no-music] [--seed 3]
Reads P/events.json from the renderer. Gate: voice 15+ dB over the background during speech; prints the result."""
import argparse, json, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
ap = argparse.ArgumentParser(); ap.add_argument('--project', required=True); ap.add_argument('--voice', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--music'); ap.add_argument('--no-music', action='store_true'); ap.add_argument('--all-sounds', action='store_true'); ap.add_argument('--seed', type=int, default=3); ap.add_argument('--bpm', type=float); ap.add_argument('--mood', default='documentary')
a = ap.parse_args(); R = np.random.default_rng(a.seed); RM = np.random.default_rng(a.seed + 1000)   # music notes do not depend on how many SFX a film has

def load(p, dur=None):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def filt(x, kind, f, order=2): return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)
def env(n, at=.002, de=.1): t = np.arange(n) / SR; return np.minimum(t / at, 1) * np.exp(-t / de)
def noise(n): return R.standard_normal(n).astype(np.float32)
def sine(f, n): return np.sin(2 * np.pi * np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR)

def pop():
    n = int(.14 * SR); t = np.arange(n) / SR; return sine(520 * np.exp(-t * 16) + 240, n) * env(n, .001, .045)
def tick():
    n = int(.028 * SR); return filt(noise(n), 'bandpass', (1600, 6500)) * env(n, .0005, .006) * 1.4
def thud():
    n = int(.34 * SR); t = np.arange(n) / SR; return np.tanh(2 * sine(130 * np.exp(-t * 9) + 46, n) * env(n, .001, .09)) + .3 * filt(noise(n), 'lowpass', 2500) * env(n, .0005, .012)
def hit():
    n = int(.26 * SR); t = np.arange(n) / SR; return np.tanh(2.2 * sine(210 * np.exp(-t * 14) + 70, n) * env(n, .001, .07)) * .9 + .5 * filt(noise(n), 'bandpass', (500, 3800)) * env(n, .0005, .03)
def whoosh():
    n = int(R.uniform(.26, .5) * SR); u = np.linspace(0, 1, n); return filt(noise(n), 'bandpass', (R.uniform(250, 500), R.uniform(2600, 5200))) * np.sin(np.pi * u ** R.uniform(.55, 1.3)) ** 3 * 1.5
def ding():
    n = int(.55 * SR); return (sine(1320, n) + .45 * sine(1980, n) + .2 * sine(2640, n)) * env(n, .001, .16) * .55
def scratch():
    n = int(.42 * SR); t = np.arange(n) / SR; f = 900 + 800 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 3)
    return filt(noise(n), 'bandpass', (500, 5000)) * .9 * (.4 + .6 * np.sin(np.cumsum(f) * 2 * np.pi / SR)) * np.minimum(1, (n - np.arange(n)) / (.05 * SR))
def boing():
    n = int(.4 * SR); t = np.arange(n) / SR; return sine(190 + 130 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 6), n) * env(n, .002, .12)
def roll():
    n = int(.9 * SR); x = np.zeros(n); t = 0
    while t < .85:
        k = int(t * SR); s = tick(); x[k:k + len(s)] += s[:n - k]; t += .05 + .03 * t
    return x
SYN = dict(swish=whoosh, pop=pop, tick=tick, thud=thud, hit=hit, whoosh=whoosh, ding=ding, scratch=scratch, boing=boing, roll=roll)
GAIN = dict(swish=.11, pop=.26, tick=.07, thud=.46, hit=.4, whoosh=.2, ding=.3, scratch=.42, boing=.32, roll=.24)
PEAK = {'thud', 'hit', 'pop'}
MOOD = dict(bpm=96, roots=[[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]], pat=[0, 2, 1, 3, 2, 1, 3, 2], pluck=.07, bass=.22, pad=.05, lp=5200, decay=.16)
try:   # Premium: more effects and music moods
    import soundpack
    _s, _g = soundpack.extra(R, SR, filt, env, noise, sine); SYN.update(_s); GAIN.update(_g)
    if a.mood not in soundpack.MOODS: sys.exit('moods: ' + ', '.join(soundpack.MOODS))
    MOOD = soundpack.MOODS[a.mood]
except ImportError:
    pass
def vary(s):
    """No two hits alike: a repeated identical sample is what makes SFX sound cheap."""
    k = R.uniform(.84, 1.2); return np.interp(np.arange(0, len(s), k), np.arange(len(s)), s) * R.uniform(.72, 1)

def music(dur):
    """Documentary pulse: soft pad, plucked minor arpeggio, muted low pulse. New seed, new notes."""
    n = int(dur * SR) + SR; x = np.zeros(n); beat = 60 / (a.bpm or MOOD['bpm']); roots = MOOD['roots']
    keyf = 110 * 2 ** (RM.integers(-2, 3) / 12); order = RM.permutation(4)
    bars = int(dur / (beat * 4)) + 2
    for b in range(bars):
        ch = roots[order[b % 4]]; t0 = b * 4 * beat; i0 = int(t0 * SR); L = int(beat * 4.4 * SR)
        if i0 >= n: break
        L = min(L, n - i0); tt = np.arange(L) / SR; pad = np.zeros(L)
        for st in ch:
            f = keyf * 2 * 2 ** (st / 12)
            pad += np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.003 * tt)
        x[i0:i0 + L] += MOOD['pad'] * pad * np.minimum(1, tt / .5) * np.minimum(1, (L / SR - tt) / .6)
        for s in range(8):
            tn = t0 + s * beat / 2; j = int(tn * SR)
            if j >= n: break
            Ln = min(int(.5 * SR), n - j); tq = np.arange(Ln) / SR; st = ch[MOOD['pat'][s]]
            f = keyf * 4 * 2 ** (st / 12)
            x[j:j + Ln] += MOOD['pluck'] * (np.sin(2 * np.pi * f * tq) + .3 * np.sin(4 * np.pi * f * tq)) * np.exp(-tq / MOOD['decay']) * (1 if s % 2 == 0 else .7)
            if s % 2 == 0:
                fb = keyf * .5 * 2 ** (ch[0] / 12); x[j:j + Ln] += MOOD['bass'] * np.sin(2 * np.pi * fb * tq) * np.exp(-tq / .14)
    return filt(x, 'lowpass', MOOD['lp'])

def thin(ev):
    """A sound should mean something. Busy shots pile up events, and a mix with 150 a minute is the whoosh problem again. Keeps the strongest, drops pile-ups. {keep:true} events always stay."""
    pri = dict(whoosh=9, scratch=9, boing=8, hit=8, thud=7, ding=7, siren=7, alarm=7, gasp=7, glass=7, crowd=6, cash=6, camera=6, door=6, splash=6, clock=5, roll=5, coins=5, ring=5, drop=5, riser=5, knock=5, coin=4, paper=4, click=4, footsteps=4, key=3, typing=3, pop=3, swish=2, tick=1)
    P_ = lambda e: pri.get(e['name'], 4); gaps = dict(tick=.45, pop=.55, key=.45, typing=.8, swish=3)
    keep = [e for e in ev if e.get('keep')]
    for e in sorted((e for e in ev if not e.get('keep')), key=lambda e: (-P_(e), e['t'])):
        g_ = gaps.get(e['name'], .28)
        if not any(abs(e['t'] - k['t']) < g_ and (e['name'] == k['name'] or P_(k) >= P_(e)) for k in keep): keep.append(e)
    keep.sort(key=lambda e: e['t']); out = []
    for e in keep:                                      # at most 9 sounds in any 6 seconds
        out.append(e); win = [x for x in out if e['t'] - x['t'] < 6 and not x.get('keep')]
        if len([x for x in out if e['t'] - x['t'] < 6]) > 9 and win: out.remove(min(win, key=lambda x: (P_(x), x['t'])))
    last, final = {}, []; rare = dict(boing=30, scratch=30, ding=2.5, thud=.8, whoosh=14)   # stingers only work when they're rare
    for e in out:
        n_ = e['name']
        if e.get('keep'): final.append(e); continue
        if e['t'] - last.get(n_, -999) < rare.get(n_, 0): continue
        last[n_] = e['t']; final.append(e)
    return final

voice = load(a.voice); info = json.load(open(f'{a.project}/events.json')); dur = max(info['END'], len(voice) / SR) + .1; N = int(dur * SR)
v = np.zeros(N); v[:min(N, len(voice))] = voice[:N]
pk = np.abs(v).max(); v = v / (pk + 1e-6) * .85 if pk > 0 else v
# speech envelope for ducking: 30 ms attack, .3 s hold, .45 s release
frame = int(.01 * SR); rms = np.sqrt(np.convolve(v ** 2, np.ones(frame) / frame, 'same')); speech = rms > .02
hold = int(.3 * SR); idx = np.where(speech)[0]; held = np.zeros(N)
cs = np.concatenate(([0], np.cumsum(speech, dtype=np.int64))); held = cs[1:] - cs[np.maximum(0, np.arange(N) + 1 - hold)] > 0
g = np.zeros(N); cur = 0; at = 1 / (.03 * SR); rl = 1 / (.45 * SR)
for i in range(N):
    cur = min(1, cur + at) if held[i] else max(0, cur - rl); g[i] = cur
fx = np.zeros(N); cnt = {}
_n0 = len(info['EV'])
if not a.all_sounds:
    info['EV'] = thin(info['EV']); print(f"sounds: kept {len(info['EV'])} of {_n0}, {len(info['EV']) / (dur / 60):.0f} a minute (--all-sounds keeps every one)")
for e in info['EV']:
    if e['name'] not in SYN: print('no sound for', e['name']); continue
    s = vary(SYN[e['name']]()).astype(np.float32) * GAIN[e['name']]; p = int(np.argmax(np.abs(s))) if e['name'] in PEAK else 0
    i = int(e['t'] * SR) - p; i0 = max(0, i); s = s[i0 - i:]; m = min(len(s), N - i0)
    if m > 0: fx[i0:i0 + m] += s[:m] * (1 - .5 * g[i0:i0 + m])          # 6 dB quieter on speech
    cnt[e['name']] = cnt.get(e['name'], 0) + 1
mus = np.zeros(N)
if not a.no_music:
    m = load(a.music) if a.music else music(dur).astype(np.float32); k = np.resize(m, N) if len(m) < N else m[:N]; mp = np.abs(k).max(); mus = k / (mp + 1e-6)
    mus = mus * (.22 - .17 * g)                       # sits at -24 dBFS under voice, swells between lines
    fade = np.minimum(1, (N - np.arange(N)) / (.8 * SR)); mus *= fade
# automatic gate: on any 100 ms frame during speech, pull the SFX down until the voice stays on top
_fl = int(.1 * SR); _nf = N // _fl; _gain = np.ones(_nf + 2)
for i in range(_nf):
    a0, a1 = i * _fl, (i + 1) * _fl; vr = np.sqrt((v[a0:a1] ** 2).mean() + 1e-12)
    if vr > .03:
        fr = np.sqrt((fx[a0:a1] ** 2).mean() + 1e-12); mr = np.sqrt((mus[a0:a1] ** 2).mean() + 1e-12); room = max(vr * .56 - mr, vr * .1)
        if fr > room: _gain[i] = room / fr
_gain = np.minimum.reduce([_gain, np.roll(_gain, 1), np.roll(_gain, -1)])
fx = fx * np.interp(np.arange(N), (np.arange(_nf + 2) + .5) * _fl, _gain)
bg = fx + mus; mix = v + bg
# gate: median of 100 ms frames during speech
fl = int(.1 * SR); nf = N // fl; vf = np.array([np.sqrt((v[i * fl:(i + 1) * fl] ** 2).mean() + 1e-12) for i in range(nf)]); bf = np.array([np.sqrt((bg[i * fl:(i + 1) * fl] ** 2).mean() + 1e-12) for i in range(nf)])
act = vf > .03; db = 20 * np.log10(vf[act] / bf[act]); loud = (bf[act] > vf[act]).mean() * 100
print(f'gate: voice over background {np.median(db):.1f} dB (need 15+), background louder in {loud:.2f}% of frames, {int((bf[act] > vf[act]).sum())} of {int(act.sum())} (need under 1%), sfx {cnt}')
tmp = a.out + '.tmp.wav'; pcm = np.clip(mix, -1, 1).astype(np.float32)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'pan=stereo|c0=c0|c1=c0', tmp], input=pcm.tobytes(), check=True)   # true dual mono, no -3 dB downmix
# measure with ebur128 (what players read), set plain gain, limit true peak at -1 dB. Linear loudnorm undershoots on short films.
def lufs(p):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(e[e.rfind('I:'):].split()[1])
af = f"volume={-14 - lufs(tmp):.2f}dB,alimiter=limit=0.86:attack=2:release=60:level=disabled"
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', af, '-ar', str(SR), a.out], check=True)
import os; os.remove(tmp); print(f'wrote {a.out}, {lufs(a.out):.1f} LUFS')
if np.median(db) < 15 or loud >= 1: print('GATE FAILED: the voice is not clear of the background'); sys.exit(1)
