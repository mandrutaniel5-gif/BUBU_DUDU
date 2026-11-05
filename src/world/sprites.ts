// Obiectele care nu se misca (copaci, case, garduri, campuri) se deseneaza o singura data intr-o imagine
// mica si apoi doar se lipeste imaginea: mult mai putina munca pe cadru (baterie!).
import { screenBox } from './cull';
import type { Furn } from './map';

interface Sprite { cv: HTMLCanvasElement; used: number; S: number; bytes: number }
/** tipurile care arata la fel tot timpul (sau aproape: legananul usor al frunzelor se opreste) */
const STATIC = new Set(['sawmill', 'logstack', 'oak', 'pine', 'tree', 'bush', 'rock', 'flowers', 'wildflower', 'fenceline', 'roadsign', 'farmhouse', 'barn', 'haystack', 'scarecrow', 'cropfield', 'bench', 'bridgerail', 'bridgegap', 'lilypad', 'gazebo', 'church', 'berrybush', 'mushroom', 'logpile', 'pier', 'flowerbed', 'stonepath', 'heartstone', 'fence', 'pot', 'lamppost', 'stalls', 'busstop', 'icecart', 'towerdoor', 'signpost',
  // mobila casei (se refac cand li se schimba starea; vezi render.ts)
  'bed', 'nightstand', 'wardrobe', 'rug', 'plant', 'toilet', 'bathtub', 'sink', 'washer', 'fridge', 'stove', 'counter', 'table', 'sofa', 'tv', 'bookshelf', 'mailbox', 'doormat', 'lamp', 'well', 'laptop', 'gateway', 'shed', 'mower', 'stand', 'sapling', 'snowman', 'swing']);
/** cladirile mari: corpul din imagine, iar semnul plutitor / ceasul / luminitele, desenate viu peste */
export const layered = (f: Furn) => (f.type as string) === 'cbuilding' || (f.type as string) === 'building';
export const cacheable = (f: Furn) => STATIC.has(f.type as string) || layered(f);

export class SpriteCache {
  private m = new Map<string, Sprite>();
  private frame = 0; private bytes = 0;
  /** cat tinem minte (memoria telefonului) */
  maxBytes = 56e6;
  clear() { this.m.clear(); this.bytes = 0; }
  /** uita imaginile unui obiect (toate starile lui) */
  forget(prefix: string) { for (const [k, sp] of this.m) if (k.startsWith(prefix + '|') || k === prefix) { this.m.delete(k); this.bytes -= sp.bytes; } }
  /** deseneaza obiectul din imaginea tinuta minte (o face daca nu exista); key = id + starea vizibila */
  draw(ctx: CanvasRenderingContext2D, f: Furn, key: string, S: number, paint: (c: CanvasRenderingContext2D) => void) { this.drawBox(ctx, key, screenBox(f), S, paint); }
  /**
   * La fel, pentru un dreptunghi de ecran (pixeli de lume). Coltul imaginii e pe un multiplu de 4 pixeli,
   * iar S e multiplu de 0,25: pixelii imaginii cad exact pe cei ai podelei "coapte" (fara margini vizibile).
   */
  drawBox(ctx: CanvasRenderingContext2D, key: string, B: { x0: number; y0: number; x1: number; y1: number }, S: number, paint: (c: CanvasRenderingContext2D) => void, only?: { x0: number; y0: number; x1: number; y1: number }[]) {
    const l = Math.floor(B.x0 / 4) * 4, top = Math.floor(B.y0 / 4) * 4, w = Math.ceil((B.x1 - l) / 4) * 4, h = Math.ceil((B.y1 - top) / 4) * 4;
    let sp = this.m.get(key);
    if (!sp || sp.S !== S) {
      if (sp) this.bytes -= sp.bytes;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(w * S)); cv.height = Math.max(1, Math.round(h * S));
      const c = cv.getContext('2d')!;
      c.setTransform(S, 0, 0, S, -l * S, -top * S); c.lineJoin = 'round'; c.lineCap = 'round';
      paint(c);
      sp = { cv, used: this.frame, S, bytes: cv.width * cv.height * 4 };
      this.m.set(key, sp); this.bytes += sp.bytes;
    }
    sp.used = this.frame;
    if (!only) { ctx.drawImage(sp.cv, l, top, sp.cv.width / S, sp.cv.height / S); return; }
    // doar bucatile din dreptunghiurile date (mult mai putini pixeli decat toata imaginea)
    const r1 = l + sp.cv.width / S, b1 = top + sp.cv.height / S;
    for (const r of only) {
      const x0 = Math.max(l, Math.floor(r.x0)), y0 = Math.max(top, Math.floor(r.y0)), x1 = Math.min(r1, Math.ceil(r.x1)), y1 = Math.min(b1, Math.ceil(r.y1));
      if (x1 <= x0 || y1 <= y0) continue;
      ctx.drawImage(sp.cv, (x0 - l) * S, (y0 - top) * S, (x1 - x0) * S, (y1 - y0) * S, x0, y0, x1 - x0, y1 - y0);
    }
  }
  /** la sfarsitul cadrului: uitam imaginile vechi daca am trecut de memorie */
  endFrame() {
    this.frame++;
    if (this.bytes <= this.maxBytes) return;
    const list = [...this.m.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, sp] of list) { if (this.bytes <= this.maxBytes * 0.8 || sp.used >= this.frame - 1) break; this.m.delete(k); this.bytes -= sp.bytes; }
  }
}
