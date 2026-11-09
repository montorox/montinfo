#!/usr/bin/env python3
"""Word times from the user's recorded voice-over.
  words.py VO.wav --script script.txt --out P/words.js [--model small.en]
Runs faster-whisper, aligns it to the script so spelling comes from the script and timing from the audio,
and prints every place the recording and the script differ. Without --script the transcript is used as is."""
import argparse, difflib, json, re
from faster_whisper import WhisperModel
ap = argparse.ArgumentParser(); ap.add_argument('vo'); ap.add_argument('--script'); ap.add_argument('--out', required=True); ap.add_argument('--model', default='small.en')
a = ap.parse_args()
# decode with ffmpeg ourselves: any audio or video format works, and it avoids PyAV version breaks
import subprocess, numpy as np
pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', a.vo, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
segs, _ = WhisperModel(a.model, compute_type='int8').transcribe(pcm, word_timestamps=True, vad_filter=False)
heard = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
norm = lambda x: re.sub(r"[^a-z0-9']", '', x.lower())
words = heard
if a.script:
    script = open(a.script).read().split(); A = [norm(w) for w in script]; B = [norm(w['w']) for w in heard]; words = [None] * len(script)
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False); diffs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1): words[i1 + k] = {'w': script[i1 + k], 's': heard[j1 + k]['s'], 'e': heard[j1 + k]['e']}
        else:
            diffs.append((' '.join(script[i1:i2]), ' '.join(w['w'] for w in heard[j1:j2])))
            if j2 > j1 and i2 > i1:                       # share the heard time span across the script words
                s, e = heard[j1]['s'], heard[j2 - 1]['e']
                for k in range(i2 - i1): words[i1 + k] = {'w': script[i1 + k], 's': round(s + (e - s) * k / (i2 - i1), 3), 'e': round(s + (e - s) * (k + 1) / (i2 - i1), 3)}
    for i in range(len(words)):                           # script words the recording skipped get a zero-length slot
        if words[i] is None:
            prev = words[i - 1]['e'] if i and words[i - 1] else 0
            words[i] = {'w': script[i], 's': prev, 'e': prev}
    for d in diffs: print(f'DIFF script: "{d[0]}"  heard: "{d[1]}"')
    print(f'{len(script)} script words, {len(diffs)} differences')
open(a.out, 'w').write('MI.setWords(' + json.dumps(words) + ');\n')
print(f'{len(words)} words, ends {words[-1]["e"]:.2f} s -> {a.out}')
