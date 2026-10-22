---
name: motion
description: Build a seekable, deterministic promo animation of a hardware-style plugin UI (brushed metal, wood cheeks, knobs, VU needles, LED ladders, step sequencer) as one self-contained index.html, then QA it frame by frame, render MP4 and publish as an Artifact. Use for "animate the plugin", "promo clip", "plugin playing itself", "/motion [Name]".
---

# SKILL: MOTION (Hardware-Style Plugin Animation)

**Trigger:** `/motion [Name]` or a request for an animated promo/teaser of a plugin UI.
**Output:** `motion/[name]/index.html` (+ QA frames, MP4 and Artifact page under `build/motion/[name]/`).
**Reference build:** `motion/velloway-m84/index.html` (copy it, don't start from a blank file).
**Not a plugin phase:** no `status.json` change, no CMake, no phase gate. If it promotes an APC plugin, read `plugins/[Name]/status.json` and `.ideas/parameter-spec.md` to take the real section/parameter names.

## Inputs (use defaults, never ask for missing ones)
| Input | Default | Where it lives |
|---|---|---|
| Maker / model | `VELLOWAY`, `M-84` `MONOSYNTH` | `CFG.maker/model/kind` or `?maker=&model=&kind=` |
| Preset | `07 COPPER DUSK` | `CFG.preset` / `?preset=` |
| Pattern | 112 BPM, 16 steps, on 1 4 7 9 11 14, accents 1 9 | `?bpm=&steps=&accents=` |
| Sections | OSCILLATOR / FILTER / ENVELOPE / OUTPUT | `KNOBS`, `SECTIONS` |
| Length | 10 s | `?len=` (adds/removes whole bars, min 3 bars, hold >= 1 s) |
| Seed | 84 | `?seed=` (all textures and per-hit variation) |

Fictional names only. Never use a real manufacturer or product name.

## Steps
1. **Spec.** Fill `references/prompt-template.md` with the inputs; keep the Direction/Banned lists intact.
2. **Copy.** `motion/velloway-m84/` to `motion/[name]/`. Change `CFG`, `KNOBS`, `SECTIONS`, `MOVES` only. Keep the architecture in `references/seekable-timeline.md`.
3. **Materials and meters.** Tune from `references/materials.md` and `references/meters-and-ballistics.md`. Don't swap in photos or flat gradients.
4. **QA (mandatory, before showing anyone).**
   `bash scripts/motion/motion.sh check motion/[name]/index.html` (Windows: `scripts\motion\motion.ps1 check ...`)
   Then **look** at every `frame-XX.png` and the contact sheet against `references/qa-checklist.md`. Fix, re-run, look again.
5. **Render.** `bash scripts/motion/motion.sh render motion/[name]/index.html` gives 1080p60 H.264 MP4 (CRF 16).
6. **Publish (only with the user's OK for anything public).** `bash scripts/motion/motion.sh artifact motion/[name]/index.html`, then publish `build/motion/[name]/artifact.html` with the Artifact tool (private by default).
7. **Report.** Artifact link, MP4 path, QA pass list, and anything you couldn't verify.

## Hard rules
- One file. Inline CSS/JS, Google Fonts `<link>` only, `await document.fonts.load()` for every face before defining `window.seek`.
- `window.seek(t)` sets everything from `t` alone and clamps past the end. No CSS transitions/animations, no setTimeout/setInterval, no `Math.random`, no frame-to-frame state.
- `?render` means no rAF loop. Otherwise loop with rAF and honour `prefers-reduced-motion` (show a still).
- Text >= 20 px in stage units. Nothing flashes more than 3 times per second.
- Light is fixed to the world: only knurl and indicator rotate; glass and specular stay put.
