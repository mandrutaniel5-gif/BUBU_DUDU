// Filmare: node tools/record.mjs <url> <out.mp4> <w> <h> <steps-json-file>
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, url, out, w = '1280', h = '720', stepsFile] = process.argv;
const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
const dir = fs.mkdtempSync('/tmp/claude-0/rec-');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, recordVideo: { dir, size: { width: +w, height: +h } } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);
for (const s of steps) {
  if (s.click) await page.click(s.click);
  if (s.eval) await page.evaluate(s.eval);
  if (s.down) await page.keyboard.down(s.down);
  if (s.up) await page.keyboard.up(s.up);
  if (s.key) await page.keyboard.press(s.key);
  if (s.tap) await page.mouse.click(s.tap[0], s.tap[1]);
  if (s.wait) await page.waitForTimeout(s.wait);
}
const vpath = await page.video().path();
await ctx.close(); await browser.close();
execSync(`ffmpeg -y -loglevel error -i ${vpath} -vf "fps=30,format=yuv420p" -c:v libx264 -crf 24 -movflags +faststart ${out}`);
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
console.log('saved', out);
