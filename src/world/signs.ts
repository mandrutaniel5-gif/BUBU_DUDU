// Indicatoarele de drum: panoul sta de-a lungul drumului (in planul lui, ca in izometrie),
// iar sageata arata spre locul scris pe el. dir = incotro duce: E (+x), W (-x), N (-y), S (+y); '' = panou fara sageata.
import { iso, isoBox, boxOf } from './iso';
import { fillTextIcons } from '../ui/icons';

export type SignDir = 'E' | 'W' | 'N' | 'S' | '';
const O = '#3a2a22';

export function drawRoadSign(c: CanvasRenderingContext2D, gx: number, gy: number, text: string, dir: SignDir, welcome = false) {
  const p = iso(gx + 0.5, gy + 0.5, 50);
  // panoul e in planul axei drumului: axa x urca spre stanga (panta +0.5), axa y urca spre dreapta (panta -0.5)
  const slope = dir === 'N' || dir === 'S' ? -0.5 : 0.5;
  const tip = dir === 'E' || dir === 'N' ? 1 : dir === 'W' || dir === 'S' ? -1 : 0;
  c.save();
  c.font = `800 ${welcome ? 11 : 10}px "Baloo 2", sans-serif`;
  const tw = Math.max(54, c.measureText(text).width + 26), hw = tw / 2, hh = welcome ? 12 : 10;
  c.translate(p.x, p.y); c.transform(1, slope, 0, 1, 0, 0);
  // stalpii (unul la panourile scurte, doi la cele lungi)
  const posts = tw > 90 ? [-hw * 0.62, hw * 0.62] : [0];
  for (const x of posts) { c.fillStyle = '#a0703f'; c.strokeStyle = O; c.lineWidth = 1.5; c.fillRect(x - 2.5, 0, 5, 50); c.strokeRect(x - 2.5, 0, 5, 50); }
  const shape = (dy: number) => {
    c.beginPath();
    c.moveTo(-hw - (tip < 0 ? 0 : 0), -hh + dy);
    if (tip < 0) { c.moveTo(-hw, -hh + dy); c.lineTo(hw, -hh + dy); c.lineTo(hw, hh + dy); c.lineTo(-hw, hh + dy); c.lineTo(-hw - 10, dy); }
    else if (tip > 0) { c.moveTo(-hw, -hh + dy); c.lineTo(hw, -hh + dy); c.lineTo(hw + 10, dy); c.lineTo(hw, hh + dy); c.lineTo(-hw, hh + dy); }
    else { c.roundRect(-hw, -hh + dy, tw, hh * 2, 4); }
    c.closePath();
  };
  // grosimea panoului (marginea de jos, mai inchisa), apoi fata
  shape(3); c.fillStyle = '#b5794a'; c.fill(); c.strokeStyle = O; c.lineWidth = 2; c.stroke();
  shape(0); c.fillStyle = welcome ? '#fff3df' : '#e7c08f'; c.fill(); c.stroke();
  if (welcome) { c.strokeStyle = '#ff9ab8'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-hw + 3, -hh + 3, tw - 6, hh * 2 - 6, 3); c.stroke(); }
  c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle';
  fillTextIcons(c, text, tip * 3, 0.5, welcome ? 11 : 10);
  c.restore();
}
/** cat de lat e panoul (pixeli), ca sa incapa in desenul copt */
export const SIGN_MARGIN = 130;
void isoBox; void boxOf;
