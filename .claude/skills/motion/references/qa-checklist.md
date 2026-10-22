# Motion QA Checklist v1 (2026-10-22)

Run `bash scripts/motion/motion.sh check <index.html>`. It produces `frame-00..NN.png`, `contact-sheet.png` and `report.json` in `build/motion/<name>/qa/`.
**Automated checks don't replace looking.** Open every frame.

## Automated (check-frames.cjs)
- [ ] No setTimeout/setInterval, CSS transition/animation, `Math.random`, or three.js
- [ ] Web fonts loaded (if not, the network is blocked and text is in the fallback: don't ship)
- [ ] `seek(DUR) === seek(DUR + 1)` (pixel-identical `toDataURL`)
- [ ] seek is stateless (A → B → A gives the same pixels)
- [ ] Needle never jumps (< 0.03 full scale per 1/480 s)
- [ ] Accent needle peak at 0 VU (±0.02)
- [ ] Meters at rest through the final 1 s hold
- [ ] No page/console errors

## By eye, per frame
- [ ] No overlaps: tooltip over controls, labels on ticks, VU numbers touching each other
- [ ] No clipped or cramped text. Everything ≥ 20 px in stage units
- [ ] Knob highlight stays put while the indicator turns (compare two frames of a knob that moved)
- [ ] Glass reflections and specular bands don't move with needles or knobs
- [ ] Walnut shows real wandering grain at 1:1 (crop a cheek). Aluminium shows horizontal brushing
- [ ] Nothing Banned: neon, emoji, photo textures, real brand names, flat grey "metal"
- [ ] No element blinks faster than 3 Hz (check the step row and ladder tops)
- [ ] Story beats on time: lamp/rise (0–1 s), PLAY + backlight (1.0), downbeat (1.47), cursor (4.2), push (6.5), last hit (7.90), stop (8.4), pull-back done (8.9)

## Deliverables
- [ ] `motion/<name>/index.html` committed
- [ ] MP4 rendered (`motion.sh render`), 1080p60, duration = DUR
- [ ] Artifact page built (`motion.sh artifact`) and published only with the owner's OK

## History
- v1 (2026-10-22): first checklist.
