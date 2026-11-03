// Semn plutitor deasupra institutiilor: un cerc alb cu iconita, ca sa le vezi de departe.
import { iconCanvas } from '../ui/icons';
const O = '#4a2a22';
export function drawPOI(c: CanvasRenderingContext2D, x: number, y: number, icon: string, t: number, ring = '#ff7aa2', locked = false) {
  const bob = Math.sin(t * 2.2 + x * 0.05) * 3;
  const yy = y + bob;
  c.save();
  // umbra si coada
  c.fillStyle = ring; c.strokeStyle = O; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(x - 8, yy + 14); c.lineTo(x, yy + 26); c.lineTo(x + 8, yy + 14); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, yy, 19, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, yy, 14.5, 0, Math.PI * 2); c.fill();
  const cv = iconCanvas(icon, 64); if (cv) { c.globalAlpha = locked ? 0.45 : 1; c.drawImage(cv, x - 12, yy - 12, 24, 24); c.globalAlpha = 1; }
  if (locked) { const lk = iconCanvas('🔒', 64); if (lk) c.drawImage(lk, x + 6, yy + 2, 14, 14); }
  c.restore();
}
/** firma mare cu iconita in stanga */
export function drawSign(c: CanvasRenderingContext2D, x: number, y: number, text: string, icon: string, bg = '#fff8ef', fg = O, size = 12) {
  c.font = `800 ${size}px "Baloo 2", sans-serif`;
  const tw = c.measureText(text).width + size * 2.6 + 12, hh = size * 1.9;
  c.fillStyle = bg; c.strokeStyle = O; c.lineWidth = 2.2; c.beginPath(); c.roundRect(x - tw / 2, y - hh / 2, tw, hh, 7); c.fill(); c.stroke();
  const cv = iconCanvas(icon, 64); if (cv) c.drawImage(cv, x - tw / 2 + 5, y - size * 0.75, size * 1.5, size * 1.5);
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x + size * 0.85, y + 0.5); c.textBaseline = 'alphabetic';
}
