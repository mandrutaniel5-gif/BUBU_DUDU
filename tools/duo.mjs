// Test multiplayer: doua tab-uri (Bubu + Dudu), filmate si puse una langa alta.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, base, out, mode = 'local', extra = ''] = process.argv;
const dir = fs.mkdtempSync('/tmp/claude-0/duo-');
const browser = await chromium.launch();
const W = 640, H = 720;
const ctxA = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: dir + '/a', size: { width: W, height: H } } });
const ctxB = mode === 'local' ? ctxA : await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: dir + '/b', size: { width: W, height: H } } });
const A = await ctxA.newPage();
const B = mode === 'local' ? await ctxA.newPage() : await ctxB.newPage();
const errs = [];
for (const p of [A, B]) { p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); }
const room = 'duo' + Date.now();
await A.goto(`${base}?who=bubu&mode=${mode}&room=${room}${extra}#world`);
await B.goto(`${base}?who=dudu&mode=${mode}&room=${room}${extra}#world`);
const w = ms => new Promise(r => setTimeout(r, ms));
await w(2500);
const ev = (p, code) => p.evaluate(code);
// Bubu merge spre Dudu
await ev(A, `game.scene.walkTo(game.scene.partner.gx+0.8, game.scene.partner.gy+0.2)`); await w(2200);
await ev(B, `game.scene.emote('wave')`); await w(1800);
await ev(A, `game.scene.pairAction('hug')`); await w(3200);
await ev(B, `game.scene.pairAction('kiss')`); await w(3000);
await ev(A, `game.scene.pairAction('slap')`); await w(2500);
await ev(B, `game.scene.w.chars.dudu.fart=100; game.scene.pairAction('fartatk')`); await w(3800);
await ev(A, `game.scene.pairAction('bonk')`); await w(3500);
await ev(B, `game.scene.emote('dance_hop')`); await ev(A, `game.scene.emote('dance_disco')`); await w(4000);
const status = await ev(A, `JSON.stringify({net: game.scene.net.status, partner: game.scene.partnerOnline, hearts: game.scene.w.hearts})`);
const statusB = await ev(B, `JSON.stringify({net: game.scene.net.status, partner: game.scene.partnerOnline, hearts: game.scene.w.hearts})`);
const va = await A.video().path(), vb = await B.video().path();
await A.close(); await B.close();
await ctxA.close(); if (ctxB !== ctxA) await ctxB.close(); await browser.close();
execSync(`ffmpeg -y -loglevel error -i ${va} -i ${vb} -filter_complex "[0]fps=30[a];[1]fps=30[b];[a][b]hstack,format=yuv420p" -c:v libx264 -crf 25 -movflags +faststart ${out}`);
console.log('A', status, 'B', statusB);
if (errs.length) console.log('ERRORS:\n' + errs.slice(0, 10).join('\n'));
