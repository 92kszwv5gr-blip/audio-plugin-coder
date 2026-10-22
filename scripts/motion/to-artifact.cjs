#!/usr/bin/env node
// Turn a standalone index.html into a claude.ai Artifact page body:
// strips <!DOCTYPE>, <html>, <head>, <body> wrappers (the Artifact host adds its own skeleton)
// and keeps <title>, <link>, <style>, content and <script> in order.
// Usage: node scripts/motion/to-artifact.cjs <index.html> [out.html]
'use strict';
const fs = require('fs');
const path = require('path');

const src = path.resolve(process.argv[2] || 'motion/velloway-m84/index.html');
const out = path.resolve(process.argv[3] || path.join('build', 'motion', path.basename(path.dirname(src)), 'artifact.html'));
let html = fs.readFileSync(src, 'utf8');
html = html
  .replace(/<!DOCTYPE[^>]*>\s*/i, '')
  .replace(/<\/?html[^>]*>\s*/gi, '')
  .replace(/<\/?head[^>]*>\s*/gi, '')
  .replace(/<\/?body[^>]*>\s*/gi, '')
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
// <title> must sit in the first 8 KB for the gallery name.
const m = html.match(/<title>[\s\S]*?<\/title>\s*/i);
if (m) html = m[0] + html.replace(m[0], '');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`artifact page -> ${out} (${(html.length / 1024).toFixed(1)} KB)`);
