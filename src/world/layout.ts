// Harta lumii mari: o singura lume legata, fara teleportari.
// Coordonatele sunt dale (grid izometric): x creste spre dreapta-jos pe ecran, y spre stanga-jos.
//
//            padurea (nord, in spatele casei)           |  raul  |
//   casa + curtea  ── drumul ──┐                         |  lacul |
//   campurile (sud)            └── pe langa lac ── PODUL ┼────────┼──┐
//                                                                    └── SATUL ── paraul ── ORASUL
//
// Fiecare zona veche (casa, padurea, satul, orasul) e pusa intreaga la locul ei (ORIGIN), cu
// coordonatele ei de acum + offset. Casa ramane la (0,0), deci tot ce era salvat acasa ramane valabil.

export interface Pt { x: number; y: number }

/** marginile lumii [x0, x1) x [y0, y1) */
export const WORLD = { x0: -24, y0: -48, x1: 252, y1: 72 };
export const WORLD_W = WORLD.x1 - WORLD.x0, WORLD_H = WORLD.y1 - WORLD.y0;

/** unde incepe harta veche a fiecarei zone (coltul ei 0,0) */
export const ORIGIN = {
  home: { x: 0, y: 0 },
  forest: { x: 8, y: -37 },
  village: { x: 112, y: 12 },
  city: { x: 190, y: 12 },
} as const;
export type CoreId = keyof typeof ORIGIN;
/** marimea hartilor vechi */
export const CORE_W = 22, CORE_H = 27;
export const at = (o: Pt, x: number, y: number): Pt => ({ x: o.x + x, y: o.y + y });

/** regiunile lumii (pentru "unde sunt?", ambianta, harta). Prima care contine punctul castiga. */
export interface Region { id: string; name: string; icon: string; x0: number; y0: number; x1: number; y1: number }
export const REGIONS: Region[] = [
  { id: 'forest', name: 'Pădurea', icon: '🌲', x0: -24, y0: -48, x1: 64, y1: -8 },
  { id: 'home', name: 'Acasă', icon: '🏡', x0: -8, y0: -8, x1: 44, y1: 34 },
  { id: 'village', name: 'Satul', icon: '🏘️', x0: 98, y0: -8, x1: 150, y1: 54 },
  { id: 'city', name: 'Orașul', icon: '🏙️', x0: 176, y0: -14, x1: 252, y1: 72 },
  { id: 'lake', name: 'Lacul', icon: '🏞️', x0: 44, y0: -8, x1: 98, y1: 35 },
  { id: 'woods', name: 'Pădurea de pe deal', icon: '🌲', x0: 64, y0: -48, x1: 176, y1: -8 },
];
export const COUNTRY: Region = { id: 'country', name: 'Câmpia', icon: '🌾', x0: WORLD.x0, y0: WORLD.y0, x1: WORLD.x1, y1: WORLD.y1 };
export function regionAt(x: number, y: number): Region {
  for (const r of REGIONS) if (x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) return r;
  return COUNTRY;
}
export const REGION_BY_ID: Record<string, Region> = Object.fromEntries([...REGIONS, COUNTRY].map(r => [r.id, r]));

// ------------------------------------------------------------------ drumurile
/** dreptunghiurile de drum (dale) */
export interface RoadRect { x0: number; y0: number; x1: number; y1: number; kind: 'road' | 'asphalt' | 'path' }
export const ROADS: RoadRect[] = [
  { x0: -13, y0: 24, x1: 46, y1: 26, kind: 'road' },        // de la catunul vecin (vest), pe la casa, spre est
  { x0: 44, y0: 24, x1: 46, y1: 38, kind: 'road' },         // coboara pe langa lac
  { x0: 44, y0: 36, x1: 98, y1: 38, kind: 'road' },         // pe malul lacului, peste pod
  { x0: 96, y0: 24, x1: 98, y1: 38, kind: 'road' },         // urca spre sat
  { x0: 96, y0: 24, x1: 112, y1: 26, kind: 'road' },        // intrarea in sat
  { x0: 134, y0: 24, x1: 190, y1: 26, kind: 'asphalt' },    // soseaua spre oras
  { x0: 212, y0: 24, x1: WORLD.x1, y1: 26, kind: 'asphalt' }, // bulevardul spre est
  { x0: 19, y0: -10, x1: 21, y1: 0, kind: 'path' },         // drumeagul spre padure
];

/** drumul principal (linia din mijloc), pe care merg vehiculele */
export const MAIN_ROAD: Pt[] = [{ x: -20, y: 25 }, { x: 45, y: 25 }, { x: 45, y: 37 }, { x: 97, y: 37 }, { x: 97, y: 25 }, { x: 248, y: 25 }];
/** drumeagul tractorului: de la poarta din spate pana in padure */
export const FOREST_TRACK: Pt[] = [{ x: 20, y: -3.5 }, { x: 20, y: -12.5 }, { x: 13.6, y: -12.5 }];

/** opririle (pe drum) */
export const STOPS = {
  home: { x: 4, y: 25 },          // poarta casei, la indicator
  village: { x: 101.5, y: 25 },   // intrarea in sat (parcarea e la sud de drum)
  villageBus: { x: 129.5, y: 25 }, // statia din coltul pietei
  cityBus: { x: 209.5, y: 25 },
  cityTaxi: { x: 203.5, y: 25 },
  homeTractor: { x: 20, y: -3.5 },
  forestTractor: { x: 13.6, y: -12.5 },
};

// ------------------------------------------------------------------ apa
/** raul mare (curge de la nord la sud, prin lac) */
export const RIVER = { x0: 64, x1: 68 };
/** lacul (elipsa) */
export const LAKE = { cx: 70, cy: 18, rx: 22, ry: 12.5 };
/** paraul dintre sat si oras */
export const BROOK = { x0: 150, x1: 152 };
/** podul cel mare (peste rau, pe drumul spre sat) si podetul de peste parau */
export const BRIDGE = { x0: 63, y0: 36, x1: 69, y1: 38 };
export const BROOK_BRIDGE = { x0: 149, y0: 24, x1: 153, y1: 26 };

/** lungimea unei linii frante */
export function polyLen(p: Pt[]) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return s; }
/** punctul de pe linie aflat la distanta s */
export function pointAt(p: Pt[], s: number): Pt & { dx: number; dy: number } {
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], l = Math.hypot(b.x - a.x, b.y - a.y);
    if (s <= l || i === p.length - 1) { const k = l ? Math.max(0, Math.min(1, s / l)) : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: l ? (b.x - a.x) / l : 1, dy: l ? (b.y - a.y) / l : 0 }; }
    s -= l;
  }
  return { ...p[p.length - 1], dx: 1, dy: 0 };
}
/** cat de departe pe linie e cel mai apropiat punct de p */
export function projectOn(line: Pt[], p: Pt): number {
  let best = 0, bd = Infinity, acc = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], l = Math.hypot(b.x - a.x, b.y - a.y) || 1e-6;
    const k = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (l * l)));
    const d = Math.hypot(a.x + (b.x - a.x) * k - p.x, a.y + (b.y - a.y) * k - p.y);
    if (d < bd) { bd = d; best = acc + k * l; }
    acc += l;
  }
  return best;
}
/** bucata de linie dintre s0 si s1 (inversata daca s1 < s0) */
export function subLine(line: Pt[], s0: number, s1: number): Pt[] {
  const rev = s1 < s0; const a = Math.min(s0, s1), b = Math.max(s0, s1);
  const out: Pt[] = [pointAt(line, a)]; let acc = 0;
  for (let i = 1; i < line.length; i++) { acc += Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y); if (acc > a + 1e-6 && acc < b - 1e-6) out.push({ x: line[i].x, y: line[i].y }); }
  out.push(pointAt(line, b));
  const clean = out.map(q => ({ x: q.x, y: q.y }));
  return rev ? clean.reverse() : clean;
}
