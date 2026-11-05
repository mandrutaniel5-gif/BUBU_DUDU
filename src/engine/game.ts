import { ErrorLog } from './errors';
import { Settings } from '../game/settings';
export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Bucla principala + canvas care se adapteaza la ecran (DPR). */
/** modul eco (30 de cadre cand nu se misca nimic): pornit implicit peste tot (se poate opri din meniu) */
export const isEco = () => { const e = Settings.get().eco; return e ?? true; };
export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0; h = 0; dpr = 1;
  scenes: Record<string, () => Scene> = {};
  scene: Scene | null = null;
  sceneName = '';
  private last = 0;
  timeScale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    this.resize();
  }

  /** telefon tinut vertical: rotim tot jocul pe lat (jocul merge doar orizontal) */
  rotated = false;
  /**
   * Calitatea (0,6..1): cat din rezolutia ecranului folosim. Scade singura daca jocul nu tine pasul
   * (calculator / telefon slab) si creste la loc cand e loc. O tinem minte pe fiecare aparat.
   */
  quality = (() => { try { const q = Number(localStorage.getItem('bd-quality')); return q >= 0.5 && q <= 1 ? q : 1; } catch { return 1; } })();
  resize() {
    // pe telefon in modul eco desenam la 1,5x (aproape la fel de clar, ~45% mai putini pixeli de colorat)
    const base = Math.min(isEco() && matchMedia('(pointer: coarse)').matches ? 1.5 : 2, devicePixelRatio || 1);
    // si cel mult ~2,2 milioane de pixeli pe ecran (pe un laptop cu ecran mare, la scara 150%, ar fi mult mai multi)
    const cssPx = Math.max(1, (this.rotated ? innerHeight * innerWidth : innerWidth * innerHeight));
    const budget = Math.sqrt(2.2e6 / cssPx);
    this.dpr = Math.max(0.75, Math.min(base, budget) * this.quality);
    const touch = matchMedia('(pointer: coarse)').matches;
    this.rotated = touch && innerHeight > innerWidth;
    this.w = this.rotated ? innerHeight : innerWidth; this.h = this.rotated ? innerWidth : innerHeight;
    const st = document.getElementById('stage'), html = document.documentElement;
    if (st) { st.style.width = this.w + 'px'; st.style.height = this.h + 'px'; }
    html.classList.toggle('rot', this.rotated);
    // in locul media query-urilor (care nu stiu de rotire), clase dupa marimea reala a jocului
    html.classList.toggle('w759', this.w <= 759); html.classList.toggle('w700', this.w <= 700);
    html.classList.toggle('h500', this.h <= 500); html.classList.toggle('h520w760', this.h <= 520 && this.w >= 760);
    html.classList.toggle('h520l', this.h <= 520 && this.w > this.h);
    html.classList.toggle('tabmid', this.w >= 701 && this.w <= 1100 && this.h >= 501);
    html.style.setProperty('--gw', this.w + 'px'); html.style.setProperty('--gh', this.h + 'px');
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
  }

  /** coordonatele unui eveniment (ecran) -> coordonatele jocului (tinand cont de rotire) */
  pt(e: { clientX: number; clientY: number }) { return this.rotated ? { x: e.clientY, y: innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }; }

  go(name: string) {
    this.scene?.exit();
    this.sceneName = name;
    this.scene = this.scenes[name]();
    this.scene.enter();
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }

  start() {
    // cel mult 60 de cadre pe secunda (si pe ecranele de 120 Hz); in modul eco 30 cand nu se misca nimic
    const loop = (t: number) => {
      requestAnimationFrame(loop);
      const want = (this.scene as { wantFps?: () => number } | null)?.wantFps?.() ?? 60;
      const fps = Math.min(60, isEco() ? want : 60);
      if (this.last && t - this.last < 1000 / fps - 3) return;
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000) * this.timeScale;
      if (this.last) this.adapt(t - this.last, fps, t);
      this.last = t;
      if (this.scene) {
        try { this.scene.update(dt); } catch (e) { ErrorLog.add(e, 'update ' + this.sceneName); }
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        try { this.scene.draw(this.ctx); } catch (e) { ErrorLog.add(e, 'draw ' + this.sceneName); this.ctx.restore?.(); }
      }
    };
    requestAnimationFrame(loop);
  }

  // ---- calitatea adaptiva: masuram cate cadre iese de fapt fata de cate vrem
  private win = { t0: 0, n: 0, want: 0 };
  private lastDown = 0;
  private adapt(dtMs: number, want: number, now: number) {
    const W = this.win;
    if (!W.t0 || W.want !== want) { W.t0 = now; W.n = 0; W.want = want; return; }
    W.n++;
    const span = now - W.t0;
    if (span < 3000) return;
    const got = W.n / (span / 1000);
    W.t0 = now; W.n = 0;
    void dtMs;
    if (document.hidden) return;
    if (got < want * 0.72 && this.quality > 0.6) { this.setQuality(Math.max(0.6, this.quality * 0.85)); this.lastDown = now; }
    else if (got > want * 0.96 && this.quality < 1 && now - this.lastDown > 45000) this.setQuality(Math.min(1, this.quality / 0.85));
  }
  setQuality(q: number) {
    q = Math.round(q * 100) / 100; if (q === this.quality) return;
    this.quality = q; try { localStorage.setItem('bd-quality', String(q)); } catch { /* */ }
    this.resize();
  }
}
