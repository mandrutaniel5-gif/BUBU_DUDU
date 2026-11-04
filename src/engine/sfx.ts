// Sunete: inregistrari reale (src/assets/sfx, vezi docs/SUNETE.md) + sunete sintetizate WebAudio ca rezerva.
import manifest from '../assets/sfx/manifest.json';

let ac: AudioContext | null = null;
let muted = false;

function ctx() {
  if (!ac) {
    try { ac = new AudioContext(); } catch { return null; }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function noiseBuffer(a: AudioContext, dur: number) {
  const b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function env(a: AudioContext, g: GainNode, t0: number, att: number, dec: number, peak = 0.5) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + att + dec);
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol = 0.3, delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(a, g, t, 0.01, dur, vol);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}

function fart(dur: number, vol: number) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime;
  // ton grav cu vibratie + zgomot filtrat
  const o = a.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(90, t);
  const lfo = a.createOscillator(); lfo.frequency.value = 28; const lg = a.createGain(); lg.gain.value = 35;
  lfo.connect(lg).connect(o.frequency);
  o.frequency.linearRampToValueAtTime(55, t + dur);
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 6;
  const g = a.createGain(); env(a, g, t, 0.03, dur, vol);
  o.connect(f).connect(g).connect(a.destination);
  const n = a.createBufferSource(); n.buffer = noiseBuffer(a, dur);
  const nf = a.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 180; nf.Q.value = 1.5;
  const ng = a.createGain(); env(a, ng, t, 0.02, dur, vol * 0.6);
  n.connect(nf).connect(ng).connect(a.destination);
  o.start(t); lfo.start(t); n.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
}

function noiseHit(dur: number, freq: number, vol: number, type: BiquadFilterType = 'bandpass', delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const n = a.createBufferSource(); n.buffer = noiseBuffer(a, dur);
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(); env(a, g, t, 0.005, dur, vol);
  n.connect(f).connect(g).connect(a.destination); n.start(t);
}

const SOUNDS: Record<string, () => void> = {
  fart: () => fart(0.45, 0.5),
  bigfart: () => fart(0.9, 0.65),
  bonk: () => { tone('square', 520, 140, 0.18, 0.25); tone('sine', 1500, 900, 0.4, 0.15, 0.02); },
  kiss: () => { tone('sine', 900, 2200, 0.08, 0.25); noiseHit(0.05, 3000, 0.15, 'highpass', 0.06); },
  slap: () => { noiseHit(0.12, 2500, 0.6, 'highpass'); },
  sneeze: () => { noiseHit(0.25, 1200, 0.15, 'bandpass'); noiseHit(0.35, 3500, 0.5, 'highpass', 0.25); },
  burp: () => { const a = ctx(); if (!a) return; tone('sawtooth', 110, 70, 0.6, 0.35); tone('square', 85, 60, 0.6, 0.12); },
  pop: () => tone('sine', 600, 1200, 0.08, 0.2),
  click: () => tone('triangle', 700, 900, 0.05, 0.15),
  step: () => noiseHit(0.04, 400, 0.05, 'lowpass'),
  coin: () => { tone('square', 990, 990, 0.08, 0.12); tone('square', 1320, 1320, 0.2, 0.12, 0.08); },
  good: () => { tone('triangle', 523, 523, 0.1, 0.2); tone('triangle', 659, 659, 0.1, 0.2, 0.1); tone('triangle', 784, 784, 0.25, 0.2, 0.2); },
  bad: () => { tone('sawtooth', 200, 120, 0.35, 0.15); },
  splash: () => noiseHit(0.5, 800, 0.4, 'lowpass'),
  plunge: () => { tone('sine', 160, 60, 0.18, 0.4); noiseHit(0.15, 300, 0.2, 'lowpass', 0.05); },
};

// ======================================================================
// Sunete REALE (inregistrari CC0 / CC-BY, vezi docs/SUNETE.md). Se incarca la pornire;
// pana se incarca (sau daca lipsesc) se aude varianta sintetizata de mai sus.
const FILES = import.meta.glob('../assets/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
type Man = Record<string, { files: string[]; loop?: boolean }>;
const MAN = manifest as Man;
const URL_OF: Record<string, string> = {};
for (const [k, u] of Object.entries(FILES)) URL_OF[k.split('/').pop()!] = u;
// fisierele comprimate stau in memorie (~4 MB); decodate (PCM, mult mai mari) tinem doar ce s-a folosit recent
const RAW: Record<string, ArrayBuffer> = {};
const DEC = new Map<string, AudioBuffer>();
const pending: Record<string, Promise<AudioBuffer | null>> = {};
const inUse = new Set<string>();
let decSecs = 0;
const BUDGET = 170; // secunde de sunet decodat tinute in memorie (~25 MB)
function evict() { for (const [f, b] of DEC) { if (decSecs <= BUDGET) break; if (inUse.has(f)) continue; DEC.delete(f); decSecs -= b.duration; } }
function decode(f: string): Promise<AudioBuffer | null> {
  const hit = DEC.get(f); if (hit) { DEC.delete(f); DEC.set(f, hit); return Promise.resolve(hit); }
  if (f in pending) return pending[f];
  const raw = RAW[f]; const a = ac; if (!raw || !a) return Promise.resolve(null);
  return (pending[f] = a.decodeAudioData(raw.slice(0)).then(b => { DEC.set(f, b); decSecs += b.duration; evict(); delete pending[f]; return b; }, () => { delete pending[f]; return null; }));
}
let outNode: GainNode | null = null;
let master: GainNode | null = null, sfxBus: GainNode | null = null, ambBus: GainNode | null = null;
function buses() {
  const a = ctx(); if (!a) return null;
  if (!master) {
    // compresor pe iesire: totul se aude mai tare si mai plin, fara sa "crape" cand se suprapun multe sunete
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.22;
    const out = (outNode = a.createGain()); out.gain.value = 1.35;
    master = a.createGain(); master.gain.value = muted ? 0 : 1; master.connect(comp).connect(out).connect(a.destination);
    sfxBus = a.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    ambBus = a.createGain(); ambBus.gain.value = 0.55; ambBus.connect(master);
  }
  return a;
}
/** citeste un fisier audio: fetch, iar daca nu merge (ex. file:// in aplicatia de PC) XMLHttpRequest */
async function getBytes(u: string): Promise<ArrayBuffer> {
  try { const r = await fetch(u); if (r.ok || r.status === 0) return await r.arrayBuffer(); } catch { /* incercam altfel */ }
  return new Promise((res, rej) => { const x = new XMLHttpRequest(); x.open('GET', u); x.responseType = 'arraybuffer'; x.onload = () => (x.response ? res(x.response) : rej()); x.onerror = () => rej(); x.send(); });
}
let loading: Promise<void> | null = null;
/** incarca sunetele (apelat la ecranul de incarcare); progress 0..1. Cele scurte se decodeaza imediat. */
function loadAll(progress?: (k: number) => void) {
  if (loading) return loading;
  const a = buses(); if (!a) return Promise.resolve();
  const files = Object.values(MAN).flatMap(m => m.files).filter(f => URL_OF[f]);
  let done = 0;
  loading = Promise.all(files.map(async f => {
    try { RAW[f] = await getBytes(URL_OF[f]); if (RAW[f].byteLength < 7000) await decode(f); } catch { /* lipsa */ }
    done++; progress?.(done / files.length);
  })).then(() => undefined);
  return loading;
}
const lastVar: Record<string, number> = {};
export interface PlayOpts { vol?: number; rate?: number; pan?: number; delay?: number; vary?: number }
/** reda un sunet real (o varianta aleatorie, cu o mica variatie de ton) */
export interface SndHandle { stop(fade?: number): void }
function sample(id: string, o: PlayOpts = {}): SndHandle | null {
  const list = MAN[id]?.files.filter(f => RAW[f]); const a = buses(); if (!list?.length || !a || !sfxBus) return null;
  let i = Math.floor(Math.random() * list.length); if (list.length > 1 && i === lastVar[id]) i = (i + 1) % list.length; lastVar[id] = i;
  let stopped = false, live: SndHandle | null = null;
  const t0 = performance.now();
  const go = (b: AudioBuffer | null) => {
    if (!b || stopped || performance.now() - t0 > 400) return; // prea tarziu: nu mai are rost
    const src = a.createBufferSource(); src.buffer = b;
    const vary = o.vary ?? 0.06;
    src.playbackRate.value = (o.rate ?? 1) * (1 + (Math.random() * 2 - 1) * vary);
    const g = a.createGain(); g.gain.value = o.vol ?? 1;
    let node: AudioNode = src.connect(g);
    if (o.pan && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); node = node.connect(p); }
    node.connect(sfxBus!);
    src.start(a.currentTime + (o.delay ?? 0));
    live = { stop(fade = 0.08) { try { g.gain.setTargetAtTime(0, a.currentTime, fade / 3); src.stop(a.currentTime + fade + 0.05); } catch { /* deja oprit */ } } };
  };
  const hit = DEC.get(list[i]);
  if (hit) go(hit); else decode(list[i]).then(go);
  return { stop(fade?: number) { stopped = true; live?.stop(fade); } };
}

// ---- bucle: ambiante (cu trecere lina intre zone) si surse "de loc" (foc, fantana, apa la baie)
export interface LoopOpts { bus?: 'amb' | 'sfx'; fade?: number; rate?: number; lp?: number; pan?: number }
interface Loop { src: AudioBufferSourceNode; g: GainNode; f: BiquadFilterNode; p: StereoPannerNode | null; target: number; id: string }
const loops: Record<string, Loop> = {};
function setLoop(key: string, id: string, vol: number, o: LoopOpts = {}) {
  const a = buses(); if (!a) return;
  const fade = o.fade ?? 1.2, rate = o.rate ?? 1, lp = o.lp ?? 20000, now = a.currentTime;
  let cur = loops[key];
  if (cur && cur.id !== id) { setLoop(key, cur.id, 0, { fade: 0.4 }); delete loops[key]; cur = undefined as any; }
  if (vol <= 0.001) {
    if (cur && cur.target > 0) {
      cur.target = 0; cur.g.gain.cancelScheduledValues(now); cur.g.gain.setTargetAtTime(0, now, fade / 3);
      const c = cur; setTimeout(() => { if (c.target === 0) { try { c.src.stop(); } catch { /* */ } if (loops[key] === c) delete loops[key]; const f = MAN[c.id]?.files[0]; if (f && !Object.values(loops).some(l => l.id === c.id)) inUse.delete(f); } }, fade * 1000 + 300);
    }
    return;
  }
  if (cur) {
    if (Math.abs(cur.target - vol) > 0.005) { cur.target = vol; cur.g.gain.cancelScheduledValues(now); cur.g.gain.setTargetAtTime(vol, now, fade / 3); }
    if (Math.abs(cur.src.playbackRate.value - rate) > 0.01) cur.src.playbackRate.setTargetAtTime(rate, now, 0.25);
    if (Math.abs(cur.f.frequency.value - lp) > 20) cur.f.frequency.setTargetAtTime(lp, now, 0.3);
    if (cur.p && o.pan != null) cur.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, o.pan)), now, 0.2);
    return;
  }
  const file = MAN[id]?.files[0]; if (!file || !RAW[file]) return;
  const b = DEC.get(file); if (!b) { decode(file); return; } // se decodeaza acum; data viitoare porneste
  inUse.add(file);
  const src = a.createBufferSource(); src.buffer = b; src.loop = true;
  // MP3 are o mica pauza la inceput/sfarsit: o sarim ca bucla sa fie continua
  const edge = Math.min(0.05, b.duration * 0.04); src.loopStart = edge; src.loopEnd = b.duration - edge;
  src.playbackRate.value = rate;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.Q.value = 0.5;
  const g = a.createGain(); g.gain.value = 0.0001;
  let node: AudioNode = src.connect(f).connect(g);
  let p: StereoPannerNode | null = null;
  if (a.createStereoPanner) { p = a.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan ?? 0)); node = node.connect(p); }
  node.connect((o.bus ?? 'amb') === 'amb' ? ambBus! : sfxBus!);
  src.start(now, edge + Math.random() * Math.max(0.05, b.duration - 2 * edge - 0.5)); // pornim din alt loc de fiecare data
  g.gain.setTargetAtTime(vol, now, fade / 3);
  loops[key] = { src, g, f, p, target: vol, id };
}

// ce sunete sintetizate inlocuim cu inregistrari (acelasi nume)
const REAL: Record<string, string | string[]> = { fart: ['fart', 'fart', 'fart_wet'], bigfart: 'bigfart', burp: 'burp', pop: 'pop', click: 'click', coin: 'coin', good: 'good', bad: 'bad', splash: 'splash', plunge: 'squelch', step: 'step_wood' };

export const Sfx = {
  /** reda un sunet: inregistrare reala daca exista, altfel cel sintetizat */
  play(id: string, o?: PlayOpts): SndHandle | null {
    if (muted) return null;
    try {
      let real = REAL[id] ?? (MAN[id] ? id : null);
      if (Array.isArray(real)) real = real[Math.floor(Math.random() * real.length)];
      if (real && MAN[real]?.files.some(f => RAW[f])) { if ((o?.vol ?? 1) <= 0.002) return null; played.push(real); if (played.length > 60) played.shift(); return sample(real, o); }
      if (o?.vol != null && o.vol < 0.05) return null;
      SOUNDS[id]?.();
    } catch { /* fara sunet */ }
    return null;
  },
  /** are inregistrare? */
  has(id: string) { return !!MAN[id]?.files.some(f => RAW[f]); },
  /** bucla (ambianta sau sursa de loc) sub o cheie; volumul 0 o opreste lin */
  loop(key: string, id: string, vol: number, o?: LoopOpts) { try { setLoop(key, id, vol, o); } catch { /* */ } },
  /** opreste lin toate buclele care nu sunt in lista de chei */
  keepOnly(keys: string[]) { for (const k of Object.keys(loops)) if (!keys.includes(k)) setLoop(k, loops[k].id, 0); },
  /** volumul ambiantei (ex. mai incet in minijocuri) */
  ambLevel(v: number) { const a = ac; if (a && ambBus) ambBus.gain.setTargetAtTime(v, a.currentTime, 0.4); },
  load: loadAll,
  setMuted(m: boolean) { muted = m; if (master && ac) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, 0.05); if (ac) { if (m) setTimeout(() => muted && ac?.suspend(), 120); else ac.resume(); } }, // fara sunet: oprim de tot procesarea audio (baterie)
  get muted() { return muted; },
  unlock() { const a = ctx(); if (a) { buses(); loadAll(); } },
};
// pentru teste / depanare (din consola: __sfx.loops())
const played: string[] = [];
(globalThis as any).__sfx = { tap: () => { const a = buses(); if (!a || !outNode) return null; const d = a.createMediaStreamDestination(); outNode.connect(d); return d.stream; }, loops: () => Object.fromEntries(Object.entries(loops).map(([k, l]) => [k, l.id + ':' + l.target.toFixed(2)])), decoded: () => Object.keys(MAN).filter(id => MAN[id].files.some(f => RAW[f])).length, pcm: () => Math.round(decSecs), played };
// in fundal (aplicatia minimizata / alt tab): oprim sunetul de tot, revine cand te intorci
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
