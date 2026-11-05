// Obiectele care nu se misca (copaci, case, garduri, campuri) se deseneaza o singura data intr-o imagine
// mica si apoi doar se lipeste imaginea: mult mai putina munca pe cadru (baterie!).
import { iso } from './iso';
import { heightOf } from './cull';
import type { Furn } from './map';

interface Sprite { cv: HTMLCanvasElement; used: number; S: number; bytes: number }
/** tipurile care arata la fel tot timpul (sau aproape: legananul usor al frunzelor se opreste) */
const STATIC = new Set(['oak', 'pine', 'tree', 'bush', 'rock', 'flowers', 'wildflower', 'fenceline', 'roadsign', 'farmhouse', 'barn', 'haystack', 'scarecrow', 'cropfield', 'bench', 'bridgerail', 'bridgegap', 'lilypad', 'gazebo', 'church', 'berrybush', 'mushroom', 'logpile', 'pier', 'flowerbed', 'stonepath', 'heartstone', 'fence', 'pot']);
/** cladirile mari: corpul din imagine, iar semnul plutitor / ceasul / luminitele, desenate viu peste */
export const layered = (f: Furn) => (f.type as string) === 'cbuilding' || (f.type as string) === 'building';
export const cacheable = (f: Furn) => STATIC.has(f.type as string) || layered(f);

export class SpriteCache {
  private m = new Map<string, Sprite>();
  private frame = 0; private bytes = 0;
  /** cat tinem minte (memoria telefonului) */
  maxBytes = 56e6;
  clear() { this.m.clear(); this.bytes = 0; }
  /** deseneaza obiectul din imaginea tinuta minte (o face daca nu exista); key = id + starea vizibila */
  draw(ctx: CanvasRenderingContext2D, f: Furn, key: string, S: number, paint: (c: CanvasRenderingContext2D) => void) {
    const l = iso(f.gx, f.gy + f.d).x - 48, r = iso(f.gx + f.w, f.gy).x + 48;
    const top = iso(f.gx, f.gy).y - heightOf(f), bottom = iso(f.gx + f.w, f.gy + f.d).y + 24;
    const w = r - l, h = bottom - top;
    let sp = this.m.get(key);
    if (!sp || sp.S !== S) {
      if (sp) this.bytes -= sp.bytes;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * S)); cv.height = Math.max(1, Math.ceil(h * S));
      const c = cv.getContext('2d')!;
      c.setTransform(S, 0, 0, S, -l * S, -top * S); c.lineJoin = 'round'; c.lineCap = 'round';
      paint(c);
      sp = { cv, used: this.frame, S, bytes: cv.width * cv.height * 4 };
      this.m.set(key, sp); this.bytes += sp.bytes;
    }
    sp.used = this.frame;
    ctx.drawImage(sp.cv, l, top, w, h);
  }
  /** la sfarsitul cadrului: uitam imaginile vechi daca am trecut de memorie */
  endFrame() {
    this.frame++;
    if (this.bytes <= this.maxBytes) return;
    const list = [...this.m.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, sp] of list) { if (this.bytes <= this.maxBytes * 0.8 || sp.used >= this.frame - 1) break; this.m.delete(k); this.bytes -= sp.bytes; }
  }
}
