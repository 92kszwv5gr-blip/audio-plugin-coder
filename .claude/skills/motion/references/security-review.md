# Motion Kit Security Review v1 (2026-10-22)

Status: **2 fixed, 1 open decision, 3 advisories.** Scope: the source prompt, `motion/velloway-m84/index.html`, `scripts/motion/*`, `.claude/skills/motion/*`, `.claude/workflows/motion.md`, the published Artifact, and the external dependencies.

## Findings

| # | Severity | Area | Finding | Status |
|---|---|---|---|---|
| 1 | Medium | index.html URL params | `?len=1e9` or `?bpm=0.001` made the load-time precompute allocate or loop without bound, so a crafted link froze the viewer's tab. Reproduced: tab never reached ready (> 15 s). | **Fixed**: bpm clamped 60–180, len 10–60, seed integer, step lists deduped and capped at 16, text params ASCII-only and length-capped. Re-test: all hostile links ready in < 1.3 s. |
| 2 | Medium | Photosensitivity (brief's own Banned rule) | The new automated check finds ladder segment 9 flashing **5 times in one 1 s window** (4.42 s). The pattern packs 4 hits into 0.94 s (steps 7, 9, 11, 14), and the falling peak-hold dot adds one more. The earlier "< 3 Hz" claim was based on the 2.8 hits/s average and was wrong. | **Open decision.** Under WCAG 2.3.1 it is likely still a pass, because the concurrently flashing area is far below the 25%-of-341×256 CSS px threshold. Under the brief's stricter "nothing flashes more than 3×/s" it fails. Options are listed in the README. |
| 3 | Low (privacy) | Google Fonts `<link>` | Every view sends the viewer's IP and user agent to Google (fonts.googleapis.com / fonts.gstatic.com). LG München I (3 O 17493/20, 2022-01-20) held dynamic Google Fonts embedding without consent to be a GDPR violation. Relevant for EU-hosted product pages. | Advisory. For any public EU page, self-host the three fonts (inline as data URIs; all OFL [VT323 licence: VERIFY on fonts.google.com]). Fine as-is for a private Artifact. |
| 4 | Low | Pipeline: ffmpeg | The sandbox has Ubuntu 24.04 `ffmpeg 7:6.1.1-3ubuntu5`, the original release build. Later USNs (e.g. USN-7538-1, USN-7982-1) fix DoS and possible code-execution bugs in the decoders. Exposure here is minimal because ffmpeg only decodes PNGs we generate. | Advisory: `sudo apt update && sudo apt upgrade ffmpeg` on any build machine. Never feed the scripts untrusted media. |
| 5 | Info | Pipeline: Playwright | Installed 1.56.1, which is past the CVE-2025-59288 fix (1.55.1; installer scripts used `curl -k`). The docs say `npm i -D playwright` unpinned. | Advisory: pin `playwright@1.56.1` (or newer patched) in devDependencies and commit the lockfile. |
| 6 | Info | Naming | "VELLOWAY": no audio product or trademark found in a web search. The nearest hit is a "YELLOWAY" US mark covering sound apparatus (class 009), one letter apart. | Advisory: run a proper EUIPO/USPTO search before any commercial use. |

## Checked and clean
- **Source prompt:** no URLs, secrets, embedded instructions or tool directives. Its only third-party request is Google Fonts. The Banned list already rules out real brand names and photo textures, which keeps trademark and photo-licence exposure down.
- **Injection:** user text (maker/model/preset) is only drawn with `fillText` on canvas. No `innerHTML`, `eval`, `Function`, `document.write` or DOM sinks. Tested `?preset=<img src=x onerror=alert(1)>`: no element created, no script run.
- **Network surface:** besides Google Fonts there are no fetch/XHR/WebSocket calls, no storage, no cookies, no third-party scripts and no CDN JS.
- **Artifact:** private by default. It declares no capabilities, collects no data, and runs under the claude.ai CSP. The host never passes query strings to the page, so finding 1 couldn't be exploited through the Artifact.
- **Globals:** `window.seek`, `__probe`, `TIMELINE` and `DURATION` are read-only views of the precomputed state. They expose nothing beyond what's on screen.
- **Scripts:** `ffmpeg` is called with `execFileSync`/`spawn` argument arrays (no shell, so no command injection). Chromium runs with its sandbox on (no `--no-sandbox`). Paths come only from the CLI caller. `to-artifact.cjs` is a pure text transform.
- **Wrappers:** `motion.sh` uses `set -euo pipefail` and quoted variables. Node drops empty `NODE_PATH` entries, so a leading `:` can't add the current directory.
- **Skill/workflow:** they instruct no publish/post without the owner's OK and use only fictional brand names. No credentials or connectors are involved.

## Re-test
`bash scripts/motion/motion.sh check <index.html>` now includes the flash-budget check (WCAG-style: a ≥ 0.5 brightness drop then rise, max count in any 1 s window, per ladder segment and step LED).

## History
- v1 (2026-10-22): first review. Fixed the param-driven tab freeze, added the flash-budget check, logged the Google Fonts, ffmpeg, Playwright and naming advisories.

Sources: [GHSA / CVE-2025-59288](https://advisories.gitlab.com/npm/playwright/CVE-2025-59288/), [LG München Google Fonts (KPMG Law)](https://kpmg-law.de/en/?p=25292), [USN-7538-1](https://ubuntu.com/security/notices/USN-7538-1), [USN-7982-1](https://ubuntu.com/security/notices/USN-7982-1), [WCAG 2.2 Understanding 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [Saira Semi Condensed licence](https://fonts.google.com/specimen/Saira%2BSemi%2BCondensed/about).
