// Harta lumii: o imagine mica, desenata o data (aceeasi orientare izometrica ca jocul), din care
// miniharta din colt arata zona din jurul tau, iar harta mare arata toata lumea cu regiunile.
import { floorAt, FURNITURE, type Floor } from '../world/map';
import { WORLD, REGIONS, regionAt } from '../world/layout';
import { iconCanvas } from './icons';

const K = 4; // pixeli pe unitate izometrica (imaginea e clara si cand miniharta se mareste)
const OX = WORLD.x0 - WORLD.y1, OY = WORLD.x0 + WORLD.y0;
export const MAP_PW = (WORLD.x1 - WORLD.y0 - OX) * K, MAP_PH = (WORLD.x1 + WORLD.y1 - OY) * K / 2;
/** punctul de pe harta pentru o dala */
export const mapPt = (x: number, y: number) => ({ x: (x - y - OX) * K, y: (x + y - OY) * K / 2 });

const COL: Partial<Record<Floor, [number, number, number]>> = {
  grass: [178, 222, 160], meadow: [178, 222, 160], forest: [118, 178, 112], water: [110, 190, 240], sand: [240, 222, 180],
  road: [222, 196, 150], path: [232, 214, 178], asphalt: [128, 132, 146], sidewalk: [226, 221, 213], bridge: [201, 142, 95],
  field: [200, 170, 120], cobble: [226, 210, 180], wood: [242, 198, 186], pinkwood: [242, 198, 186], tileblue: [196, 230, 245], checker: [255, 216, 201], dirt: [168, 122, 80],
};
const BUILDING_TYPES = ['building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill', 'sawmill'];
let base: HTMLCanvasElement | null = null;
/** imaginea hartii (o data; se refoloseste). Fara copaci (padurea se vede din culoare): miniharta ramane curata */
export function worldMapImage(): HTMLCanvasElement {
  if (base) return base;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(MAP_PW); cv.height = Math.ceil(MAP_PH);
  const ctx = cv.getContext('2d')!;
  // podeaua: fiecare dala e un romb (desenat dintr-o imagine mica, apoi marit fara blur)
  const small = document.createElement('canvas'); const sw = Math.ceil(MAP_PW / K), sh = Math.ceil(MAP_PH / K); small.width = sw; small.height = sh;
  const sc = small.getContext('2d')!, img = sc.createImageData(sw, sh), d = img.data;
  for (let py = 0; py < sh; py++) for (let px = 0; px < sw; px++) {
    const u = px + OX, v = py * 2 + OY; // u = x - y, v = x + y
    const x = Math.floor((u + v) / 2), y = Math.floor((v - u) / 2);
    const f = floorAt(x, y); if (f === 'void') continue;
    const c = COL[f] ?? [170, 214, 150], i = (py * sw + px) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  sc.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, sw * K, sh * K);
  // cladirile: romburi cu acoperis colorat si contur
  for (const f of FURNITURE) {
    const t = f.type as string;
    if (!BUILDING_TYPES.includes(t) && f.id !== 'w-house') continue;
    const a = mapPt(f.gx, f.gy), b = mapPt(f.gx + f.w, f.gy), c = mapPt(f.gx + f.w, f.gy + f.d), e = mapPt(f.gx, f.gy + f.d);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath();
    ctx.fillStyle = t === 'cbuilding' ? (f.action?.id ? '#9fb3dd' : '#c9d2e6') : t === 'barn' ? '#d9574a' : t === 'farmhouse' ? '#f2c0a8' : '#f7a8b8'; ctx.fill();
    ctx.strokeStyle = 'rgba(74,42,34,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // casa voastra
  { const a = mapPt(2, 2), b = mapPt(14, 2), c = mapPt(14, 12), e = mapPt(2, 12); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fillStyle = '#ff7aa2'; ctx.fill(); ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 2; ctx.stroke(); }
  base = cv; return cv;
}

export interface MapMarks { me: { x: number; y: number; name: string } ; partner?: { x: number; y: number; name: string }; vehicles: { x: number; y: number; icon: string }[]; t: number }
function dot(c: CanvasRenderingContext2D, x: number, y: number, col: string, r: number, pulse = 0) {
  if (pulse) { c.fillStyle = col + '55'; c.beginPath(); c.arc(x, y, r + pulse, 0, 7); c.fill(); }
  c.fillStyle = col; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
}
/** locurile importante (iconite pe miniharta mare): magazinele, institutiile, cheresteaua */
let pois: { x: number; y: number; icon: string }[] | null = null;
function poiList() {
  if (pois) return pois;
  pois = FURNITURE.filter(f => f.action?.id && f.action.icon && (BUILDING_TYPES.includes(f.type as string) || ['stalls', 'busstop', 'fountain', 'ferris'].includes(f.type as string)) && !f.action.id.startsWith('v-visit'))
    .map(f => ({ x: f.gx + f.w / 2, y: f.gy + f.d / 2, icon: f.action!.icon }));
  return pois;
}
const LABELS: [string, string, number, number][] = [['🏡', 'Acasă', 9, 9], ['🌲', 'Pădurea', 19, -24], ['🏞️', 'Lacul', 70, 18], ['🌉', 'Podul', 66, 39], ['🏘️', 'Satul', 121, 14], ['🏙️', 'Orașul', 214, 30], ['🪚', 'Cheresteaua', 29, 15]];
/**
 * miniharta: zona din jurul tau. big = miniharta marita (cu numele locurilor si iconitele magazinelor);
 * mica = doar drumurile, apa, cladirile si voi doi (fara nimic in plus, ca sa nu incurce).
 */
export function drawMini(c: CanvasRenderingContext2D, W: number, H: number, m: MapMarks, zoom = 1, big = false) {
  const img = worldMapImage(), p = mapPt(m.me.x, m.me.y);
  c.save(); c.clearRect(0, 0, W, H);
  c.beginPath(); c.roundRect(0, 0, W, H, 12); c.clip();
  c.fillStyle = '#a7d697'; c.fillRect(0, 0, W, H);
  c.imageSmoothingEnabled = zoom < 1;
  c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.translate(-p.x, -p.y);
  c.drawImage(img, 0, 0);
  const inv = 1 / zoom;
  if (big) {
    for (const q0 of poiList()) { const q = mapPt(q0.x, q0.y), ic = iconCanvas(q0.icon, 32); if (ic) c.drawImage(ic, q.x - 7 * inv, q.y - 7 * inv, 14 * inv, 14 * inv); }
    c.font = `800 ${11 * inv}px "Baloo 2", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [, name, x, y] of LABELS) { const q = mapPt(x, y); c.lineWidth = 3 * inv; c.strokeStyle = '#fff'; c.strokeText(name, q.x, q.y - 12 * inv); c.fillStyle = '#4a2a22'; c.fillText(name, q.x, q.y - 12 * inv); }
  }
  for (const v of m.vehicles) { const q = mapPt(v.x, v.y), ic = iconCanvas(v.icon, 32); if (ic && (big || Math.hypot(v.x - m.me.x, v.y - m.me.y) < 40)) c.drawImage(ic, q.x - 6 * inv, q.y - 6 * inv, 12 * inv, 12 * inv); }
  if (m.partner) { const q = mapPt(m.partner.x, m.partner.y); dot(c, q.x, q.y, '#3a2a22', 3.5 * inv); }
  dot(c, p.x, p.y, '#ff4d6d', 4.5 * inv, (1.5 + Math.sin(m.t * 5) * 1.2) * inv);
  c.restore();
  // partenerul in afara hartii: o sageata pe margine, spre el
  if (m.partner) {
    const q = mapPt(m.partner.x, m.partner.y), dx = (q.x - p.x) * zoom, dy = (q.y - p.y) * zoom;
    if (Math.abs(dx) > W / 2 - 6 || Math.abs(dy) > H / 2 - 6) {
      const k = Math.min((W / 2 - 12) / Math.max(1e-6, Math.abs(dx)), (H / 2 - 12) / Math.max(1e-6, Math.abs(dy))), ax = W / 2 + dx * k, ay = H / 2 + dy * k, a = Math.atan2(dy, dx);
      c.save(); c.translate(ax, ay); c.rotate(a); c.fillStyle = '#3a2a22'; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  }
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
    else if (['building', 'cbuilding', 'farmhouse', 'church', 'barn', 'windmill', 'sawmill'].includes(t)) { ctx.fillStyle = t === 'cbuilding' ? '#b8c4e0' : t === 'barn' ? '#d9574a' : '#f2b8a8'; ctx.fillRect(x, y, f.w * TK, f.d * TK); ctx.strokeStyle = 'rgba(74,42,34,.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, f.w * TK - 1, f.d * TK - 1); }
  }
  ctx.fillStyle = '#ff9ab8'; ctx.fillRect((2 - T0.x) * TK, (2 - T0.y) * TK, 12 * TK, 10 * TK); ctx.strokeStyle = '#4a2a22'; ctx.lineWidth = 1.5; ctx.strokeRect((2 - T0.x) * TK, (2 - T0.y) * TK, 12 * TK, 10 * TK);
  top = cv; return cv;
}
export interface MapPoi { id: string; x: number; y: number; icon: string; name: string; label: string; major: boolean }
export interface MapView { z: number; cx: number; cy: number }
export const MAP_T0 = T0, MAP_T1 = T1;
/** geometria hartii mari: scara (pixeli pe dala), dala → ecran si ecran → dala; centrul se tine in interiorul lumii */
export function mapGeom(W: number, H: number, v: MapView) {
  const img = topMapImage(), k0 = Math.min(W / img.width, H / img.height), k = k0 * v.z, px = TK * k;
  const hw = W / 2 / px, hh = H / 2 / px;
  const cx = (T1.x - T0.x) <= hw * 2 ? (T0.x + T1.x) / 2 : Math.max(T0.x + hw, Math.min(T1.x - hw, v.cx));
  const cy = (T1.y - T0.y) <= hh * 2 ? (T0.y + T1.y) / 2 : Math.max(T0.y + hh, Math.min(T1.y - hh, v.cy));
  v.cx = cx; v.cy = cy;
  return { px, k, P: (x: number, y: number) => ({ x: W / 2 + (x - cx) * px, y: H / 2 + (y - cy) * px }), inv: (sx: number, sy: number) => ({ x: cx + (sx - W / 2) / px, y: cy + (sy - H / 2) / px }) };
}
/** harta mare: toata lumea vazuta de sus, cu regiunile, toate cladirile si unde sunteti; se mareste (z) si se trage */
export function drawFull(c: CanvasRenderingContext2D, W: number, H: number, m: MapMarks, view: MapView = { z: 1, cx: 0, cy: 0 }, pois: MapPoi[] = [], sel = '') {
  const img = topMapImage(), G = mapGeom(W, H, view), P = G.P;
  c.clearRect(0, 0, W, H); c.fillStyle = '#8fc98a'; c.fillRect(0, 0, W, H);
  c.imageSmoothingEnabled = G.px < TK * 1.5;
  { const a = P(T0.x, T0.y); c.drawImage(img, a.x, a.y, img.width * G.k, img.height * G.k); }
  // busola: padurea e la nord
  { c.font = '800 11px "Baloo 2", sans-serif'; c.fillStyle = '#4a2a22'; c.textAlign = 'left'; c.textBaseline = 'top'; const a = P(T0.x, T0.y); c.fillText('↑ Nord (pădurea)', Math.max(6, a.x + 6), Math.max(4, a.y + 4)); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const zoomed = G.px >= 6;
  // numele regiunilor (cand harta e mica); cand o maresti, apar numele fiecarei cladiri
  const labels: [string, string, number, number][] = [['🏡', 'Acasă', 4, 6], ['🌲', 'Pădurea', 19, -24], ['🏞️', 'Lacul', 70, 18], ['🌉', 'Podul Mare', 66, 44], ['🏘️', 'Satul', 121, 14], ['🏙️', 'Orașul', 214, 30], ['🌾', 'Câmpurile', 20, 41], ['🪚', 'Cheresteaua (scânduri)', 26, 27], ['🐓', 'Ferma', 40, -1], ['🌾', 'Moara', 42, 47]];
  const pill = (ic: string, name: string, q: { x: number; y: number }, fs: number, hot = false) => {
    c.font = `800 ${fs}px "Baloo 2", sans-serif`; const tw = c.measureText(name).width + fs * 2.5;
    c.fillStyle = hot ? '#ffe3ea' : '#fffaf5ee'; c.strokeStyle = hot ? '#ff4d6d' : '#4a2a22'; c.lineWidth = 2; c.beginPath(); c.roundRect(q.x - tw / 2, q.y - fs * 0.92, tw, fs * 1.84, fs * 0.92); c.fill(); c.stroke();
    const cv = iconCanvas(ic, 48); if (cv) c.drawImage(cv, q.x - tw / 2 + fs * 0.35, q.y - fs * 0.66, fs * 1.33, fs * 1.33);
    c.fillStyle = '#4a2a22'; c.fillText(name, q.x + fs * 0.75, q.y + 1);
    return { x0: q.x - tw / 2, x1: q.x + tw / 2, y0: q.y - fs, y1: q.y + fs };
  };
  // cladirile: iconita pe fiecare; numele cand e loc (cele importante intai, fara sa se incalece)
  const taken: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const free = (b: { x0: number; x1: number; y0: number; y1: number }) => !taken.some(t => b.x0 < t.x1 && b.x1 > t.x0 && b.y0 < t.y1 && b.y1 > t.y0);
  const vis = pois.filter(p => { const q = P(p.x, p.y); return q.x > -20 && q.x < W + 20 && q.y > -20 && q.y < H + 20 && (zoomed || p.major); });
  const isz = zoomed ? Math.min(22, 10 + G.px * 0.9) : 12;
  for (const p of vis) { const q = P(p.x, p.y), hot = p.id === sel; c.fillStyle = hot ? '#ff4d6d' : '#fffaf5'; c.strokeStyle = '#4a2a22'; c.lineWidth = 1.5; c.beginPath(); c.arc(q.x, q.y, isz * 0.62, 0, 7); c.fill(); c.stroke(); const ic = iconCanvas(p.icon, 48); if (ic) c.drawImage(ic, q.x - isz * 0.4, q.y - isz * 0.4, isz * 0.8, isz * 0.8); taken.push({ x0: q.x - isz * 0.6, x1: q.x + isz * 0.6, y0: q.y - isz * 0.6, y1: q.y + isz * 0.6 }); }
  if (!zoomed) for (const [ic, name, x, y] of labels) pill(ic, name, P(x, y), 12);
  if (zoomed) {
    const fs = Math.min(13, 8 + G.px * 0.35);
    for (const p of [...vis].sort((a, b) => (b.id === sel ? 1 : 0) - (a.id === sel ? 1 : 0) || +b.major - +a.major)) {
      const q = P(p.x, p.y), r = isz * 0.62; c.font = `800 ${fs}px "Baloo 2", sans-serif`; const tw = c.measureText(p.name).width + 8;
      // sub iconita; daca nu e loc: deasupra, in dreapta, in stanga
      const spots = [[q.x, q.y + r + fs], [q.x, q.y - r - fs * 0.8], [q.x + r + tw / 2 + 2, q.y], [q.x - r - tw / 2 - 2, q.y]];
      let at: number[] | null = null, b = { x0: 0, x1: 0, y0: 0, y1: 0 };
      for (const [x, y] of spots) { b = { x0: x - tw / 2, x1: x + tw / 2, y0: y - fs * 0.7, y1: y + fs * 0.7 }; if (free(b)) { at = [x, y]; break; } }
      if (!at) { if (p.id !== sel) continue; at = spots[0]; b = { x0: at[0] - tw / 2, x1: at[0] + tw / 2, y0: at[1] - fs * 0.7, y1: at[1] + fs * 0.7 }; }
      taken.push(b);
      c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(p.name, at[0], at[1]); c.fillStyle = p.id === sel ? '#ff4d6d' : '#4a2a22'; c.fillText(p.name, at[0], at[1]);
    }
  }
  for (const v of m.vehicles) { const q = P(v.x, v.y), ic = iconCanvas(v.icon, 48); if (ic) c.drawImage(ic, q.x + 4, q.y - 16, 14, 14); }
  // impreuna (aproape unul de altul): un singur nume, ca sa nu se incalece
  const together = !!m.partner && Math.hypot(m.partner.x - m.me.x, m.partner.y - m.me.y) < 6;
  const label = (t: string, x: number, y: number, col: string) => { c.font = '900 12px "Baloo 2", sans-serif'; c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText(t, x, y); c.fillStyle = col; c.fillText(t, x, y); };
  if (m.partner) { const q = P(m.partner.x, m.partner.y); dot(c, q.x, q.y, '#3a2a22', 5); if (!together) label(m.partner.name, q.x, q.y + 15, '#3a2a22'); }
  const q = P(m.me.x, m.me.y); dot(c, q.x, q.y, '#ff4d6d', 6, 3 + Math.sin(m.t * 5) * 2); label(together ? `${m.me.name} & ${m.partner!.name}` : m.me.name, q.x, q.y - 15, '#ff4d6d');
  void REGIONS; void regionAt;
}
