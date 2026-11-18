// Hainele hamsterilor vazute din profil (1.14.2), pentru desenul de pe vehicule (hamside.ts).
// Aceleasi culori si aceeasi umbrire ca hainele din fata (hamwear.ts), dar desenate pe forma din lateral, cu fata spre dreapta.
// Corpul: centrul in (0,-38), burtica in fata (x ~ 30..50), spatele la x ~ -48, sezutul pe sa la y 0.
// Capul: centrul in (0,0), crestetul pe la y -51, ochiul in (32,-6), nasul in (60,6), barbia pe la (10,50),
// urechile in (-18,-46) (aproape) si (4,-50) (departe).
import { heartPath, starPath } from './draw';
import { drawPin } from './outfit';

const O = '#4a2a22';
const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };
const st = (c: C, fill: string | CanvasGradient, lw = 2.6) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = O; c.stroke(); };
const lin = (c: C, y0: number, y1: number, a: string, b: string) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
/** umbra tesaturii: lumina sus-stanga, mai inchis spre margini (ca in hamwear) */
function shade(c: C, cx = 0, cy = -38, a = 0.2) {
  const g = c.createRadialGradient(cx - 12, cy - 22, 6, cx, cy, 62); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(50,25,20,${a})`);
  c.fillStyle = g; c.fillRect(-90, -120, 180, 150);
}
function dots(c: C, col: string, r: number, step: number, x0 = -64, x1 = 64, y0 = -100, y1 = 30) { c.fillStyle = col; for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) { ell(c, x + ((Math.round(y / step)) % 2 ? step / 2 : 0), y, r, r); c.fill(); } }
function button(c: C, x: number, y: number, r = 2.8, col = '#ffd23f') { ell(c, x, y, r, r); st(c, col, 1.6); c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3); c.fill(); }
function flower(c: C, x: number, y: number, r: number, col: string, mid = '#ffd23f') {
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; ell(c, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5); c.fillStyle = col; c.fill(); c.lineWidth = 1.3; c.strokeStyle = O; c.stroke(); }
  ell(c, x, y, r * 0.34, r * 0.34); c.fillStyle = mid; c.fill(); c.lineWidth = 1.2; c.stroke();
}
function inClip(c: C, p: Path2D, fn: () => void) { c.save(); c.clip(p); fn(); c.restore(); }
/** fusta (rochii): de la talie, peste coapsa, pana sub sa; hem = cat de jos ajunge */
function skirtPath(c: C, hem: number, flare: number) {
  c.beginPath(); c.moveTo(-46, -30); c.quadraticCurveTo(-58 - flare * 0.4, -6, -60 - flare, hem);
  for (let i = 0; i <= 8; i++) { const x = -60 - flare + (i / 8) * (120 + flare * 2), yy = hem + (i % 2 ? 4 : 0); c.lineTo(x, yy); }
  c.quadraticCurveTo(58 + flare * 0.4, -6, 48, -32); c.quadraticCurveTo(0, -24, -46, -30); c.closePath();
}

// ======================================================================= corp
export interface SideLegs { col: string; dark: string }
/** pantalonii (coapsa si laba, cand hainele au): salopeta, costumele, pijamaua */
export function sideLegWear(id: string): SideLegs | null {
  switch (id) {
    case 'salopeta': return { col: '#5b8be0', dark: '#3d6cc0' };
    case 'costum': return { col: '#2f3b5c', dark: '#232c47' };
    case 'mire': return { col: '#23232b', dark: '#15151b' };
    case 'pijama': return { col: '#cfe7ff', dark: '#a9d0f5' };
    default: return null;
  }
}
/**
 * layer 'torso': peste corp (decupat pe forma lui), inainte de piciorul din fata;
 * 'over': dupa piciorul din fata (fuste, sort, poala); 'hood': inainte de cap (gluga); 'collar': dupa cap (guler pufos).
 */
export function sideBodyWear(c: C, id: string, layer: 'torso' | 'over' | 'hood' | 'collar', body: Path2D, t: number) {
  void t;
  switch (id) {
    case 'ie': if (layer === 'torso') inClip(c, body, () => {
      c.fillStyle = lin(c, -80, 0, '#fffaf0', '#f6ead6'); c.fillRect(-80, -110, 160, 130); shade(c);
      // altita pe umar si randul de cusaturi pe piept
      c.fillStyle = '#d62828'; for (let i = 0; i < 6; i++) { const x = 30 + (i % 2) * 4, y = -56 + i * 6; c.beginPath(); c.moveTo(x, y - 2.4); c.lineTo(x + 2.4, y); c.lineTo(x, y + 2.4); c.lineTo(x - 2.4, y); c.closePath(); c.fill(); }
      c.strokeStyle = '#d62828'; c.lineWidth = 2; c.beginPath(); c.moveTo(-50, -14); c.lineTo(52, -14); c.stroke();
      c.strokeStyle = '#1f1512'; c.lineWidth = 1.2; for (let x = -46; x < 50; x += 6) { c.beginPath(); c.moveTo(x, -18); c.lineTo(x + 3, -15); c.lineTo(x, -12); c.stroke(); }
    }); break;
    case 'vesta': if (layer === 'torso') inClip(c, body, () => {
      // vesta deschisa in fata: se vede burtica
      c.beginPath(); c.moveTo(-80, -110); c.lineTo(22, -110); c.quadraticCurveTo(14, -50, 26, -8); c.lineTo(-80, -8); c.closePath();
      c.fillStyle = lin(c, -80, 0, '#c43a44', '#97222c'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
      shade(c);
      c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; c.setLineDash([2.5, 3]); c.beginPath(); c.moveTo(18, -60); c.quadraticCurveTo(12, -36, 21, -12); c.stroke(); c.setLineDash([]);
      for (const [x, y] of [[-24, -40], [-8, -30], [-30, -22]]) flower(c, x, y, 4.2, '#ffd23f', '#2a6f3b');
    }); break;
    case 'salopeta': if (layer === 'torso') inClip(c, body, () => {
      c.beginPath(); c.moveTo(-80, -30); c.quadraticCurveTo(0, -36, 18, -34); c.lineTo(18, -58); c.lineTo(46, -58); c.lineTo(60, -8); c.lineTo(-80, -8); c.closePath();
      c.fillStyle = lin(c, -60, 0, '#5b8be0', '#3d6cc0'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.2; c.setLineDash([2, 2.5]); c.beginPath(); c.moveTo(22, -54); c.lineTo(42, -54); c.lineTo(46, -40); c.stroke(); c.setLineDash([]);
      // bretelele: din pieptar, peste umar, spre spate
      c.strokeStyle = O; c.lineWidth = 8; c.beginPath(); c.moveTo(22, -56); c.quadraticCurveTo(-6, -74, -36, -40); c.stroke(); c.strokeStyle = '#3d6cc0'; c.lineWidth = 5; c.stroke();
      button(c, 23, -54, 3);
      c.beginPath(); c.roundRect(26, -48, 12, 9, 2); c.fillStyle = '#4a7bd0'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = O; c.stroke(); // buzunarul
    }); break;
    case 'rochita':
      if (layer === 'torso') inClip(c, body, () => { c.fillStyle = lin(c, -80, 0, '#f9b7c5', '#ef8fa6'); c.fillRect(-80, -110, 160, 130); dots(c, '#ffffff', 2, 9); shade(c); });
      else if (layer === 'over') {
        skirtPath(c, 10, 4); c.fillStyle = lin(c, -30, 12, '#f9b7c5', '#ef8fa6'); c.fill();
        c.save(); skirtPath(c, 10, 4); c.clip(); dots(c, '#ffffff', 2, 9, -70, 70, -36, 20); c.strokeStyle = 'rgba(160,60,80,0.35)'; c.lineWidth = 1.6; for (const x of [-28, 4, 34]) { c.beginPath(); c.moveTo(x, -28); c.quadraticCurveTo(x + 2, -6, x + 4, 12); c.stroke(); } c.restore();
        skirtPath(c, 10, 4); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-60, 8); c.lineTo(60, 8); c.stroke();
        c.strokeStyle = '#ff6890'; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-46, -31); c.quadraticCurveTo(0, -24, 48, -33); c.stroke(); // cordonul
      }
      break;
    case 'tricou': if (layer === 'torso') inClip(c, body, () => { c.fillStyle = lin(c, -80, 0, '#a9d4f5', '#86bbe8'); c.fillRect(-80, -110, 160, 130); dots(c, '#ffffff', 2.2, 10); shade(c); c.strokeStyle = '#7fb3de'; c.lineWidth = 3; c.beginPath(); c.moveTo(-60, -10); c.lineTo(60, -10); c.stroke(); }); break;
    case 'pulover': if (layer === 'torso') inClip(c, body, () => {
      c.fillStyle = lin(c, -80, 0, '#8cc77f', '#6aa95e'); c.fillRect(-80, -110, 160, 130);
      c.fillStyle = '#fff6e0'; for (const y of [-46, -30]) c.fillRect(-80, y, 160, 4);
      c.strokeStyle = 'rgba(40,80,30,0.25)'; c.lineWidth = 1; for (let x = -60; x < 60; x += 5) { c.beginPath(); c.moveTo(x, -16); c.lineTo(x, -6); c.stroke(); }
      shade(c);
    }); break;
    case 'rochie':
      if (layer === 'torso') inClip(c, body, () => { c.fillStyle = lin(c, -80, 0, '#de1f45', '#97102b'); c.fillRect(-80, -110, 160, 130); shade(c, 0, -38, 0.25); c.fillStyle = 'rgba(255,255,255,0.25)'; ell(c, 30, -50, 6, 14, -0.3); c.fill(); });
      else if (layer === 'over') {
        // rochia lunga de seara: cade peste sa, pana jos, cu falduri
        c.beginPath(); c.moveTo(-46, -30); c.quadraticCurveTo(-66, 0, -70, 34); c.quadraticCurveTo(0, 44, 66, 34); c.quadraticCurveTo(62, 0, 48, -32); c.quadraticCurveTo(0, -24, -46, -30); c.closePath();
        c.fillStyle = lin(c, -30, 40, '#de1f45', '#97102b'); c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
        c.strokeStyle = 'rgba(80,0,20,0.4)'; c.lineWidth = 1.8; for (const x of [-36, -6, 24, 46]) { c.beginPath(); c.moveTo(x * 0.6, -26); c.quadraticCurveTo(x * 0.85, 6, x, 38); c.stroke(); }
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, -16); c.quadraticCurveTo(-40, 10, -44, 30); c.stroke();
        c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(-46, -31); c.quadraticCurveTo(0, -24, 48, -33); c.stroke();
      }
      break;
    case 'costum': case 'mire': {
      const dark = id === 'mire', col = dark ? '#23232b' : '#2f3b5c', col2 = dark ? '#3c3c48' : '#3e4c74';
      if (layer === 'torso') inClip(c, body, () => {
        c.fillStyle = lin(c, -80, 0, col2, col); c.fillRect(-80, -110, 160, 130); shade(c, 0, -38, 0.25);
        // camasa alba in fata si reverul
        c.beginPath(); c.moveTo(30, -70); c.lineTo(56, -70); c.lineTo(56, -14); c.quadraticCurveTo(40, -30, 30, -70); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
        c.beginPath(); c.moveTo(26, -70); c.quadraticCurveTo(26, -44, 40, -22); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
        c.beginPath(); c.moveTo(26, -70); c.lineTo(34, -56); c.lineTo(28, -52); c.quadraticCurveTo(30, -38, 40, -22); c.fillStyle = col2; c.fill(); c.lineWidth = 1.8; c.stroke();
        button(c, 42, -30, 2.4, dark ? '#c9c9d2' : '#ffd23f');
        if (dark) { c.fillStyle = '#fff'; ell(c, 14, -46, 3, 3); c.fill(); flower(c, 14, -46, 4, '#ffffff', '#ffd23f'); } // floarea de la butoniera
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-80, -12, 160, 2);
      });
      else if (layer === 'over' && dark) { // frac: cozile in spate, peste sa
        c.beginPath(); c.moveTo(-44, -26); c.quadraticCurveTo(-58, -8, -56, 8); c.quadraticCurveTo(-48, 12, -40, 6); c.quadraticCurveTo(-36, -8, -28, -18); c.closePath(); st(c, lin(c, -26, 10, col2, col), 2.4); c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-46, -16); c.quadraticCurveTo(-50, -2, -48, 6); c.stroke();
      }
      break;
    }
    case 'mireasa':
      if (layer === 'torso') inClip(c, body, () => { c.fillStyle = lin(c, -80, 0, '#fffdf8', '#f1e9e0'); c.fillRect(-80, -110, 160, 130); dots(c, 'rgba(230,210,220,0.8)', 1.4, 8); shade(c, 0, -38, 0.14); });
      else if (layer === 'over') {
        c.beginPath(); c.moveTo(-46, -30); c.quadraticCurveTo(-72, 0, -78, 36); c.quadraticCurveTo(0, 48, 72, 36); c.quadraticCurveTo(66, 0, 48, -32); c.quadraticCurveTo(0, -24, -46, -30); c.closePath();
        c.fillStyle = lin(c, -30, 44, '#fffdf8', '#efe6dc'); c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
        c.strokeStyle = 'rgba(180,150,140,0.35)'; c.lineWidth = 1.6; for (const x of [-40, -12, 18, 44]) { c.beginPath(); c.moveTo(x * 0.6, -26); c.quadraticCurveTo(x * 0.85, 8, x, 40); c.stroke(); }
        // dantela pe margine
        c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(74,42,34,0.5)'; c.lineWidth = 1; for (let x = -74; x <= 68; x += 9) { ell(c, x, 38 + Math.sin(x) * 0.6, 4.6, 3.4); c.fill(); c.stroke(); }
        c.strokeStyle = '#ffd6e4'; c.lineWidth = 4; c.beginPath(); c.moveTo(-46, -31); c.quadraticCurveTo(0, -24, 48, -33); c.stroke(); // esarfa roz de la talie
        c.save(); c.translate(-44, -30); flower(c, 0, 0, 5, '#ffd6e4'); c.restore();
      }
      break;
    case 'pijama': if (layer === 'torso') inClip(c, body, () => {
      c.fillStyle = lin(c, -80, 0, '#cfe7ff', '#a9d0f5'); c.fillRect(-80, -110, 160, 130);
      for (const [x, y] of [[-30, -52], [-6, -40], [-34, -24], [12, -22], [-14, -60]]) { starPath(c, x, y, 4.4, 2, 5); c.fillStyle = '#fff7c2'; c.fill(); }
      shade(c, 0, -38, 0.16);
      for (const y of [-50, -36, -22]) button(c, 40, y, 2.4, '#ffffff');
    }); break;
    case 'hanorac':
      if (layer === 'torso') inClip(c, body, () => {
        c.fillStyle = lin(c, -80, 0, '#c9b6f2', '#a993e0'); c.fillRect(-80, -110, 160, 130); shade(c);
        // buzunarul cangur in fata
        c.beginPath(); c.moveTo(14, -36); c.lineTo(48, -36); c.lineTo(52, -12); c.lineTo(10, -12); c.closePath(); c.fillStyle = '#b9a3ea'; c.fill(); c.lineWidth = 2; c.strokeStyle = O; c.stroke();
        c.strokeStyle = '#ad97e3'; c.lineWidth = 4; c.beginPath(); c.moveTo(-60, -9); c.lineTo(60, -9); c.stroke();
      });
      else if (layer === 'hood') { // gluga, in spatele capului (pe ceafa)
        c.beginPath(); c.moveTo(-6, -58); c.bezierCurveTo(-30, -76, -62, -66, -60, -46); c.bezierCurveTo(-58, -36, -40, -36, -26, -44); c.closePath(); st(c, lin(c, -76, -38, '#c9b6f2', '#a993e0'));
        c.strokeStyle = 'rgba(74,42,34,0.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-50, -54); c.quadraticCurveTo(-40, -48, -26, -50); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(34, -54); c.quadraticCurveTo(38, -44, 34, -36); c.stroke(); // snurul
        ell(c, 34, -35, 2, 2.4); st(c, '#ffffff', 1.2);
      }
      break;
    case 'sort':
      if (layer === 'torso') inClip(c, body, () => {
        c.beginPath(); c.moveTo(22, -60); c.lineTo(48, -60); c.lineTo(60, -8); c.lineTo(16, -8); c.closePath(); c.fillStyle = lin(c, -60, 0, '#ffb3c8', '#ff9ab8'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = O; c.stroke();
        heartPath(c, 36, -44, 5); c.fillStyle = '#ff6890'; c.fill();
        c.strokeStyle = '#ff9ab8'; c.lineWidth = 3; c.beginPath(); c.moveTo(18, -32); c.lineTo(-50, -30); c.stroke(); // snurul spre spate
      });
      else if (layer === 'over') {
        c.beginPath(); c.moveTo(14, -32); c.quadraticCurveTo(34, -34, 50, -32); c.quadraticCurveTo(58, -10, 58, 8); c.quadraticCurveTo(34, 12, 12, 8); c.quadraticCurveTo(10, -10, 14, -32); c.closePath();
        st(c, lin(c, -30, 10, '#ffb3c8', '#ff9ab8'));
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(14, 4); c.quadraticCurveTo(34, 8, 56, 4); c.stroke(); c.setLineDash([]);
        c.save(); c.translate(-48, -30); for (const s of [-1, 1]) { ell(c, s * 5, -2, 5, 3.4, s * 0.5); st(c, '#ff9ab8', 1.6); } c.restore(); // funda din spate
      }
      break;
    case 'geaca':
      if (layer === 'torso') inClip(c, body, () => {
        c.fillStyle = lin(c, -80, 0, '#ef5a5f', '#c8323a'); c.fillRect(-80, -110, 160, 130);
        c.strokeStyle = 'rgba(90,10,20,0.45)'; c.lineWidth = 1.8; for (const y of [-58, -44, -30, -16]) { c.beginPath(); c.moveTo(-70, y); c.quadraticCurveTo(0, y + 4, 70, y); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,0.18)'; for (const y of [-52, -38, -24]) { ell(c, -6, y, 30, 3); c.fill(); }
        shade(c, 0, -38, 0.25);
        c.strokeStyle = O; c.lineWidth = 1.4; c.beginPath(); c.moveTo(40, -62); c.quadraticCurveTo(46, -36, 44, -8); c.stroke(); // fermoarul
      });
      else if (layer === 'collar') { // gulerul pufos alb: un sul de blanita sub barbie, din bucle rotunde
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 9; i++) { const k = i / 9; pts.push([-34 + k * 82, -48 + Math.sin(k * Math.PI) * 6, 8 - Math.abs(k - 0.6) * 4]); }
        c.fillStyle = '#fffaf3'; c.strokeStyle = O; c.lineWidth = 2.2;
        for (const [x, y, r] of pts) { ell(c, x, y, r, r * 0.9); c.stroke(); }
        for (const [x, y, r] of pts) { ell(c, x, y, r - 0.6, r * 0.9 - 0.6); c.fill(); }
        c.fillStyle = 'rgba(200,180,170,0.4)'; for (const [x, y, r] of pts) { ell(c, x + 1, y + r * 0.4, r * 0.6, r * 0.3); c.fill(); }
      }
      break;
  }
}

// ======================================================================= cap (coordonatele capului)
/** palariile mari acopera urechile si din profil */
export const sideHides = (head: string) => ({ ears: head === 'beanie' || head === 'palarie' || head === 'batic' || head === 'cowboy' });
export function sideHeadWear(c: C, id: string, layer: 'behind' | 'front', t: number) {
  const F = layer === 'front';
  switch (id) {
    case 'flower': if (F) { // coronita: florile pe arcul crestetului, de la ceafa pana deasupra ochiului
      c.strokeStyle = '#5bbf5b'; c.lineWidth = 3; c.beginPath(); c.ellipse(-8, -18, 52, 34, -0.22, Math.PI * 1.02, Math.PI * 1.9); c.stroke();
      const cols = ['#ff9ab8', '#ffd23f', '#c9a7ff', '#ffffff', '#ffb38a', '#ff9ab8', '#c9a7ff'];
      const ph = -0.22;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.06 + i * 0.12), ux = Math.cos(a) * 52, uy = Math.sin(a) * 34;
        flower(c, -8 + ux * Math.cos(ph) - uy * Math.sin(ph), -18 + ux * Math.sin(ph) + uy * Math.cos(ph), 6.4 - Math.abs(i - 3) * 0.3, cols[i], i % 2 ? '#ff8a3d' : '#ffd23f');
      }
    } break;
    case 'party': if (F) {
      c.save(); c.translate(-6, -48); c.rotate(-0.15);
      c.beginPath(); c.moveTo(-20, 2); c.lineTo(0, -54); c.lineTo(20, 2); c.quadraticCurveTo(0, 8, -20, 2); c.closePath(); st(c, lin(c, -54, 4, '#8fc6ff', '#5a9cf0'));
      c.save(); c.clip(); c.strokeStyle = '#ffd23f'; c.lineWidth = 4; for (const y of [-34, -16]) { c.beginPath(); c.moveTo(-24, y + 8); c.lineTo(24, y - 6); c.stroke(); } c.fillStyle = '#ff7aa2'; for (const [x, y] of [[-8, -6], [6, -26], [-2, -40]]) { ell(c, x, y, 2.2, 2.2); c.fill(); } c.restore();
      ell(c, 0, -56, 6.5, 6.5); st(c, '#ff4d6d', 2); c.restore();
    } break;
    case 'chef': if (F) {
      c.save(); c.translate(-6, -46); c.rotate(-0.12);
      c.beginPath(); c.roundRect(-30, -14, 58, 16, 4); st(c, '#ffffff'); c.fillStyle = '#ebe4de'; c.fillRect(-28, -4, 54, 4);
      c.beginPath(); c.moveTo(-28, -12); c.bezierCurveTo(-46, -26, -34, -52, -16, -44); c.bezierCurveTo(-10, -62, 14, -62, 18, -44); c.bezierCurveTo(36, -52, 44, -26, 26, -12); c.closePath(); st(c, lin(c, -60, -10, '#ffffff', '#ebe4de'));
      c.strokeStyle = 'rgba(74,42,34,0.3)'; c.lineWidth = 1.2; for (const x of [-12, 4]) { c.beginPath(); c.moveTo(x, -14); c.quadraticCurveTo(x - 2, -30, x + 2, -42); c.stroke(); }
      c.restore();
    } break;
    case 'beanie': if (F) { // caciulita trasa pe urechi, cu mot
      c.beginPath(); c.moveTo(-60, -2); c.bezierCurveTo(-66, -50, -14, -76, 30, -50); c.quadraticCurveTo(40, -42, 42, -34); c.quadraticCurveTo(-8, -30, -60, -2); c.closePath();
      st(c, lin(c, -70, -10, '#ffb59d', '#ff8c69'), 3);
      c.save(); c.clip(); c.strokeStyle = 'rgba(160,60,30,0.3)'; c.lineWidth = 1.4; for (let x = -60; x < 40; x += 7) { c.beginPath(); c.moveTo(x, -70); c.quadraticCurveTo(x + 4, -40, x + 2, -10); c.stroke(); } c.restore();
      c.beginPath(); c.moveTo(-62, 0); c.quadraticCurveTo(-8, -34, 44, -36); c.lineTo(44, -26); c.quadraticCurveTo(-8, -22, -60, 12); c.closePath(); st(c, '#f2754f', 2.6);
      ell(c, -18, -66, 11, 10); st(c, '#ffd6c9', 2.4);
    } break;
    case 'cap': if (F) { // sapca: cupola + cozorocul in fata
      c.beginPath(); c.moveTo(30, -36); c.quadraticCurveTo(58, -38, 70, -30); c.quadraticCurveTo(58, -26, 28, -28); c.closePath(); st(c, '#a8121f');
      c.beginPath(); c.moveTo(-42, -24); c.bezierCurveTo(-46, -66, 18, -76, 34, -34); c.quadraticCurveTo(-4, -36, -42, -24); c.closePath(); st(c, lin(c, -70, -26, '#f0505c', '#c8202f'));
      c.strokeStyle = 'rgba(100,0,10,0.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6, -64); c.quadraticCurveTo(0, -48, -4, -34); c.stroke();
      ell(c, -8, -64, 4, 2.6); st(c, '#c8202f', 1.6);
      heartPath(c, 14, -50, 5); c.fillStyle = '#ffffff'; c.fill();
    } break;
    case 'crown': if (F) {
      c.save(); c.translate(-4, -50); c.rotate(-0.15);
      c.beginPath(); c.moveTo(-22, 0); c.lineTo(-24, -26); c.lineTo(-12, -14); c.lineTo(-2, -32); c.lineTo(8, -14); c.lineTo(20, -26); c.lineTo(20, 0); c.quadraticCurveTo(0, 5, -22, 0); c.closePath();
      st(c, lin(c, -32, 2, '#ffe680', '#e8a817'));
      for (const [x, col] of [[-12, '#e63946'], [0, '#4cc9f0'], [11, '#7cc576']] as const) { ell(c, x, -6, 3, 3); st(c, col, 1.4); }
      for (const [x, y] of [[-24, -26], [-2, -32], [20, -26]]) { ell(c, x, y, 2.6, 2.6); st(c, '#fff3b0', 1.4); }
      c.restore();
    } break;
    case 'palarie': if (F) { // palaria de paie: borul lat, panglica rosie
      c.beginPath(); c.ellipse(-4, -40, 70, 11, -0.12, 0, TAU); st(c, lin(c, -52, -30, '#fbe9b4', '#e9c770'));
      c.beginPath(); c.moveTo(-36, -42); c.bezierCurveTo(-38, -80, 26, -84, 28, -48); c.quadraticCurveTo(-4, -40, -36, -42); c.closePath(); st(c, lin(c, -82, -42, '#f8e3a3', '#ecd083'));
      c.beginPath(); c.moveTo(-37, -48); c.quadraticCurveTo(-4, -44, 29, -54); c.lineTo(28, -47); c.quadraticCurveTo(-4, -38, -36, -42); c.closePath(); st(c, '#e5383b', 1.8);
      flower(c, -30, -46, 5, '#ff9ab8');
      c.strokeStyle = 'rgba(160,120,40,0.35)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-4, -40, 26 + i * 11, 4 + i * 1.6, -0.12, 0, TAU); c.stroke(); }
    } break;
    case 'batic': if (F) { // basmaluta: acopera crestetul si ceafa, nodul sub barbie
      c.beginPath(); c.moveTo(38, -34); c.bezierCurveTo(20, -66, -54, -64, -64, -14); c.quadraticCurveTo(-66, 14, -46, 30); c.quadraticCurveTo(-20, 22, -6, 36); c.quadraticCurveTo(18, 30, 30, 42); c.quadraticCurveTo(20, 10, 38, -34); c.closePath();
      st(c, lin(c, -64, 40, '#ef4b4f', '#c62a2e'), 3);
      c.save(); c.clip(); for (const [x, y] of [[-30, -40], [0, -48], [-50, -6], [-20, -10], [10, -24], [-36, 18], [16, 14]]) flower(c, x, y, 5, '#ffffff', '#ffd23f'); c.restore();
      c.strokeStyle = '#d6363b'; c.lineWidth = 4; c.beginPath(); c.moveTo(28, 40); c.quadraticCurveTo(32, 54, 24, 60); c.moveTo(30, 42); c.quadraticCurveTo(40, 52, 40, 62); c.stroke();
      ell(c, 29, 42, 5, 4); st(c, '#c62a2e', 2);
    } break;
    case 'joben': if (F) {
      c.save(); c.translate(-6, -46); c.rotate(-0.1);
      c.beginPath(); c.ellipse(0, 0, 40, 7, 0, 0, TAU); st(c, '#22222a');
      c.beginPath(); c.moveTo(-24, -2); c.lineTo(-22, -58); c.quadraticCurveTo(0, -64, 22, -58); c.lineTo(24, -2); c.quadraticCurveTo(0, 4, -24, -2); c.closePath(); st(c, lin(c, -60, 0, '#3a3a46', '#2b2b33'));
      c.beginPath(); c.moveTo(-23, -14); c.quadraticCurveTo(0, -10, 23, -14); c.lineTo(23.5, -4); c.quadraticCurveTo(0, 0, -23.5, -4); c.closePath(); st(c, '#c8102e', 1.8);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-16, -54, 5, 36);
      c.restore();
    } break;
    case 'voal':
      if (!F) { // voalul cade pe spate, transparent
        c.save(); c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(-8, -50); c.bezierCurveTo(-60, -50, -96, 20, -92, 96); c.quadraticCurveTo(-60, 104, -26, 92); c.bezierCurveTo(-40, 40, -20, -20, 10, -46); c.closePath();
        c.fillStyle = lin(c, -50, 100, '#ffffff', '#ffe6ef'); c.fill(); c.globalAlpha = 1; c.lineWidth = 1.6; c.strokeStyle = 'rgba(74,42,34,0.5)'; c.stroke(); c.restore();
      } else { for (let i = 0; i < 5; i++) { const a = Math.PI * (1.2 + i * 0.12); flower(c, -8 + Math.cos(a) * 50, -16 + Math.sin(a) * 36, 4.6, i % 2 ? '#ffd6e4' : '#ffffff'); } }
      break;
    case 'cowboy': if (F) {
      c.beginPath(); c.moveTo(-74, -38); c.quadraticCurveTo(-70, -50, -54, -46); c.quadraticCurveTo(-4, -36, 48, -48); c.quadraticCurveTo(66, -52, 70, -40); c.quadraticCurveTo(10, -24, -74, -38); c.closePath(); st(c, lin(c, -52, -30, '#d39a63', '#99602f'));
      c.beginPath(); c.moveTo(-38, -44); c.bezierCurveTo(-40, -86, -14, -76, -6, -84); c.bezierCurveTo(4, -76, 30, -88, 30, -46); c.quadraticCurveTo(-4, -40, -38, -44); c.closePath(); st(c, lin(c, -88, -44, '#c58a52', '#b07a45'));
      c.beginPath(); c.moveTo(-38, -52); c.quadraticCurveTo(-4, -46, 30, -54); c.lineTo(30, -47); c.quadraticCurveTo(-4, -40, -38, -45); c.closePath(); st(c, '#5a3018', 1.8);
      starPath(c, 14, -50, 3.4, 1.5, 5); c.fillStyle = '#ffd23f'; c.fill();
    } break;
    case 'casca': if (F) {
      c.beginPath(); c.moveTo(-50, -26); c.quadraticCurveTo(0, -38, 60, -28); c.quadraticCurveTo(62, -22, 56, -22); c.quadraticCurveTo(0, -30, -50, -20); c.closePath(); st(c, '#f2a91c');
      c.beginPath(); c.moveTo(-42, -28); c.bezierCurveTo(-46, -78, 34, -82, 40, -30); c.quadraticCurveTo(0, -36, -42, -28); c.closePath(); st(c, lin(c, -78, -30, '#ffe27a', '#ffd54a'));
      c.beginPath(); c.moveTo(-6, -76); c.quadraticCurveTo(0, -54, -2, -32); c.lineWidth = 5; c.strokeStyle = '#f2a91c'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; ell(c, -18, -58, 10, 4, -0.5); c.fill();
    } break;
    case 'agrafa': if (F) { // agrafa-capsuna langa ureche
      c.save(); c.translate(-36, -34); c.rotate(-0.6);
      c.fillStyle = '#f2c94c'; c.fillRect(-10, -2, 20, 4);
      c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(12, -12, 12, 4, 0, 12); c.bezierCurveTo(-12, 4, -12, -12, 0, -12); st(c, lin(c, -12, 12, '#ff6b6b', '#e03b3b'), 2);
      c.fillStyle = '#fff3b0'; for (const [x, y] of [[-4, -4], [3, -2], [-1, 3], [4, 5]]) { ell(c, x, y, 1, 1.4); c.fill(); }
      c.beginPath(); c.moveTo(-6, -11); c.lineTo(0, -16); c.lineTo(6, -11); c.lineTo(0, -9); c.closePath(); st(c, '#5bbf5b', 1.4);
      c.restore();
    } break;
    case 'bereta': if (F) { // bereta lasata pe o parte
      c.save(); c.translate(-6, -48); c.rotate(-0.22);
      c.beginPath(); c.ellipse(0, -4, 46, 15, 0, 0, TAU); st(c, lin(c, -20, 10, '#e5566c', '#b8304a'));
      c.beginPath(); c.moveTo(-30, 4); c.quadraticCurveTo(0, 12, 34, 4); c.lineWidth = 3; c.strokeStyle = '#b8304a'; c.stroke();
      c.beginPath(); c.moveTo(-2, -18); c.lineTo(0, -26); c.lineWidth = 3; c.strokeStyle = O; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; ell(c, -14, -10, 14, 4, -0.1); c.fill();
      c.restore();
    } break;
  }
  void t;
}

// ======================================================================= fata (coordonatele capului)
export function sideFaceWear(c: C, id: string, t: number) {
  const ex = 32, ey = -6;
  const arm = (x: number, col = O) => { c.strokeStyle = col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, ey - 3); c.quadraticCurveTo(-4, -16, -14, -20); c.stroke(); };
  switch (id) {
    case 'hearts': { arm(ex - 14, '#d93a5b'); heartPath(c, ex + 2, ey + 5, 17); c.fillStyle = 'rgba(255,110,150,0.6)'; c.fill(); c.lineWidth = 2.8; c.strokeStyle = '#d93a5b'; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; ell(c, ex - 4, ey - 3, 3, 2, -0.5); c.fill(); break; }
    case 'stele': { arm(ex - 12, '#c77dff'); starPath(c, ex + 1, ey, 15, 7, 5, t * 0.5); c.fillStyle = 'rgba(210,160,255,0.5)'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#c77dff'; c.stroke(); break; }
    case 'shades': {
      arm(ex - 13, '#2b2b33');
      c.beginPath(); c.moveTo(ex - 14, ey - 9); c.lineTo(ex + 16, ey - 11); c.quadraticCurveTo(ex + 17, ey + 9, ex + 2, ey + 10); c.quadraticCurveTo(ex - 14, ey + 9, ex - 14, ey - 9); c.closePath();
      const g = c.createLinearGradient(0, ey - 11, 0, ey + 10); g.addColorStop(0, '#4a4a58'); g.addColorStop(1, '#15151b'); c.fillStyle = g; c.fill(); c.lineWidth = 2.8; c.strokeStyle = '#111116'; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(ex - 6, ey + 4); c.lineTo(ex + 2, ey - 6); c.moveTo(ex + 2, ey + 6); c.lineTo(ex + 8, ey - 2); c.stroke();
      break;
    }
    case 'ochelari': { arm(ex - 13, '#6b4423'); ell(c, ex + 1, ey, 14, 14); c.fillStyle = 'rgba(220,240,255,0.25)'; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#6b4423'; c.stroke(); break; }
    case 'monoclu': { ell(c, ex + 1, ey, 13, 13); c.lineWidth = 2.6; c.strokeStyle = '#c9a227'; c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex - 6, ey + 12); c.quadraticCurveTo(ex - 14, ey + 34, ex - 2, ey + 48); c.stroke(); break; }
    case 'mustata': {
      c.save(); c.translate(52, 14);
      c.beginPath(); c.moveTo(6, -2); c.bezierCurveTo(2, -8, -12, -6, -18, 2); c.bezierCurveTo(-22, 8, -16, 12, -14, 6); c.bezierCurveTo(-10, 2, -2, 4, 6, 2); c.closePath(); st(c, '#4a2a1a', 1.6);
      c.beginPath(); c.moveTo(6, -2); c.bezierCurveTo(10, -6, 16, -2, 16, 4); c.bezierCurveTo(14, 2, 10, 2, 6, 2); c.closePath(); st(c, '#4a2a1a', 1.6);
      c.restore(); break;
    }
  }
}

// ======================================================================= gat (coordonatele capului, sub barbie)
/** papionul din profil: o aripioara vazuta pe langa barbie */
export function bowtieSide(c: C, col1 = '#7db4ff', col2 = '#3f73da') {
  c.save(); c.translate(30, 50); c.rotate(0.15);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -11, 15, -8); c.quadraticCurveTo(18, 0, 15, 8); c.quadraticCurveTo(6, 11, 0, 0); c.closePath();
  c.fillStyle = lin(c, -10, 10, col1, col2); c.fill(); c.lineWidth = 2.6; c.strokeStyle = O; c.stroke();
  c.beginPath(); c.roundRect(-4, -5, 8, 10, 3); c.fillStyle = col2; c.fill(); c.lineWidth = 2.4; c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.6)'; ell(c, 10, -4, 3, 1.5, 0.2); c.fill();
  c.restore();
}
export function sideNeckWear(c: C, id: string, t: number) {
  switch (id) {
    case 'bowtie': bowtieSide(c, '#f0505c', '#b81c2c'); break;
    case 'scarf': {
      const sw = Math.sin(t * 3) * 2.5;
      // capatul din spate, care flutura
      c.beginPath(); c.moveTo(-22, 40); c.quadraticCurveTo(-46, 44 + sw, -62, 34 + sw); c.lineTo(-60, 46 + sw); c.quadraticCurveTo(-44, 56, -20, 50); c.closePath(); st(c, lin(c, 34, 56, '#6fd0f5', '#3fb0e0'));
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-44, 42 + sw * 0.6); c.lineTo(-42, 52 + sw * 0.4); c.stroke();
      // inelul din jurul gatului
      c.beginPath(); c.moveTo(-26, 36); c.quadraticCurveTo(10, 52, 46, 34); c.quadraticCurveTo(50, 42, 44, 48); c.quadraticCurveTo(8, 64, -24, 50); c.quadraticCurveTo(-30, 44, -26, 36); c.closePath(); st(c, lin(c, 34, 60, '#6fd0f5', '#3fb0e0'));
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; for (const x of [-12, 8, 28]) { c.beginPath(); c.moveTo(x, 42 + (x > 10 ? -2 : 1)); c.lineTo(x + 1, 55 - (x > 10 ? 3 : 0)); c.stroke(); }
      // capatul din fata, cu franjuri
      c.beginPath(); c.moveTo(30, 46); c.quadraticCurveTo(40, 60, 36, 80); c.lineTo(24, 80); c.quadraticCurveTo(26, 62, 20, 50); c.closePath(); st(c, lin(c, 46, 80, '#6fd0f5', '#3fb0e0'));
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(23, 64); c.lineTo(37, 64); c.stroke();
      c.strokeStyle = '#3fb0e0'; c.lineWidth = 1.8; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(25 + i * 2.6, 80); c.lineTo(25 + i * 2.6, 86); c.stroke(); }
      break;
    }
    case 'bandana': {
      c.beginPath(); c.moveTo(-8, 44); c.quadraticCurveTo(20, 52, 46, 40); c.lineTo(34, 70); c.closePath(); st(c, lin(c, 40, 70, '#ee4b55', '#c4232f'));
      c.fillStyle = '#ffffff'; for (const [x, y] of [[14, 52], [26, 50], [22, 60], [32, 58], [6, 48]]) { ell(c, x, y, 1.6, 1.6); c.fill(); }
      break;
    }
    case 'colier': {
      for (let i = 0; i <= 9; i++) { const k = i / 9, x = -10 + k * 52, y = 44 + Math.sin(k * Math.PI) * 9; ell(c, x, y, 3.2, 3.2); c.fillStyle = '#fffaf2'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(74,42,34,0.7)'; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.9)'; ell(c, x - 1, y - 1, 1, 1); c.fill(); }
      c.beginPath(); c.moveTo(20, 54); c.lineTo(24, 60); c.lineTo(20, 66); c.lineTo(16, 60); c.closePath(); st(c, '#ff8fb0', 1.4);
      break;
    }
  }
}
/** martisorul prins in piept, in fata */
export function sidePin(c: C, id: string, t: number) { c.save(); c.translate(30, -38); c.scale(1.6, 1.6); c.translate(12, 16); drawPin(c, id, t); c.restore(); }
