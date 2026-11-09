---
name: montinfo
description: Make a long-form 16:9 flat-vector infographic explainer of 8 minutes or more, where cartoon people act out every narrated line inside a new illustrated place every few seconds, from a recorded voice-over. All art and motion are code, with no account or API needed. Use when the user says MontInfo, or asks for a big infographic-channel style explainer, a flat-vector documentary explainer, or an animated explainer with many places and acted-out narration.
---

# MontInfo

A finished 1920x1080 explainer where every line is acted out by cartoon people in full illustrated places. Nothing is generated as video. Every frame is a pure function of time.

Works in Claude Code and Codex. `<skill>` below means the folder holding this file. **If `references/pro.md` exists, this is the Premium version: read that file now too.** It adds to everything below.

**Studio** (holds `.venv`, node modules and `projects/<slug>/`): `$MONTINFO_HOME` if set, else `~/MontInfoStudio`. First run: `bash <skill>/setup.sh`, then tell the user what was installed. It prints the studio path. Below, `$STUDIO` is that path.

**Long commands.** A final render takes minutes. If your shell has a time limit, run it in the background with its output in a log and check the log. A stopped render resumes when you run the same command again.

**Looking at frames.** You must open contact sheets and look at them. Claude Code: Read the JPEG. Codex: use your image viewing tool. Passing checks alone is never enough.

## Start: ask only what is missing

1. **Topic and script.** A script the user supplies is used word for word. If you think a fact in it is wrong, keep their words and tell them what you found and why; change it only when they agree. No script: write one (see Script). Real scripts are **8 minutes or longer**, about 1,500 words or more at 170-180 words a minute. If theirs is shorter, say so before building. Anything shorter is only a test.
2. **Voice.** The user records it, unless `references/pro.md` adds another way and the user asks for it. Any voice file works. Until it exists, build against a placeholder voice (`say` on a Mac, any local speech tool elsewhere) and label the result as a placeholder.
3. **Look test** before anything long on a new look: one place, one rigged character, a 10 s shot with typing, a tag and a character who talks and points. Wait for the OK.

## Order of work

1. Script, sources, `vo-script.txt` (spell numbers for reading: "nine hundred million").
2. Art: pick places and cast (below). Contact sheet.
3. Voice: `words.py` gives word times from the recording and lists differences from the script.
4. Shots, one file per chapter in `shots/`.
5. Checks: fix every `CHECK` line, then read a contact sheet per chapter.
6. Sound, then final render.

```bash
PY=$STUDIO/.venv/bin/python; T=<skill>/tools
$PY $T/words.py audio/vo.wav --script script.txt --out words.js
node $T/render.mjs --project . --art code --contact 2 --dir frames        # checks + one frame every 2 s
$PY $T/sound.py --project . --voice audio/vo.wav --out audio/mix.wav       # needs events.json from the line above
node $T/render.mjs --project . --art code --out film.mp4 --audio audio/mix.wav --workers 6
```

Renders go in 20 s chunks in the system caches folder (inside the project if that is blocked). After a crash, run the same command and it resumes. Edits are detected, so old chunks are never reused; `--fresh` forces a restart. Back up `shots/` before any big patch. Speed: about 21 ms a frame on 6 pages, so 8 minutes takes about 5 minutes.

**Shorts:** add `--format 9:16` to the `render.mjs` commands. The world stays 1920x1080 and the frame is its centre column, so keep everything between x 676 and 1244. A Short gets its own 60 to 70 second script and its own `shots/`, never a cut of the long film. The checks use the narrow column.

**Sound:** `sound.py` thins events by default, keeping the strongest and dropping pile-ups, and prints how many a minute it kept. About 50 is right. `MI.ev(name, t, {keep: true})` protects one sound, such as a joke's whoosh. `--all-sounds` turns thinning off.

## Project files

- `script.txt`, `sources.md`, `words.js`, `audio/`
- `art.js` (optional): `window.setupArt = async () => {...}` adds image plates and image rigs
- New code places and new cast go at the top of `shots/00-places.js`
- `shots.js`, or `shots/01-*.js`, each `(window.SHOTFILES = window.SHOTFILES || []).push(() => { ... });`

## Shots

```js
(window.SHOTFILES = window.SHOTFILES || []).push(() => {
  const { Q, actor: A, write: W, tag, stamp, numberCard: N, dateCard, rigs: R, K, prop: P } = MI;
  //  words the shot starts on, place, camera from, camera to, world drawing, screen drawing, options
  Q(0, 'street', [1.02, .5, .55], [1.1, .52, .52], (g, b) => {
    K.sign(b.band, 'First National', { max: 56 });                // text lives on the world
    A(R.clerk, { x: 100, y: 880, h: 460, walk: [[g.st, -160, g.st + 2.2, 1060]], poses: [[0, 'hold']], expr: [[0, 'sleepy']] });
  }, g => { dateCard('Next morning', g.st + .1); });              // screen space
  Q('the money left', 'vault:night', [1, .5, .5], [1.08, .5, .47], (g, b) => {
    K.rain(g, 700, 520, 300, 800, g.a('money left'), 16, .8);     // g.a('words') = when those words start
  }, g => { N(640, 70, 'Lost', 500000000, g.st + .1, { prefix: '$', size: 84, roll: .9 }); });
});
```

`Q` searches forward from the last shot, so a repeated line cannot land on the wrong moment. `Q(0, ...)` is the first shot. Camera is `[zoom, focusX, focusY]` and always moves. The fifth argument draws in the world, the sixth over it; either can be `null`. Same place as the shot before makes a planned cut. Options: `{trans:'push'|'splat'|'cut', sfx:'whoosh', name}`. `splat` opens a chapter. Inside a shot, `g.st`, `g.en` and `g.d` are its times; `g.a('words', offset)` and `g.b('words', offset)` give start and end times at or after the shot.

Whole words only, apostrophes included: `"It isn't"`, not `'It isn'`. A missing phrase stops the build. Blanks are `b.screen`, `b.board` and so on, never `b` itself. Every place's blanks are in `references/places.md`.

Pace on the Citibank film: 11 minutes, 280 shots, 96 plates, 2.4 s a shot. Places build on demand with only 5 kept in memory, so 100+ plates are safe on 6 render pages.

**Actor:** `x, y (feet), h, walk:[[t0,x0,t1,x1]], poses:[[t,name]], expr:[[t,name]], say:[[a,b]], enter:t, hop, jump:[t], fear:[[a,b]], sprite:[[t,'typing']], jitter, flip, dark, raised`. Use `raised` for anyone standing behind a bench or counter.
**Poses:** rest, down, hips, point, pointl, pointdown, present, presentl, shrug, up, head, chin, hold, wave, stop, cheer, typing.
**Expressions (code cast):** neutral, smile, happy, shocked, worried, angry, sad, disgust, terrified, sleepy.
**Graphics:** `dateCard placeCard board write type tag numberCard redX stamp banner bubble thought qmark bang puff speedLines sweat coins vignette tint tickBox`.
**Props:** `MI.prop.` table desk bench gavel block mug moneyBag bills phone arrow lipstick envelope mask cheque dialog swan rabbit hat net truck crate pages ice glove wmoney stream. Arguments for everything are in `references/api.md`. Read it before writing shots.
**Helpers:** `MI.K.` sign (fill a blank instantly), hand (with a click press), click, mask, rain (falling money), lineGroup (a row of people), flash.
## Films about films: real clips, robots, code

For a film that shows real footage or an AI at work. All in `MI.K`. Only use footage you own.

```bash
$PY $T/clips.py --project . swan=old/film.mp4@541+5 first=old/film.mp4@0+0     # name=file@START+SECONDS, 0 seconds is one sharp frame
$PY $T/splice.py --film body.mp4 --at 245.37 --sample old/film.mp4 --from 0 --to 70.2 --out film.mp4   # cut a long sample in with its own sound
```

- `K.tv(x, y, w, 'swan', g.st)` a monitor playing the clip. `K.clipIn('swan', x, y, w, h, g.st)` plays it in any rectangle. Options: `{speed, frame}`.
- `K.film('swan', g.st)` fills the frame, on the place `film_swan`, which every clip gets automatically.
- `K.robot(x, y, s, {mood, pose, say, enter, hop, walk, flip})` an AI agent as a character. Moods: happy, proud, neutral, oops, thinking, sleepy. Poses: rest, wave, up, point, pointl, shrug, type.
- `K.term(x, y, w, h, lines, g.st, {title, size, rate})` a code window that types itself.
- `K.score(x, y, 'Failed', g.st, {col})` a stamped result chip.

Read the frames of every clip before using it: pick a moment that says something, and avoid a clip's blurred transitions. In 9:16, play clips on phone-width screens (`K.clipIn('swan', 680, y, 560, 315, g.st)`) rather than cropping them.

## Art

**Before planning shots, look at the pictures of every kit place in `references/places-*.jpg`**; names and blanks are in `references/places.md`. Use a name in `Q`: `'laundry'`, or `'laundry:night'` for another mood (`day`, `night`, `warm`).

Cast, ready as `MI.rigs.<name>`: clerk boss analyst officer lender lender2 judge judge2 passer passer2 maker checker approver headops rep lawyer lawyer2 postman you. For someone new, add to `MI.PEOPLE` before use: skin, hair, hairStyle (bob, short, long, bun, bald), top, vest, tie, collar, pants, shoes, glasses, beard, seed.

The kit is the floor, not the ceiling. An 8-minute video needs about 80 places, and no script is served by the kit alone. **Write new places for the subject** in the project, and make them truly different pictures: one drawing function with options reads as one place, and the check compares the pictures. Write them the same way the kit does; copy the pattern from `engine/mi-places.js`, using `MI.draw` and `MI.set`, with blank rectangles for text:

```js
(window.SHOTFILES = window.SHOTFILES || []).push(() => {      // shots/00-places.js
  const { rr } = MI.draw, S = MI.set;
  MI.PLACES.bakery = (mood = 'day') => MI.place(c => {
    const m = MI.MOODS[mood]; S.room(c, m, 740); rr(c, 610, 110, 700, 100, 8, '#8a4b2d');   // draw with solid fills, no outlines
    return { sign: { x: 630, y: 118, w: 660, h: 84 } };                                     // blanks: text goes here
  }, { floorY: 790, mood });
});
```

## The look, and what we learned in our other studios

These matter as much as the code.

- Every line is acted. A character points at the thing being named, presents it, shrugs, cheers, holds their head. Check motion, not stills.
- **A shot every 2-3 s. A different place at least every 6 s, about 10 distinct places a minute or more.** Something new every 2 s. Never hold a still over 1 s. Nobody stands still.
- **Never a slideshow.** One person beside one sign is the failure this style exists to avoid. Do not write a helper that builds every shot from one recipe, and do not add easels or panels to hold text. Build each shot from what its line says happens: "the money left" means money physically leaves the building; "three people approve" means three people, in a row, each doing it. Before writing a shot, ask what a silent viewer would understand from the action alone. Most lines need more than a person and words: props, other people, things falling, moving, breaking, or being handed over. Vary who is on screen, where and how big, from wide shots to faces filling the frame.
- Text lives on things in the world: signs, boards, screens, pages. Facts never sit on a plain card when a place could hold them. Unwritten signs fill themselves.
- Sound follows what happens on screen, never the edit. The engine adds a soft whoosh on the bigger scene changes by itself, about one every 15 s, and chapter opens get a full one. Do not add a sound to every move: at 25 a minute it becomes a tic. Use `{sfx:'whoosh'}` to force one on a move or `{sfx:false}` to silence it. `sound.py` varies pitch, length and level so no two hits match.
- Land jokes on their own beat with a stinger (`scratch`, `boing`), and act beats like "A pause." rather than saying them. Add one small visual payoff gag when it fits, like the coin that tips over.
- Mix wide shots with reaction close-ups. Keep characters moving around the frame, never parked in one corner.
- Change props and sets as the script changes them, so a scene never repeats.
- Never invent words for real people. A chat, email or quote shown on screen is the real text from the source, or it carries no readable words. Made-up figures are labelled as examples, and any sum you work out yourself must be something the source supports.
- Literal gags earn their place: a laundromat for a wash account, a claw machine for "clawed back", a black swan on a lake. Look for the picture hiding in the words.
- Banned: ink outlines on people and scenery, floating glossy panels, emoji, burned-in subtitles, any channel's logo or name, photos of real people. Do not copy a specific channel's characters or look.

## Script

Open on the strangest true detail, hold back the why, and keep it conversational. Every line must give a picture to act. Real people and companies get sourced facts in `sources.md`, and anything unconfirmed is left out or said plainly. Judge dryness yourself and deliver a finished script. Accuracy never turns it into an essay: follow a person who wants something, state a doubt once and move on, and cut lecture lines like "that difference matters" or a run of "reports say". Read it aloud: would you keep listening? Titles are an absurd picture that holds back the why.

## Checks

`render.mjs` prints `CHECK` lines before rendering. They catch: backgrounds that look alike whatever they are named, one sound repeated into a tic, sound switched off across the film, hard cuts between places, slideshow patterns (the same person in the same spot, the same camera move, one recipe repeated, shots with nothing happening), too few sounds, holds over 5 s, repeated places, text over a face, text off screen, text cut off by a shot, a tag line crossing text, feet above the floor, 4 s with nothing new, under 8 places a minute. Fix them by changing what happens in the shot, never by working around the check. Fix all of them, or explain why one stays.

Then read a contact sheet per chapter. The checks cannot judge whether the acting matches the line, and they cannot catch text placed on top of a sign in the world, so look for those by eye. `--contact` writes `sheet-*.jpg` next to the frames. If a sheet looks like slides with different backgrounds, redo the shots.

`sound.py` builds SFX and an original music bed in code, or takes `--music file`. It ducks music under the voice, protects the voice automatically (15+ dB, background louder in under 1% of frames), and masters to -14 LUFS (within 0.5 is fine), true peak under -1 dB. It exits with an error if the voice is not clear. Check that its gate line passes. New music each video: change `--seed`.

## Deliver

`film.mp4` plus an `Upload to Socials` folder: title, description with chapters, thumbnails and sources. Say plainly anything placeholder or unverified.

Temp files stay in the caches folder and are deleted after encoding.
