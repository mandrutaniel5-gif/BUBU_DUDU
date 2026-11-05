import { RESOURCE_NODES } from './build';
import { WORLD, WORLD_W, WORLD_H, ORIGIN, CORE_W, CORE_H } from './layout';
// Harta casei si a curtii.
export type Floor = 'forest' | 'road' | 'grass' | 'path' | 'wood' | 'pinkwood' | 'tileblue' | 'checker' | 'dirt' | 'water' | 'sand' | 'asphalt' | 'sidewalk' | 'void' | 'bridge' | 'field' | 'meadow' | 'cobble';
export const FLOORS: Floor[] = ['void', 'grass', 'forest', 'road', 'path', 'wood', 'pinkwood', 'tileblue', 'checker', 'dirt', 'water', 'sand', 'asphalt', 'sidewalk', 'bridge', 'field', 'meadow', 'cobble'];
const FLOOR_ID: Record<string, number> = Object.fromEntries(FLOORS.map((f, i) => [f, i]));

export interface Wall { x: number; y: number; dir: 'x' | 'y'; h: number; kind: 'back' | 'inner' | 'low'; window?: boolean; door?: boolean; color: string }

export type FurnType =
  | 'bed' | 'nightstand' | 'wardrobe' | 'toilet' | 'bathtub' | 'sink' | 'washer' | 'fridge' | 'stove'
  | 'counter' | 'table' | 'sofa' | 'tv' | 'plant' | 'bookshelf' | 'tree' | 'plot' | 'bench' | 'mailbox'
  | 'rug' | 'lamp' | 'flowers' | 'doormat' | 'bush'
  | 'well' | 'soilplot' | 'laptop' | 'fireplace' | 'shed' | 'stand' | 'gateway' | 'signpost'
  | 'rock' | 'wildflower' | 'stonepath' | 'heartstone' | 'fence' | 'pot' | 'lamppost' | 'sapling' | 'flowerbed' | 'swing' | 'snowman' | 'gazebo';

export interface Furn {
  id: string; type: FurnType; gx: number; gy: number; w: number; d: number;
  solid: boolean; action?: { id: string; label: string; icon: string };
  rot?: 0 | 1; color?: string;
  /** decor: textul indicatorului, felul culturii etc. */
  text?: string; kind?: string;
}

export const MAP_W = 22, MAP_H = 27;
/** curtea (in interiorul gardului); dincolo de y = YARD_H e marginea drumului */
export const YARD_H = 22, YARD_GATE = 5, ROAD_Y = 24.6;
export const HOUSE = { x0: 2, y0: 2, x1: 13, y1: 11 };

/** harta incarcata acum: 'world' (lumea mare) sau un interior ('apartment') */
export let AREA = 'world';
let areaFloor: ((x: number, y: number) => Floor) | null = null;
/** podeaua lumii, precalculata (o dala = un octet) */
let grid: Uint8Array | null = null;
export function floorAt(x: number, y: number): Floor {
  if (areaFloor) return areaFloor(Math.floor(x), Math.floor(y));
  const ix = Math.floor(x) - WORLD.x0, iy = Math.floor(y) - WORLD.y0;
  if (ix < 0 || iy < 0 || ix >= WORLD_W || iy >= WORLD_H) return 'void';
  if (!grid) return worldFloorRaw(Math.floor(x), Math.floor(y));
  return FLOORS[grid[iy * WORLD_W + ix]];
}
export function homeFloor(x: number, y: number): Floor {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'grass';
  if (y === 24 || y === 25) return 'road';
  if (y >= YARD_H) return x === YARD_GATE && y < 24 ? 'path' : 'grass';
  if (x >= 0 && x <= 1 && y >= 6 && y <= 9) return 'water';
  if (x >= HOUSE.x0 && x <= HOUSE.x1 && y >= HOUSE.y0 && y <= HOUSE.y1) {
    if (x <= 7 && y <= 6) return 'pinkwood';
    if (x >= 8 && y <= 5) return 'tileblue';
    if (x >= 8) return 'checker';
    return 'wood';
  }
  if (x === 5 && y >= 12) return 'path';
  if (x === 14 && y >= 9 && y <= 10) return 'path';
  if (x >= 17 && x <= 19 && y >= 17 && y <= 19 && !(x === 19 && y === 19)) return 'water';
  if (x === 5 && y > 15) return 'path';
  return 'grass';
}

const WALL_BACK = '#ffd9e2', WALL_IN = '#fbe4c9', WALL_LOW = '#f1d2b0';

function wallsBuild(): Wall[] {
  const W: Wall[] = [];
  // pereti din spate (inalti, cu ferestre)
  for (let x = 2; x <= 13; x++) W.push({ x, y: 2, dir: 'x', h: 84, kind: 'back', window: x === 4 || x === 10 || x === 12, color: x >= 8 ? '#d6ecf5' : WALL_BACK });
  for (let y = 2; y <= 11; y++) W.push({ x: 2, y, dir: 'y', h: 84, kind: 'back', window: y === 4 || y === 9, color: y <= 6 ? WALL_BACK : '#fff0c9' });
  // pereti interiori (josi, ca sa se vada personajele)
  for (let y = 2; y <= 5; y++) if (y !== 4) W.push({ x: 8, y, dir: 'y', h: 26, kind: 'inner', color: WALL_IN });
  for (let y = 6; y <= 11; y++) if (y !== 8) W.push({ x: 8, y, dir: 'y', h: 26, kind: 'inner', color: WALL_IN });
  for (let x = 2; x <= 7; x++) if (x !== 4) W.push({ x, y: 7, dir: 'x', h: 26, kind: 'inner', color: WALL_IN });
  for (let x = 8; x <= 13; x++) if (x !== 10) W.push({ x, y: 6, dir: 'x', h: 26, kind: 'inner', color: WALL_IN });
  // marginile din fata (plinte joase, cu usi)
  for (let x = 2; x <= 13; x++) if (x !== 5) W.push({ x, y: 12, dir: 'x', h: 10, kind: 'low', color: WALL_LOW });
  for (let y = 2; y <= 11; y++) if (y !== 9) W.push({ x: 14, y, dir: 'y', h: 10, kind: 'low', color: WALL_LOW });
  return W;
}
export const WALLS = wallsBuild();

const act = (id: string, label: string, icon: string) => ({ id, label, icon });

export const FURNITURE: Furn[] = [
  // dormitor
  { id: 'bed', type: 'bed', gx: 3, gy: 2, w: 2, d: 3, solid: true, action: act('sleep', 'Culcarea', '🛏️') },
  { id: 'ns1', type: 'nightstand', gx: 5, gy: 2, w: 1, d: 1, solid: true, action: act('lamp', 'Lampa', '💡') },
  { id: 'ward', type: 'wardrobe', gx: 2, gy: 5, w: 1, d: 1, solid: true, action: act('dress', 'Garderoba', '👗') },
  { id: 'rugB', type: 'rug', gx: 5, gy: 4, w: 2, d: 2, solid: false, color: '#ffb6c9' },
  { id: 'plantB', type: 'plant', gx: 7, gy: 2, w: 1, d: 1, solid: true, action: act('water_plant', 'Udă floarea', '🪴') },
  // baie
  { id: 'toilet', type: 'toilet', gx: 9, gy: 2, w: 1, d: 1, solid: true, action: act('toilet', 'Toaleta', '🚽') },
  { id: 'tub', type: 'bathtub', gx: 11, gy: 2, w: 2, d: 1, solid: true, action: act('bath', 'Baie cu spumă', '🛁') },
  { id: 'sink', type: 'sink', gx: 13, gy: 4, w: 1, d: 1, solid: true, action: act('teeth', 'Spălat pe dinți', '🪥') },
  { id: 'washer', type: 'washer', gx: 13, gy: 2, w: 1, d: 1, solid: true, action: act('laundry', 'Rufe', '🧺') },
  // bucatarie
  { id: 'fridge', type: 'fridge', gx: 13, gy: 7, w: 1, d: 1, solid: true, action: act('snack', 'Frigiderul', '🧊') },
  { id: 'stove', type: 'stove', gx: 13, gy: 8, w: 1, d: 1, solid: true, action: act('cook', 'Gătește', '🍳') },
  { id: 'counter', type: 'counter', gx: 13, gy: 9, w: 1, d: 1, solid: true, action: act('dishes', 'Spălat vase', '🍽️') },
  { id: 'table', type: 'table', gx: 10, gy: 9, w: 2, d: 1, solid: true, action: act('eat', 'Masa', '🍰') },
  // sufragerie
  { id: 'rugL', type: 'rug', gx: 3, gy: 8, w: 3, d: 3, solid: false, color: '#c9e4ff' },
  { id: 'sofa', type: 'sofa', gx: 5, gy: 9, w: 1, d: 2, solid: true, action: act('cuddle', 'Canapeaua', '🛋️') },
  { id: 'tv', type: 'tv', gx: 2, gy: 9, w: 1, d: 2, solid: true, action: act('tv', 'Televizor', '📺') },
  { id: 'shelf', type: 'bookshelf', gx: 2, gy: 7, w: 1, d: 1, solid: true, action: act('read', 'Citește', '📚') },
  { id: 'plantL', type: 'plant', gx: 2, gy: 11, w: 1, d: 1, solid: true, action: act('water_plant', 'Udă floarea', '🪴') },
  // curte
  { id: 'mat', type: 'doormat', gx: 5, gy: 12, w: 1, d: 1, solid: false },
  { id: 'tree1', type: 'tree', gx: 0, gy: 1, w: 1, d: 1, solid: true, action: act('chop', 'Taie lemne', '🪓') },
  { id: 'tree2', type: 'tree', gx: 14, gy: 14, w: 1, d: 1, solid: true, action: act('chop', 'Taie lemne', '🪓') },
  { id: 'tree3', type: 'tree', gx: 1, gy: 13, w: 1, d: 1, solid: true, action: act('chop', 'Taie lemne', '🪓') },
  { id: 'tree4', type: 'tree', gx: 15, gy: 3, w: 1, d: 1, solid: true, action: act('chop', 'Taie lemne', '🪓') },
  { id: 'bench', type: 'bench', gx: 2, gy: 14, w: 2, d: 1, solid: true, action: act('bench', 'Băncuța', '🌅') },
  { id: 'mail', type: 'mailbox', gx: 6, gy: 13, w: 1, d: 1, solid: true, action: act('mail', 'Cutia poștală', '💌') },
  { id: 'fl1', type: 'flowers', gx: 7, gy: 14, w: 1, d: 1, solid: false },
  { id: 'fl2', type: 'flowers', gx: 13, gy: 12, w: 1, d: 1, solid: false },
  { id: 'fl3', type: 'flowers', gx: 0, gy: 11, w: 1, d: 1, solid: false },
  { id: 'bush1', type: 'bush', gx: 15, gy: 8, w: 1, d: 1, solid: true },
  { id: 'bush2', type: 'bush', gx: 8, gy: 15, w: 1, d: 1, solid: true },
  ...RESOURCE_NODES,
  // supravietuire si economie
  { id: 'well', type: 'well', gx: 12, gy: 13, w: 1, d: 1, solid: true, action: act('drawwater', 'Scoate apă din fântână', '🪣') },
  { id: 'laptop', type: 'laptop', gx: 7, gy: 4, w: 1, d: 1, solid: true, action: act('online', 'Laptopul (magazin online)', '💻') },
  { id: 'fireplace', type: 'fireplace', gx: 7, gy: 7, w: 1, d: 1, solid: true, action: act('stove', 'Soba', '🔥') },
  { id: 'shed', type: 'shed', gx: 16, gy: 13, w: 1, d: 1, solid: true, action: act('mow', 'Tunde iarba', '✂️') },
  { id: 'stand', type: 'stand', gx: 7, gy: 23, w: 2, d: 1, solid: true, action: act('stand', 'Taraba lui Bubu', '🧺') },
  { id: 'gateway', type: 'signpost', gx: 3, gy: 23, w: 1, d: 1, solid: true, action: act('village', 'Spre sat', '🏘️') },
];

/** dreptunghiuri de coliziune in grid */
export interface Rect { x0: number; y0: number; x1: number; y1: number }
/** poarta din spatele curtii (spre padure) */
export const BACK_GATE = 19;
/** marginile hartii incarcate */
export function spaceBounds() { return AREA === 'world' ? { x0: WORLD.x0, y0: WORLD.y0, x1: WORLD.x1, y1: WORLD.y1 } : { x0: 0, y0: 0, x1: MAP_W, y1: MAP_H }; }
/** obstacolele (fara apa: apa si golul le stie navigarea din podea) */
export function colliders(): Rect[] {
  const R: Rect[] = [];
  const t = 0.08;
  for (const w of WALLS) {
    if (w.dir === 'x') R.push({ x0: w.x, y0: w.y - t, x1: w.x + 1, y1: w.y + t });
    else R.push({ x0: w.x - t, y0: w.y, x1: w.x + t, y1: w.y + 1 });
  }
  for (const f of FURNITURE) if (f.solid) {
    const inset = f.type === 'tree' || f.type === 'bush' || (f.type as string) === 'pine' ? 0.25 : 0.04;
    R.push({ x0: f.gx + inset, y0: f.gy + inset, x1: f.gx + f.w - inset, y1: f.gy + f.d - inset });
  }
  if (AREA === 'world') {
    // gardul curtii pe toate laturile: portita din fata (spre drum) si poarta din spate (spre padure)
    for (let x = 0; x < MAP_W; x++) {
      if (x !== YARD_GATE) R.push({ x0: x, y0: YARD_H - t, x1: x + 1, y1: YARD_H + t });
      if (x !== BACK_GATE) R.push({ x0: x, y0: -t, x1: x + 1, y1: t });
    }
    for (let y = 0; y < YARD_H; y++) { R.push({ x0: -t, y0: y, x1: t, y1: y + 1 }); R.push({ x0: MAP_W - t, y0: y, x1: MAP_W + t, y1: y + 1 }); }
    R.push(...EXTRA_COLLIDERS);
  }
  const B = spaceBounds();
  R.push({ x0: B.x0 - 1, y0: B.y0 - 1, x1: B.x1 + 1, y1: B.y0 }, { x0: B.x0 - 1, y0: B.y1, x1: B.x1 + 1, y1: B.y1 + 1 });
  R.push({ x0: B.x0 - 1, y0: B.y0 - 1, x1: B.x0, y1: B.y1 + 1 }, { x0: B.x1, y0: B.y0 - 1, x1: B.x1 + 1, y1: B.y1 + 1 });
  return R;
}
/** ziduri nevazute ale lumii (marginea padurii, malurile...) puse de modulul campiei */
export const EXTRA_COLLIDERS: Rect[] = [];

// ------------------------------------------------------------------ zone
export interface AreaDef { floor: (x: number, y: number) => Floor; furniture: Furn[]; walls: Wall[]; spawn: { x: number; y: number } }
const HOME_FURN = [...FURNITURE];
const HOME_WALLS = [...WALLS];
/**
 * Hartile: 'home' (casa si curtea), 'forest', 'village', 'city' (zonele vechi, puse in lume cu coordonate de lume),
 * 'country' (campia dintre ele) si interioarele ('apartment'). Lumea ('world') le aduna pe toate.
 */
export const AREAS: Record<string, AreaDef> = {
  home: { floor: homeFloor, furniture: HOME_FURN, walls: HOME_WALLS, spawn: { x: 17.5, y: 16.5 } },
};
/** zonele vechi in lume, in ordinea in care isi dau podeaua */
const CORES = ['forest', 'village', 'city'] as const;
function inCore(x: number, y: number, o: { x: number; y: number }) { return x >= o.x && y >= o.y && x < o.x + CORE_W && y < o.y + CORE_H; }
/** podeaua lumii, calculata (fara grila) */
function worldFloorRaw(x: number, y: number): Floor {
  if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) return homeFloor(x, y);
  for (const c of CORES) if (AREAS[c] && inCore(x, y, ORIGIN[c])) return AREAS[c].floor(x, y);
  return AREAS.country ? AREAS.country.floor(x, y) : 'grass';
}
/** zona incarcata acum */
export const currentArea = () => AREA;
let built = false;
/** aduna lumea mare din zonele ei (o data) */
function buildWorld() {
  const furn: Furn[] = [...HOME_FURN];
  for (const c of [...CORES, 'country']) if (AREAS[c]) furn.push(...AREAS[c].furniture);
  AREAS.world = { floor: worldFloorRaw, furniture: furn, walls: [...HOME_WALLS], spawn: { x: 6.5, y: 9.4 } };
  grid = new Uint8Array(WORLD_W * WORLD_H);
  for (let iy = 0; iy < WORLD_H; iy++) for (let ix = 0; ix < WORLD_W; ix++) grid[iy * WORLD_W + ix] = FLOOR_ID[worldFloorRaw(ix + WORLD.x0, iy + WORLD.y0)] ?? 1;
  built = true;
}
/**
 * Reporneste hartile de la zero (la intrarea in joc / iesirea in meniu): lumea curata (fara
 * obiectele adaugate in joc: razoare, constructii, vehicule), incarcata pe harta.
 */
const BASE_FURN: Record<string, Furn[]> = {};
export function resetAreas() {
  if (!built) buildWorld();
  for (const [k, a] of Object.entries(AREAS)) { BASE_FURN[k] ??= [...a.furniture]; a.furniture = [...BASE_FURN[k]]; }
  AREA = 'world'; areaFloor = null;
  FURNITURE.splice(0, FURNITURE.length, ...AREAS.world.furniture);
  WALLS.splice(0, WALLS.length, ...AREAS.world.walls);
}
/** incarca harta: 'world' sau un interior (se pastreaza ce s-a schimbat pe harta de unde pleci) */
export function setArea(name: string) {
  if (!built) buildWorld();
  if (!AREAS[name] || name === 'home' || (CORES as readonly string[]).includes(name) || name === 'country') name = 'world';
  if (name === AREA) return;
  const cur = AREAS[AREA];
  if (cur) cur.furniture = [...FURNITURE];
  AREA = name;
  const a = AREAS[name];
  areaFloor = name === 'world' ? null : a.floor;
  FURNITURE.splice(0, FURNITURE.length, ...a.furniture);
  WALLS.splice(0, WALLS.length, ...a.walls);
}
