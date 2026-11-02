// Smoke test: open dist/index.html via file:// (no server) in headless Chromium.
// Usage: node tools/smoke.mjs [out.png]
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright'); }

const url = pathToFileURL(resolve('dist/index.html')).href;
const out = process.argv[2] ?? 'docs/screens/0.1-title.png'; // also writes -tap, -dpr3, portrait variants
const browser = await pw.chromium.launch();
const errors = [];
const external = [];
async function run(viewport, shot, tap, dpr = 1) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: dpr, hasTouch: true });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  await page.goto(url);
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const c = document.querySelector('#game canvas');
    if (!c) return { canvas: false };
    const r = c.getBoundingClientRect();
    return { canvas: true, w: c.width, h: c.height, cssW: r.width, cssH: r.height, rotateShown: getComputedStyle(document.getElementById('rotate')).display !== 'none' };
  });
  let colours = 0;
  if (info.canvas && !info.rotateShown) {
    // non-blank check: count distinct colours in a screenshot of the canvas
    const b64 = (await page.locator('#game canvas').screenshot()).toString('base64');
    colours = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const set = new Set();
      for (let i = 0; i < d.length; i += 4) set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      return set.size;
    }, b64);
  }
  if (shot) await page.screenshot({ path: shot });
  if (tap) {
    await page.mouse.click(viewport.width / 2, viewport.height / 2);
    await page.waitForTimeout(700);
    await page.screenshot({ path: tap });
  }
  await page.close();
  return { ...info, colours };
}
const land = await run({ width: 844, height: 390 }, out, out.replace('.png', '-tap.png'));
const phone3x = await run({ width: 844, height: 390 }, out.replace('title', 'title-dpr3'), null, 3);
const port = await run({ width: 390, height: 844 }, out.replace('title', 'portrait'));
await browser.close();
console.log(JSON.stringify({ url, landscape: land, phoneDpr3: { cssW: phone3x.cssW, cssH: phone3x.cssH, colours: phone3x.colours }, portrait: { rotateShown: port.rotateShown }, consoleErrors: errors, externalRequests: external }, null, 1));
process.exit(errors.length || external.length || !land.canvas || land.colours < 8 || land.rotateShown || !port.rotateShown ? 1 : 0);
