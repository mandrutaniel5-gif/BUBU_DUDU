import { Settings } from '../game/settings';
export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Bucla principala + canvas care se adapteaza la ecran (DPR). */
export const isEco = () => { const e = Settings.get().eco; return e ?? matchMedia('(pointer: coarse)').matches; };
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
  resize() {
    // pe telefon in modul eco desenam la 1,5x (aproape la fel de clar, ~45% mai putini pixeli de colorat)
    this.dpr = Math.min(isEco() && matchMedia('(pointer: coarse)').matches ? 1.5 : 2, devicePixelRatio || 1);
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
      this.last = t;
      if (this.scene) {
        this.scene.update(dt);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.scene.draw(this.ctx);
      }
    };
    requestAnimationFrame(loop);
  }
}
