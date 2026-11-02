// Smoke test: open dist/index.html via file:// (no server) in headless Chromium.
// Flow (v0.2.1, 1920x1200): Title -> Begin (disabled) -> Gallery -> every tab -> detail -> back ->
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

// --- main flow at tablet 1920x1200 (the owner's device class)
const V = '0.2.1';
const page = await open({ width: 1920, height: 1200 });
log(`title scene active: ${await activeScenes(page)}`, (await activeScenes(page))?.includes('Title'));
const tc = await colours(page);
log(`title canvas non-blank (${tc} colours)`, tc > 8);
const cv = await page.evaluate(() => { const c = document.querySelector('#game canvas'); return { w: c.width, h: c.height }; });
log(`tablet canvas backing store ${cv.w}x${cv.h} (expect 1920x1080, text at device res)`, cv.w === 1920 && cv.h === 1080);
await page.screenshot({ path: `${dir}/${V}-title.png` });
await tapGame(page, 98, 239); // Begin (disabled) -> "soon" hint, stays on Title
log('Begin is disabled (stays on Title)', (await activeScenes(page))?.includes('Title'));
await page.screenshot({ path: `${dir}/${V}-title-begin.png` });

await tapGame(page, 240, 239); // Gallery
log('Gallery opened', (await activeScenes(page))?.includes('Gallery'));
const tabs = [['Tiles', 100], ['Edges', 180], ['Characters', 260], ['Props', 340], ['Palette', 420]];
for (const [name, x] of tabs) {
  await tapGame(page, x, 19);
  log(`tab ${name}`, (await activeScenes(page))?.includes('Gallery'));
  await page.screenshot({ path: `${dir}/${V}-gallery-${name.toLowerCase()}.png` });
}
await tapGame(page, 260, 19); // characters
await tapGame(page, 32 + 6 + 48, 38 + 64); // first character -> detail
await tapGame(page, 354, 249); // grid toggle
await page.screenshot({ path: `${dir}/${V}-gallery-detail.png` });
await tapGame(page, 34, 19); // close detail
await tapGame(page, 30, 19); // back to title
log('back to Title', (await activeScenes(page))?.includes('Title'));

await tapGame(page, 382, 239, 600); // Test Village
log('Test Village opened', (await activeScenes(page))?.includes('Village'));
const before = (await state(page))?.player;
const OX = 0, OY = 3;
// necromancer starts at (9,6); tap free mud tile (9,8)
await tapGame(page, OX + 9 * 24 + 12, OY + 8 * 24 + 12, 120);
await page.waitForTimeout(700);
const after = (await state(page))?.player;
log(`walk: player ${JSON.stringify(before)} -> ${JSON.stringify(after)}`, !!after && after.x === 9 && after.y === 8);
// tap the cart (blocked) -> no move
await tapGame(page, OX + 14 * 24 + 12, OY + 5 * 24 + 12, 500);
const still = (await state(page))?.player;
log('blocked tile: no move', still?.x === 9 && still?.y === 8);
// walk back to the square for the screenshot
await tapGame(page, OX + 10 * 24 + 12, OY + 6 * 24 + 12, 1200);
await page.screenshot({ path: `${dir}/${V}-village.png` });
await page.close();

// --- other screens: sizes + screenshots
for (const [w, h, dpr, expW, name] of [[844, 390, 3, 640, 'phone-844x390-dpr3'], [915, 412, 2.625, 731.4, 'phone-2400x1080'], [844, 390, 1, 480, 'phone-844x390-dpr1']]) {
  const pg = await open({ width: w, height: h }, dpr);
  const r = await pg.evaluate(() => { const c = document.querySelector('#game canvas'); const b = c.getBoundingClientRect(); return { w: b.width, h: b.height, cw: c.width }; });
  log(`${name}: canvas ${r.w.toFixed(1)}x${r.h.toFixed(1)} CSS, ${r.cw} device px wide (expect ~${expW} CSS)`, Math.abs(r.w - expW) < 1.5);
  await tapGame(pg, 382, 239, 600);
  await pg.screenshot({ path: `${dir}/${V}-${name}-village.png` });
  await pg.close();
}
const pp = await open({ width: 390, height: 844 });
const rot = await pp.evaluate(() => getComputedStyle(document.getElementById('rotate')).display !== 'none');
log('portrait shows rotate screen', rot);
await pp.close();
await browser.close();

log(`console errors: ${errors.length}`, errors.length === 0);
log(`external requests: ${external.length}`, external.length === 0);
console.log(steps.join('\n'));
if (errors.length) console.log(errors.join('\n'));
if (external.length) console.log(external.join('\n'));
process.exit(failed ? 1 : 0);
