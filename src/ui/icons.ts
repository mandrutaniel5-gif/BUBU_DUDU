// Iconite desenate (in locul emoji-urilor pentru lucruri).
// Fiecare iconita e desenata pe o panza 64x64 cu contur maro, stil "sticker".
// - iconURL(e) -> data URL pentru DOM
// - iconizeDom() -> inlocuieste automat emoji-urile cunoscute din interfata cu desene
// - fillTextIcons() -> scrie text pe canvas, cu emoji-urile inlocuite de desene

const O = '#4a2a22';
type C = CanvasRenderingContext2D;

// ---------------------------------------------------------------- unelte de desen
let LW = 3;
function st(c: C, fill?: string, stroke = true) { if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = LW; c.strokeStyle = O; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); } }
const ci = (c: C, x: number, y: number, r: number, f?: string, s = true) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); st(c, f, s); };
const el = (c: C, x: number, y: number, rx: number, ry: number, f?: string, rot = 0, s = true) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); st(c, f, s); };
const rr = (c: C, x: number, y: number, w: number, h: number, r: number, f?: string, s = true) => { c.beginPath(); c.roundRect(x, y, w, h, r); st(c, f, s); };
const po = (c: C, pts: number[], f?: string, s = true, close = true) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); if (close) c.closePath(); st(c, f, s); };
const ln = (c: C, pts: number[], w = 3, col = O) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
const qd = (c: C, d: (c: C) => void, f?: string, s = true) => { c.beginPath(); d(c); st(c, f, s); };
const shine = (c: C, x: number, y: number, r = 3) => ci(c, x, y, r, 'rgba(255,255,255,.75)', false);

function flower(c: C, x: number, y: number, r: number, petal: string, mid = '#ffd23f', n = 5) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2; ci(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.78, petal); }
  ci(c, x, y, r * 0.62, mid);
}
function leaf(c: C, x: number, y: number, len: number, ang: number, col = '#7cc56b') {
  c.save(); c.translate(x, y); c.rotate(ang); qd(c, c => { c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0); }, col); c.restore();
}
function stem(c: C, x1: number, y1: number, x2: number, y2: number) { ln(c, [x1, y1, x2, y2], 7); ln(c, [x1, y1, x2, y2], 3.5, '#6bb35a'); }
function wheel(c: C, x: number, y: number, r: number) { ci(c, x, y, r, '#3a3a44'); ci(c, x, y, r * 0.45, '#d8d8e0'); }
function shirt(c: C, col: string, long = true) {
  po(c, [20, 12, 26, 10, 32, 15, 38, 10, 44, 12, long ? 58 : 52, long ? 34 : 24, long ? 50 : 46, long ? 38 : 30, 46, 30, 46, 54, 18, 54, 18, 30, long ? 14 : 18, long ? 38 : 30, long ? 6 : 12, long ? 34 : 24], col);
}

/** registrul: emoji -> functie de desen (64x64) */
const D: Record<string, (c: C) => void> = {
  // ---------------- resurse
  '🪵': c => { rr(c, 8, 22, 46, 22, 11, '#b07a4a'); el(c, 50, 33, 9, 11, '#e8c08a'); el(c, 50, 33, 4.5, 5.5, undefined); ln(c, [16, 29, 34, 29], 2.5); ln(c, [20, 37, 40, 37], 2.5); },
  '🪨': c => { po(c, [10, 46, 14, 28, 26, 16, 42, 18, 54, 30, 54, 46], '#a8a4b0'); ln(c, [26, 16, 30, 32, 54, 30], 2.5); shine(c, 22, 28, 3); },
  '🌸': c => { flower(c, 32, 32, 12, '#ffb3c7', '#ffd23f'); },
  '🌼': c => { flower(c, 32, 32, 12, '#fff6c8', '#ffb347', 7); },
  '🟫': c => { po(c, [10, 40, 18, 24, 46, 24, 54, 40, 46, 52, 18, 52], '#8a5a3a'); ci(c, 26, 36, 2.5, '#5a3a22', false); ci(c, 38, 42, 2.5, '#5a3a22', false); ci(c, 34, 32, 2, '#5a3a22', false); },
  '💧': c => { qd(c, c => { c.moveTo(32, 8); c.bezierCurveTo(44, 26, 50, 32, 50, 40); c.arc(32, 40, 18, 0, Math.PI); c.bezierCurveTo(14, 32, 20, 26, 32, 8); }, '#7cc8f0'); shine(c, 25, 40, 4); },
  '💦': c => { D['💧'](c); },
  '🌾': c => { for (const dx of [-10, 0, 10]) { ln(c, [32 + dx * 0.3, 58, 32 + dx, 20], 3); for (let i = 0; i < 4; i++) { el(c, 32 + dx - 4, 22 + i * 7, 3.2, 5, '#f2c14e', -0.5); el(c, 32 + dx + 4, 22 + i * 7, 3.2, 5, '#f2c14e', 0.5); } } },
  '🌱': c => { stem(c, 32, 56, 32, 32); leaf(c, 32, 34, 20, -0.6); leaf(c, 32, 38, 18, Math.PI + 0.5); el(c, 32, 56, 16, 5, '#8a5a3a'); },
  '🌿': c => { stem(c, 20, 56, 40, 12); for (let i = 0; i < 4; i++) { leaf(c, 24 + i * 5, 46 - i * 10, 14, -0.9); leaf(c, 24 + i * 5, 46 - i * 10, 14, Math.PI - 0.2); } },
  '🌰': c => { qd(c, c => { c.moveTo(32, 12); c.bezierCurveTo(52, 16, 54, 44, 32, 54); c.bezierCurveTo(10, 44, 12, 16, 32, 12); }, '#b0703a'); qd(c, c => { c.moveTo(14, 26); c.quadraticCurveTo(32, 14, 50, 26); c.quadraticCurveTo(32, 20, 14, 26); }, '#e8c08a'); shine(c, 24, 36, 3); },
  '🫘': c => { el(c, 24, 34, 10, 14, '#c0563a', 0.4); el(c, 40, 34, 10, 14, '#c0563a', -0.4); },
  '✨': c => { const star = (x: number, y: number, r: number) => po(c, [x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28], '#ffd23f'); star(26, 34, 18); star(48, 16, 9); star(48, 50, 7); },
  '💰': c => { qd(c, c => { c.moveTo(24, 18); c.bezierCurveTo(4, 30, 6, 56, 32, 56); c.bezierCurveTo(58, 56, 60, 30, 40, 18); c.closePath(); }, '#e8c08a'); po(c, [22, 8, 42, 8, 38, 18, 26, 18], '#e8c08a'); ln(c, [22, 18, 42, 18], 4, '#c0563a'); ci(c, 32, 38, 9, '#ffd23f'); ln(c, [32, 32, 32, 44], 2.5); },
  '🪙': c => { ci(c, 32, 32, 20, '#ffd23f'); ci(c, 32, 32, 13, undefined); ln(c, [32, 25, 32, 39], 3); shine(c, 24, 24, 3); },
  '💱': c => { D['🪙'](c); },
  // ---------------- mancare
  '🥕': c => { po(c, [20, 22, 44, 18, 30, 58], '#ff8c3a'); ln(c, [26, 30, 32, 29], 2.5); ln(c, [28, 40, 34, 39], 2.5); leaf(c, 32, 20, 14, -1.9); leaf(c, 32, 20, 14, -1.2); leaf(c, 32, 20, 12, -2.6); },
  '🥔': c => { el(c, 32, 34, 22, 16, '#c99a5a', 0.2); ci(c, 24, 30, 1.8, O, false); ci(c, 38, 38, 1.8, O, false); ci(c, 40, 28, 1.8, O, false); },
  '🍅': c => { ci(c, 32, 36, 20, '#e63946'); po(c, [22, 18, 28, 22, 32, 14, 36, 22, 42, 18, 38, 26, 26, 26], '#6bb35a'); shine(c, 24, 32, 4); },
  '🥬': c => { ci(c, 32, 36, 20, '#9ed67a'); qd(c, c => { c.arc(32, 36, 12, Math.PI * 1.1, Math.PI * 1.9); }, undefined); ln(c, [32, 20, 32, 52], 2.5); ln(c, [32, 40, 22, 30], 2); ln(c, [32, 40, 42, 30], 2); },
  '🥦': c => { po(c, [26, 36, 38, 36, 36, 56, 28, 56], '#9ed67a'); ci(c, 22, 28, 10, '#4caf50'); ci(c, 42, 28, 10, '#4caf50'); ci(c, 32, 20, 11, '#4caf50'); },
  '🍓': c => { qd(c, c => { c.moveTo(14, 24); c.quadraticCurveTo(32, 16, 50, 24); c.quadraticCurveTo(50, 46, 32, 58); c.quadraticCurveTo(14, 46, 14, 24); }, '#ff4d6d'); for (const [x, y] of [[24, 32], [32, 36], [40, 32], [28, 44], [36, 44], [32, 28]]) el(c, x, y, 1.2, 2, '#fff3b0', 0, false); po(c, [20, 22, 26, 14, 32, 20, 38, 14, 44, 22], '#6bb35a'); },
  '🫐': c => { ci(c, 22, 38, 11, '#5a6ad6'); ci(c, 42, 38, 11, '#5a6ad6'); ci(c, 32, 24, 11, '#6a7ae6'); for (const [x, y] of [[22, 38], [42, 38], [32, 24]]) ci(c, x, y - 3, 2.5, '#3a4ab0', false); },
  '🍋': c => { el(c, 32, 34, 22, 15, '#ffe14f', -0.3); el(c, 12, 42, 3, 3, '#ffe14f', 0); leaf(c, 40, 20, 14, -0.6); shine(c, 26, 30, 4); },
  '🍄': c => { rr(c, 24, 32, 16, 22, 7, '#fff3e0'); qd(c, c => { c.moveTo(8, 36); c.quadraticCurveTo(10, 10, 32, 10); c.quadraticCurveTo(54, 10, 56, 36); c.closePath(); }, '#e63946'); ci(c, 22, 24, 4, '#fff', false); ci(c, 38, 18, 3.5, '#fff', false); ci(c, 44, 30, 3, '#fff', false); ci(c, 30, 31, 2.5, '#fff', false); },
  '🐟': c => { qd(c, c => { c.moveTo(10, 32); c.quadraticCurveTo(28, 12, 46, 32); c.quadraticCurveTo(28, 52, 10, 32); }, '#7cc8f0'); po(c, [44, 32, 58, 20, 56, 32, 58, 44], '#5aa8d8'); ci(c, 20, 29, 2.5, O, false); ln(c, [30, 22, 30, 42], 2); },
  '🍲': c => { qd(c, c => { c.moveTo(8, 30); c.lineTo(56, 30); c.quadraticCurveTo(54, 54, 32, 54); c.quadraticCurveTo(10, 54, 8, 30); }, '#e07a5f'); el(c, 32, 30, 24, 6, '#ffb347'); ci(c, 24, 29, 3, '#7cc56b', false); ci(c, 38, 30, 3, '#ff8c3a', false); for (const x of [24, 32, 40]) ln(c, [x, 20, x + 2, 14, x, 8], 2.5, '#c9b8b0'); },
  '🍱': c => { rr(c, 8, 18, 48, 34, 6, '#e07a5f'); rr(c, 13, 23, 18, 24, 3, '#fff'); rr(c, 34, 23, 17, 11, 3, '#7cc56b'); rr(c, 34, 36, 17, 11, 3, '#ffb347'); },
  '🥡': c => { po(c, [14, 20, 50, 20, 46, 56, 18, 56], '#f5ead6'); ln(c, [14, 20, 22, 12, 42, 12, 50, 20], 3); rr(c, 22, 30, 20, 10, 3, '#c9a678'); },
  '🥞': c => { for (let i = 0; i < 3; i++) el(c, 32, 48 - i * 8, 22, 7, '#e8a85a'); el(c, 32, 30, 12, 4, '#ffd23f'); qd(c, c => { c.moveTo(26, 30); c.quadraticCurveTo(22, 44, 26, 48); }, undefined); },
  '🍰': c => { po(c, [8, 40, 50, 26, 56, 40, 56, 52, 8, 52], '#fff3e0'); po(c, [8, 40, 50, 26, 56, 40], '#ffb3c7'); ln(c, [8, 46, 56, 46], 3, '#ff8fab'); ci(c, 44, 24, 5, '#e63946'); },
  '🍪': c => { ci(c, 32, 32, 22, '#d9a05a'); for (const [x, y] of [[24, 24], [38, 22], [30, 36], [42, 38], [22, 42]]) ci(c, x, y, 3, '#5a3a22', false); },
  '🍔': c => { qd(c, c => { c.moveTo(10, 30); c.quadraticCurveTo(32, 4, 54, 30); c.closePath(); }, '#e8a85a'); rr(c, 8, 30, 48, 6, 3, '#6bb35a'); rr(c, 10, 36, 44, 7, 3, '#8a4a2a'); rr(c, 10, 43, 44, 9, 4, '#e8a85a'); },
  '🍕': c => { po(c, [10, 14, 54, 14, 32, 58], '#ffd23f'); rr(c, 8, 10, 48, 8, 4, '#e8a85a'); ci(c, 26, 24, 4, '#e63946'); ci(c, 38, 26, 4, '#e63946'); ci(c, 32, 38, 3.5, '#e63946'); },
  '🍫': c => { rr(c, 14, 8, 36, 48, 4, '#7a4a2a'); for (let i = 0; i < 3; i++) ln(c, [14, 20 + i * 12, 50, 20 + i * 12], 2); ln(c, [32, 8, 32, 56], 2); },
  '🧋': c => { po(c, [18, 18, 46, 18, 42, 56, 22, 56], '#f2d3b0'); rr(c, 16, 14, 32, 6, 3, '#fff'); ln(c, [36, 2, 33, 40], 4, '#ff8fab'); for (const x of [26, 32, 38]) ci(c, x, 50, 3, '#4a2a22', false); },
  '🍼': c => { rr(c, 20, 22, 24, 34, 8, '#fff'); rr(c, 22, 16, 20, 7, 3, '#7cc8f0'); qd(c, c => { c.moveTo(26, 16); c.quadraticCurveTo(32, 2, 38, 16); }, '#ffcf8a'); ln(c, [24, 34, 30, 34], 2); ln(c, [24, 42, 30, 42], 2); },
  '🧊': c => { rr(c, 14, 14, 36, 36, 8, '#bfe8ff'); shine(c, 24, 24, 4); },
  '🍑': c => { ci(c, 24, 36, 16, '#ffb38a'); ci(c, 40, 36, 16, '#ffb38a'); leaf(c, 32, 20, 14, -1.2); },
  '🫙': c => { rr(c, 14, 18, 36, 38, 8, 'rgba(190,230,255,.7)'); rr(c, 16, 10, 32, 9, 3, '#e07a5f'); },
  // ---------------- flori
  '🌷': c => { stem(c, 32, 58, 32, 32); leaf(c, 32, 50, 16, -0.7); qd(c, c => { c.moveTo(18, 16); c.lineTo(25, 24); c.lineTo(32, 12); c.lineTo(39, 24); c.lineTo(46, 16); c.quadraticCurveTo(48, 36, 32, 36); c.quadraticCurveTo(16, 36, 18, 16); }, '#ff5d8f'); },
  '🌹': c => { stem(c, 32, 58, 32, 32); leaf(c, 32, 46, 14, -0.6); leaf(c, 32, 50, 14, Math.PI + 0.6); ci(c, 32, 24, 14, '#e63946'); qd(c, c => { c.arc(32, 24, 7, 0.2, Math.PI * 1.7); }, undefined); },
  '🌻': c => { stem(c, 32, 58, 32, 40); leaf(c, 32, 50, 14, -0.5); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; el(c, 32 + Math.cos(a) * 14, 24 + Math.sin(a) * 14, 7, 4, '#ffd23f', a); } ci(c, 32, 24, 10, '#8a4a2a'); },
  '💐': c => { po(c, [20, 34, 44, 34, 36, 58, 28, 58], '#ff8fab'); flower(c, 22, 22, 6, '#ffb3c7'); flower(c, 42, 22, 6, '#fff6c8', '#ffb347'); flower(c, 32, 14, 6, '#c9a0ff'); ci(c, 32, 30, 4, '#7cc56b'); },
  '🪴': c => { po(c, [18, 38, 46, 38, 42, 58, 22, 58], '#e07a5f'); leaf(c, 32, 38, 18, -2.2); leaf(c, 32, 38, 18, -0.9); leaf(c, 32, 38, 20, -1.6); },
  '🌳': c => { rr(c, 27, 36, 10, 22, 3, '#8a5a3a'); ci(c, 22, 28, 13, '#6bb35a'); ci(c, 42, 28, 13, '#6bb35a'); ci(c, 32, 18, 14, '#7cc56b'); },
  '🌲': c => { rr(c, 28, 46, 8, 12, 2, '#8a5a3a'); po(c, [32, 4, 48, 26, 40, 26, 54, 48, 10, 48, 24, 26, 16, 26], '#3f8f5a'); },
  // ---------------- unelte
  '🪓': c => { ln(c, [16, 56, 42, 14], 9); ln(c, [16, 56, 42, 14], 5, '#c99a5a'); qd(c, c => { c.moveTo(36, 10); c.quadraticCurveTo(60, 8, 56, 32); c.lineTo(42, 24); c.closePath(); }, '#c9ccd6'); },
  '⛏️': c => { ln(c, [18, 56, 40, 18], 9); ln(c, [18, 56, 40, 18], 5, '#c99a5a'); qd(c, c => { c.moveTo(14, 18); c.quadraticCurveTo(38, 2, 58, 26); c.quadraticCurveTo(40, 14, 14, 18); }, '#c9ccd6'); },
  '🔨': c => { ln(c, [20, 56, 36, 26], 9); ln(c, [20, 56, 36, 26], 5, '#c99a5a'); po(c, [22, 10, 56, 10, 56, 26, 22, 26], '#9aa0ae'); },
  '🔧': c => { ln(c, [16, 50, 40, 26], 10); ln(c, [16, 50, 40, 26], 6, '#c9ccd6'); ci(c, 44, 22, 11, '#c9ccd6'); ci(c, 48, 18, 4, '#fff'); },
  '🪚': c => { po(c, [10, 30, 46, 22, 46, 40, 10, 40], '#c9ccd6'); for (let i = 0; i < 6; i++) po(c, [12 + i * 6, 40, 15 + i * 6, 45, 18 + i * 6, 40], '#c9ccd6'); rr(c, 44, 18, 14, 26, 6, '#c0563a'); },
  '🪣': c => { po(c, [14, 22, 50, 22, 44, 56, 20, 56], '#7cc8f0'); el(c, 32, 22, 18, 5, '#bfe8ff'); qd(c, c => { c.moveTo(14, 22); c.quadraticCurveTo(32, -2, 50, 22); }, undefined); },
  '🪠': c => { ln(c, [32, 6, 32, 36], 8); ln(c, [32, 6, 32, 36], 4, '#c99a5a'); qd(c, c => { c.moveTo(14, 52); c.quadraticCurveTo(14, 32, 32, 32); c.quadraticCurveTo(50, 32, 50, 52); c.closePath(); }, '#e63946'); },
  '🎣': c => { ln(c, [10, 58, 46, 10], 5, '#8a5a3a'); ln(c, [46, 10, 52, 44], 1.6); qd(c, c => { c.arc(50, 48, 4, 0, Math.PI); }, undefined); ci(c, 52, 38, 4, '#e63946'); },
  '🧹': c => { ln(c, [42, 6, 30, 36], 6); ln(c, [42, 6, 30, 36], 3, '#c99a5a'); po(c, [22, 34, 40, 38, 40, 58, 12, 52], '#f2c14e'); },
  '🧽': c => { rr(c, 10, 22, 44, 24, 6, '#ffe14f'); rr(c, 10, 38, 44, 8, 3, '#6bb35a'); for (const [x, y] of [[20, 30], [32, 28], [44, 31]]) ci(c, x, y, 2.5, '#e8c030', false); },
  '🧼': c => { rr(c, 10, 22, 44, 26, 12, '#ffb3c7'); ci(c, 48, 16, 6, 'rgba(190,230,255,.8)'); ci(c, 38, 10, 4, 'rgba(190,230,255,.8)'); },
  '🫧': c => { ci(c, 24, 36, 14, 'rgba(190,230,255,.6)'); ci(c, 44, 22, 9, 'rgba(190,230,255,.6)'); shine(c, 18, 30); },
  '🪥': c => { rr(c, 6, 36, 40, 8, 4, '#7cc8f0'); rr(c, 40, 22, 18, 12, 3, '#fff'); },
  '🩹': c => { c.save(); c.translate(32, 32); c.rotate(-0.7); rr(c, -26, -9, 52, 18, 9, '#f2c9a0'); rr(c, -9, -9, 18, 18, 2, '#fff3e0'); c.restore(); },
  '💊': c => { c.save(); c.translate(32, 32); c.rotate(-0.7); rr(c, -24, -10, 48, 20, 10, '#fff'); qd(c, c => { c.moveTo(0, -10); c.lineTo(-14, -10); c.arc(-14, 0, 10, -Math.PI / 2, Math.PI / 2, true); c.lineTo(0, 10); c.closePath(); }, '#ff5d8f'); c.restore(); },
  '🌡️': c => { rr(c, 26, 6, 12, 40, 6, '#fff'); ci(c, 32, 48, 9, '#e63946'); ln(c, [32, 20, 32, 44], 4, '#e63946'); },
  '🧪': c => { po(c, [24, 8, 40, 8, 40, 30, 52, 54, 12, 54, 24, 30], 'rgba(190,230,255,.6)'); po(c, [18, 42, 46, 42, 52, 54, 12, 54], '#9ed67a'); },
  '✂️': c => { ln(c, [20, 46, 46, 10], 4, '#9aa0ae'); ln(c, [44, 46, 18, 10], 4, '#9aa0ae'); ci(c, 18, 50, 7, '#ff5d8f'); ci(c, 46, 50, 7, '#ff5d8f'); },
  '🧵': c => { rr(c, 16, 10, 32, 8, 3, '#c99a5a'); rr(c, 16, 46, 32, 8, 3, '#c99a5a'); rr(c, 20, 18, 24, 28, 4, '#ff5d8f'); ln(c, [22, 26, 42, 22], 2); ln(c, [22, 34, 42, 30], 2); ln(c, [22, 42, 42, 38], 2); },
  '🧶': c => { ci(c, 32, 32, 20, '#c9a0ff'); qd(c, c => { c.arc(32, 32, 12, 0.5, 2.5); }, undefined); qd(c, c => { c.arc(24, 40, 18, -1.4, -0.2); }, undefined); },
  '🔒': c => { qd(c, c => { c.arc(32, 26, 11, Math.PI, 0); }, undefined); ln(c, [21, 26, 21, 30], 3); ln(c, [43, 26, 43, 30], 3); rr(c, 14, 28, 36, 26, 6, '#ffd23f'); ci(c, 32, 40, 3, O, false); },
  '🔔': c => { qd(c, c => { c.moveTo(12, 46); c.quadraticCurveTo(18, 40, 18, 28); c.quadraticCurveTo(18, 12, 32, 12); c.quadraticCurveTo(46, 12, 46, 28); c.quadraticCurveTo(46, 40, 52, 46); c.closePath(); }, '#ffd23f'); ci(c, 32, 50, 5, '#ffb347'); },
  '💡': c => { ci(c, 32, 26, 16, '#fff3b0'); rr(c, 24, 40, 16, 14, 3, '#9aa0ae'); },
  '📦': c => { po(c, [8, 22, 32, 12, 56, 22, 56, 48, 32, 58, 8, 48], '#d9a05a'); ln(c, [8, 22, 32, 32, 56, 22], 3); ln(c, [32, 32, 32, 58], 3); },
  '🎒': c => { rr(c, 14, 16, 36, 42, 12, '#e07a5f'); rr(c, 20, 36, 24, 16, 5, '#ffb347'); qd(c, c => { c.arc(32, 16, 8, Math.PI, 0); }, undefined); },
  '🛍️': c => { po(c, [12, 22, 52, 22, 56, 58, 8, 58], '#ff8fab'); qd(c, c => { c.arc(32, 22, 10, Math.PI, 0); }, undefined); },
  '🛒': c => { ln(c, [6, 14, 14, 14, 20, 42, 50, 42], 4); po(c, [16, 20, 56, 20, 50, 36, 19, 36], '#7cc8f0'); ci(c, 22, 50, 5, '#3a3a44'); ci(c, 46, 50, 5, '#3a3a44'); },
  '📜': c => { rr(c, 14, 10, 36, 44, 4, '#f5ead6'); el(c, 32, 10, 20, 5, '#e8c08a'); el(c, 32, 54, 20, 5, '#e8c08a'); for (let i = 0; i < 3; i++) ln(c, [22, 22 + i * 9, 42, 22 + i * 9], 2); },
  '📖': c => { po(c, [6, 16, 32, 22, 58, 16, 58, 50, 32, 56, 6, 50], '#fff'); ln(c, [32, 22, 32, 56], 3); ln(c, [12, 28, 26, 31], 2); ln(c, [38, 31, 52, 28], 2); },
  '📚': c => { rr(c, 10, 40, 44, 12, 3, '#e07a5f'); rr(c, 14, 28, 40, 12, 3, '#7cc8f0'); rr(c, 8, 16, 42, 12, 3, '#9ed67a'); },
  '💻': c => { rr(c, 12, 12, 40, 28, 4, '#5a6a8a'); rr(c, 16, 16, 32, 20, 2, '#bfe8ff', false); po(c, [6, 44, 58, 44, 54, 52, 10, 52], '#c9ccd6'); },
  '📱': c => { rr(c, 18, 6, 28, 52, 6, '#3a3a44'); rr(c, 22, 12, 20, 36, 2, '#bfe8ff', false); },
  '📺': c => { rr(c, 8, 14, 48, 34, 6, '#7a5a4a'); rr(c, 13, 19, 30, 24, 4, '#bfe8ff'); ci(c, 50, 26, 3, '#ffd23f'); ln(c, [24, 4, 32, 14, 40, 4], 2.5); ln(c, [16, 48, 14, 56], 3); ln(c, [48, 48, 50, 56], 3); },
  '🎬': c => { rr(c, 10, 24, 44, 30, 4, '#3a3a44'); po(c, [10, 14, 54, 8, 56, 18, 12, 24], '#fff'); ln(c, [22, 12, 26, 22], 3); ln(c, [36, 10, 40, 20], 3); },
  '🗺️': c => { po(c, [6, 14, 24, 8, 40, 14, 58, 8, 58, 50, 40, 56, 24, 50, 6, 56], '#f5ead6'); ln(c, [24, 8, 24, 50], 2); ln(c, [40, 14, 40, 56], 2); ln(c, [12, 40, 30, 26, 48, 36], 2.5, '#e63946'); },
  '🔄': c => { qd(c, c => { c.arc(32, 32, 18, -2.6, 1.2); }, undefined); po(c, [10, 14, 22, 20, 10, 28], O); },
  // ---------------- casa / mobila
  '🛋️': c => { rr(c, 8, 22, 48, 18, 8, '#e07a5f'); rr(c, 6, 34, 52, 16, 6, '#e8907a'); ln(c, [14, 50, 14, 56], 4); ln(c, [50, 50, 50, 56], 4); },
  '🪑': c => { rr(c, 18, 6, 26, 30, 4, '#c99a5a'); rr(c, 14, 34, 34, 8, 3, '#b07a4a'); ln(c, [18, 42, 18, 58], 4); ln(c, [44, 42, 44, 58], 4); },
  '🛏️': c => { rr(c, 6, 30, 52, 16, 4, '#ffb3c7'); rr(c, 6, 18, 12, 36, 3, '#c99a5a'); rr(c, 20, 24, 14, 8, 4, '#fff'); },
  '🛁': c => { rr(c, 6, 28, 52, 20, 9, '#fff'); el(c, 32, 30, 24, 4, '#bfe8ff'); for (const [x, y, r] of [[18, 22, 5], [30, 18, 6], [42, 22, 5]]) ci(c, x, y, r, 'rgba(255,255,255,.9)'); ln(c, [14, 48, 12, 56], 3); ln(c, [50, 48, 52, 56], 3); },
  '🚽': c => { rr(c, 16, 6, 30, 16, 4, '#fff'); el(c, 30, 34, 22, 9, '#fff'); po(c, [16, 36, 44, 36, 38, 58, 22, 58], '#fff'); },
  '🍽️': c => { ci(c, 32, 32, 20, '#fff'); ci(c, 32, 32, 12, undefined); ln(c, [6, 14, 6, 50], 3); ln(c, [58, 14, 58, 50], 3); },
  '🍳': c => { ci(c, 28, 34, 20, '#4a4a54'); ln(c, [44, 46, 60, 58], 7); el(c, 28, 34, 11, 9, '#fff', 0, false); ci(c, 28, 34, 5, '#ffd23f', false); },
  '🥄': c => { el(c, 22, 20, 10, 13, '#c9ccd6', -0.7); ln(c, [28, 28, 52, 56], 6); ln(c, [28, 28, 52, 56], 2.5, '#c9ccd6'); },
  '🧺': c => { po(c, [8, 28, 56, 28, 50, 56, 14, 56], '#d9a05a'); ln(c, [12, 38, 52, 38], 2); ln(c, [14, 47, 50, 47], 2); qd(c, c => { c.moveTo(14, 28); c.quadraticCurveTo(32, 0, 50, 28); }, undefined); },
  '🧦': c => { po(c, [22, 6, 40, 6, 40, 38, 50, 46, 46, 58, 22, 50], '#ff8fab'); rr(c, 20, 6, 22, 8, 3, '#fff'); },
  '🏠': c => { po(c, [10, 30, 32, 10, 54, 30], '#e07a5f'); rr(c, 16, 30, 32, 26, 2, '#fff3e0'); rr(c, 28, 40, 9, 16, 2, '#b07a4a'); },
  '🏡': c => { D['🏠'](c); ci(c, 52, 46, 7, '#7cc56b'); },
  '🏘️': c => { po(c, [4, 34, 18, 20, 32, 34], '#e07a5f'); rr(c, 8, 34, 20, 20, 2, '#fff3e0'); po(c, [28, 28, 44, 12, 60, 28], '#7cc8f0'); rr(c, 32, 28, 24, 26, 2, '#fff3e0'); rr(c, 40, 40, 8, 14, 2, '#b07a4a'); },
  '🏙️': c => { rr(c, 6, 24, 16, 32, 2, '#9aa8c8'); rr(c, 22, 8, 18, 48, 2, '#b8c4e0'); rr(c, 40, 18, 18, 38, 2, '#9aa8c8'); for (let y = 14; y < 50; y += 8) { ci(c, 28, y, 1.6, '#fff3b0', false); ci(c, 34, y, 1.6, '#fff3b0', false); } },
  '🏫': c => { po(c, [6, 28, 32, 14, 58, 28], '#e07a5f'); rr(c, 10, 28, 44, 28, 2, '#ffe1b0'); rr(c, 27, 40, 10, 16, 2, '#b07a4a'); ln(c, [32, 14, 32, 4], 2.5); po(c, [32, 4, 42, 7, 32, 10], '#e63946'); },
  '🏛️': c => { po(c, [6, 22, 32, 8, 58, 22], '#f5ead6'); for (let i = 0; i < 4; i++) rr(c, 12 + i * 11, 24, 6, 26, 2, '#fff'); rr(c, 6, 50, 52, 8, 2, '#f5ead6'); },
  // ---------------- vehicule
  '🚲': c => { wheel(c, 16, 42, 12); wheel(c, 48, 42, 12); ln(c, [16, 42, 28, 24, 44, 24, 48, 42], 4, '#e63946'); ln(c, [28, 24, 32, 42, 44, 24], 4, '#e63946'); ln(c, [26, 18, 32, 18], 4); ln(c, [44, 24, 42, 16, 48, 16], 3); },
  '🛵': c => { wheel(c, 16, 46, 9); wheel(c, 48, 46, 9); qd(c, c => { c.moveTo(8, 42); c.quadraticCurveTo(10, 26, 26, 30); c.lineTo(38, 30); c.lineTo(46, 12); c.lineTo(52, 12); c.lineTo(50, 42); c.closePath(); }, '#7cc8f0'); rr(c, 14, 24, 20, 6, 3, '#7a4a2a'); },
  '🚜': c => { wheel(c, 18, 42, 14); wheel(c, 50, 48, 8); rr(c, 22, 30, 34, 14, 4, '#6bb35a'); rr(c, 10, 10, 20, 24, 4, '#6bb35a'); rr(c, 14, 14, 12, 12, 2, '#bfe8ff'); ln(c, [46, 30, 46, 18], 4); },
  '🚌': c => { rr(c, 6, 14, 52, 34, 8, '#ffd23f'); for (let i = 0; i < 3; i++) rr(c, 10 + i * 14, 20, 11, 11, 2, '#bfe8ff'); rr(c, 50, 20, 6, 20, 2, '#bfe8ff'); wheel(c, 18, 48, 7); wheel(c, 46, 48, 7); },
  '✈️': c => { po(c, [8, 34, 56, 26, 58, 32, 10, 40], '#fff'); po(c, [28, 32, 40, 8, 46, 8, 40, 30], '#7cc8f0'); po(c, [30, 36, 40, 58, 46, 58, 40, 36], '#7cc8f0'); },
  // ---------------- haine
  '👗': c => { po(c, [24, 6, 40, 6, 42, 22, 56, 58, 8, 58, 22, 22], '#ff8fab'); ln(c, [22, 22, 42, 22], 3); },
  '👚': c => { shirt(c, '#ffb3c7'); ci(c, 32, 30, 3, '#fff'); },
  '👕': c => { shirt(c, '#7cc8f0', false); },
  '🦺': c => { po(c, [18, 10, 28, 10, 32, 30, 36, 10, 46, 10, 52, 56, 12, 56], '#b07a4a'); ci(c, 26, 40, 2, '#ffd23f', false); ci(c, 38, 40, 2, '#ffd23f', false); },
  '👖': c => { po(c, [16, 8, 48, 8, 52, 58, 36, 58, 32, 26, 28, 58, 12, 58], '#5a7ad6'); ln(c, [16, 16, 48, 16], 3); },
  '🎩': c => { rr(c, 18, 8, 28, 36, 3, '#3a3a44'); rr(c, 18, 32, 28, 6, 0, '#e63946'); el(c, 32, 46, 28, 6, '#3a3a44'); },
  '👒': c => { el(c, 32, 40, 28, 9, '#f2c14e'); qd(c, c => { c.moveTo(16, 40); c.quadraticCurveTo(16, 16, 32, 16); c.quadraticCurveTo(48, 16, 48, 40); }, '#f2c14e'); ln(c, [17, 34, 47, 34], 4, '#ff5d8f'); flower(c, 44, 30, 3, '#fff'); },
  '🧢': c => { qd(c, c => { c.moveTo(10, 40); c.quadraticCurveTo(10, 14, 34, 14); c.quadraticCurveTo(54, 14, 52, 40); c.closePath(); }, '#e63946'); el(c, 50, 40, 12, 5, '#e63946'); },
  '🧕': c => { qd(c, c => { c.moveTo(10, 56); c.quadraticCurveTo(6, 10, 32, 10); c.quadraticCurveTo(58, 10, 54, 56); c.lineTo(44, 50); c.quadraticCurveTo(46, 24, 32, 24); c.quadraticCurveTo(18, 24, 20, 50); c.closePath(); }, '#e63946'); for (const [x, y] of [[20, 20], [32, 16], [44, 20], [14, 40], [50, 40]]) ci(c, x, y, 2.5, '#fff', false); },
  '🧣': c => { rr(c, 8, 18, 48, 14, 7, '#e63946'); rr(c, 36, 26, 12, 30, 4, '#e63946'); ln(c, [38, 56, 38, 60], 2); ln(c, [46, 56, 46, 60], 2); },
  '👑': c => { po(c, [8, 48, 10, 18, 22, 32, 32, 12, 42, 32, 54, 18, 56, 48], '#ffd23f'); ci(c, 32, 40, 4, '#e63946'); },
  '🎀': c => { po(c, [32, 32, 8, 18, 8, 46], '#ff5d8f'); po(c, [32, 32, 56, 18, 56, 46], '#ff5d8f'); ci(c, 32, 32, 6, '#ff8fab'); },
  '👢': c => { po(c, [18, 6, 38, 6, 38, 40, 56, 44, 56, 56, 18, 56], '#8a5a3a'); },
  '🤵': c => { D['🦺'](c); },
  // ---------------- natura / vreme
  '🔥': c => { qd(c, c => { c.moveTo(32, 4); c.bezierCurveTo(46, 18, 54, 28, 50, 42); c.quadraticCurveTo(46, 58, 32, 58); c.quadraticCurveTo(14, 58, 14, 42); c.quadraticCurveTo(14, 30, 24, 22); c.quadraticCurveTo(26, 32, 30, 32); c.quadraticCurveTo(28, 16, 32, 4); }, '#ff8c3a'); qd(c, c => { c.moveTo(32, 30); c.quadraticCurveTo(44, 42, 40, 50); c.quadraticCurveTo(32, 58, 24, 50); c.quadraticCurveTo(22, 42, 32, 30); }, '#ffd23f', false); },
  '☀️': c => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ln(c, [32 + Math.cos(a) * 20, 32 + Math.sin(a) * 20, 32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28], 4, '#ffb347'); } ci(c, 32, 32, 15, '#ffd23f'); },
  '🌞': c => { D['☀️'](c); },
  '🌙': c => { qd(c, c => { c.arc(32, 32, 22, 0.9, -0.9 + Math.PI * 2); c.arc(44, 26, 18, -1.1, 1.7, true); c.closePath(); }, '#ffe58a'); },
  '❄️': c => { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; ln(c, [32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, 32 - Math.cos(a) * 24, 32 - Math.sin(a) * 24], 7); ln(c, [32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24, 32 - Math.cos(a) * 24, 32 - Math.sin(a) * 24], 3.5, '#bfe8ff'); } },
  '☁️': c => { qd(c, c => { c.arc(20, 38, 11, Math.PI / 2, Math.PI * 1.5); c.arc(32, 26, 13, Math.PI, 0); c.arc(46, 36, 11, -Math.PI / 2, Math.PI / 2); c.closePath(); }, '#fff'); },
  '⚡': c => { po(c, [36, 4, 14, 36, 30, 36, 24, 60, 50, 24, 34, 24], '#ffd23f'); },
  '⭐': c => { const p: number[] = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 11 : 25; p.push(32 + Math.cos(a) * r, 34 + Math.sin(a) * r); } po(c, p, '#ffd23f'); },
  '🌊': c => { qd(c, c => { c.moveTo(4, 52); c.quadraticCurveTo(10, 20, 34, 18); c.quadraticCurveTo(52, 18, 54, 34); c.quadraticCurveTo(40, 26, 36, 40); c.quadraticCurveTo(48, 44, 60, 40); c.lineTo(60, 52); c.closePath(); }, '#5aa8d8'); },
  '🐦': c => { el(c, 30, 36, 18, 14, '#7cc8f0'); ci(c, 44, 26, 10, '#7cc8f0'); po(c, [52, 24, 60, 28, 52, 30], '#ffb347'); ci(c, 46, 24, 2, O, false); qd(c, c => { c.moveTo(18, 32); c.quadraticCurveTo(28, 26, 36, 38); c.quadraticCurveTo(26, 44, 18, 32); }, '#5aa8d8'); },
  '🦌': c => { el(c, 30, 40, 18, 12, '#c99a5a'); ci(c, 46, 24, 9, '#c99a5a'); ln(c, [44, 16, 40, 4, 34, 6], 3); ln(c, [50, 16, 54, 4, 60, 6], 3); ln(c, [20, 50, 20, 60], 4); ln(c, [38, 50, 38, 60], 4); },
  '🐓': c => { el(c, 30, 38, 18, 14, '#fff'); ci(c, 42, 22, 9, '#fff'); po(c, [38, 12, 42, 8, 46, 12], '#e63946'); po(c, [50, 22, 58, 24, 50, 26], '#ffb347'); po(c, [12, 34, 4, 20, 16, 28], '#e07a5f'); },
  '🐝': c => { el(c, 32, 36, 18, 13, '#ffd23f'); ln(c, [26, 24, 26, 48], 4); ln(c, [36, 24, 36, 48], 4); el(c, 26, 18, 9, 7, 'rgba(255,255,255,.8)'); el(c, 40, 18, 9, 7, 'rgba(255,255,255,.8)'); },
  '🎈': c => { el(c, 32, 26, 16, 20, '#ff5d8f'); po(c, [29, 46, 35, 46, 32, 50], '#ff5d8f'); ln(c, [32, 50, 28, 62], 2); shine(c, 26, 18, 4); },
  '🎠': c => { po(c, [8, 18, 32, 4, 56, 18], '#ff8fab'); ln(c, [32, 18, 32, 56], 3); el(c, 32, 40, 16, 8, '#fff'); ci(c, 44, 32, 5, '#fff'); el(c, 32, 58, 24, 4, '#ffd23f'); },
  '🎡': c => { ci(c, 32, 28, 22, undefined); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ln(c, [32, 28, 32 + Math.cos(a) * 22, 28 + Math.sin(a) * 22], 2); ci(c, 32 + Math.cos(a) * 22, 28 + Math.sin(a) * 22, 4, ['#ff5d8f', '#7cc8f0', '#ffd23f'][i % 3]); } ln(c, [32, 28, 20, 58], 3); ln(c, [32, 28, 44, 58], 3); },
  '🎸': c => { ci(c, 22, 44, 12, '#e07a5f'); ci(c, 30, 34, 9, '#e07a5f'); ln(c, [30, 34, 54, 10], 5, '#8a5a3a'); ci(c, 22, 44, 3, O, false); },
  '💩': c => { el(c, 32, 50, 22, 8, '#8a5a3a'); el(c, 32, 38, 16, 7, '#8a5a3a'); el(c, 32, 26, 10, 6, '#8a5a3a'); po(c, [30, 20, 34, 10, 36, 20], '#8a5a3a'); },
  '🦷': c => { qd(c, c => { c.moveTo(14, 18); c.quadraticCurveTo(32, 6, 50, 18); c.quadraticCurveTo(52, 34, 44, 58); c.lineTo(36, 40); c.lineTo(28, 40); c.lineTo(20, 58); c.quadraticCurveTo(12, 34, 14, 18); }, '#fff'); },
  '🦠': c => { ci(c, 32, 32, 16, '#9ed67a'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ln(c, [32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16, 32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24], 3); } },
  '💌': c => { rr(c, 8, 16, 48, 34, 4, '#fff'); ln(c, [8, 18, 32, 36, 56, 18], 3); qd(c, c => { c.moveTo(32, 46); c.bezierCurveTo(18, 36, 24, 26, 32, 33); c.bezierCurveTo(40, 26, 46, 36, 32, 46); }, '#ff5d8f'); },
  '🥗': c => { qd(c, c => { c.moveTo(6, 30); c.lineTo(58, 30); c.quadraticCurveTo(54, 54, 32, 54); c.quadraticCurveTo(10, 54, 6, 30); }, '#fff'); leaf(c, 14, 30, 18, -0.6, '#7cc56b'); leaf(c, 30, 30, 18, -1.2, '#9ed67a'); ci(c, 40, 26, 5, '#e63946'); ci(c, 26, 24, 4, '#ffd23f'); leaf(c, 44, 30, 14, -2.2, '#6bb35a'); },
  '🍦': c => { po(c, [20, 30, 44, 30, 32, 60], '#e8b06a'); ln(c, [24, 36, 38, 48], 2); ln(c, [40, 36, 28, 50], 2); ci(c, 26, 24, 11, '#ffb3c7'); ci(c, 38, 22, 11, '#fff3b0'); ci(c, 32, 12, 9, '#c9a0ff'); },
  '🍿': c => { po(c, [14, 26, 50, 26, 44, 60, 20, 60], '#fff'); for (let i = 0; i < 3; i++) po(c, [17 + i * 12, 26, 23 + i * 12, 26, 21 + i * 10, 60, 17 + i * 10, 60], '#e63946', false); po(c, [14, 26, 50, 26, 44, 60, 20, 60], undefined); for (const [x, y] of [[18, 20], [28, 14], [38, 18], [46, 22], [24, 24], [34, 24]]) ci(c, x, y, 7, '#fff3b0'); },
  '🥂': c => { for (const s of [-1, 1]) { c.save(); c.translate(32 + s * 10, 34); c.rotate(s * 0.25); po(c, [-9, -26, 9, -26, 3, 2, -3, 2], 'rgba(255,230,160,.8)'); ln(c, [0, 2, 0, 20], 3); ln(c, [-8, 20, 8, 20], 3); c.restore(); } ci(c, 32, 8, 3, '#ffd23f', false); },
  '☕': c => { qd(c, c => { c.moveTo(12, 24); c.lineTo(46, 24); c.lineTo(42, 54); c.lineTo(16, 54); c.closePath(); }, '#fff'); qd(c, c => { c.arc(48, 36, 8, -1.4, 1.4); }, undefined); el(c, 29, 26, 16, 4, '#8a4a2a'); for (const x of [22, 32]) ln(c, [x, 18, x + 2, 12, x, 6], 2.5, '#c9b8b0'); },
  '💼': c => { rr(c, 8, 22, 48, 32, 6, '#8a5a3a'); rr(c, 24, 14, 16, 10, 3, undefined); ln(c, [8, 34, 56, 34], 3); rr(c, 28, 30, 8, 8, 2, '#ffd23f'); },
  '🏢': c => { D['🏙️'](c); },
  '🕯️': c => { rr(c, 24, 26, 16, 32, 3, '#fff3e0'); el(c, 32, 16, 6, 10, '#ffb347'); el(c, 32, 18, 3, 5, '#fff3b0', 0, false); },
  '🔑': c => { ci(c, 20, 22, 12, '#ffd23f'); ci(c, 20, 22, 4.5, '#fff', true); ln(c, [28, 30, 54, 56], 9); ln(c, [28, 30, 54, 56], 5, '#ffd23f'); ln(c, [44, 46, 50, 40], 5); ln(c, [50, 52, 56, 46], 5); },
  '🍞': c => { qd(c, c => { c.moveTo(8, 40); c.quadraticCurveTo(6, 18, 32, 16); c.quadraticCurveTo(58, 18, 56, 40); c.lineTo(56, 50); c.lineTo(8, 50); c.closePath(); }, '#d9a05a'); for (const x of [20, 32, 44]) ln(c, [x - 4, 24, x + 4, 34], 2.5, '#fff8'); },
  '🥖': c => { c.save(); c.translate(32, 32); c.rotate(-0.6); el(c, 0, 0, 28, 10, '#d9a05a'); for (const x of [-14, 0, 14]) ln(c, [x - 4, -5, x + 4, 5], 2.5, '#fff8'); c.restore(); },
  '🥨': c => { c.beginPath(); c.lineWidth = 9; c.strokeStyle = O; c.arc(22, 30, 13, 0, 7); c.moveTo(55, 30); c.arc(42, 30, 13, 0, 7); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#c98a4a'; c.beginPath(); c.arc(22, 30, 13, 0, 7); c.moveTo(55, 30); c.arc(42, 30, 13, 0, 7); c.stroke(); },
  '🍵': c => { qd(c, c => { c.moveTo(12, 28); c.lineTo(48, 28); c.quadraticCurveTo(46, 54, 30, 54); c.quadraticCurveTo(14, 54, 12, 28); }, '#9ed67a'); qd(c, c => { c.arc(50, 38, 7, -1.4, 1.4); }, undefined); for (const x of [24, 34]) ln(c, [x, 20, x + 2, 14, x, 8], 2.5, '#c9b8b0'); },
  '🎹': c => { rr(c, 6, 18, 52, 30, 4, '#fff'); for (let i = 1; i < 7; i++) ln(c, [6 + i * 7.4, 18, 6 + i * 7.4, 48], 2); for (const i of [0, 1, 3, 4, 5]) rr(c, 10 + i * 7.4, 18, 5, 17, 1, '#3a3a44', false); },
  '🎮': c => { qd(c, c => { c.moveTo(14, 22); c.lineTo(50, 22); c.quadraticCurveTo(62, 22, 58, 44); c.quadraticCurveTo(54, 54, 44, 44); c.lineTo(20, 44); c.quadraticCurveTo(10, 54, 6, 44); c.quadraticCurveTo(2, 22, 14, 22); }, '#7ab8ff'); ln(c, [18, 28, 18, 38], 3); ln(c, [13, 33, 23, 33], 3); ci(c, 44, 30, 3, '#ff5d8f'); ci(c, 50, 36, 3, '#ffd23f'); },
  '🖼️': c => { rr(c, 8, 12, 48, 40, 3, '#c99a5a'); rr(c, 14, 18, 36, 28, 2, '#bfe8ff'); po(c, [14, 46, 26, 30, 34, 40, 40, 34, 50, 46], '#7cc56b'); ci(c, 42, 25, 4, '#ffd23f', false); },
  '💾': c => { rr(c, 10, 10, 44, 44, 5, '#5b7fbf'); rr(c, 18, 10, 24, 14, 2, '#c9ccd6'); rr(c, 16, 32, 32, 18, 2, '#fff'); },
  '📁': c => { po(c, [6, 18, 24, 18, 28, 24, 58, 24, 58, 52, 6, 52], '#ffd23f'); },
  '📊': c => { rr(c, 8, 8, 48, 48, 4, '#fff'); rr(c, 16, 34, 8, 14, 1, '#7ab8ff'); rr(c, 28, 24, 8, 24, 1, '#ff8fab'); rr(c, 40, 16, 8, 32, 1, '#9ed67a'); },
  '✉️': c => { rr(c, 8, 16, 48, 32, 4, '#fff'); ln(c, [8, 18, 32, 36, 56, 18], 3); },
  '⏰': c => { ci(c, 32, 34, 20, '#fff'); ln(c, [32, 34, 32, 22], 3); ln(c, [32, 34, 41, 38], 3); ci(c, 16, 14, 7, '#ff5d8f'); ci(c, 48, 14, 7, '#ff5d8f'); },
  '🏦': c => { po(c, [6, 22, 32, 8, 58, 22], '#ffd23f'); for (let i = 0; i < 4; i++) rr(c, 12 + i * 11, 24, 6, 24, 2, '#fff'); rr(c, 6, 48, 52, 8, 2, '#ffd23f'); ci(c, 32, 17, 3, O, false); },
  '🏥': c => { rr(c, 8, 14, 48, 42, 3, '#fff'); rr(c, 27, 20, 10, 26, 1, '#e63946', false); rr(c, 19, 28, 26, 10, 1, '#e63946', false); },
  '🎓': c => { po(c, [4, 26, 32, 14, 60, 26, 32, 38], '#3a3a44'); qd(c, c => { c.moveTo(16, 32); c.lineTo(16, 44); c.quadraticCurveTo(32, 54, 48, 44); c.lineTo(48, 32); }, '#3a3a44'); ln(c, [56, 26, 56, 42], 2.5, '#ffd23f'); ci(c, 56, 44, 3, '#ffd23f'); },
  '🏬': c => { rr(c, 6, 18, 52, 38, 3, '#ffe1ea'); rr(c, 6, 12, 52, 10, 3, '#ff7aa2'); for (let i = 0; i < 4; i++) rr(c, 10 + i * 12, 28, 8, 10, 2, '#bfe8ff'); rr(c, 26, 42, 12, 14, 2, '#bfe8ff'); },
  '🩺': c => { qd(c, c => { c.moveTo(16, 8); c.lineTo(16, 30); c.quadraticCurveTo(16, 44, 30, 44); c.quadraticCurveTo(44, 44, 44, 30); c.lineTo(44, 8); }, undefined); ln(c, [30, 44, 30, 50, 46, 54], 3); ci(c, 48, 54, 6, '#c9ccd6'); ci(c, 16, 8, 3, O, false); ci(c, 44, 8, 3, O, false); },
  '🤕': c => { ci(c, 32, 34, 22, '#ffd8b0'); rr(c, 10, 18, 44, 9, 4, '#fff'); ci(c, 24, 36, 2.5, O, false); ci(c, 40, 36, 2.5, O, false); ln(c, [26, 46, 38, 46], 2.5); },
  '🤧': c => { ci(c, 32, 30, 20, '#ffd8b0'); ln(c, [22, 26, 28, 28], 2.5); ln(c, [36, 28, 42, 26], 2.5); rr(c, 22, 38, 22, 16, 5, '#fff'); },
  '😢': c => { ci(c, 32, 32, 22, '#ffe58a'); ci(c, 24, 28, 2.5, O, false); ci(c, 40, 28, 2.5, O, false); qd(c, c => { c.arc(32, 46, 8, Math.PI * 1.15, Math.PI * 1.85); }, undefined); el(c, 22, 38, 3, 5, '#7ec8f0', 0, false); },
  '🧤': c => { qd(c, c => { c.moveTo(18, 56); c.lineTo(18, 24); c.quadraticCurveTo(18, 14, 26, 14); c.lineTo(42, 14); c.quadraticCurveTo(50, 14, 50, 24); c.lineTo(50, 30); c.lineTo(56, 26); c.quadraticCurveTo(62, 32, 50, 44); c.lineTo(46, 56); c.closePath(); }, '#e07a5f'); rr(c, 16, 50, 32, 8, 3, '#fff'); },
  '🎪': c => { po(c, [6, 30, 32, 8, 58, 30], '#ff5d8f'); rr(c, 10, 30, 44, 26, 2, '#fff'); for (let i = 0; i < 4; i++) rr(c, 12 + i * 11, 30, 5, 26, 0, '#ff8fab', false); rr(c, 26, 40, 12, 16, 2, '#7a4a2a'); },
  '📮': c => { rr(c, 18, 14, 28, 40, 8, '#e63946'); rr(c, 22, 24, 20, 5, 2, '#3a3a44'); ln(c, [32, 54, 32, 60], 5); },
  '💕': c => { const hh = (x: number, y: number, r: number, f: string) => qd(c, c => { c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.4, x, y - r * 0.5); c.bezierCurveTo(x + r * 0.7, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); }, f); hh(24, 38, 14, '#ff5d8f'); hh(42, 24, 10, '#ff8fab'); },
  '💗': c => { qd(c, c => { c.moveTo(32, 54); c.bezierCurveTo(4, 34, 14, 10, 32, 22); c.bezierCurveTo(50, 10, 60, 34, 32, 54); }, '#ff5d8f'); shine(c, 22, 26, 4); },
  '❤️': c => { qd(c, c => { c.moveTo(32, 54); c.bezierCurveTo(4, 34, 14, 10, 32, 22); c.bezierCurveTo(50, 10, 60, 34, 32, 54); }, '#e63946'); shine(c, 22, 26, 4); },
  '🤍': c => { qd(c, c => { c.moveTo(32, 54); c.bezierCurveTo(4, 34, 14, 10, 32, 22); c.bezierCurveTo(50, 10, 60, 34, 32, 54); }, '#fff'); },
  '🚕': c => { rr(c, 6, 28, 52, 18, 6, '#ffd23f'); po(c, [16, 28, 22, 16, 42, 16, 48, 28], '#ffd23f'); rr(c, 24, 19, 8, 8, 2, '#bfe8ff'); rr(c, 34, 19, 8, 8, 2, '#bfe8ff'); rr(c, 26, 10, 12, 6, 2, '#fff'); wheel(c, 18, 46, 6); wheel(c, 46, 46, 6); },
  '⬇': c => { po(c, [24, 8, 40, 8, 40, 32, 52, 32, 32, 56, 12, 32, 24, 32], '#9be38f'); },
  '⬆': c => { po(c, [24, 56, 40, 56, 40, 32, 52, 32, 32, 8, 12, 32, 24, 32], '#ffd23f'); },
  '🐷': c => { ci(c, 32, 34, 20, '#ffb3c7'); el(c, 32, 38, 9, 6, '#ff8fab'); ci(c, 29, 38, 1.8, O, false); ci(c, 35, 38, 1.8, O, false); ci(c, 24, 28, 2.5, O, false); ci(c, 40, 28, 2.5, O, false); po(c, [14, 20, 20, 10, 24, 20], '#ffb3c7'); po(c, [40, 20, 44, 10, 50, 20], '#ffb3c7'); },
  '🤝': c => { qd(c, c => { c.moveTo(6, 30); c.lineTo(22, 22); c.lineTo(34, 30); c.lineTo(46, 22); c.lineTo(58, 30); c.lineTo(48, 44); c.lineTo(30, 46); c.lineTo(16, 42); c.closePath(); }, '#ffd8b0'); ln(c, [26, 34, 34, 40], 2); ln(c, [30, 30, 38, 36], 2); },
  '🧑‍🍳': c => { D['🍞'](c); },
  '🏮': c => { el(c, 32, 32, 18, 20, '#e63946'); rr(c, 24, 8, 16, 6, 2, '#ffd23f'); rr(c, 24, 50, 16, 6, 2, '#ffd23f'); },
};
// Alias (fara selectorul de varianta)
for (const k of Object.keys(D)) { const b = k.replace(/️/g, ''); if (b !== k && !D[b]) D[b] = D[k]; }

const cache: Record<string, HTMLCanvasElement> = {};
const urls: Record<string, string> = {};
const norm = (e: string) => D[e] ? e : D[e.replace(/️/g, '')] ? e.replace(/️/g, '') : '';
export const hasIcon = (e: string) => !!norm(e);

export function iconCanvas(e: string, px = 64): HTMLCanvasElement | null {
  const k = norm(e); if (!k) return null;
  const key = k + '@' + px;
  if (cache[key]) return cache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = px;
  const c = cv.getContext('2d')!; c.scale(px / 64, px / 64);
  LW = 3; D[k](c);
  return cache[key] = cv;
}
export function iconURL(e: string) { const k = norm(e); if (!k) return ''; return urls[k] ??= iconCanvas(k, 64)!.toDataURL(); }
export const iconImg = (e: string, cls = 'di') => hasIcon(e) ? `<img class="${cls}" src="${iconURL(e)}" alt="">` : e;

// regex pentru toate emoji-urile din registru (cele mai lungi primele)
const KEYS = Object.keys(D).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const RX = new RegExp('(' + KEYS.join('|') + ')️?', 'gu');

/** inlocuieste emoji-urile din nodurile text ale unui element */
export function iconizeNode(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const todo: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) { const t = n as Text; RX.lastIndex = 0; if (RX.test(t.data)) todo.push(t); }
  for (const t of todo) {
    const p = t.parentNode; if (!p || (p as HTMLElement).closest?.('textarea,input,script,style')) continue;
    const frag = document.createDocumentFragment();
    let last = 0; RX.lastIndex = 0; let m: RegExpExecArray | null;
    while ((m = RX.exec(t.data))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.data.slice(last, m.index)));
      const img = document.createElement('img'); img.className = 'di'; img.alt = ''; img.src = iconURL(m[1]); frag.appendChild(img);
      last = m.index + m[0].length;
    }
    if (last < t.data.length) frag.appendChild(document.createTextNode(t.data.slice(last)));
    p.replaceChild(frag, t);
  }
}

let observing = false;
/** porneste inlocuirea automata in toata pagina */
export function iconizeDom() {
  if (observing || typeof document === 'undefined') return; observing = true;
  const st = document.createElement('style');
  st.textContent = 'img.di{width:1.25em;height:1.25em;vertical-align:-0.28em;display:inline-block;object-fit:contain;pointer-events:none}img.prev{width:64px;height:64px;display:block;margin:0 auto;pointer-events:none}';
  document.head.appendChild(st);
  iconizeNode(document.body);
  let pending = false; const queue = new Set<Node>();
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') queue.add(m.target.parentNode ?? m.target);
      else m.addedNodes.forEach(n => queue.add(n.nodeType === 3 ? (n.parentNode ?? n) : n));
    }
    if (!pending) { pending = true; queueMicrotask(() => { pending = false; const q = [...queue]; queue.clear(); for (const n of q) if (n.isConnected) iconizeNode(n); }); }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

const P2 = CanvasRenderingContext2D.prototype;
const origFill = P2.fillText, origStroke = P2.strokeText;
function fontPx(c: C) { const m = /(\d+(?:\.\d+)?)px/.exec(c.font); return m ? +m[1] : 16; }
function layout(c: C, text: string, x: number, size: number) {
  const parts: (string | { e: string })[] = []; let last = 0; RX.lastIndex = 0; let m: RegExpExecArray | null;
  while ((m = RX.exec(text))) { if (m.index > last) parts.push(text.slice(last, m.index)); parts.push({ e: m[1] }); last = m.index + m[0].length; }
  if (last < text.length) parts.push(text.slice(last));
  const isz = size * 1.15;
  const ws = parts.map(p => typeof p === 'string' ? c.measureText(p).width : isz);
  const total = ws.reduce((a, b) => a + b, 0);
  const al = c.textAlign;
  const x0 = al === 'center' ? x - total / 2 : al === 'right' || al === 'end' ? x - total : x;
  return { parts, ws, x0, isz };
}
function midOf(c: C, y: number, size: number) { const bl = c.textBaseline; return bl === 'middle' ? y : bl === 'top' || bl === 'hanging' ? y + size / 2 : bl === 'bottom' || bl === 'ideographic' ? y - size / 2 : y - size * 0.35; }
function draw(c: C, text: string, x: number, y: number, size: number, fill: boolean) {
  const L = layout(c, text, x, size); const al = c.textAlign; c.textAlign = 'left';
  let cx = L.x0; const my = midOf(c, y, size);
  L.parts.forEach((p, i) => {
    if (typeof p === 'string') (fill ? origFill : origStroke).call(c, p, cx, y);
    else if (fill) { const cv = iconCanvas(p.e, 64); if (cv) c.drawImage(cv, cx, my - L.isz / 2, L.isz, L.isz); }
    cx += L.ws[i];
  });
  c.textAlign = al;
}
/** toate textele scrise pe canvas care contin emoji-uri cunoscute le deseneaza ca iconite */
P2.fillText = function (this: C, text: string, x: number, y: number, maxW?: number) {
  const s = String(text); RX.lastIndex = 0;
  if (!RX.test(s)) return maxW === undefined ? origFill.call(this, s, x, y) : origFill.call(this, s, x, y, maxW);
  draw(this, s, x, y, fontPx(this), true);
} as any;
P2.strokeText = function (this: C, text: string, x: number, y: number, maxW?: number) {
  const s = String(text); RX.lastIndex = 0;
  if (!RX.test(s)) return maxW === undefined ? origStroke.call(this, s, x, y) : origStroke.call(this, s, x, y, maxW);
  draw(this, s, x, y, fontPx(this), false);
} as any;

/** compatibilitate: scrie (si optional contureaza) text cu iconite */
export function fillTextIcons(c: C, text: string, x: number, y: number, _size?: number, stroke = false) {
  if (stroke) c.strokeText(text, x, y); c.fillText(text, x, y);
}

/** pregateste toate iconitele dinainte (ecranul de incarcare) */
export function preloadIcons(step?: (k: number) => void) {
  const keys = Object.keys(D); keys.forEach((k, i) => { iconURL(k); if (step && i % 20 === 0) step(i / keys.length); });
}
