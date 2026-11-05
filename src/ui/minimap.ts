// Harta lumii: o imagine mica, desenata o data (aceeasi orientare izometrica ca jocul), din care
// miniharta din colt arata zona din jurul tau, iar harta mare arata toata lumea cu regiunile.
import { floorAt, FURNITURE, type Floor } from '../world/map';
import { WORLD, REGIONS, regionAt } from '../world/layout';
import { iconCanvas } from './icons';

const K = 2; // pixeli pe unitate izometrica
const OX = WORLD.x0 - WORLD.y1, OY = WORLD.x0 + WORLD.y0;
export const MAP_PW = (WORLD.x1 - WORLD.y0 - OX) * K, MAP_PH = (WORLD.x1 + WORLD.y1 - OY) * K / 2;
/** punctul de pe harta pentru o dala */
export const mapPt = (x: number, y: number) => ({ x: (x - y - OX) * K, y: (x + y - OY) * K / 2 });

const COL: Partial<Record<Floor, [number, number, number]>> = {
  grass: [166, 220, 147], meadow: [179, 226, 154], forest: [110, 182, 108], water: [126, 200, 240], sand: [244, 226, 181],
  road: [214, 190, 150], path: [233, 216, 184], asphalt: [141, 143, 154], sidewalk: [226, 221, 213], bridge: [201, 142, 95],
  field: [185, 138, 92], cobble: [221, 208, 184], wood: [242, 198, 186], pinkwood: [242, 198, 186], tileblue: [196, 230, 245], checker: [255, 216, 201], dirt: [168, 122, 80],
};
let base: HTMLCanvasElement | null = null;
/** imaginea hartii (o data; se refoloseste) */
export function worldMapImage(): HTMLCanvasElement {
  if (base) return base;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(MAP_PW); cv.height = Math.ceil(MAP_PH);
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height), d = img.data;
  for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++) {
    const u = px / K + OX, v = py * 2 / K + OY; // u = x - y, v = x + y
    const x = Math.floor((u + v) / 2), y = Math.floor((v - u) / 2);
    const f = floorAt(x, y); if (f === 'void') continue;
    const c = COL[f] ?? [160, 210, 140], i = (py * cv.width + px) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // copacii (puncte verzi inchise) si cladirile (romburi colorate)
  for (const f of FURNITURE) {
    const t = f.type as string;
    if (t === 'pine' || t === 'oak' || t === 'tree') { const p = mapPt(f.gx + 0.5, f.gy + 0.5); ctx.fillStyle = t === 'pine' ? '#3f8f5a' : '#5aa35a'; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    else if (['building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill'].includes(t) || f.id === 'w-house') {
      const a = mapPt(f.gx, f.gy), b = mapPt(f.gx + f.w, f.gy), c = mapPt(f.gx + f.w, f.gy + f.d), e = mapPt(f.gx, f.gy + f.d);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath();
      ctx.fillStyle = t === 'cbuilding' ? '#b8c4e0' : t === 'barn' ? '#d9574a' : '#f2b8a8'; ctx.fill(); ctx.strokeStyle = 'rgba(74,42,34,.55)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  // casa voastra
  { const a = mapPt(2, 2), b = mapPt(14, 2), c = mapPt(14, 12), e = mapPt(2, 12); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fillStyle = '#ff9ab8'; ctx.fill(); ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 1.2; ctx.stroke(); }
  base = cv; return cv;
}

export interface MapMarks { me: { x: number; y: number; name: string } ; partner?: { x: number; y: number; name: string }; vehicles: { x: number; y: number; icon: string }[]; t: number }
function dot(c: CanvasRenderingContext2D, x: number, y: number, col: string, r: number, pulse = 0) {
  if (pulse) { c.fillStyle = col + '55'; c.beginPath(); c.arc(x, y, r + pulse, 0, 7); c.fill(); }
  c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
}
/** miniharta: zona din jurul tau (s = cat de mult se mareste) */
export function drawMini(c: CanvasRenderingContext2D, W: number, H: number, m: MapMarks, zoom = 2.2) {
  const img = worldMapImage(), p = mapPt(m.me.x, m.me.y);
  c.save(); c.clearRect(0, 0, W, H);
  c.beginPath(); c.roundRect(0, 0, W, H, 12); c.clip();
  c.fillStyle = '#8fc98a'; c.fillRect(0, 0, W, H);
  c.imageSmoothingEnabled = true;
  c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-p.x, -p.y);
  c.drawImage(img, 0, 0);
  for (const v of m.vehicles) { const q = mapPt(v.x, v.y), ic = iconCanvas(v.icon, 32); if (ic) c.drawImage(ic, q.x - 4, q.y - 4, 8, 8); }
  if (m.partner) { const q = mapPt(m.partner.x, m.partner.y); dot(c, q.x, q.y, '#3a2a22', 2.6 / zoom * 2); }
  dot(c, p.x, p.y, '#ff4d6d', 3, 1.5 + Math.sin(m.t * 5) * 1.2);
  c.restore();
  c.strokeStyle = '#4a2a22'; c.lineWidth = 3; c.beginPath(); c.roundRect(1.5, 1.5, W - 3, H - 3, 11); c.stroke();
}
const TK = 3; // harta de sus: pixeli pe dala
const T0 = { x: -14, y: -40 }, T1 = { x: 252, y: 66 };
let top: HTMLCanvasElement | null = null;
/** harta vazuta de sus (nordul = padurea, sus), pentru harta mare */
export function topMapImage(): HTMLCanvasElement {
  if (top) return top;
  const cv = document.createElement('canvas'); cv.width = (T1.x - T0.x) * TK; cv.height = (T1.y - T0.y) * TK;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height), d = img.data;
  for (let ty = T0.y; ty < T1.y; ty++) for (let tx = T0.x; tx < T1.x; tx++) {
    const f = floorAt(tx, ty); const c = COL[f] ?? [160, 210, 140];
    for (let j = 0; j < TK; j++) for (let i = 0; i < TK; i++) { const k = (((ty - T0.y) * TK + j) * cv.width + (tx - T0.x) * TK + i) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
  for (const f of FURNITURE) {
    const t = f.type as string, x = (f.gx - T0.x) * TK, y = (f.gy - T0.y) * TK;
    if (t === 'pine' || t === 'oak' || t === 'tree') { ctx.fillStyle = t === 'pine' ? '#3f8f5a' : '#5aa35a'; ctx.beginPath(); ctx.arc(x + TK / 2, y + TK / 2, TK * 0.55, 0, 7); ctx.fill(); }
    else if (['building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill'].includes(t)) { ctx.fillStyle = t === 'cbuilding' ? '#b8c4e0' : t === 'barn' ? '#d9574a' : '#f2b8a8'; ctx.fillRect(x, y, f.w * TK, f.d * TK); ctx.strokeStyle = 'rgba(74,42,34,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, f.w * TK - 1, f.d * TK - 1); }
  }
  ctx.fillStyle = '#ff9ab8'; ctx.fillRect((2 - T0.x) * TK, (2 - T0.y) * TK, 12 * TK, 10 * TK); ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 1.5; ctx.strokeRect((2 - T0.x) * TK, (2 - T0.y) * TK, 12 * TK, 10 * TK);
  top = cv; return cv;
}
/** harta mare: toata lumea vazuta de sus, cu regiunile si unde sunteti */
export function drawFull(c: CanvasRenderingContext2D, W: number, H: number, m: MapMarks) {
  const img = topMapImage();
  const k = Math.min(W / img.width, H / img.height), ox = (W - img.width * k) / 2, oy = (H - img.height * k) / 2;
  c.clearRect(0, 0, W, H);
  c.imageSmoothingEnabled = true;
  c.drawImage(img, ox, oy, img.width * k, img.height * k);
  const P = (x: number, y: number) => ({ x: ox + (x - T0.x) * TK * k, y: oy + (y - T0.y) * TK * k });
  // busola: padurea e la nord
  { c.font = '800 11px "Baloo 2", sans-serif'; c.fillStyle = '#4a2a22'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('↑ Nord (pădurea)', ox + 6, oy + 4); }
  // numele regiunilor
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const labels: [string, string, number, number][] = [['🏡', 'Acasă', 10, 12], ['🌲', 'Pădurea', 19, -24], ['🏞️', 'Lacul', 70, 18], ['🌉', 'Podul Mare', 66, 37], ['🏘️', 'Satul', 122, 24], ['🏙️', 'Orașul', 212, 25], ['🌾', 'Câmpurile', 18, 32]];
  for (const [ic, name, x, y] of labels) {
    const q = P(x, y); c.font = '800 12px "Baloo 2", sans-serif'; const tw = c.measureText(name).width + 30;
    c.fillStyle = '#fffaf5ee'; c.strokeStyle = '#4a2a22'; c.lineWidth = 2; c.beginPath(); c.roundRect(q.x - tw / 2, q.y - 11, tw, 22, 11); c.fill(); c.stroke();
    const cv = iconCanvas(ic, 48); if (cv) c.drawImage(cv, q.x - tw / 2 + 4, q.y - 8, 16, 16);
    c.fillStyle = '#4a2a22'; c.fillText(name, q.x + 9, q.y + 1);
  }
  for (const v of m.vehicles) { const q = P(v.x, v.y), ic = iconCanvas(v.icon, 48); if (ic) c.drawImage(ic, q.x - 9, q.y - 9, 18, 18); }
  if (m.partner) { const q = P(m.partner.x, m.partner.y); dot(c, q.x, q.y, '#3a2a22', 5); c.font = '800 11px "Baloo 2", sans-serif'; c.fillStyle = '#3a2a22'; c.fillText(m.partner.name, q.x, q.y + 14); }
  const q = P(m.me.x, m.me.y); dot(c, q.x, q.y, '#ff4d6d', 6, 3 + Math.sin(m.t * 5) * 2); c.font = '900 12px "Baloo 2", sans-serif'; c.fillStyle = '#ff4d6d'; c.fillText(m.me.name, q.x, q.y - 15);
  void REGIONS; void regionAt;
}
