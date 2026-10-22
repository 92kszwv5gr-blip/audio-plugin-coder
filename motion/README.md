# Motion: Plugin Promo Animations

Version: v1 (2026-10-22) · Status: **active**

Seekable, deterministic canvas animations of plugin UIs, each in one self-contained `index.html`. They render to MP4 frame-exactly and publish as Artifacts.

| Piece | What | Length |
|---|---|---|
| [`velloway-m84/`](velloway-m84/index.html) | Hardware-style monosynth (walnut + brushed aluminium) playing a 16-step pattern at 112 BPM | 10 s |

## Kit
| Part | Path |
|---|---|
| Skill (`/motion`) | `.claude/skills/motion/SKILL.md` |
| Prompt template | `.claude/skills/motion/references/prompt-template.md` |
| Knowledge base | `.claude/skills/motion/references/` (materials, meters & ballistics, timeline architecture, QA checklist) |
| Workflow | `.claude/workflows/motion.md` |
| Pipeline | `scripts/motion/motion.sh` / `motion.ps1` → `check-frames.cjs`, `render-video.cjs`, `to-artifact.cjs` |

## Quick use
```bash
open motion/velloway-m84/index.html                       # live loop
open "motion/velloway-m84/index.html?preset=03%20IRON%20TIDE&bpm=120&len=12"
bash scripts/motion/motion.sh all motion/velloway-m84/index.html   # QA frames + MP4 + artifact page
```
URL params: `maker`, `model`, `kind`, `preset`, `bpm`, `steps`, `accents`, `len`, `seed`, `render`.

## Open decisions
- Audio track: the piece is silent. A matching render from the same hit list (WebAudio offline → WAV, then muxed) is the natural next step. [not built]
- BPM other than 112 keeps the gesture times fixed relative to the last hit. Lengths under 10 s need the story re-planned.

## History
- v1 (2026-10-22): VELLOWAY M-84 reference build, `/motion` skill, QA/render/artifact pipeline.
