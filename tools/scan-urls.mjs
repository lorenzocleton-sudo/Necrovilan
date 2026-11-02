// Fails if dist/index.html contains anything that could load from outside the file.
// Known-inert strings (never fetched at runtime) are allowlisted with a reason.
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'dist/index.html';
const html = readFileSync(file, 'utf8');

const INERT = [
  ['https://phaser.io`', 'Phaser console banner text; banner:false in config'],
  ['https://phaser.io/`', 'Phaser gameURL metadata string, never requested'],
  ['http://www.w3.org/2000/svg', 'XML namespace identifier, not a request'],
  ['http://www.w3.org/1999/xhtml', 'XML namespace identifier, not a request'],
];

const problems = [];
for (const m of html.matchAll(/https?:\/\/[^"'`\s)\\<>]*`?/g)) {
  const hit = m[0];
  if (!INERT.some(([s]) => hit === s || hit.startsWith(s))) problems.push(`url: ${hit}`);
}
for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=/gi)) problems.push(`external script: ${m[0]}`);
for (const m of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']?(?!data:)[^>]*>/gi)) problems.push(`link: ${m[0]}`);
for (const m of html.matchAll(/url\(\s*["']?(?!data:|["'`]?\s*`|`)([^)"'`]{1,80})/g)) problems.push(`css url(): ${m[0]}`);

const sizeMB = (Buffer.byteLength(html) / 1e6).toFixed(2);
console.log(`${file}: ${sizeMB} MB`);
if (problems.length) {
  console.error(`EXTERNAL REFERENCES FOUND (${problems.length}):\n` + problems.join('\n'));
  process.exit(1);
}
console.log('external-URL scan: 0 runtime references (inert allowlisted strings: ' + INERT.length + ')');
