import { fillTextIcons } from '../ui/icons';
import { heartPath, starPath } from './draw';

export type FxKind = 'heart' | 'fart' | 'note' | 'zzz' | 'star' | 'sparkle' | 'drop' | 'puff' | 'steam' | 'text' | 'rumble' | 'shock';

export interface Particle {
  kind: FxKind; x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; rot: number; vr: number;
  color?: string; text?: string; grav: number;
}

/** Sistem simplu de particule, coordonate in lume. */
export class Fx {
  list: Particle[] = [];

  emit(kind: FxKind, x: number, y: number, o: Partial<Particle> = {}) {
    this.list.push({
      kind, x, y, vx: 0, vy: -20, life: 0, max: 1.2, size: 1, rot: 0, vr: 0, grav: 0, ...o,
    });
  }
  burst(kind: FxKind, x: number, y: number, n: number, spread: number, speed: number, o: Partial<Particle> = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.rot ?? -Math.PI / 2) + (Math.random() - 0.5) * spread;
      const s = speed * (0.5 + Math.random() * 0.7);
      this.emit(kind, x, y, { ...o, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4, max: (o.max ?? 1.2) * (0.7 + Math.random() * 0.6) });
    }
  }
  hearts(x: number, y: number, n = 5) { this.burst('heart', x, y, n, 1.6, 70, { max: 1.5, size: 0.8 + Math.random() * 0.6 }); }
  fart(x: number, y: number, big = 1, dir = 1) {
    this.burst('fart', x, y, Math.round(8 * big), 1.4, 60 * big, { rot: Math.PI / 2 + (dir > 0 ? 0.6 : -0.6), max: 1.8, size: 1.1 * big });
  }
  text(x: number, y: number, text: string, color = '#ff4d6d', size = 1) {
    this.emit('text', x, y, { text, color, vy: -35, max: 1.3, size });
  }

  update(dt: number) {
    for (const p of this.list) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.rot += p.vr * dt;
      if (p.kind === 'fart' || p.kind === 'puff' || p.kind === 'steam') { p.vx *= 0.96; p.vy *= 0.96; }
      if (p.kind === 'heart' || p.kind === 'note') { p.vx *= 0.97; p.vy = p.vy * 0.97 - 6 * dt; }
    }
    this.list = this.list.filter(p => p.life < p.max);
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    for (const p of this.list) {
      const k = p.life / p.max;
      const alpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.scale(scale * p.size, scale * p.size);
      switch (p.kind) {
        case 'heart': {
          const s = 7 * (0.6 + Math.min(1, k * 4) * 0.4);
          ctx.rotate(Math.sin(p.rot) * 0.3);
          heartPath(ctx, 0, 0, s); ctx.fillStyle = p.color ?? '#ff5c7c'; ctx.fill();
          ctx.lineWidth = 1.4; ctx.strokeStyle = '#a3243f'; ctx.stroke();
          ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.4, s * 0.18, 0, 7); ctx.fill();
          break;
        }
        case 'fart': {
          const r = 7 + k * 14;
          ctx.fillStyle = p.color ?? '#a8d46f'; ctx.strokeStyle = '#6b9a3a'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(Math.cos(i * 2.1 + p.rot) * r * 0.5, Math.sin(i * 2.1 + p.rot) * r * 0.4, r * 0.6, 0, 7);
            ctx.fill(); ctx.stroke();
          }
          break;
        }
        case 'puff': case 'steam': {
          const r = 5 + k * 10;
          ctx.fillStyle = p.kind === 'steam' ? '#ffffffdd' : '#f4f0ea'; ctx.strokeStyle = '#c9c0b6'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
          break;
        }
        case 'note': {
          ctx.rotate(Math.sin(p.rot) * 0.4);
          ctx.fillStyle = p.color ?? '#7a5cff'; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, 6, 4, 3, -0.4, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(3.5, 5); ctx.lineTo(3.5, -8); ctx.quadraticCurveTo(7, -6, 9, -2); ctx.stroke();
          break;
        }
        case 'zzz': {
          ctx.font = 'bold 16px "Baloo 2", "Comic Sans MS", sans-serif';
          ctx.fillStyle = '#6b7cff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
          ctx.strokeText('z', 0, 0); ctx.fillText('z', 0, 0);
          break;
        }
        case 'star': case 'sparkle': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color ?? '#ffd23f';
          starPath(ctx, 0, 0, p.kind === 'star' ? 7 : 5, p.kind === 'star' ? 3 : 1.4, p.kind === 'star' ? 5 : 4);
          ctx.fill(); if (p.kind === 'star') { ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.stroke(); }
          break;
        }
        case 'drop': {
          ctx.fillStyle = p.color ?? '#8fd3ff';
          ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 7); ctx.fill();
          break;
        }
        case 'rumble': {
          ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 6 + k * 10, -0.6, 0.6); ctx.stroke();
          break;
        }
        case 'shock': {
          ctx.strokeStyle = p.color ?? '#ffb703'; ctx.lineWidth = 3;
          const r = 10 + k * 40;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
          break;
        }
        case 'text': {
          const pop = k < 0.2 ? 0.6 + (k / 0.2) * 0.6 : 1.2 - Math.min(0.2, (k - 0.2));
          ctx.scale(pop, pop); ctx.rotate(-0.08);
          ctx.font = '900 20px "Baloo 2", "Comic Sans MS", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.fillStyle = p.color ?? '#ff4d6d'; fillTextIcons(ctx, p.text ?? '', 0, 0, 20, true);
          break;
        }
      }
      ctx.restore();
    }
  }
}
