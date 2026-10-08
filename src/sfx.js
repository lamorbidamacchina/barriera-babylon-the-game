// Tiny chiptune sound effects synthesized with WebAudio: no audio files needed.
// The AudioContext is created on the first user gesture (browsers require it).

let ctx = null;
let master = null;
let muted = false;
let primed = false;

// Must run inside a user gesture. On iOS only some events count as one
// (touchend / pointerup / click, not touchstart), so main.js calls this on
// all of them. Safe to call many times.
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.18;
    master.connect(ctx.destination);
  }
  // 'interrupted' is iOS-only: after a call, Siri or switching app.
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  if (!primed) {
    // Older iOS versions only unlock after a sound actually plays in the gesture.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
    primed = true;
  }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.18;
  return muted;
}

export const isMuted = () => muted;

// One note: wave type, start/end frequency, duration, start offset, volume.
function tone(type, f1, f2, dur, at = 0, vol = 1) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, t);
  if (f2 !== f1) osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Short burst of white noise through a filter: slices, splats, crashes.
let noiseBuf = null;
function noise(dur, { at = 0, vol = 1, freq = 3000, q = 1, type = 'bandpass', sweep } = {}) {
  if (!ctx || muted) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export const sfx = {
  coin() {
    tone('square', 988, 988, 0.08, 0, 0.6);
    tone('square', 1319, 1319, 0.35, 0.08, 0.6);
  },
  start() {
    [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.12, i * 0.07, 0.5));
    tone('triangle', 262, 262, 0.5, 0, 0.8);
  },
  blip() {
    tone('square', 620 + Math.random() * 120, 620, 0.025, 0, 0.18);
  },
  move() {
    tone('square', 440, 440, 0.04, 0, 0.35);
  },
  confirm() {
    tone('square', 660, 660, 0.06, 0, 0.45);
    tone('square', 990, 990, 0.12, 0.06, 0.45);
  },
  error() {
    tone('sawtooth', 160, 110, 0.25, 0, 0.4);
  },
  laser() {
    tone('square', 1800, 300, 0.18, 0, 0.3);
  },
  drone() {
    tone('sawtooth', 90, 70, 0.6, 0, 0.12);
  },
  swoosh() {
    noise(0.12, { freq: 1200, sweep: 5000, q: 0.8, vol: 0.25 });
  },
  slice(pitch = 1) {
    noise(0.07, { freq: 6000, q: 2, vol: 0.5 });
    tone('square', 880 * pitch, 440 * pitch, 0.08, 0, 0.25);
    noise(0.15, { freq: 500, q: 1, vol: 0.5, at: 0.02, type: 'lowpass' });
  },
  combo(n) {
    for (let i = 0; i < Math.min(n, 6); i++) tone('square', 523 * 2 ** (i / 4), 523 * 2 ** (i / 4), 0.07, i * 0.05, 0.4);
  },
  alarm() {
    for (let i = 0; i < 4; i++) tone('square', i % 2 ? 660 : 880, i % 2 ? 660 : 880, 0.12, i * 0.12, 0.45);
    noise(0.3, { freq: 200, type: 'lowpass', vol: 0.8 });
  },
  powerup() {
    [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, f, 0.1, i * 0.05, 0.7));
  },
  crash() {
    noise(0.5, { freq: 800, sweep: 80, type: 'lowpass', vol: 0.9 });
    tone('sawtooth', 300, 40, 0.5, 0, 0.3);
  },
  tick() {
    tone('square', 1200, 1200, 0.03, 0, 0.3);
  },
  key() {
    tone('square', 1000 + Math.random() * 200, 1000, 0.04, 0, 0.3);
  },
  win() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone('square', f, f, 0.14, i * 0.11, 0.5));
    tone('triangle', 131, 131, 0.7, 0, 0.8);
  },
  lose() {
    [392, 370, 349, 330].forEach((f, i) => tone('square', f, f * 0.98, 0.22, i * 0.22, 0.45));
  },
  // Oom-pa-pa: one bar of a cheap waltz. Called on a timer while slow-mo lasts.
  waltzBar(step) {
    const roots = [196, 262, 220, 147];
    const r = roots[step % roots.length];
    tone('triangle', r, r, 0.3, 0, 0.9);
    tone('square', r * 2.52, r * 2.52, 0.12, 0.33, 0.25);
    tone('square', r * 3, r * 3, 0.12, 0.66, 0.25);
  },
};
