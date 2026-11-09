'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html'), sw = read('sw.js');
const stripQuery = u => u.split('?')[0];
const precached = new Set([...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]));

test('service worker VERSION matches the vNN label in index.html', () => {
  const label = html.match(/opacity:\.6">(v\d+)</)[1];
  assert.equal(sw.match(/const VERSION = '(v\d+)'/)[1], label);
});

test('every local script, stylesheet and CSS url() is precached and exists on disk', () => {
  const used = new Set([
    ...[...html.matchAll(/<script src="([^"]+)"/g)].map(m => stripQuery(m[1])),
    ...[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => stripQuery(m[1])),
    ...[...read('mobile.css').matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map(m => stripQuery(m[1])).filter(u => !u.startsWith('data:')),
  ]);
  for (const f of used) assert.ok(precached.has(f), `${f} is missing from sw.js ASSETS`);
  for (const f of precached) if (f !== './') assert.ok(fs.existsSync(path.join(root, f)), `${f} in ASSETS does not exist`);
});

test('manifest is valid and its icons exist', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.name && m.short_name && m.start_url && m.scope);
  assert.ok(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(root, i.src)), i.src);
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
});

test('every script tag in index.html carries a ?v= cache buster', () => {
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) assert.match(m[1], /\?v=\d+$/, m[1]);
});
