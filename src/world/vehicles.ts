// Tractorasul lui Dudu: desen lateral detaliat (pentru drum) si desen izometric (in lume).
import { drawCharacter, type CharSpec } from '../char/draw';
import { basePose } from '../char/pose';
import { iso, isoBox, boxOf, shade } from './iso';

const O = '#4a2a22';
const RED = '#e5383b', RED_D = '#b81d24', RED_L = '#ff6b6b';

function wheel(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, hub = '#ffd23f') {
  // anvelopa cu crampoane
  c.save(); c.translate(x, y);
  c.fillStyle = '#2b2b33'; c.strokeStyle = O; c.lineWidth = 2.5;
  c.beginPath();
  const n = Math.max(10, Math.round(r * 1.1));
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n; const rr = i % 2 ? r : r * 1.09; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#3d3d47'; c.beginPath(); c.arc(0, 0, r * 0.78, 0, 7); c.fill();
  // janta
  c.fillStyle = hub; c.beginPath(); c.arc(0, 0, r * 0.56, 0, 7); c.fill(); c.stroke();
  c.fillStyle = shade(hub, 0.8); c.beginPath(); c.arc(0, 0, r * 0.22, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = shade(hub, 0.7); c.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.24, Math.sin(a) * r * 0.24); c.lineTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52); c.stroke(); }
  c.fillStyle = '#ffffff55'; c.beginPath(); c.ellipse(-r * 0.25, -r * 0.3, r * 0.16, r * 0.08, -0.6, 0, 7); c.fill();
  c.restore();
}

/**
 * Tractorul vazut din lateral (spre dreapta). Origine: pe sol, sub osia din spate.
 * rot = rotatia rotilor, bump = saltul caroseriei, logs = busteni in remorca.
 */
export function drawTractorSide(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, opt: { rot: number; bump: number; logs: number; driver?: CharSpec; passenger?: CharSpec; trailer?: boolean }) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  const b = opt.bump;
  // ---- remorca
  if (opt.trailer !== false) {
    c.save(); c.translate(-118, 0);
    c.fillStyle = 'rgba(40,20,20,0.18)'; c.beginPath(); c.ellipse(0, 2, 50, 6, 0, 0, 7); c.fill();
    const tb = b * 0.6;
    // busteni
    for (let i = 0; i < Math.min(9, opt.logs); i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const lx = -34 + col * 24 + (row % 2) * 10, ly = -46 - row * 13 + tb;
      c.fillStyle = '#9a6a3f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(lx - 14, ly - 6, 30, 12, 6); c.fill(); c.stroke();
      c.fillStyle = '#efc995'; c.beginPath(); c.ellipse(lx + 15, ly, 4.5, 6, 0, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = '#c99a5b'; c.lineWidth = 1; c.beginPath(); c.arc(lx + 15, ly, 2.2, 0, 7); c.stroke();
    }
    // lada din scanduri
    c.fillStyle = '#d9a273'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(-46, -40 + tb, 92, 26, 4); c.fill(); c.stroke();
    c.strokeStyle = '#b07a4f'; c.lineWidth = 2; for (const yy of [-31, -22]) { c.beginPath(); c.moveTo(-44, yy + tb); c.lineTo(44, yy + tb); c.stroke(); }
    c.fillStyle = '#c98e5f'; c.strokeStyle = O; c.lineWidth = 2.5; for (const xx of [-46, -2, 40]) { c.beginPath(); c.roundRect(xx, -44 + tb, 6, 32, 2); c.fill(); c.stroke(); }
    // proap
    c.strokeStyle = '#555'; c.lineWidth = 4; c.beginPath(); c.moveTo(46, -18 + tb); c.lineTo(80, -18 + b); c.stroke();
    wheel(c, 0, -13, 13, opt.rot * 1.4, '#e5e5e5');
    c.restore();
  }
  // ---- umbra
  c.fillStyle = 'rgba(40,20,20,0.2)'; c.beginPath(); c.ellipse(4, 2, 62, 7, 0, 0, 7); c.fill();
  c.save(); c.translate(0, b);
  // sasiu
  c.fillStyle = '#3d3d47'; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.roundRect(-30, -40, 92, 12, 4); c.fill(); c.stroke();
  // capota (motorul) cu grila si far
  c.fillStyle = RED; c.beginPath(); c.moveTo(4, -40); c.lineTo(58, -40); c.quadraticCurveTo(70, -40, 70, -50); c.lineTo(70, -66); c.quadraticCurveTo(70, -72, 62, -72); c.lineTo(4, -72); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = RED_L; c.beginPath(); c.roundRect(8, -70, 50, 6, 3); c.fill();
  c.strokeStyle = RED_D; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(18 + i * 9, -62); c.lineTo(18 + i * 9, -48); c.stroke(); }
  c.fillStyle = '#9aa5ad'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(62, -66, 9, 20, 3); c.fill(); c.stroke(); // grila
  c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(68, -70, 5, 0, 7); c.fill(); c.stroke(); // far
  c.fillStyle = '#ffffffcc'; c.beginPath(); c.arc(66.5, -71.5, 1.6, 0, 7); c.fill();
  // inimioara pe capota
  c.fillStyle = '#fff'; c.beginPath(); const hx = 38, hy = -57, hs = 6; c.moveTo(hx, hy + hs * 0.35); c.bezierCurveTo(hx - hs, hy - hs * 0.35, hx - hs * 0.45, hy - hs * 1.05, hx, hy - hs * 0.45); c.bezierCurveTo(hx + hs * 0.45, hy - hs * 1.05, hx + hs, hy - hs * 0.35, hx, hy + hs * 0.35); c.fill();
  // teava de esapament
  c.fillStyle = '#777'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(46, -96, 6, 26, 2); c.fill(); c.stroke();
  c.fillStyle = '#555'; c.beginPath(); c.roundRect(44, -99, 10, 5, 2); c.fill(); c.stroke();
  // cabina: aripa spate, scaun, stalpi, acoperis
  c.fillStyle = RED_D; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-40, -40); c.quadraticCurveTo(-40, -74, -8, -74); c.lineTo(6, -74); c.lineTo(6, -40); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#5a4a42'; c.beginPath(); c.roundRect(-24, -84, 20, 10, 3); c.fill(); c.stroke(); // scaunul
  // stalpul din spate al cabinei (in spatele soferului)
  c.fillStyle = '#3d3d47'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(-40, -194, 5, 122, 2); c.fill(); c.stroke();
  c.fillStyle = '#5a4a42'; c.beginPath(); c.roundRect(-32, -118, 9, 36, 4); c.fill(); c.stroke(); // spatarul scaunului
  // soferul (sprite din profil, asezat, cu labutele pe volan)
  const steer = Math.sin(t * 1.7) * 0.18 + Math.sin(t * 4.3) * 0.05;
  if (opt.passenger) drawDriverSide(c, opt.passenger, -40, -84, 0.85, t + 1, 0, false);
  if (opt.driver) drawDriverSide(c, opt.driver, -14, -84, 1, t, steer, true);
  // stalpul din fata + acoperisul (cadru peste sofer)
  c.fillStyle = '#3d3d47'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(30, -194, 5, 124, 2); c.fill(); c.stroke();
  c.fillStyle = RED; c.beginPath(); c.roundRect(-48, -202, 88, 11, 5); c.fill(); c.stroke();
  c.fillStyle = RED_L; c.beginPath(); c.roundRect(-44, -200, 76, 3, 2); c.fill();
  // aripa fata
  c.fillStyle = RED_D; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.arc(52, -28, 17, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(66, -30); c.lineTo(38, -30); c.closePath(); c.fill(); c.stroke();
  c.restore();
  // rotile (raman pe sol, nu sar)
  wheel(c, -16, -26, 27, opt.rot);
  wheel(c, 52, -14, 15, opt.rot * 1.8);
  c.restore();
}

/** tractorul in lume (izometric): caroserie pe axa x, roti vazute din lateral */
export function drawTractorIso(c: CanvasRenderingContext2D, gx: number, gy: number, t: number, logs: number) {
  c.lineJoin = 'round';
  // remorca
  isoBox(c, gx - 0.15, gy + 0.2, 0.75, 0.6, 14, { top: '#d9a273', left: '#c48b5c', right: '#b07a4f' }, 8);
  for (let i = 0; i < Math.min(6, logs); i++) { const p = iso(gx + 0.05 + (i % 3) * 0.2, gy + 0.5, 24 + Math.floor(i / 3) * 7); c.fillStyle = '#9a6a3f'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y, 9, 4, 0.45, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#efc995'; c.beginPath(); c.ellipse(p.x + 7, p.y + 3, 2.5, 3, 0, 0, 7); c.fill(); }
  const tw = (u: number, v: number, z: number, r: number) => { const p = iso(gx + u, gy + v, z); c.fillStyle = '#2b2b33'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, r * 0.75, r, 0.5, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(p.x, p.y, r * 0.36, r * 0.48, 0.5, 0, 7); c.fill(); c.stroke(); };
  tw(0.12, 0.85, 4, 4.5);
  // roti din spate (in spatele caroseriei)
  tw(0.9, 0.18, 12, 12);
  // sasiu + capota
  isoBox(c, 0.7 + gx, gy + 0.28, 1.25, 0.44, 8, boxOf('#3d3d47'), 10);
  isoBox(c, 1.2 + gx, gy + 0.3, 0.75, 0.4, 16, { top: RED_L, left: RED, right: RED_D }, 18);
  const g1 = iso(gx + 1.95, gy + 0.5, 26); c.fillStyle = '#9aa5ad'; c.strokeStyle = O; c.lineWidth = 1.5; c.beginPath(); c.roundRect(g1.x - 3, g1.y - 6, 7, 12, 2); c.fill(); c.stroke();
  const ex = iso(gx + 1.55, gy + 0.4, 34); c.fillStyle = '#777'; c.beginPath(); c.roundRect(ex.x - 2, ex.y - 18, 4, 18, 2); c.fill(); c.stroke();
  for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i / 2) % 1; c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#ddd'; c.beginPath(); c.arc(ex.x + k * 8, ex.y - 22 - k * 20, 3 + k * 5, 0, 7); c.fill(); c.globalAlpha = 1; }
  // cabina
  isoBox(c, 0.7 + gx, gy + 0.25, 0.5, 0.5, 18, { top: '#5a4a42', left: RED, right: RED_D }, 18);
  for (const [u, v] of [[0.72, 0.27], [1.12, 0.27], [0.72, 0.68], [1.12, 0.68]]) isoBox(c, gx + u, gy + v, 0.05, 0.05, 30, boxOf('#3d3d47'), 36);
  isoBox(c, 0.64 + gx, gy + 0.2, 0.62, 0.6, 4, { top: RED, left: RED_D, right: shade(RED_D, 0.85) }, 66);
  // roti din fata (vizibile)
  tw(0.9, 0.82, 12, 12); tw(1.75, 0.82, 7, 7);
  const h = iso(gx + 1.6, gy + 0.7, 30); c.fillStyle = '#fff'; c.beginPath(); c.arc(h.x, h.y, 2.5, 0, 7); c.fill();
}

/** scena de drum (side-scroller cu parallax); k = 0..1 progresul calatoriei */
export function drawTravelScene(c: CanvasRenderingContext2D, w: number, h: number, k: number, t: number, toForest: boolean, night: number, driver: CharSpec, passenger?: CharSpec, logs = 0, vehicle: 'tractor' | 'bike' | 'scooter' = 'tractor', dest = '') {
  const ground = h * 0.7;
  const speed = vehicle === 'bike' ? 360 : 520; const off = t * speed;
  const toVillage = dest === 'village', fromVillage = dest === 'home-from-village';
  const forestK = toVillage || fromVillage ? 0 : toForest ? k : 1 - k; // cat de "padure" e peisajul
  const villageK = toVillage ? k : fromVillage ? 1 - k : 0;
  // cerul
  const sky = c.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, night > 0.5 ? '#1d2550' : '#7cc8f5'); sky.addColorStop(1, night > 0.5 ? '#4a3f75' : '#ffe9cc');
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  // soarele / luna
  c.fillStyle = night > 0.5 ? '#fff6b0' : '#ffd23f'; c.beginPath(); c.arc(w * 0.8, h * 0.18, 34, 0, 7); c.fill();
  if (night < 0.5) { c.fillStyle = '#ffd23f44'; c.beginPath(); c.arc(w * 0.8, h * 0.18, 52, 0, 7); c.fill(); }
  // nori
  for (let i = 0; i < 5; i++) { const x = ((i * 300 - off * 0.05) % (w + 300) + w + 300) % (w + 300) - 150, y = h * (0.08 + (i % 3) * 0.06); c.fillStyle = '#ffffffdd'; for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 28], [52, 0, 20], [26, 6, 22]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); } }
  // munti departe
  const layer = (f: number, base: number, amp: number, col: string, freq: number, seed: number) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, ground);
    for (let x = 0; x <= w + 10; x += 10) { const wx = x + off * f; c.lineTo(x, base - amp * (0.55 + 0.45 * Math.sin(wx * freq + seed) * Math.cos(wx * freq * 0.37 + seed * 3))); }
    c.lineTo(w, ground); c.closePath(); c.fill();
  };
  layer(0.06, h * 0.42, 70, night > 0.5 ? '#3b4570' : '#a9c7e8', 0.004, 1);
  layer(0.15, h * 0.52, 50, night > 0.5 ? '#35514a' : '#9fd68c', 0.006, 4);
  // copaci pe dealul mijlociu (mai multi brazi spre padure)
  for (let i = 0; i < 26; i++) {
    const x = ((i * 70 - off * 0.3) % (w + 140) + w + 140) % (w + 140) - 70;
    const house = ((i * 53) % 100) / 100 < villageK * 0.8;
    if (house) { const y0 = h * 0.6 + ((i * 13) % 20); c.fillStyle = ['#fff1d6', '#ffe1ea', '#e8f1ff', '#fff6b8'][i % 4]; c.strokeStyle = O; c.lineWidth = 1.5; c.fillRect(x - 18, y0 - 26, 36, 26); c.strokeRect(x - 18, y0 - 26, 36, 26); c.fillStyle = ['#c0573e', '#e5809a', '#5b7fbf', '#7cb870'][i % 4]; c.beginPath(); c.moveTo(x - 22, y0 - 26); c.lineTo(x, y0 - 44); c.lineTo(x + 22, y0 - 26); c.closePath(); c.fill(); c.stroke(); c.fillStyle = night > 0.5 ? '#ffe680' : '#bfe8ff'; c.fillRect(x - 10, y0 - 18, 7, 7); c.fillRect(x + 3, y0 - 18, 7, 7); continue; }
    const pine = ((i * 37) % 100) / 100 < forestK * 0.9 + 0.1;
    const y = h * 0.58 + ((i * 13) % 20);
    if (pine) { for (let l = 0; l < 3; l++) { c.fillStyle = ['#2f7a4a', '#3f8f5a', '#4aa267'][l]; c.beginPath(); c.moveTo(x - 22 + l * 5, y - l * 16); c.lineTo(x, y - 34 - l * 16); c.lineTo(x + 22 - l * 5, y - l * 16); c.fill(); } }
    else { c.fillStyle = '#7fd07f'; c.beginPath(); c.arc(x, y - 22, 18, 0, 7); c.fill(); c.fillStyle = '#8a5d32'; c.fillRect(x - 3, y - 8, 6, 10); }
  }
  // campul de langa drum
  c.fillStyle = night > 0.5 ? '#2e5a3a' : '#a6dc93'; c.fillRect(0, h * 0.6, w, ground - h * 0.6);
  // gard care trece repede
  for (let i = 0; i < 20; i++) { const x = ((i * 80 - off * 0.7) % (w + 80) + w + 80) % (w + 80) - 40; c.fillStyle = '#c4935f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(x, ground - 38, 7, 34, 2); c.fill(); c.stroke(); }
  c.strokeStyle = '#c4935f'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, ground - 30); c.lineTo(w, ground - 30); c.moveTo(0, ground - 18); c.lineTo(w, ground - 18); c.stroke();
  // indicatorul care trece pe langa
  const sx = w * 1.2 - k * w * 1.6;
  if (sx > -120 && sx < w + 120) {
    c.fillStyle = '#a0703f'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(sx - 3, ground - 90, 6, 90, 2); c.fill(); c.stroke();
    c.fillStyle = '#e7c08f'; c.beginPath(); c.moveTo(sx - 50, ground - 96); c.lineTo(sx + 40, ground - 96); c.lineTo(sx + 56, ground - 82); c.lineTo(sx + 40, ground - 68); c.lineTo(sx - 50, ground - 68); c.closePath(); c.fill(); c.stroke();
    c.font = '800 15px "Baloo 2", sans-serif'; c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(toVillage ? 'Satul 🏘️' : toForest ? 'Pădurea 🌲' : 'Acasă 🏡', sx, ground - 82); c.textBaseline = 'alphabetic';
  }
  // drumul
  c.fillStyle = '#c9af89'; c.fillRect(0, ground, w, h - ground);
  c.fillStyle = '#b39873'; c.fillRect(0, ground, w, 6);
  for (let i = 0; i < 30; i++) { const x = ((i * 60 - off) % (w + 60) + w + 60) % (w + 60) - 30; c.fillStyle = '#a88f6a'; c.beginPath(); c.ellipse(x, ground + 22 + (i % 3) * 14, 5 + (i % 2) * 3, 2, 0, 0, 7); c.fill(); }
  for (let i = 0; i < 8; i++) { const x = ((i * 190 - off * 1.15) % (w + 190) + w + 190) % (w + 190) - 95; c.fillStyle = '#8fcf7a'; for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(x + j * 5, h); c.lineTo(x + j * 5 + 3, h - 18 - (j % 2) * 8); c.lineTo(x + j * 5 + 6, h); c.fill(); } }
  // pasari
  for (let i = 0; i < 3; i++) { const bx = ((i * 260 + t * 60) % (w + 100)) - 50, by = h * 0.25 + i * 26 + Math.sin(t * 3 + i) * 8; const fl = Math.sin(t * 14 + i) * 5; c.strokeStyle = '#3a2a22'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 8, by - fl); c.quadraticCurveTo(bx - 3, by - 4, bx, by); c.quadraticCurveTo(bx + 3, by - 4, bx + 8, by - fl); c.stroke(); }
  // tractorul (cu gropi)
  const sc = Math.min(1.9, h / 380);
  const bumpPhase = (off / 140) % 1;
  const bump = -(Math.max(0, Math.sin(bumpPhase * Math.PI * 2)) ** 6) * 6;
  const tx = w * 0.5 + Math.sin(t * 1.3) * 12;
  // praf din spatele rotilor
  for (let i = 0; i < 7; i++) { const q = ((t * 1.8 + i / 7) % 1); c.globalAlpha = 0.45 * (1 - q); c.fillStyle = '#e6d3b0'; c.beginPath(); c.arc(tx - (60 + q * 220) * sc, ground + 8 - q * 26 * sc, (6 + q * 20) * sc, 0, 7); c.fill(); }
  // fumul din teava
  for (let i = 0; i < 6; i++) { const q = ((t * 1.2 + i / 6) % 1); c.globalAlpha = 0.5 * (1 - q); c.fillStyle = '#dcdcdc'; c.beginPath(); c.arc(tx + 49 * sc - q * 140 * sc, ground - 100 * sc - q * 70 * sc + bump * sc, (5 + q * 16) * sc, 0, 7); c.fill(); }
  c.globalAlpha = 1;
  if (vehicle === 'scooter') drawScooterSide(c, tx, ground + 10, sc * 1.15, t, { rot: off / 18, bump, driver, passenger });
  else if (vehicle === 'bike') drawTandemSide(c, tx, ground + 10, sc * 1.1, t, { rot: off / 20, bump, driver, passenger });
  else drawTractorSide(c, tx, ground + 10, sc, t, { rot: off / 22, bump, logs, driver, passenger });
}

/** tranzitie "iris" (cerc care se deschide/inchide) */
export function irisWipe(c: CanvasRenderingContext2D, w: number, h: number, open: number) {
  const R = Math.hypot(w, h) * 0.6 * Math.max(0, Math.min(1, open));
  c.save(); c.fillStyle = '#2b1d17'; c.beginPath(); c.rect(0, 0, w, h); c.arc(w / 2, h / 2, R, 0, Math.PI * 2, true); c.fill('evenodd'); c.restore();
}

/**
 * Personajul la volan, din profil (spre dreapta). (x,y) = sezutul pe scaun.
 * steer = cat roteste volanul; drive = tine volanul (altfel saluta, ca pasager).
 */
export function drawDriverSide(c: CanvasRenderingContext2D, spec: CharSpec, x: number, y: number, s: number, t: number, steer: number, drive: boolean, wheel = true) {
  const body = spec.body, dark = spec.shade, isDudu = spec.id === 'dudu';
  const pad = isDudu ? '#c8917a' : '#4a2a22';
  const bob = Math.sin(t * 9) * 0.8;
  c.save(); c.translate(x, y + bob); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  const fill = (col: string, lw = 2.4) => { c.fillStyle = col; c.fill(); c.strokeStyle = O; c.lineWidth = lw; c.stroke(); };
  // piciorul din spate (mai inchis)
  c.save(); c.globalAlpha = 0.9;
  c.beginPath(); c.ellipse(8, -2, 11, 7, 0, 0, 7); fill(dark);
  c.beginPath(); c.ellipse(17, 7, 6, 8, 0, 0, 7); fill(dark);
  c.restore();
  // mana din spate (pe volan, partial ascunsa)
  if (drive) { c.save(); c.translate(-2, -24); c.rotate(-0.2 + steer * 0.4); c.beginPath(); c.ellipse(10, 0, 12, 6, 0, 0, 7); fill(dark); c.restore(); }
  // corpul, piciorul din fata si manuta din fata = o singura forma moale (fara "incheieturi")
  const parts = (mode: 'stroke' | 'fill') => {
    const go = () => (mode === 'stroke' ? c.stroke() : c.fill());
    c.save(); c.rotate(0.12); c.beginPath(); c.moveTo(-17, 2); c.bezierCurveTo(-25, -14, -18, -32, 0, -33); c.bezierCurveTo(18, -33, 24, -14, 16, 2); c.closePath(); go(); c.restore();
    c.beginPath(); c.ellipse(10, -3, 13, 8.5, 0, 0, 7); go();          // coapsa
    c.beginPath(); c.ellipse(21, 6, 6.5, 9, 0, 0, 7); go();             // gamba
    c.beginPath(); c.ellipse(23, 12, 7.5, 4.5, 0, 0, 7); go();          // talpa
    if (drive) { c.save(); c.translate(4, -22); c.rotate(-0.15 + steer * 0.4); c.beginPath(); c.ellipse(11, 0, 13, 7, 0, 0, 7); go(); c.restore(); }
    else { c.save(); c.translate(4, -24); c.rotate(-2.3 + Math.sin(t * 8) * 0.3); c.beginPath(); c.ellipse(9, 0, 11, 6.5, 0, 0, 7); go(); c.restore(); }
  };
  c.strokeStyle = O; c.lineWidth = 5.4; parts('stroke');
  c.fillStyle = body; parts('fill');
  c.fillStyle = pad; c.beginPath(); c.ellipse(25, 13, 3.4, 2, 0, 0, 7); c.fill();
  c.beginPath(); c.arc(-15, -4, 5, 0, 7); fill(spec.tail, 1.8); // codita
  // capul din profil: mare si rotund (ca la stickere), fata spre dreapta
  c.save(); c.translate(6, -56); c.rotate(-0.04 + steer * 0.12);
  const earCol = spec.ear, inner = spec.earInner;
  // urechea din spate
  c.beginPath(); c.ellipse(-16, -26, 10, 10, 0, 0, 7); fill(earCol);
  if (inner) { c.fillStyle = inner; c.beginPath(); c.ellipse(-16, -25, 6, 6, 0, 0, 7); c.fill(); }
  c.beginPath(); c.moveTo(-32, 4); c.bezierCurveTo(-33, -30, 28, -32, 31, -2); c.bezierCurveTo(33, 22, 16, 28, 0, 28); c.bezierCurveTo(-20, 28, -32, 22, -32, 4); c.closePath(); fill(body, 2.7);
  c.save(); c.clip(); c.fillStyle = dark; c.globalAlpha = 0.3; c.beginPath(); c.ellipse(-4, 30, 34, 9, 0, 0, 7); c.fill(); c.restore();
  // urechea din fata
  c.beginPath(); c.ellipse(4, -29, 11, 10.5, 0.25, 0, 7); fill(earCol);
  if (inner) { c.fillStyle = inner; c.beginPath(); c.ellipse(5, -28, 6.4, 6, 0.25, 0, 7); c.fill(); }
  // obrajorul mare
  c.fillStyle = spec.cheek; c.globalAlpha = 0.95; c.beginPath(); c.ellipse(16, 12, 8.5, 7.6, 0, 0, 7); c.fill(); c.globalAlpha = 1;
  // ochiul: bulina mare maro-inchis (clipeste)
  const blink = (t % 3.6) < 0.12;
  c.fillStyle = O; c.strokeStyle = O; c.lineWidth = 2.4;
  if (blink) { c.beginPath(); c.moveTo(14, 2); c.lineTo(22, 2); c.stroke(); }
  else { c.beginPath(); c.ellipse(18, 1, 4.4, 5, 0, 0, 7); c.fill(); }
  // gurita deschisa cu limbuta
  c.beginPath(); c.moveTo(26, 9); c.quadraticCurveTo(28, 11, 30, 9); c.quadraticCurveTo(30.5, 15, 27, 15.5); c.quadraticCurveTo(25, 14, 26, 9); c.closePath();
  c.fillStyle = '#ff8a9a'; c.fill(); c.lineWidth = 1.8; c.stroke();
  c.restore();
  c.restore();
  // volanul (desenat peste labute), doar pentru sofer
  if (drive && wheel) {
    c.save(); c.translate(x + 29 * s, y - 27 * s + bob);
    c.strokeStyle = '#333'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(10, 30); c.stroke(); // coloana
    c.rotate(-0.45); c.lineWidth = 3.5; c.beginPath(); c.ellipse(0, 0, 4, 13, 0, 0, 7); c.stroke();
    c.save(); c.rotate(steer * 2); c.lineWidth = 2; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 12); c.stroke(); c.restore();
    c.restore();
  }
}

function simpleWheel(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, tire = '#2b2b33', rim = '#e5e5e5') {
  c.save(); c.translate(x, y);
  c.fillStyle = tire; c.strokeStyle = O; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.stroke();
  c.fillStyle = rim; c.beginPath(); c.arc(0, 0, r * 0.62, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = '#9aa5ad'; c.lineWidth = 1.5; for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); c.stroke(); }
  c.fillStyle = '#666'; c.beginPath(); c.arc(0, 0, r * 0.16, 0, 7); c.fill();
  c.restore();
}

/** scuterul albastru (ca in desenele lor): sofer in fata, pasager in spate */
export function drawScooterSide(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, opt: { rot: number; bump: number; driver?: CharSpec; passenger?: CharSpec }) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  const BL = '#8ecdf0', BL_D = '#5fa9d6', BL_L = '#c2e6fa';
  c.fillStyle = 'rgba(40,20,20,0.2)'; c.beginPath(); c.ellipse(0, 2, 62, 7, 0, 0, 7); c.fill();
  c.save(); c.translate(0, opt.bump);
  // esapament
  c.fillStyle = '#c0c6cc'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(-58, -24, 34, 8, 4); c.fill(); c.stroke();
  // caroseria din spate (rotunjita, ca la Vespa)
  c.fillStyle = BL; c.strokeStyle = O; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(-52, -28); c.bezierCurveTo(-58, -62, -12, -66, -4, -40); c.lineTo(10, -40); c.lineTo(10, -22); c.lineTo(-40, -22); c.quadraticCurveTo(-54, -22, -52, -28); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = BL_L; c.lineWidth = 3; c.beginPath(); c.moveTo(-44, -46); c.quadraticCurveTo(-30, -56, -16, -50); c.stroke();
  // podeaua si coloana din fata
  c.fillStyle = BL_D; c.strokeStyle = O; c.lineWidth = 2.4; c.beginPath(); c.roundRect(-8, -26, 36, 8, 3); c.fill(); c.stroke();
  c.fillStyle = BL; c.beginPath(); c.moveTo(22, -22); c.quadraticCurveTo(46, -26, 44, -70); c.lineTo(34, -72); c.quadraticCurveTo(34, -36, 18, -30); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = BL_L; c.lineWidth = 3; c.beginPath(); c.moveTo(38, -64); c.quadraticCurveTo(40, -40, 28, -30); c.stroke();
  // aripa fata
  c.fillStyle = BL; c.strokeStyle = O; c.lineWidth = 2.4; c.beginPath(); c.arc(42, -14, 15, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill(); c.stroke();
  // sa (lunga, pentru doi)
  c.fillStyle = '#5a4a42'; c.beginPath(); c.roundRect(-50, -66, 52, 10, 5); c.fill(); c.stroke();
  // ghidonul si farul
  c.strokeStyle = '#5a4a42'; c.lineWidth = 4; c.beginPath(); c.moveTo(38, -72); c.lineTo(30, -82); c.stroke();
  c.fillStyle = '#c0c6cc'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(20, -88, 18, 7, 3); c.fill(); c.stroke();
  c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(44, -76, 6, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#e63946'; c.beginPath(); c.arc(-56, -42, 3.5, 0, 7); c.fill(); c.stroke(); // stop
  // pasagerul (in spate) si soferul (in fata)
  if (opt.passenger) drawDriverSide(c, opt.passenger, -40, -64, 0.9, t + 1.3, 0, false);
  if (opt.driver) drawDriverSide(c, opt.driver, -14, -64, 0.95, t, Math.sin(t * 1.5) * 0.12, true, false);
  c.restore();
  simpleWheel(c, -36, -12, 13, opt.rot, '#2b2b33', '#d9d9d9');
  simpleWheel(c, 42, -12, 13, opt.rot, '#2b2b33', '#d9d9d9');
  c.restore();
}

/** bicicleta in tandem (pentru doi) */
export function drawTandemSide(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, opt: { rot: number; bump: number; driver?: CharSpec; passenger?: CharSpec }) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(40,20,20,0.2)'; c.beginPath(); c.ellipse(0, 2, 70, 7, 0, 0, 7); c.fill();
  const F = '#ff7aa2';
  simpleWheel(c, -52, -18, 18, opt.rot, '#2b2b33', '#fff');
  simpleWheel(c, 52, -18, 18, opt.rot, '#2b2b33', '#fff');
  // cadrul
  const fr = (a: Pt, b: Pt) => { c.strokeStyle = O; c.lineWidth = 6; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.strokeStyle = F; c.lineWidth = 3.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); };
  type Pt = { x: number; y: number };
  const A = { x: -52, y: -18 }, B = { x: 52, y: -18 }, P1 = { x: -24, y: -16 }, P2 = { x: 18, y: -16 }, S1 = { x: -32, y: -50 }, S2 = { x: 8, y: -50 }, H = { x: 40, y: -56 };
  fr(A, P1); fr(P1, S1); fr(S1, A); fr(P1, P2); fr(S1, S2); fr(P2, S2); fr(S2, H); fr(H, B); fr(P2, B);
  // pedale care se invart
  for (const pc of [P1, P2]) { const a = opt.rot * 0.8; c.strokeStyle = '#555'; c.lineWidth = 3; c.beginPath(); c.moveTo(pc.x + Math.cos(a) * 8, pc.y + Math.sin(a) * 8); c.lineTo(pc.x - Math.cos(a) * 8, pc.y - Math.sin(a) * 8); c.stroke(); c.fillStyle = '#666'; c.beginPath(); c.arc(pc.x, pc.y, 4, 0, 7); c.fill(); }
  // sei + ghidon + cos cu flori
  for (const sp of [S1, S2]) { c.fillStyle = '#5a4a42'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.ellipse(sp.x, sp.y - 4, 10, 4, 0, 0, 7); c.fill(); c.stroke(); }
  c.strokeStyle = '#555'; c.lineWidth = 3; c.beginPath(); c.moveTo(H.x, H.y); c.lineTo(H.x - 6, H.y - 8); c.stroke();
  c.fillStyle = '#d9a273'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect(H.x + 2, H.y - 4, 18, 14, 3); c.fill(); c.stroke();
  for (let i = 0; i < 3; i++) { c.fillStyle = ['#ff7aa2', '#ffd23f', '#c77dff'][i]; c.beginPath(); c.arc(H.x + 6 + i * 5, H.y - 6, 3.5, 0, 7); c.fill(); }
  // ciclistii (pedaleaza: corpul sare usor)
  const pedal = Math.sin(opt.rot * 0.8) * 1.5;
  if (opt.passenger) drawDriverSide(c, opt.passenger, S1.x + 2, S1.y - 6 + pedal, 0.85, t + 1.3, 0, false);
  if (opt.driver) drawDriverSide(c, opt.driver, S2.x + 2, S2.y - 6 - pedal, 0.9, t, Math.sin(t * 1.5) * 0.1, true, false);
  c.restore();
}
