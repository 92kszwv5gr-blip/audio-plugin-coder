---
description: "MOTION: Seekable promo animation of a hardware-style plugin UI (spec, build, QA, render, publish)"
---

# Motion Workflow

**Prerequisites:** none (not gated by plugin phases). Node 18+, Playwright with Chromium, ffmpeg.

**Execute Skill:**
Load and execute `.claude/skills/motion/SKILL.md`

**Pipeline:**
```
brief ──► prompt-template.md (filled) ──► motion/<name>/index.html
      ──► motion.sh check   (frames + contract checks + contact sheet)  ──► look at every frame, fix, repeat
      ──► motion.sh render  (1080p60 MP4)
      ──► motion.sh artifact (Artifact page body) ──► publish privately, share only with the owner's OK
```

**Commands:**
- macOS/Linux: `bash scripts/motion/motion.sh <check|render|artifact|all> motion/<name>/index.html`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\motion\motion.ps1 <check|render|artifact|all> motion\<name>\index.html`

**Outputs:** `build/motion/<name>/qa/`, `build/motion/<name>/<name>.mp4`, `build/motion/<name>/artifact.html` (`build/` is git-ignored).

**Stop** after reporting the links and QA results. Don't post or publish anything public without explicit approval.
