// Casele (camerele de joc): fiecare cuplu are casa lui, cu un COD unic si o PAROLA.
//
// - Codul (ex. „LALEA-7K3P”) e generat de joc, unic: nu poate exista de doua ori.
// - Parola o alegeti voi. Nu se salveaza nicaieri, nici in cloud: din cod + parola se calculeaza
//   (SHA-256) numele camerei din baza de date, de 40 de caractere. Fara parola nu ai cum sa afli camera.
// - In cloud, la houses/<amprenta codului> sta doar „codul exista” (ca sa nu se dea de doua ori).
//   Camera, la rooms/<cheia din cod + parola>, are meta = { v: 2 } (asa stim ca parola e buna).
// - Pe serverul propriu (S10) se intampla la fel, prin mesajele 'house' (vezi server/server.mjs).
import { BUILTIN_FIREBASE } from '../game/settings';
import type { NetConfig } from './types';

// ------------------------------------------------------------------ SHA-256 (fara crypto.subtle: merge si pe http in reteaua de acasa)
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
export function sha256(text: string): string {
  const msg = new TextEncoder().encode(text);
  const len = msg.length, bits = len * 8;
  const n = ((len + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(n); m.set(msg); m[len] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(n - 8, Math.floor(bits / 2 ** 32)); dv.setUint32(n - 4, bits >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  const rotr = (x: number, r: number) => (x >>> r) | (x << (32 - r));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, x => x.toString(16).padStart(8, '0')).join('');
}

// ------------------------------------------------------------------ codul si cheile
/** litere si cifre usor de citit (fara 0/O, 1/I/L) */
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const WORDS = ['LALEA', 'MACIES', 'CIRES', 'GUTUI', 'BRADUT', 'PRUNA', 'ZMEURA', 'NUFAR', 'SALCAM', 'TEI', 'MUSCATA', 'ROUA', 'SOARE', 'LUNA', 'STEA', 'NOR', 'POIANA', 'CASUTA'];
const rnd = (k: number) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % k; };
/** un cod nou, ex. „LALEA-7K3P” */
export function newCode() { let s = ''; for (let i = 0; i < 4; i++) s += ALPHA[rnd(ALPHA.length)]; return `${WORDS[rnd(WORDS.length)]}-${s}`; }
/** codul scris de mana: litere mari, fara spatii, cu o liniuta */
export function normCode(c: string) {
  const s = (c || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '');
  const m = /^([A-Z]+)([A-Z0-9]{4})$/.exec(s);
  return m ? `${m[1]}-${m[2]}` : s;
}
export const codeOk = (c: string) => /^[A-Z]{2,8}-[A-Z0-9]{4}$/.test(normCode(c));
export const passOk = (p: string) => (p || '').length >= 4;
/** amprenta codului (ce vede baza de date in loc de cod) */
export const codeKey = (code: string) => 'c' + sha256('bubududu|cod|' + normCode(code)).slice(0, 31);
/** camera: din cod + parola; fara parola nu se poate afla */
export const roomOf = (code: string, pass: string) => 'h' + sha256('bubududu|casa|v2|' + normCode(code) + '|' + pass).slice(0, 39);
/** camerele noi (sigure) au 40 de caractere si incep cu h */
export const isSecureRoom = (room: string) => /^h[0-9a-f]{39}$/.test(room || '');

export type HouseResult = { ok: true; code: string; room: string } | { ok: false; msg: string };

// ------------------------------------------------------------------ Firebase
const timeout = <T>(p: Promise<T>, ms: number, msg: string) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
async function fbDb(cfg: NetConfig['firebase']) {
  const [{ initializeApp, getApps }, fb] = await Promise.all([import('firebase/app'), import('firebase/database')]);
  const app = getApps()[0] ?? initializeApp(cfg?.databaseURL ? cfg : BUILTIN_FIREBASE);
  return { fb, db: fb.getDatabase(app) };
}
const NET_ERR = 'Nu mă pot conecta la internet. Verifică conexiunea și încearcă din nou.';

async function fbCreate(cfg: NetConfig['firebase'], pass: string, seed?: { json: string; ts: number } | null): Promise<HouseResult> {
  const { fb, db } = await timeout(fbDb(cfg), 8000, NET_ERR);
  for (let tries = 0; tries < 6; tries++) {
    const code = newCode(), key = codeKey(code), room = roomOf(code, pass);
    // rezervam codul doar daca nu exista (tranzactie: doua telefoane nu pot primi acelasi cod)
    const tr: any = await timeout(fb.runTransaction(fb.ref(db, `houses/${key}`), (cur: unknown) => (cur ? undefined : { t: Date.now() })), 8000, NET_ERR);
    if (!tr.committed) continue;
    await timeout(fb.set(fb.ref(db, `rooms/${room}/meta`), { v: 2, t: Date.now() }), 8000, NET_ERR);
    if (seed?.json) await timeout(fb.set(fb.ref(db, `rooms/${room}/save`), { json: seed.json, ts: Date.now() }), 12000, NET_ERR);
    return { ok: true, code, room };
  }
  return { ok: false, msg: 'Nu am putut face un cod nou. Mai încearcă o dată.' };
}
async function fbJoin(cfg: NetConfig['firebase'], code: string, pass: string): Promise<HouseResult> {
  const { fb, db } = await timeout(fbDb(cfg), 8000, NET_ERR);
  const c = normCode(code), room = roomOf(c, pass);
  const h = await timeout(fb.get(fb.ref(db, `houses/${codeKey(c)}`)), 8000, NET_ERR);
  if (!(h as any).exists()) return { ok: false, msg: `Nu există nicio casă cu codul ${c}. Verifică literele.` };
  const m = await timeout(fb.get(fb.ref(db, `rooms/${room}/meta`)), 8000, NET_ERR);
  if (!(m as any).exists()) return { ok: false, msg: 'Parola nu e bună pentru casa asta.' };
  return { ok: true, code: c, room };
}

// ------------------------------------------------------------------ serverul nostru (S10 / PC)
function wsAsk(url: string, msg: object): Promise<any> {
  return new Promise((res, rej) => {
    let ws: WebSocket; try { ws = new WebSocket(url); } catch { rej(new Error('Adresa serverului nu e bună.')); return; }
    const t = setTimeout(() => { try { ws.close(); } catch { /* */ } rej(new Error('Serverul nu răspunde. E pornit și are ultima versiune (git pull)?')); }, 8000);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'house', ...msg }));
    ws.onmessage = m => { try { const d = JSON.parse(m.data); if (d.t === 'house') { clearTimeout(t); ws.close(); res(d); } } catch { /* */ } };
    ws.onerror = () => { clearTimeout(t); rej(new Error('Serverul nu răspunde. E pornit?')); };
  });
}
async function wsCreate(url: string, pass: string, seed?: { json: string; ts: number } | null): Promise<HouseResult> {
  for (let tries = 0; tries < 6; tries++) {
    const code = newCode(), room = roomOf(code, pass);
    const r = await wsAsk(url, { op: 'create', key: codeKey(code), room, save: seed?.json ? { json: seed.json, ts: Date.now() } : undefined });
    if (r.old) return { ok: false, msg: 'Serverul are o versiune veche. Actualizează-l (git pull) și pornește-l din nou.' };
    if (r.ok) return { ok: true, code, room };
  }
  return { ok: false, msg: 'Nu am putut face un cod nou. Mai încearcă o dată.' };
}
async function wsJoin(url: string, code: string, pass: string): Promise<HouseResult> {
  const c = normCode(code), room = roomOf(c, pass);
  const r = await wsAsk(url, { op: 'join', key: codeKey(c), room });
  if (r.old) return { ok: false, msg: 'Serverul are o versiune veche. Actualizează-l (git pull) și pornește-l din nou.' };
  if (r.ok) return { ok: true, code: c, room };
  return { ok: false, msg: r.why === 'pass' ? 'Parola nu e bună pentru casa asta.' : `Nu există nicio casă cu codul ${c} pe server.` };
}

// ------------------------------------------------------------------ ce foloseste meniul
/** casa noua (cod unic). seed = progresul de pana acum, mutat in casa noua */
export async function createHouse(net: NetConfig, serverUrl: string, pass: string, seed?: { json: string; ts: number } | null): Promise<HouseResult> {
  if (!passOk(pass)) return { ok: false, msg: 'Parola trebuie să aibă cel puțin 4 caractere.' };
  try {
    if (net.mode === 'server') return await wsCreate(serverUrl, pass, seed);
    if (net.mode === 'solo' || net.mode === 'local') { const code = newCode(); return { ok: true, code, room: roomOf(code, pass) }; }
    return await fbCreate(net.firebase, pass, seed);
  } catch (e) { return { ok: false, msg: (e as Error).message || NET_ERR }; }
}
/** intri in casa partenerului (codul si parola de la el / ea) */
export async function joinHouse(net: NetConfig, serverUrl: string, code: string, pass: string): Promise<HouseResult> {
  if (!codeOk(code)) return { ok: false, msg: 'Codul arată așa: LALEA-7K3P (un cuvânt, liniuță, 4 litere sau cifre).' };
  if (!passOk(pass)) return { ok: false, msg: 'Parola are cel puțin 4 caractere.' };
  try {
    if (net.mode === 'server') return await wsJoin(serverUrl, code, pass);
    if (net.mode === 'solo' || net.mode === 'local') { const c = normCode(code); return { ok: true, code: c, room: roomOf(c, pass) }; }
    return await fbJoin(net.firebase, code, pass);
  } catch (e) { return { ok: false, msg: (e as Error).message || NET_ERR }; }
}
