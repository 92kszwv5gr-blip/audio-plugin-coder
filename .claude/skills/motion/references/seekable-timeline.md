# Seekable Timeline Architecture v1 (2026-10-22)

Each motion piece is a **pure function of time**. Write it this way so any frame can be rendered alone: for video export, for QA and for scrubbing.

## Load order
1. Parse `CFG` (defaults, then URL params). Seed the PRNG.
2. Derive the timeline: `STEP`, `BAR`, `BARS`, `LAST`, `STOP`, `DUR`, plus the anchors (all relative to `START` or `LAST`).
3. `await document.fonts.load()` for **every** face, so no text is baked with a fallback font.
4. Build the static layer: textures, silkscreen, bezels and knob shadows, all in one offscreen canvas at 2×.
5. Precompute the signal arrays (see `meters-and-ballistics.md`).
6. Define `window.seek`, `window.DURATION`, `window.TIMELINE` and `window.__probe`, then call `seek(0)` and set `window.__ready = true`.
7. Without `?render`: run a rAF loop calling `seek(elapsed % DUR)`. With `prefers-reduced-motion`: draw a single still frame.

## seek(t)
- `t = clamp(t, 0, DUR)`, so `seek(DUR)` and `seek(DUR + 1)` are identical.
- Size the canvas from `clientWidth/Height × devicePixelRatio` (min(dpr, 3)) inside seek. No resize listener is needed.
- Fit the 1920×1080 stage with `fit = min(W/1920, H/1080)` and centre it. The camera is `(z, cx, cy)` from easing on `t`.
- Draw order: desk → lamp pool → (plugin translate) shadow sprite → static layer → VU → display/scope → ladders → knobs → LEDs → sheen → darkness overlay → cursor/tooltip.

## State from t (never from the previous frame)
- Knob angle: start from the default, then fold every `MOVES` entry in time order with `lerp(a, to, ease(prog(t, t0, t0 + d)))`.
- Step LED: compute the most recent playhead index for that LED and decay from its off-time. After `STOP`, step 1 ramps to rest.
- Meters: `read(array, t)` with linear interpolation.

## Easing
- `bezier(x1, y1, x2, y2)` solved by bisection (28 iterations), matching CSS `cubic-bezier`.
- Knobs: (0.45, 0, 0.2, 1) over 0.6–0.9 s. Camera: (0.65, 0, 0.35, 1) over 1.2 s. Rise: (0.22, 1, 0.36, 1).

## Changing length / BPM
- `BARS = max(3, floor((len − 2.1 − 1.47)/BAR + 0.01))`. Extra bars go before the cutoff gesture, because every later anchor is relative to `LAST`.
- For under 3 bars, re-plan the story. Don't compress the gestures below 0.6 s.

## QA hooks
- `window.__probe(t)` returns needle positions, ladder levels, the cutoff angle/Hz, zoom and the playing flag. It is read-only.
- `scripts/motion/check-frames.cjs` uses the probe to check needle continuity, the 0 VU kiss and the meters at rest during the hold.

## History
- v1 (2026-10-22): first version, from the M-84 build.
