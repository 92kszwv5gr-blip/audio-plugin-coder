#!/usr/bin/env node
// Motion QA: one frame per second + contract checks for a seekable canvas animation.
// Usage: node scripts/motion/check-frames.cjs <path/to/index.html> [outDir] [--query "maker=X&len=12"]
// Needs Playwright (npm i -D playwright, or a global install reachable through NODE_PATH).
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const qi = args.indexOf('--query');
const extraQuery = qi >= 0 ? args.splice(qi, 2)[1] : '';
const file = path.resolve(args[0] || 'motion/velloway-m84/index.html');
const outDir = path.resolve(args[1] || path.join('build', 'motion', path.basename(path.dirname(file)), 'qa'));
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  const url = 'file://' + file + '?render' + (extraQuery ? '&' + extraQuery : '');
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true && typeof window.seek === 'function', null, { timeout: 30000 });

  const report = { file, url, checks: [], frames: [] };
  const check = (name, ok, detail) => { report.checks.push({ name, ok, detail }); };

  // Source-level contract.
  const src = fs.readFileSync(file, 'utf8');
  check('no setTimeout/setInterval', !/set(Timeout|Interval)\s*\(/.test(src));
  check('no CSS transitions/animations', !/(^|[;{\s])(transition|animation)\s*:/m.test(src));
  check('no Math.random', !/Math\.random\s*\(/.test(src));
  check('no three.js', !/three(\.min)?\.js/i.test(src));
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family));
  check('web fonts loaded', fonts.length > 0, fonts.join(', ') || 'none (fallbacks in use: check network)');

  const dur = await page.evaluate(() => window.DURATION);
  const tl = await page.evaluate(() => window.TIMELINE || null);
  report.timeline = tl;

  // One frame per second.
  for (let s = 0; s <= Math.ceil(dur); s++) {
    await page.evaluate(t => window.seek(t), s);
    const f = path.join(outDir, `frame-${String(s).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    report.frames.push(f);
  }

  // Determinism and end clamp.
  const snap = t => page.evaluate(t => { window.seek(t); return document.querySelector('canvas').toDataURL(); }, t);
  const end = await snap(dur), past = await snap(dur + 1);
  check(`seek(${dur}) === seek(${dur + 1})`, end === past);
  const a1 = await snap(5.37), b0 = await snap(2.1), a2 = await snap(5.37);
  check('seek is stateless (5.37 -> 2.1 -> 5.37 identical)', a1 === a2 && a1 !== b0);

  // Needle continuity: no jumps at the 1/240 s grid (and between grid points).
  const probe = await page.evaluate(d => {
    const out = []; for (let i = 0; i <= d * 480; i++) out.push(window.__probe ? window.__probe(i / 480) : null); return out;
  }, dur);
  if (probe[0]) {
    let maxStep = 0, at = 0;
    for (let i = 1; i < probe.length; i++) {
      const dl = Math.abs(probe[i].needleL - probe[i - 1].needleL);
      if (dl > maxStep) { maxStep = dl; at = i / 480; }
    }
    // A 300 ms movement can't exceed ~0.02 of full scale per 1/480 s.
    check('needle never jumps', maxStep < 0.03, `max d(pos) per 1/480 s = ${maxStep.toFixed(4)} at ${at.toFixed(3)} s`);
    const peak = Math.max(...probe.map(p => p.needleL));
    check('needles kiss 0 VU', Math.abs(peak - probe[0].vuZero) < 0.02, `peak pos ${peak.toFixed(3)} vs 0 VU ${probe[0].vuZero.toFixed(3)}`);
    // Flash budget (WCAG 2.3.1 style): per light element, count rises of >= 0.5 brightness that follow a
    // drop of >= 0.5, then take the most in any 1 s sliding window. Must stay <= 3.
    if (probe[0].ladSegsL) {
      const series = [];
      probe[0].ladSegsL.forEach((_, i) => series.push({ name: `ladder seg ${i + 1}`, v: probe.map(p => p.ladSegsL[i]) }));
      probe[0].stepLeds.forEach((_, i) => series.push({ name: `step LED ${i + 1}`, v: probe.map(p => p.stepLeds[i]) }));
      let worst = { n: 0, name: '-', at: 0 };
      for (const s of series) {
        const flashes = []; let lo = s.v[0], hi = s.v[0], dropped = false;
        for (let i = 1; i < s.v.length; i++) {
          const v = s.v[i];
          if (!dropped) { hi = Math.max(hi, v); if (hi - v >= 0.5) { dropped = true; lo = v; } }
          else { lo = Math.min(lo, v); if (v - lo >= 0.5) { flashes.push(i / 480); dropped = false; hi = v; } }
        }
        for (let a = 0; a < flashes.length; a++) {
          let b = a; while (b < flashes.length && flashes[b] - flashes[a] < 1.0) b++;
          if (b - a > worst.n) worst = { n: b - a, name: s.name, at: flashes[a] };
        }
      }
      check('no element flashes > 3x in any 1 s', worst.n <= 3, `worst: ${worst.name}, ${worst.n} flashes from ${worst.at.toFixed(2)} s`);
    }
    const tail = probe.filter(p => p.t >= dur - 1.0);
    check('meters at rest during hold', tail.every(p => p.needleL < 0.02 && p.ladL < -40), `needle ${tail[0].needleL.toFixed(3)}, ladder ${tail[0].ladL.toFixed(1)} dB`);
  }

  check('no page errors', errors.length === 0, errors.join(' | '));

  // Contact sheet (ffmpeg optional).
  try {
    const sheet = path.join(outDir, 'contact-sheet.png');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', path.join(outDir, 'frame-%02d.png'),
      '-vf', 'scale=640:-1,tile=4x3:padding=8:color=0x16120E', '-frames:v', '1', sheet]);
    report.contactSheet = sheet;
  } catch (e) { report.contactSheet = null; }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  let failed = 0;
  for (const c of report.checks) { if (!c.ok) failed++; console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? '  (' + c.detail + ')' : ''}`); }
  console.log(`frames: ${report.frames.length} -> ${outDir}`);
  if (report.contactSheet) console.log(`contact sheet: ${report.contactSheet}`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
