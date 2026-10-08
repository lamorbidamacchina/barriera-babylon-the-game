// Tiny chiptune sound effects synthesized with WebAudio: no audio files needed.
// The AudioContext is created on the first user gesture (browsers require it).

let ctx = null;
let master = null;
let muted = false;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.18;
  return muted;
}

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
};
