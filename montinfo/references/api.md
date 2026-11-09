# MontInfo API

Arguments of every helper, taken from the engine. `st` is a start time in seconds, `en` an end time, `o` an options object. Values after `=` are defaults.

## Graphics (`MI.`)

- `dateCard(value, st, o)`
- `placeCard(value, st, o)`
- `board(x, y, w, h, lines, st, o = {})`
- `write(blank, str, o = {})`
- `type(str, x, y, o = {})`
- `tag(tx, ty, ex, ey, text, st, o = {})`: `tx, ty` is the thing being pointed at, `ex, ey` is the end where the label sits.
- A person seen walking side-on keeps a pleasant face. For a frightened walker, use the front view with the legs moving.
- `numberCard(x, y, label, value, st, o = {})`
- `redX(x, y, size, st)`
- `stamp(x, y, text, st, o = {})`
- `banner(y, text, st, o = {})`
- `bubble(x, y, w, h, text, st, o = {})`
- `thought(x, y, w, h, text, st, o = {})`
- `qmark(x, y, st, en = 1e9, size = 110)`
- `bang(x, y, st, dur = 1, size = 130)`
- `puff(x, y, st, size = 90, o = {})`
- `speedLines(x, y, w, h, dir = 1, a = .5)`
- `sweat(x, y, st, en)`
- `coins(x, y, st, n = 10, o = {})`
- `vignette(a = .22)`
- `tint(col, a)`
- `tickBox(x, y, size, label, tick, o = {})`
- `actor(rig, o)`
- `Q(phrase, name, A, B, world, screen, o = {})`
- `cam(g, plate, A, B)`

## Props (`MI.prop.`)

- `street(mood = 'day')`
- `skyline(mood = 'day')`
- `courtroom(mood = 'day')`
- `boardroom(mood = 'day')`
- `table(x, y, w, col = '#6b4a3f')`
- `vault(mood = 'night')`
- `factory(mood = 'day')`
- `classroom(mood = 'day')`
- `hospital(mood = 'day')`
- `shop(mood = 'day')`
- `lipstick(x, y, s = 1)`
- `envelope(x, y, s = 1, ang = 0, col = '#f6f3ec')`
- `mask(x, y, s = 1)`
- `cheque(x, y, w, name, st, o = {})`
- `dialog(x, y, w, st, lines, o = {})`
- `swan(x, y, s = 1, col = '#16182a')`
- `rabbit(x, y, s = 1)`
- `hat(x, y, s = 1)`
- `net(x, y, w, sag = 40)`
- `truck(x, y, s = 1, col = '#59607a', flip = 1, label)`
- `crate(x, y, s = 1, label, col = '#c49a6c')`
- `pages(x, y, n, w = 260)`
- `ice(x, y, w, hh)`
- `glove(x, y, s = 1, col = '#d62828', flip = 1)`
- `wmoney(x, y, s = 1, ang = 0)`
- `stream(x1, y1, x2, y2, st, n = 14, s = 1, rate = .9)`

## Helpers (`MI.K.`)

- `sign(b, str, o = {})`
- `hand(x, y, s = 1, col = '#f2f2f4', skin = '#b57d5c', press = 0)`
- `face(rig, x, y, h, o = {})`
- `mask(x, y, h)`
- `rain(g, x, w, top, bot, st, n = 26, s = 1)`
- `lineGroup(who, x0, gap, y, h, o = {})`
- `flash(g, st)`

## Film tools (`MI.K.`)

Clips come from `tools/clips.py`, which writes `clips/<name>/0000.jpg` at 15 fps and `clips/manifest.js`. They load before `setupArt`.

- `K.film(name, st, {speed, frame})` fills the frame. Use it on the place `film_<name>`.
- `K.clipIn(name, x, y, w, h, st, {speed, frame, r})` plays in a rectangle. A clip holds its last frame when it runs out.
- `K.tv(x, y, w, name, st, {stand, col, speed, frame})` a monitor. Height follows 16:9.
- `K.robot(x, y, s, {mood, pose, say:[[a,b]], enter, hop, walk:[[t0,x0,t1,x1]], seed, flip})` `x, y` are the feet, `s = 1` is about 300 px tall. `mood` and `pose` also take `[[t, name]]` lists.
- `K.term(x, y, w, h, lines, st, {title, size, rate})` lines are strings or `[string, colour]`; `rate` is lines a second.
- `K.score(x, y, text, st, {ang, col, size})` a stamped chip.

`MI.COLUMN` is the visible world width, `[0, 1920]` or `[676, 1244]` in 9:16. `MI.ev(name, t, {keep: true})` protects a sound from thinning.

