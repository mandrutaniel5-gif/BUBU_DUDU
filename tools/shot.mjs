// Utilitar: capturi de ecran si filmari ale jocului (Playwright).
// node tools/shot.mjs <url> <out.png> [w] [h] [script-json]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, url, out, w = '1280', h = '800', steps = '[]'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(800);
for (const s of JSON.parse(steps)) {
  if (s.click) await page.click(s.click);
  if (s.wait) await page.waitForTimeout(s.wait);
  if (s.eval) await page.evaluate(s.eval);
  if (s.key) await page.keyboard.press(s.key);
  if (s.down) await page.keyboard.down(s.down);
  if (s.up) await page.keyboard.up(s.up);
  if (s.shot) await page.screenshot({ path: s.shot });
}
await page.screenshot({ path: out });
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
await browser.close();
