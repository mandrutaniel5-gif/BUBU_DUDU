export interface Scene {
  enter(): void;
  exit(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Bucla principala + canvas care se adapteaza la ecran (DPR). */
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
    this.resize();
  }

  resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
  }

  go(name: string) {
    this.scene?.exit();
    this.sceneName = name;
    this.scene = this.scenes[name]();
    this.scene.enter();
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }

  start() {
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000) * this.timeScale;
      this.last = t;
      if (this.scene) {
        this.scene.update(dt);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.scene.draw(this.ctx);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
