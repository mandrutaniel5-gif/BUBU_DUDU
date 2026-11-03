import { RESOURCE_NODES } from './build';
// Harta casei si a curtii.
export type Floor = 'forest' | 'road' | 'grass' | 'path' | 'wood' | 'pinkwood' | 'tileblue' | 'checker' | 'dirt' | 'water' | 'sand';

export interface Wall { x: number; y: number; dir: 'x' | 'y'; h: number; kind: 'back' | 'inner' | 'low'; window?: boolean; color: string }

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
}

export const MAP_W = 22, MAP_H = 27;
/** curtea (in interiorul gardului); dincolo de y = YARD_H e marginea drumului */
export const YARD_H = 22, YARD_GATE = 5, ROAD_Y = 24.6;
export const HOUSE = { x0: 2, y0: 2, x1: 13, y1: 11 };

/** zona curenta (acasa / padure / ...) */
export let AREA = 'home';
let areaFloor: ((x: number, y: number) => Floor) | null = null;
export function floorAt(x: number, y: number): Floor { return areaFloor ? areaFloor(x, y) : homeFloor(x, y); }
function homeFloor(x: number, y: number): Floor {
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
  { id: 'gateway', type: 'signpost', gx: 2, gy: 23, w: 1, d: 1, solid: true, action: act('village', 'Spre sat', '🏘️') },
];

/** dreptunghiuri de coliziune in grid */
export interface Rect { x0: number; y0: number; x1: number; y1: number }
export function colliders(): Rect[] {
  const R: Rect[] = [];
  const t = 0.08;
  for (const w of WALLS) {
    if (w.dir === 'x') R.push({ x0: w.x, y0: w.y - t, x1: w.x + 1, y1: w.y + t });
    else R.push({ x0: w.x - t, y0: w.y, x1: w.x + t, y1: w.y + 1 });
  }
  for (const f of FURNITURE) if (f.solid) {
    const inset = f.type === 'tree' || f.type === 'bush' ? 0.25 : 0.04;
    R.push({ x0: f.gx + inset, y0: f.gy + inset, x1: f.gx + f.w - inset, y1: f.gy + f.d - inset });
  }
  for (let x = 0; x < MAP_W; x++) for (let y = 0; y < MAP_H; y++) if (floorAt(x, y) === 'water') R.push({ x0: x, y0: y, x1: x + 1, y1: y + 1 });
  // gardul curtii (cu portita)
  for (let x = 0; x < MAP_W; x++) if (x !== YARD_GATE) R.push({ x0: x, y0: YARD_H - t, x1: x + 1, y1: YARD_H + t });
  // marginile hartii
  R.push({ x0: -1, y0: -1, x1: MAP_W + 1, y1: 0 }, { x0: -1, y0: MAP_H, x1: MAP_W + 1, y1: MAP_H + 1 });
  R.push({ x0: -1, y0: -1, x1: 0, y1: MAP_H + 1 }, { x0: MAP_W, y0: -1, x1: MAP_W + 1, y1: MAP_H + 1 });
  return R;
}

// ------------------------------------------------------------------ zone
export interface AreaDef { floor: (x: number, y: number) => Floor; furniture: Furn[]; walls: Wall[]; spawn: { x: number; y: number } }
const HOME_FURN = [...FURNITURE];
const HOME_WALLS = [...WALLS];
export const AREAS: Record<string, AreaDef> = {
  home: { floor: homeFloor, furniture: HOME_FURN, walls: HOME_WALLS, spawn: { x: 17.5, y: 16.5 } },
};
/** inlocuieste continutul listelor globale cu cel al zonei (pastreaza obiectele dinamice ale casei) */
export function setArea(name: string) {
  const cur = AREAS[AREA];
  if (cur) cur.furniture = [...FURNITURE];
  AREA = name;
  const a = AREAS[name];
  areaFloor = name === 'home' ? null : a.floor;
  FURNITURE.splice(0, FURNITURE.length, ...a.furniture);
  WALLS.splice(0, WALLS.length, ...a.walls);
}
