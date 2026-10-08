// Diagnostic overlay, enabled by adding ?debug to the URL.
// Shows in real time what the browser sends (touch / pointer events), what
// Phaser understood (its pointers) and what the game is doing (scene, state,
// current swipe), plus a log of notable events. Built to chase the iPhone bug
// where swipes stop registering for a few seconds.

const LOG_SIZE = 10;

export function initDebug(game) {
  if (!new URLSearchParams(location.search).has('debug')) return;

  const el = document.createElement('pre');
  el.id = 'debug';
  Object.assign(el.style, {
    position: 'fixed',
    left: 'max(4px, env(safe-area-inset-left))',
    top: '4px',
    zIndex: 30,
    margin: 0,
    padding: '4px 6px',
    maxWidth: '60vw',
    font: '9px/1.25 ui-monospace, Menlo, monospace',
    color: '#9be36b',
    background: 'rgba(0, 0, 0, 0.72)',
    pointerEvents: 'none',
    whiteSpace: 'pre-wrap',
  });
  document.body.appendChild(el);

  const t0 = performance.now();
  const now = () => ((performance.now() - t0) / 1000).toFixed(1);
  const log = [];
  const push = (msg) => {
    log.push(`${now()} ${msg}`);
    if (log.length > LOG_SIZE) log.shift();
  };

  // What the browser delivers, before Phaser sees it.
  const counts = {};
  let lastNative = '-';
  let touchesNow = 0;
  const describe = (t) => (t === game.canvas ? 'canvas' : t?.id ? `#${t.id}` : t?.tagName?.toLowerCase() ?? '?');
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointerup', 'pointercancel']) {
    window.addEventListener(
      ev,
      (e) => {
        counts[ev] = (counts[ev] ?? 0) + 1;
        if (e.touches) touchesNow = e.touches.length;
        const p = e.changedTouches?.[0] ?? e;
        lastNative = `${ev} ${Math.round(p.clientX)},${Math.round(p.clientY)} on ${describe(e.target)}`;
        if (ev !== 'touchmove') push(lastNative);
        if (ev === 'touchcancel' || ev === 'pointercancel') push(`!!! ${ev.toUpperCase()}`);
      },
      { capture: true, passive: true },
    );
  }
  document.addEventListener('visibilitychange', () => push(`visibility ${document.visibilityState}`));
  window.visualViewport?.addEventListener('resize', () => push(`viewport ${Math.round(visualViewport.width)}x${Math.round(visualViewport.height)}`));

  // What the game does with it: scene-level events, hooked on every (re)start.
  for (const scene of game.scene.scenes) {
    scene.events.on('create', () => {
      push(`scene ${scene.scene.key} start`);
      scene.input.on('pointerdown', (p) => push(`game down #${p.id} ${Math.round(p.x)},${Math.round(p.y)} state=${scene.state ?? '-'}`));
      scene.input.on('pointerup', (p) => push(`game up #${p.id}`));
      scene.input.on('pointerdownoutside', (p) => push(`game down OUTSIDE #${p.id}`));
    });
  }

  let lastState = null;
  let frames = 0;
  let fps = 0;
  let lastFpsT = performance.now();
  game.events.on('poststep', () => frames++);

  setInterval(() => {
    const t = performance.now();
    fps = Math.round((frames * 1000) / (t - lastFpsT));
    frames = 0;
    lastFpsT = t;

    const scene = game.scene.getScenes(true)[0];
    const state = scene?.state ?? '-';
    const key = scene?.scene.key ?? '-';
    if (`${key}/${state}` !== lastState) {
      push(`state ${key}/${state}`);
      lastState = `${key}/${state}`;
    }

    const pointers = game.input.pointers
      .map((p) => `#${p.id}${p.id === 0 ? '(mouse)' : ''} ${p.isDown ? 'DOWN' : 'up'}${p.active ? ' active' : ''} ${Math.round(p.x)},${Math.round(p.y)}`)
      .join('\n  ');
    const b = game.canvas.getBoundingClientRect();
    const vv = window.visualViewport;
    const stroke = scene?.stroke ? `yes (pointer ${scene.strokePointer}, combo ${scene.stroke.combo})` : 'no';

    el.textContent = [
      `loop ${game.loop.running ? 'running' : 'SLEEPING'}  ${fps} fps`,
      `scene ${key}  state ${state}`,
      `swipe ${stroke}  trail ${scene?.trail?.length ?? '-'}`,
      `touches on screen ${touchesNow}`,
      `pointers\n  ${pointers}`,
      `last ${lastNative}`,
      `n ts${counts.touchstart ?? 0} tm${counts.touchmove ?? 0} te${counts.touchend ?? 0} tc${counts.touchcancel ?? 0} pd${counts.pointerdown ?? 0} pc${counts.pointercancel ?? 0}`,
      `canvas ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`,
      vv ? `viewport ${Math.round(vv.width)}x${Math.round(vv.height)} off ${Math.round(vv.offsetLeft)},${Math.round(vv.offsetTop)} zoom ${vv.scale.toFixed(2)}` : '',
      '--- log',
      ...log,
    ].join('\n');
  }, 150);

  push('debug on');
}
