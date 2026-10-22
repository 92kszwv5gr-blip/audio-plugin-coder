# Meters & Ballistics v1 (2026-10-22)

Everything is precomputed at load on a fixed **1/240 s** grid. `seek(t)` only interpolates the arrays linearly.

## Source signal
- Hits on the active steps: attack is linear over 5 ms, then decays as `exp(−(dt − 5 ms)/60 ms)`, which is about −26 dB at 180 ms. Accents ×1.4 (+2.9 dB).
- L/R gains get a seeded ±5% per-hit spread so the two needles never move as one.

## VU needle (2nd-order mass-spring)
- `ẍ = ω²(u − x) − 2ζω·ẋ`, integrated semi-implicitly with 8 substeps per grid step (1920 Hz).
- ζ from overshoot: `ζ = −ln(0.015)/√(π² + ln²(0.015)) ≈ 0.80` (1.5% overshoot).
- ω is solved by bisection so the unit step first reaches **99% at 300 ms**.
- The scale is **linear in voltage**: `pos = 10^(dB/20) / 10^(3/20)`, so +3 VU is full scale and 0 VU sits at 0.708. This gives the real crowded low end.
- Angle sweep is −45° to +45°. Pegs at 0 and 1.04 with the velocity zeroed (no bounce through the stop).
- Calibration: a first pass at gain 1 finds the peak position, then `K_VU = pos(0 VU)/peak`, so accents just kiss 0 VU.
- Labels: −20, −7, −3, 0, +3. A −20, −10, −5 set crowds at 20 px, because −20 and −10 sit only 14° apart.

## LED ladder (16 segments)
- Thresholds (dBFS): −40 −34 −30 −26 −22 −19 −16 −13 −11 −9 | −7 −5.5 −4.5 −3.5 | −2.5 −1.2
  (10 green #39D353, 4 amber #FFB000, 2 red #FF3B30, unlit at 14%).
- Instant rise, **36 dB/s** release. Peak hold is 0.4 s, then a 60 dB/s fall, so the ladders clear about 1 s after the last hit.
- Calibration: accent peak = −1.5 dBFS (first red lit, top red rare). Normal hits peak around −4.4 dBFS.
- Segment brightness is ramped over 1.2 dB, so a segment fades rather than snapping.

## Flash budget (< 3 Hz)
- With the default pattern, the hit rate is 6 per 2.14 s bar, about 2.8 per second, so the top segments toggle below 3 Hz.
- Step-LED chase: each LED lights once per bar and decays over 90 ms. Never make a whole row blink together.
- The display shows no per-step counter; text that changes at 7.5 Hz reads as flicker.

## Measured on the reference build (check-frames.cjs)
- Largest needle change per 1/480 s: 0.016 of full scale (limit 0.03).
- Needle peak 0.708 against 0 VU at 0.708. Meters at rest through the final 1 s hold.

## History
- v1 (2026-10-22): first version. Dropped the −10/−5 VU labels for being cramped at 20 px.
