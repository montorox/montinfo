#!/usr/bin/env python3
"""Cut a stretch of a finished film into a new one, playing with its own sound, frame-exact.
  splice.py --film body.mp4 --at SECONDS --sample old/film.mp4 --from 0 --to 70.2 [--hold .3] --out film.mp4
--at is where in body.mp4 the sample starts. Make the camera finish a push into a screen there, and start the next shot pulling back out.
--hold keeps the sample's last frame on screen in silence, so the voice doesn't come in on top of it.
Prints how far the sample moved everything, because every chapter time after it is now later."""
import argparse, json, subprocess
ap = argparse.ArgumentParser(); [ap.add_argument('--' + k, required=True) for k in ('film', 'sample', 'out')]; ap.add_argument('--at', type=float, required=True); ap.add_argument('--from', dest='a', type=float, default=0); ap.add_argument('--to', dest='b', type=float, required=True); ap.add_argument('--hold', type=float, default=.3); ap.add_argument('--fade', type=float, default=.45); a = ap.parse_args()
FPS = 30; f0 = round(a.at * FPS); T = f0 / FPS; sf = round(a.b * FPS) - round(a.a * FPS); L = sf / FPS
AU = 'aresample=48000,aformat=channel_layouts=stereo'
g = (f'[0:v]trim=end_frame={f0},setpts=PTS-STARTPTS,format=yuv420p[va];'
     f'[0:a]atrim=0:{T:.6f},asetpts=PTS-STARTPTS,afade=t=out:st={max(0, T - .16):.6f}:d=0.16,{AU}[aa];'
     f'[1:v]fps={FPS},trim=end_frame={sf},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={a.hold},format=yuv420p[vs];'
     f'[1:a]atrim=0:{L:.6f},asetpts=PTS-STARTPTS,afade=t=out:st={max(0, L - a.fade):.6f}:d={a.fade},apad=pad_dur={a.hold},atrim=0:{L + a.hold:.6f},{AU}[as];'
     f'[0:v]trim=start_frame={f0},setpts=PTS-STARTPTS,format=yuv420p[vb];'
     f'[0:a]atrim={T:.6f},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,{AU}[ab];'
     f'[va][aa][vs][as][vb][ab]concat=n=3:v=1:a=1[v][a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.film, '-ss', str(a.a), '-i', a.sample, '-filter_complex', g, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', a.out], check=True)
print(f'wrote {a.out}. Chapters after it move, for upload.json if you use one: ' + json.dumps({'splice': {'at': round(T, 3), 'by': round(L + a.hold, 3)}}))
