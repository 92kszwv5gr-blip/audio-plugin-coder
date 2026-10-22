#!/usr/bin/env node
// Render a seekable canvas animation (window.seek(t), window.DURATION) to H.264 MP4.
// Usage: node scripts/motion/render-video.cjs <index.html> [out.mp4] [--fps 60] [--width 1920] [--height 1080] [--query "len=12"]
// Deterministic: every frame is seek(i / fps), so any frame can be re-rendered on its own.
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv.splice(i, 2)[1] : def; };
const fps = +opt('fps', 60), width = +opt('width', 1920), height = +opt('height', 1080), query = opt('query', '');
const file = path.resolve(argv[0] || 'motion/velloway-m84/index.html');
const out = path.resolve(argv[1] || path.join('build', 'motion', path.basename(path.dirname(file)), 'render.mp4'));
fs.mkdirSync(path.dirname(out), { recursive: true });

(async () => {
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('file://' + file + '?render' + (query ? '&' + query : ''));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * fps);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));

  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.seek(t), i / fps);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r${(i / fps).toFixed(0)}s / ${dur}s`);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log(`\n${frames} frames @ ${fps} fps -> ${out}`);
})().catch(e => { console.error(e); process.exit(2); });
