// Smoke test: open dist/index.html via file:// (no server) in headless Chromium.
// Flow (v0.2): Title -> Gallery -> every tab -> sprite detail -> back ->
// Test Village -> tap a free tile -> the necromancer's tile must change;
// tap a blocked tile -> no move. Also: phone dpr 3 sizing, portrait screen.
// Fails on any console error or any non-file request.
// Usage: node tools/smoke.mjs [screensDir]
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright'); }

const url = pathToFileURL(resolve('dist/index.html')).href;
const dir = process.argv[2] ?? 'docs/screens';
const browser = await pw.chromium.launch();
const errors = [];
const external = [];
const steps = [];
const log = (s, ok = true) => { steps.push(`${ok ? 'ok  ' : 'FAIL'} ${s}`); if (!ok) failed = true; };
let failed = false;

async function open(viewport, dpr = 1) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: dpr, hasTouch: true });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  await page.goto(url);
  await page.waitForTimeout(1500);
  return page;
}
/** click at game coordinates (480x270 space) */
async function tapGame(page, gx, gy, wait = 350) {
  const r = await page.evaluate(() => { const c = document.querySelector('#game canvas').getBoundingClientRect(); return { l: c.left, t: c.top, s: c.width / 480 }; });
  await page.mouse.move(r.l + gx * r.s, r.t + gy * r.s);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.up();
  await page.waitForTimeout(wait);
}
const activeScenes = (page) => page.evaluate(() => window.__PHASER_GAME__?.scene.getScenes(true).map((s) => s.scene.key));
const state = (page) => page.evaluate(() => window.__GRIMSHARD__ ?? null);
async function colours(page) {
  const b64 = (await page.locator('#game canvas').screenshot()).toString('base64');
  return page.evaluate(async (src) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data; const set = new Set();
    for (let i = 0; i < d.length; i += 4) set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return set.size;
  }, b64);
}

// --- main flow at phone landscape 844x390
const page = await open({ width: 844, height: 390 });
log(`title scene active: ${await activeScenes(page)}`, (await activeScenes(page))?.includes('Title'));
const tc = await colours(page);
log(`title canvas non-blank (${tc} colours)`, tc > 8);
await page.screenshot({ path: `${dir}/0.2-title.png` });

await tapGame(page, 240, 229); // Gallery button
log('Gallery opened', (await activeScenes(page))?.includes('Gallery'));
await page.screenshot({ path: `${dir}/0.2-gallery.png` });
const tabs = [['Tiles', 104], ['Characters', 188], ['Props', 272], ['Palette', 356]];
for (const [name, x] of tabs) {
  await tapGame(page, x, 19);
  log(`tab ${name}`, (await activeScenes(page))?.includes('Gallery'));
  await page.screenshot({ path: `${dir}/0.2-gallery-${name.toLowerCase()}.png` });
}
await tapGame(page, 188, 19); // characters
await tapGame(page, 32 + 16 + 48, 42 + 64); // first character -> detail
await tapGame(page, 353, 249); // grid toggle
await page.screenshot({ path: `${dir}/0.2-gallery-detail.png` });
await tapGame(page, 31, 19); // close detail
await tapGame(page, 31, 19); // back to title
log('back to Title', (await activeScenes(page))?.includes('Title'));

await tapGame(page, 376, 229, 600); // Test Village
log('Test Village opened', (await activeScenes(page))?.includes('Village'));
const before = (await state(page))?.player;
// necromancer starts at (6,3); tap free cobble tile (8,2)
const OX = 120, OY = 63;
await tapGame(page, OX + 8 * 24 + 12, OY + 2 * 24 + 12, 120);
await page.screenshot({ path: `${dir}/0.2-village-walking.png` });
await page.waitForTimeout(900);
const after = (await state(page))?.player;
log(`walk: player ${JSON.stringify(before)} -> ${JSON.stringify(after)}`, !!before && !!after && (before.x !== after.x || before.y !== after.y) && after.x === 8 && after.y === 2);
// tap the cart (blocked) -> no move
await tapGame(page, OX + 7 * 24 + 12, OY + 4 * 24 + 12, 120);
await page.screenshot({ path: `${dir}/0.2-village-blocked.png` });
await page.waitForTimeout(500);
const still = (await state(page))?.player;
log('blocked tile: no move', still?.x === 8 && still?.y === 2);
// walk behind the cart (row 3 above it) for the y-sort screenshot
await tapGame(page, OX + 8 * 24 + 12, OY + 3 * 24 + 12, 600);
await page.screenshot({ path: `${dir}/0.2-village.png` });
await page.close();

// --- phone dpr 3 sizing + portrait
const p3 = await open({ width: 844, height: 390 }, 3);
const size = await p3.evaluate(() => { const r = document.querySelector('#game canvas').getBoundingClientRect(); return { w: r.width, h: r.height }; });
log(`dpr3 canvas ${size.w}x${size.h} CSS (expect 640x360)`, Math.round(size.w) === 640 && Math.round(size.h) === 360);
await p3.close();
const pp = await open({ width: 390, height: 844 });
const rot = await pp.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none');
log('portrait shows rotate screen', rot);
await pp.screenshot({ path: `${dir}/0.2-portrait.png` });
await pp.close();
await browser.close();

log(`console errors: ${errors.length}`, errors.length === 0);
log(`external requests: ${external.length}`, external.length === 0);
console.log(steps.join('\n'));
if (errors.length) console.log(errors.join('\n'));
if (external.length) console.log(external.join('\n'));
process.exit(failed ? 1 : 0);
