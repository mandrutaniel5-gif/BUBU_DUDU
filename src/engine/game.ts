import { ErrorLog } from './errors';
import { setBucketQuality } from '../char/hamster';
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
/** cea mai mica parte din rezolutie la care coboara calitatea adaptiva (sub ea textul si personajele se vad incetosate) */
const Q_MIN = 0.8;

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0; h = 0; dpr = 1;
  /** rezolutia fara calitatea adaptiva (pentru imaginile pastrate: podea, personaje) */
  baseDpr = 1;
  scenes: Record<string, () => Scene> = {};
  scene: Scene | null = null;
  sceneName = '';
  private last = 0;
  timeScale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // 1.17: panza opaca (fiecare scena o picteaza toata): browserul nu o mai amesteca cu pagina din spate la fiecare cadru
    this.ctx = canvas.getContext('2d', { alpha: !!(globalThis as any).__perfOld })!;
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
  quality = (() => { try { const q = Number(localStorage.getItem('bd-quality')); return q >= 0.5 && q <= 1 ? Math.max(Q_MIN, q) : 1; } catch { return 1; } })();
  resize() {
    // pe telefon in modul eco desenam la 1,5x (aproape la fel de clar, ~45% mai putini pixeli de colorat)
    const base = Math.min(isEco() && matchMedia('(pointer: coarse)').matches ? 1.5 : 2, devicePixelRatio || 1);
    // si cel mult ~2,2 milioane de pixeli pe ecran (pe un laptop cu ecran mare, la scara 150%, ar fi mult mai multi)
    const cssPx = Math.max(1, (this.rotated ? innerHeight * innerWidth : innerWidth * innerHeight));
    const budget = Math.sqrt(2.2e6 / cssPx);
    this.baseDpr = Math.max(0.75, Math.min(base, budget));
    this.dpr = Math.max(0.75, this.baseDpr * this.quality);
    setBucketQuality(this.dpr / this.baseDpr);
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
    this.settle(8000);
    this.scene.enter();
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }

  start() {
    // cel mult 60 de cadre pe secunda (si pe ecranele de 120 Hz); in modul eco 30 cand nu se misca nimic
    const loop = (t: number) => {
      requestAnimationFrame(loop);
      const want = (this.scene as { wantFps?: () => number } | null)?.wantFps?.() ?? 60;
      // cat cere scena (1.17: nu mai depinde de Eco; vezi WorldScene.wantFps si setarea Fluiditate maxima).
      // Ritm adaptiv: daca aparatul nu tine 60 constant (cadre neregulate 17/25/17 ms se vad sacadat, desi contorul arata 48+),
      // trecem la 30 constant, care e neted, si mai incercam 60 dupa o vreme.
      const fps = Math.min(60, want, t < this.pace30Until ? 30 : 60);
      if (this.last && t - this.last < 1000 / fps - 3) return;
      if (this.last) this.pace(t - this.last, fps, t);
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

  // ---- calitatea adaptiva: masuram cate cadre iese de fapt fata de cate vrem (cel mult pana la Q_MIN)
  private win = { t0: 0, n: 0, want: 0 };
  private lastDown = 0; private bad = 0; private good = 0;
  // ---- ritmul: la 60, numaram cadrele intarziate; prea multe -> 30 pentru o vreme (din ce in ce mai lunga daca se repeta)
  private pace30Until = 0; private paceN = 0; private paceLate = 0; private paceBack = 15000; private paceOkSince = 0;
  private pace(dtMs: number, fps: number, now: number) {
    if (fps < 55 || (globalThis as any).__perfOld) { this.paceN = this.paceLate = 0; return; }
    if (now < this.quietUntil) return;
    this.paceN++; if (dtMs > 22) this.paceLate++;
    if (this.paceN >= 90) { // ~1,5 s la 60
      if (this.paceLate / this.paceN > 0.12) { this.pace30Until = now + this.paceBack; this.paceBack = Math.min(120000, this.paceBack * 2); this.paceOkSince = 0; }
      else if ((this.paceOkSince ||= now) && now - this.paceOkSince > 30000) this.paceBack = 15000; // 60 merge bine de 30 s: revenim la pauza scurta
      this.paceN = this.paceLate = 0;
    }
  }
  /** pana cand nu masuram (incarcarea unei zone sau scene) */
  quietUntil = 0;
  settle(ms = 6000) { this.quietUntil = performance.now() + ms; }
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
    // 1.17: dupa o zona noua / o scena noua (incarcare) nu judecam; si schimbam doar dupa 2 masuratori la rand
    if (now < this.quietUntil || (globalThis as any).__noAdapt) { this.bad = this.good = 0; return; }
    // 1.14.2: iPhone-ul in economie de baterie da doar 30 de cadre oricat de putin am desena (si o blocare de cateva secunde
    // nu inseamna ca e slab): atunci nu scadem rezolutia. Si nu mai jos de Q_MIN: la 0,6 jocul arata „blurat”.
    const capped = want > 45 && got > 27 && got < 32.5;
    const old = !!(globalThis as any).__perfOld;
    if (got < want * 0.72 && !capped && this.quality > Q_MIN) { this.good = 0; if (++this.bad >= (old ? 1 : 2)) { this.bad = 0; this.setQuality(Math.max(Q_MIN, this.quality * 0.88)); this.lastDown = now; } }
    else if (got > want * 0.96 && this.quality < 1 && now - this.lastDown > (old ? 45000 : 90000)) { this.bad = 0; if (++this.good >= (old ? 1 : 3)) { this.good = 0; this.setQuality(Math.min(1, this.quality / 0.85)); } }
    else { this.bad = 0; this.good = 0; }
  }
  setQuality(q: number) {
    q = Math.round(q * 100) / 100; if (q === this.quality) return;
    this.quality = q; try { localStorage.setItem('bd-quality', String(q)); } catch { /* */ }
    this.resize();
  }
}
