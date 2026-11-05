// Desenarea mobilei, peretilor si a podelei in stil izometric "sticker".
import { iso, isoBox, boxOf, poly, tilePath, shade, TW, TH, type Pt } from './iso';
import { type Furn, type Wall } from './map';
import { heartPath } from '../char/draw';
import { drawBuildType } from './build';
import { drawForestType } from './forest';
import { drawVillageType } from './village';
import { drawCityType } from './city';
import { drawCountryType } from './country';
import { drawStoryType } from './season';

const O = '#3a2a22';

function ell(ctx: CanvasRenderingContext2D, p: Pt, rx: number, ry: number, fill: string, stroke = true) {
  ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke(); }
}
function rhombDecal(ctx: CanvasRenderingContext2D, gx: number, gy: number, w: number, d: number, fill: string, z = 0.5) {
  tilePath(ctx, gx, gy, w, d, z); ctx.fillStyle = fill; ctx.fill();
}

export interface FurnState { depleted?: Record<string, boolean>; tvBroken?: boolean; tubDirty?: boolean; fridgeDirty?: boolean; dishesDirty?: boolean; lampOn?: boolean; tvOn?: boolean; clogged?: boolean; bathFoam?: number; cooking?: boolean; crops?: number[]; night?: number; }

export function drawFurn(ctx: CanvasRenderingContext2D, f: Furn, t: number, st: FurnState) {
  const { gx, gy, w, d } = f;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (drawVillageType(ctx, f, t, st.night ?? 0, (globalThis as any).__villageOwned ?? {})) return;
  if (drawCityType(ctx, f, t, st.night ?? 0, (globalThis as any).__villageOwned ?? {})) return;
  if (drawForestType(ctx, f, t, !!st.depleted?.[f.id])) return;
  if (drawStoryType(ctx, f, t)) return;
  if (drawCountryType(ctx, f, t, st.night ?? 0)) return;
  if (drawBuildType(ctx, f, t, st.night ?? 0, !!st.depleted?.[f.id])) return;
  switch (f.type) {
    case 'bed': {
      isoBox(ctx, gx, gy, w, 0.18, 46, boxOf('#c98e5f'));             // tablia
      const hb = iso(gx + 1, gy + 0.09, 38); heartPath(ctx, hb.x, hb.y, 7); ctx.fillStyle = '#ff7aa2'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke();
      isoBox(ctx, gx, gy + 0.18, w, d - 0.18, 14, boxOf('#c98e5f'));   // cadru
      isoBox(ctx, gx + 0.06, gy + 0.22, w - 0.12, d - 0.3, 9, boxOf('#fffaf4'), 14); // saltea
      isoBox(ctx, gx + 0.12, gy + 0.3, 0.82, 0.55, 7, boxOf('#ffffff'), 23);   // perne
      isoBox(ctx, gx + 1.06, gy + 0.3, 0.82, 0.55, 7, boxOf('#ffe3ec'), 23);
      isoBox(ctx, gx + 0.04, gy + 1.05, w - 0.08, d - 1.11, 4, boxOf('#ff9ab8'), 23); // plapuma
      // inimioare pe plapuma
      for (const [a, b] of [[0.5, 1.6], [1.4, 2.2], [0.7, 2.6], [1.5, 1.35]]) {
        const p = iso(gx + a, gy + b, 27.5); heartPath(ctx, p.x, p.y + 2, 4); ctx.fillStyle = '#fff0f5'; ctx.fill();
      }
      break;
    }
    case 'nightstand': {
      isoBox(ctx, gx + 0.15, gy + 0.15, 0.7, 0.7, 26, boxOf('#d9a273'));
      const p = iso(gx + 0.5, gy + 0.5, 26);
      ctx.fillStyle = '#e9e3da'; ctx.strokeStyle = O; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(p.x - 2, p.y - 18, 4, 18, 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - 11, p.y - 16); ctx.lineTo(p.x + 11, p.y - 16); ctx.lineTo(p.x + 7, p.y - 32); ctx.lineTo(p.x - 7, p.y - 32); ctx.closePath();
      ctx.fillStyle = st.lampOn ? '#fff3a8' : '#ffd1dc'; ctx.fill(); ctx.stroke();
      if (st.lampOn && (st.night ?? 0) > 0.2) {
        const g = ctx.createRadialGradient(p.x, p.y - 20, 4, p.x, p.y - 20, 110);
        g.addColorStop(0, 'rgba(255,230,140,0.45)'); g.addColorStop(1, 'rgba(255,230,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 20, 110, 0, 7); ctx.fill();
      }
      break;
    }
    case 'wardrobe': {
      isoBox(ctx, gx + 0.05, gy + 0.08, 0.85, 0.9, 82, boxOf('#e0b083'));
      // usi pe fata dreapta (+x)
      const a = iso(gx + 0.9, gy + 0.53, 6), b = iso(gx + 0.9, gy + 0.53, 76);
      ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (const k of [0.43, 0.63]) { const h = iso(gx + 0.9, gy + k, 42); ell(ctx, h, 2.2, 2.2, '#ffd23f'); }
      break;
    }
    case 'rug': {
      rhombDecal(ctx, gx + 0.1, gy + 0.1, w - 0.2, d - 0.2, f.color ?? '#ffb6c9');
      ctx.strokeStyle = shade(f.color ?? '#ffb6c9', 0.8); ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      tilePath(ctx, gx + 0.25, gy + 0.25, w - 0.5, d - 0.5, 0.6); ctx.stroke(); ctx.setLineDash([]);
      const c = iso(gx + w / 2, gy + d / 2, 0.6); heartPath(ctx, c.x, c.y + 3, 8); ctx.fillStyle = '#ffffffaa'; ctx.fill();
      break;
    }
    case 'plant': {
      isoBox(ctx, gx + 0.3, gy + 0.3, 0.4, 0.4, 16, boxOf('#e07a5f'));
      const c = iso(gx + 0.5, gy + 0.5, 16);
      const sway = Math.sin(t * 1.5 + gx) * 2;
      for (const [dx, dy, r] of [[-8, -10, 9], [8, -12, 9], [0, -22, 10], [-4, -30, 7], [6, -28, 7]]) ell(ctx, { x: c.x + dx + sway * (dy / -30), y: c.y + dy }, r * 0.8, r, '#7cc576');
      break;
    }
    case 'toilet': {
      isoBox(ctx, gx + 0.22, gy + 0.08, 0.56, 0.24, 40, boxOf('#ffffff'));    // rezervor
      isoBox(ctx, gx + 0.3, gy + 0.3, 0.4, 0.45, 16, boxOf('#f4f6f8'));       // picior
      const c = iso(gx + 0.5, gy + 0.55, 18);
      ell(ctx, c, 15, 9, '#ffffff');
      ell(ctx, { x: c.x, y: c.y + 0.5 }, 10, 5.5, st.clogged ? '#8b6b3e' : '#bfe6ff', false);
      if (st.clogged) {
        for (let i = 0; i < 3; i++) { // muste
          const a = t * 5 + i * 2.1; const p = { x: c.x + Math.cos(a) * 14, y: c.y - 22 + Math.sin(a * 1.3) * 6 };
          ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.ellipse(p.x - 1.5, p.y - 2, 1.6, 1, 0, 0, 7); ctx.fill();
        }
        // linii de miros
        ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); const x = c.x + i * 7; ctx.moveTo(x, c.y - 6); ctx.bezierCurveTo(x - 4, c.y - 14, x + 4, c.y - 18, x, c.y - 26 - Math.sin(t * 3 + i) * 3); ctx.stroke(); }
      }
      const btn = iso(gx + 0.5, gy + 0.2, 40); ell(ctx, btn, 3, 1.8, '#cfd8dc');
      break;
    }
    case 'bathtub': {
      isoBox(ctx, gx + 0.05, gy + 0.08, w - 0.1, d - 0.14, 26, boxOf('#ffffff'));
      tilePath(ctx, gx + 0.18, gy + 0.2, w - 0.36, d - 0.38, 26.5); ctx.fillStyle = st.tubDirty ? '#a0845a' : '#9fd8f5'; ctx.fill();
      if (st.tubDirty) { stink(ctx, iso(gx + w / 2, gy + d / 2, 30), t); break; }
      const foam = st.bathFoam ?? 0.3;
      for (let i = 0; i < 14 * foam + 3; i++) {
        const u = (i * 0.37) % 1, v = (i * 0.61) % 1;
        const p = iso(gx + 0.25 + u * (w - 0.5), gy + 0.25 + v * (d - 0.5), 28 + Math.sin(t * 2 + i) * 1.5);
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (i % 3) * 2, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#cbe7f5'; ctx.lineWidth = 1; ctx.stroke();
      }
      const fa = iso(gx + 0.3, gy + 0.12, 34);
      ctx.strokeStyle = '#9aa5ad'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fa.x, fa.y + 6); ctx.quadraticCurveTo(fa.x + 6, fa.y - 6, fa.x + 12, fa.y + 2); ctx.stroke();
      // ratusca
      const dk = iso(gx + 1.3, gy + 0.5, 30 + Math.sin(t * 2) * 1.5);
      ell(ctx, dk, 7, 5, '#ffd23f'); ell(ctx, { x: dk.x + 4, y: dk.y - 6 }, 4, 4, '#ffd23f');
      ctx.fillStyle = '#ff8c42'; ctx.beginPath(); ctx.moveTo(dk.x + 7, dk.y - 6); ctx.lineTo(dk.x + 11, dk.y - 5); ctx.lineTo(dk.x + 7, dk.y - 4); ctx.fill();
      break;
    }
    case 'sink': {
      isoBox(ctx, gx + 0.35, gy + 0.35, 0.3, 0.3, 22, boxOf('#f4f6f8'));
      const c = iso(gx + 0.5, gy + 0.5, 24); ell(ctx, c, 16, 9, '#ffffff'); ell(ctx, { x: c.x, y: c.y + 1 }, 10, 5, '#cfeaf7', false);
      const m = iso(gx + 0.5, gy + 0.5, 24);
      ctx.fillStyle = '#ff9ab8'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(m.x + 8, m.y - 16, 4, 12, 2); ctx.fill(); ctx.stroke(); // periuta
      break;
    }
    case 'washer': {
      isoBox(ctx, gx + 0.08, gy + 0.1, 0.84, 0.84, 42, boxOf('#fbfbfb'));
      const c = iso(gx + 0.5, gy + 0.94, 20); ell(ctx, c, 11, 9, '#a9d6f5');
      ctx.save(); ctx.beginPath(); ctx.ellipse(c.x, c.y, 9, 7, 0, 0, 7); ctx.clip();
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.arc(c.x + Math.cos(t * 4) * 4, c.y + Math.sin(t * 4) * 3, 4, 0, 7); ctx.fill(); ctx.restore();
      break;
    }
    case 'fridge': {
      isoBox(ctx, gx + 0.08, gy + 0.08, 0.84, 0.84, 76, boxOf('#eaf6ff'));
      const a = iso(gx + 0.08, gy + 0.92, 50), b = iso(gx + 0.92, gy + 0.92, 50);
      ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (const z of [60, 36]) { const h = iso(gx + 0.8, gy + 0.92, z); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(h.x, h.y - 6); ctx.lineTo(h.x, h.y + 6); ctx.stroke(); }
      if (st.fridgeDirty) stink(ctx, iso(gx + 0.5, gy + 0.9, 70), t);
      const mg = iso(gx + 0.4, gy + 0.92, 64); heartPath(ctx, mg.x, mg.y, 5); ctx.fillStyle = '#ff7aa2'; ctx.fill();
      const mg2 = iso(gx + 0.3, gy + 0.92, 30); ell(ctx, mg2, 4, 4, '#ffd23f');
      break;
    }
    case 'stove': {
      isoBox(ctx, gx + 0.08, gy + 0.08, 0.84, 0.84, 32, { top: '#4a4a52', left: '#f2f2f2', right: '#dedede' });
      for (const [u, v] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
        const p = iso(gx + u, gy + v, 32); ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 3.6, 0, 0, 7);
        ctx.strokeStyle = st.cooking ? '#ff6b3d' : '#888'; ctx.lineWidth = 2; ctx.stroke();
      }
      const ov = iso(gx + 0.5, gy + 0.92, 16); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.roundRect(ov.x - 12, ov.y - 8, 24, 12, 3); ctx.fill();
      if (st.cooking) {
        const p = iso(gx + 0.5, gy + 0.5, 32);
        ctx.fillStyle = '#c0c6cc'; ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(p.x - 12, p.y - 14, 24, 14, 4); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x - 6 + i * 6, p.y - 18 - k * 30, 4 + k * 6, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'counter': {
      isoBox(ctx, gx + 0.08, gy + 0.08, 0.84, 0.84, 32, { top: '#f6e7d3', left: '#d9a273', right: '#c48b5c' });
      const p = iso(gx + 0.5, gy + 0.5, 32);
      for (let i = 0; i < (st.dishesDirty ? 6 : 3); i++) { ell(ctx, { x: p.x + (st.dishesDirty ? (i % 2) * 3 : 0), y: p.y - i * 3 }, 11, 5, '#ffffff'); if (st.dishesDirty) { ctx.fillStyle = '#a0784a'; ctx.beginPath(); ctx.arc(p.x - 4 + (i % 3) * 3, p.y - i * 3, 2, 0, 7); ctx.fill(); } }
      if (st.dishesDirty) stink(ctx, { x: p.x, y: p.y - 14 }, t);
      break;
    }
    case 'table': {
      for (const [u, v] of [[0.15, 0.2], [w - 0.25, 0.2], [0.15, d - 0.3], [w - 0.25, d - 0.3]]) isoBox(ctx, gx + u, gy + v, 0.1, 0.1, 22, boxOf('#c98e5f'));
      isoBox(ctx, gx + 0.05, gy + 0.08, w - 0.1, d - 0.16, 5, boxOf('#e7b98a'), 22);
      tilePath(ctx, gx + 0.3, gy + 0.2, w - 0.6, d - 0.4, 27.2); ctx.fillStyle = '#ffe1ea'; ctx.fill();
      const c = iso(gx + w / 2, gy + d / 2, 27); // tort
      ctx.fillStyle = '#fff8ef'; ctx.strokeStyle = O; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(c.x - 10, c.y - 14, 20, 12, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.roundRect(c.x - 10, c.y - 16, 20, 5, 3); ctx.fill(); ctx.stroke();
      ell(ctx, { x: c.x, y: c.y - 19 }, 3, 3, '#e63946');
      break;
    }
    case 'sofa': {
      // canapeaua cu spatarul spre +x (privim spre televizorul de pe peretele stang)
      const col = '#8ec5ff';
      isoBox(ctx, gx + 0.1, gy, 0.8, 0.22, 28, boxOf(shade(col, 0.95)));
      isoBox(ctx, gx + 0.1, gy + 0.22, 0.75, d - 0.44, 16, boxOf(col));
      isoBox(ctx, gx + 0.72, gy + 0.22, 0.22, d - 0.44, 38, boxOf(shade(col, 0.92)));
      isoBox(ctx, gx + 0.1, gy + d - 0.22, 0.8, 0.22, 28, boxOf(shade(col, 0.95)));
      for (const v of [0.7, 1.3]) { const p = iso(gx + 0.5, gy + v, 18); ctx.fillStyle = '#ffe1ea'; ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 9, 7, 0, 0, 7); ctx.fill(); ctx.stroke(); heartPath(ctx, p.x, p.y - 5, 3.5); ctx.fillStyle = '#ff7aa2'; ctx.fill(); }
      break;
    }
    case 'tv': {
      isoBox(ctx, gx + 0.05, gy + 0.15, 0.45, d - 0.3, 22, boxOf('#d9a273'));
      // ecran: plan vertical la gx+0.25, cu fata spre +x
      const x = gx + 0.28; const a = iso(x, gy + 0.2, 26), b = iso(x, gy + d - 0.2, 26), c = iso(x, gy + d - 0.2, 66), e = iso(x, gy + 0.2, 66);
      poly(ctx, [a, b, c, e]); ctx.fillStyle = '#2b2b33'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2.5; ctx.stroke();
      const a2 = iso(x + 0.01, gy + 0.3, 30), b2 = iso(x + 0.01, gy + d - 0.3, 30), c2 = iso(x + 0.01, gy + d - 0.3, 62), e2 = iso(x + 0.01, gy + 0.3, 62);
      poly(ctx, [a2, b2, c2, e2]);
      if (st.tvBroken) {
        ctx.fillStyle = '#555'; ctx.fill(); ctx.save(); ctx.clip();
        for (let i = 0; i < 40; i++) { const v = Math.floor(Math.random() * 255); ctx.fillStyle = `rgb(${v},${v},${v})`; const q = iso(x + 0.01, gy + 0.3 + Math.random() * (d - 0.6), 30 + Math.random() * 32); ctx.fillRect(q.x - 2, q.y - 1, 4, 3); }
        ctx.restore();
      } else if (st.tvOn) {
        const hue = (t * 40) % 360; ctx.fillStyle = `hsl(${hue},70%,72%)`; ctx.fill();
        const m = iso(x + 0.01, gy + d / 2, 46); heartPath(ctx, m.x, m.y + 4, 6 + Math.sin(t * 6) * 1.5); ctx.fillStyle = '#fff'; ctx.fill();
      } else { ctx.fillStyle = '#3b4250'; ctx.fill(); const gl = iso(x + 0.01, gy + 0.6, 56); ctx.fillStyle = '#ffffff33'; ctx.fillRect(gl.x - 4, gl.y - 2, 10, 4); }
      break;
    }
    case 'bookshelf': {
      isoBox(ctx, gx + 0.05, gy + 0.08, 0.4, 0.84, 66, boxOf('#c98e5f'));
      const cols = ['#ff7aa2', '#7ab8ff', '#ffd23f', '#7cc576', '#c77dff'];
      for (let s = 0; s < 3; s++) for (let i = 0; i < 5; i++) {
        const z = 8 + s * 20; const v = 0.15 + i * 0.14;
        const p = iso(gx + 0.46, gy + v, z), q = iso(gx + 0.46, gy + v + 0.1, z), r = iso(gx + 0.46, gy + v + 0.1, z + 14 + (i % 2) * 2), u = iso(gx + 0.46, gy + v, z + 14 + (i % 2) * 2);
        poly(ctx, [p, q, r, u]); ctx.fillStyle = cols[(i + s) % 5]; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1; ctx.stroke();
      }
      break;
    }
    case 'tree': {
      isoBox(ctx, gx + 0.4, gy + 0.4, 0.2, 0.2, 40, boxOf('#a0703f'));
      const c = iso(gx + 0.5, gy + 0.5, 40);
      const sw = Math.sin(t * 0.8 + gx * 2) * 2;
      for (const [dx, dy, r, col] of [[-18, -6, 22, '#6cbf6c'], [18, -8, 22, '#6cbf6c'], [0, -26, 26, '#7fd07f'], [-10, -44, 18, '#8fdc8f'], [12, -42, 18, '#8fdc8f']] as const) ell(ctx, { x: c.x + dx + sw, y: c.y + dy }, r, r * 0.9, col);
      for (const [dx, dy] of [[-12, -20], [14, -30], [2, -48]]) ell(ctx, { x: c.x + dx + sw, y: c.y + dy }, 3.5, 3.5, '#ff7aa2');
      break;
    }
    case 'bush': {
      const c = iso(gx + 0.5, gy + 0.5, 0);
      for (const [dx, dy, r] of [[-10, -8, 12], [10, -8, 12], [0, -18, 13]]) ell(ctx, { x: c.x + dx, y: c.y + dy }, r, r * 0.85, '#79c879');
      ell(ctx, { x: c.x - 4, y: c.y - 16 }, 2.5, 2.5, '#fff');
      break;
    }
    case 'plot': {
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
        const idx = i * d + j; const stage = st.crops?.[idx] ?? 0;
        const p = iso(gx + i + 0.5, gy + j + 0.5, 0);
        ctx.strokeStyle = '#7a5532'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x - 14, p.y - 2); ctx.lineTo(p.x + 14, p.y + 2); ctx.stroke();
        if (stage >= 1) { ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 6 - stage * 3); ctx.stroke(); ell(ctx, { x: p.x - 4, y: p.y - 6 - stage * 2 }, 4, 2.5, '#7cc576', false); ell(ctx, { x: p.x + 4, y: p.y - 7 - stage * 2 }, 4, 2.5, '#7cc576', false); }
        if (stage >= 3) ell(ctx, { x: p.x, y: p.y - 18 }, 6, 6, '#ff4d6d');
      }
      break;
    }
    case 'bench': {
      // banca de parc: picioare de fier, sezut din scanduri, spatar cu doua scanduri (in spate, -y)
      const iron = boxOf('#4a4f5c');
      for (const u of [0.18, w - 0.26]) { isoBox(ctx, gx + u, gy + 0.72, 0.08, 0.08, 12, iron); isoBox(ctx, gx + u, gy + 0.22, 0.08, 0.08, 40, iron); }
      for (let i = 0; i < 3; i++) isoBox(ctx, gx + 0.08, gy + 0.26 + i * 0.19, w - 0.16, 0.16, 3, { top: i % 2 ? '#e7b98a' : '#efc697', left: '#c98e5f', right: '#b5794a' }, 11, 1.5);
      for (const z of [22, 32]) isoBox(ctx, gx + 0.08, gy + 0.16, w - 0.16, 0.07, 7, { top: '#efc697', left: '#d9a273', right: '#b5794a' }, z, 1.5);
      // cotierele de fier
      for (const u of [0.14, w - 0.22]) isoBox(ctx, gx + u, gy + 0.24, 0.12, 0.56, 3, iron, 21, 1.5);
      break;
    }
    case 'mailbox': {
      isoBox(ctx, gx + 0.45, gy + 0.45, 0.1, 0.1, 30, boxOf('#a0703f'));
      isoBox(ctx, gx + 0.25, gy + 0.3, 0.5, 0.4, 16, boxOf('#ff7aa2'), 30);
      const fl = iso(gx + 0.75, gy + 0.5, 50); ctx.fillStyle = '#ffd23f'; ctx.fillRect(fl.x, fl.y - 6, 8, 6); ctx.strokeStyle = O; ctx.strokeRect(fl.x, fl.y - 6, 8, 6);
      break;
    }
    case 'flowers': {
      for (let i = 0; i < 6; i++) {
        const p = iso(gx + 0.2 + (i * 0.37) % 0.7, gy + 0.2 + (i * 0.53) % 0.7, 0);
        ctx.strokeStyle = '#3d8b3d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 8); ctx.stroke();
        ell(ctx, { x: p.x, y: p.y - 10 }, 3.5, 3.5, ['#ff7aa2', '#ffd23f', '#c77dff', '#fff'][i % 4], false);
      }
      break;
    }
    case 'doormat': {
      rhombDecal(ctx, gx + 0.15, gy + 0.15, 0.7, 0.7, '#c98e5f');
      const c = iso(gx + 0.5, gy + 0.5, 0.6); heartPath(ctx, c.x, c.y + 2, 5); ctx.fillStyle = '#ff7aa2'; ctx.fill();
      break;
    }
    case 'lamp': break;
  }
}

export function drawWall(ctx: CanvasRenderingContext2D, wl: Wall, t: number, night: number) {
  const { x, y, h } = wl;
  const a = iso(x, y, 0), b = wl.dir === 'x' ? iso(x + 1, y, 0) : iso(x, y + 1, 0);
  const pts = [a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }];
  const base = wl.color;
  const fill = wl.dir === 'x' ? shade(base, 0.93) : base;
  poly(ctx, pts); ctx.fillStyle = fill; ctx.fill();
  if (wl.kind === 'back') {
    // tapet: buline / inimioare
    ctx.save(); poly(ctx, pts); ctx.clip();
    ctx.fillStyle = shade(base, 0.86);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      const u = (i + 0.5) / 3, zz = 12 + j * 20 + (i % 2) * 10;
      const p = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - zz };
      heartPath(ctx, p.x, p.y, 3); ctx.fill();
    }
    // plinta
    ctx.fillStyle = shade(base, 0.75);
    poly(ctx, [a, b, { x: b.x, y: b.y - 8 }, { x: a.x, y: a.y - 8 }]); ctx.fill();
    ctx.restore();
    if (wl.window) {
      const u0 = 0.18, u1 = 0.82, z0 = 28, z1 = 70;
      const P = (u: number, z: number) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - z });
      poly(ctx, [P(u0, z0), P(u1, z0), P(u1, z1), P(u0, z1)]);
      const sky = night > 0.5 ? '#2b3a67' : '#bfe8ff';
      ctx.fillStyle = sky; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke();
      const m1 = P(0.5, z0), m2 = P(0.5, z1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
      if (night > 0.5) { const s = P(0.3, 58); ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, 7); ctx.fill(); }
      else { const cl = P(0.35 + Math.sin(t * 0.1) * 0.05, 52); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cl.x, cl.y, 4, 0, 7); ctx.arc(cl.x + 5, cl.y - 2, 5, 0, 7); ctx.fill(); }
      // perdele
      ctx.fillStyle = '#ffb6c9';
      for (const u of [u0, u1]) { const q = P(u, z1 + 4), r = P(u, z0 - 4); ctx.beginPath(); ctx.ellipse((q.x + r.x) / 2, (q.y + r.y) / 2, 4, (r.y - q.y) / 2 + 2, 0, 0, 7); ctx.fill(); }
    }
    if (wl.door) {
      // usa de la intrare (apartament): toc, usa de lemn, vizor, clanta, numarul
      const P = (u: number, z: number) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - z });
      poly(ctx, [P(0.12, 0), P(0.88, 0), P(0.88, 80), P(0.12, 80)]); ctx.fillStyle = '#f4efe8'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
      poly(ctx, [P(0.2, 0), P(0.8, 0), P(0.8, 74), P(0.2, 74)]); ctx.fillStyle = '#a0703f'; ctx.fill(); ctx.stroke();
      for (const [z0, z1] of [[8, 34], [40, 66]]) { poly(ctx, [P(0.28, z0), P(0.72, z0), P(0.72, z1), P(0.28, z1)]); ctx.strokeStyle = shade('#a0703f', 0.75); ctx.lineWidth = 2; ctx.stroke(); }
      const k = P(0.7, 36); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(k.x, k.y, 3.2, 0, 7); ctx.fill(); ctx.stroke();
      const v = P(0.5, 60); ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.arc(v.x, v.y, 2, 0, 7); ctx.fill();
      const n = P(0.5, 70); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(n.x, n.y, 7, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = O; ctx.font = '800 7px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('14', n.x, n.y + 0.5); ctx.textBaseline = 'alphabetic';
      // lumina de pe scara se vede pe sub usa
      const l0 = P(0.22, 1), l1 = P(0.78, 1); ctx.strokeStyle = night > 0.4 ? '#ffe680' : '#fff4c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l0.x, l0.y); ctx.lineTo(l1.x, l1.y); ctx.stroke();
    }
  }
  poly(ctx, pts); ctx.strokeStyle = O; ctx.lineWidth = 2; ctx.stroke();
  // capacul peretelui (grosime)
  const th = 0.1;
  const c0 = iso(x, y, h), c1 = wl.dir === 'x' ? iso(x + 1, y, h) : iso(x, y + 1, h);
  const c2 = wl.dir === 'x' ? iso(x + 1, y - th, h) : iso(x - th, y + 1, h), c3 = wl.dir === 'x' ? iso(x, y - th, h) : iso(x - th, y, h);
  poly(ctx, [c0, c1, c2, c3]); ctx.fillStyle = shade(base, 1.04); ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke();
}

export { TW, TH };

/** gardul care inconjoara curtea: un segment pe marginea dalei (x,y), de-a lungul lui x sau y */
export function drawYardFence(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 'x' | 'y') {
  const P = (u: number, z: number) => dir === 'x' ? iso(x + u, y, z) : iso(x, y + u, z);
  const wood = '#e7c08f', dark = '#c4935f';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // sipci
  for (const u of [0.25, 0.5, 0.75]) {
    const a = P(u, 0), b = P(u, 26);
    ctx.strokeStyle = O; ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = wood; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.fillStyle = wood; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x - 3.2, b.y); ctx.lineTo(b.x, b.y - 4); ctx.lineTo(b.x + 3.2, b.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // traverse
  for (const z of [9, 19]) {
    const a = P(0, z), b = P(1, z);
    ctx.strokeStyle = O; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // stalpi la capete
  for (const u of [0, 1]) {
    const a = P(u, 0), b = P(u, 32);
    ctx.strokeStyle = O; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.fillStyle = wood; ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 2.2, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
}

/** portita de la intrarea in curte (deschisa), cu arcada cu inimioara */
export function drawYardGate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const L = iso(x, y), R = iso(x + 1, y);
  for (const p of [L, R]) {
    ctx.strokeStyle = O; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 50); ctx.stroke();
    ctx.strokeStyle = '#c4935f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 50); ctx.stroke();
  }
  // arcada
  ctx.strokeStyle = O; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(L.x, L.y - 48); ctx.quadraticCurveTo((L.x + R.x) / 2, Math.min(L.y, R.y) - 76, R.x, R.y - 48); ctx.stroke();
  ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 4; ctx.stroke();
  const m = { x: (L.x + R.x) / 2, y: Math.min(L.y, R.y) - 66 };
  heartPath(ctx, m.x, m.y, 8); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.strokeStyle = O; ctx.lineWidth = 1.5; ctx.stroke();
  // usita deschisa spre interior (o jumatate de gard rotita)
  const a = iso(x + 0.02, y - 0.05, 0), b = iso(x + 0.15, y - 0.55, 0);
  for (const z of [8, 20]) { ctx.strokeStyle = O; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.x, a.y - z); ctx.lineTo(b.x, b.y - z); ctx.stroke(); ctx.strokeStyle = '#e7c08f'; ctx.lineWidth = 2.5; ctx.stroke(); }
}

/** linii de miros + muste (pentru lucrurile murdare din casa) */
export function stink(ctx: CanvasRenderingContext2D, c: Pt, t: number) {
  ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); const x = c.x + i * 7; ctx.moveTo(x, c.y); ctx.bezierCurveTo(x - 4, c.y - 8, x + 4, c.y - 12, x, c.y - 20 - Math.sin(t * 3 + i) * 3); ctx.stroke(); }
  for (let i = 0; i < 2; i++) { const a = t * 5 + i * 2.5; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * 14, c.y - 14 + Math.sin(a * 1.3) * 6, 1.6, 0, 7); ctx.fill(); }
}
