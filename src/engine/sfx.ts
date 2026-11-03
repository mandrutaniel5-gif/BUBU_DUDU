// Sunete sintetizate cu WebAudio (fara fisiere audio, merg si offline).

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

export const Sfx = {
  play(id: string) { if (muted) return; try { SOUNDS[id]?.(); } catch { /* fara sunet */ } },
  setMuted(m: boolean) { muted = m; },
  get muted() { return muted; },
  unlock() { ctx(); },
};
