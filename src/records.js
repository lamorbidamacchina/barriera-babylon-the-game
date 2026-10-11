import { C, N } from './config.js';
import { text, blink, panel, textInput, overlay, button, typeText } from './ui.js';
import { writeSave } from './save.js';
import { getRecord, onRecords, submitRecord, cleanNickname, NICKNAME_MAX } from './leaderboard.js';

// The Barriera records on screen, shared by the minigames: who holds a
// level's record (under the host's portrait in the intro) and the panel
// asking a new record holder for a name.

// Three centred lines at (cx, y): RECORD / nickname / score, or the host's
// name (`name`, two lines) while the records are unknown (offline on the first
// launch). Redrawn in place when fresher records arrive while it's open.
export function drawBarrieraRecord(scene, o, game, level, cx, y, name) {
  const lines = [0, 11, 22].map((dy, i) =>
    o.add(text(scene, cx, y + dy, '', { color: [C.ocraLight, C.white, C.ocraLight][i], origin: [0.5, 0] })),
  );
  const show = () => {
    if (!lines[0].active) return;
    const r = getRecord(game, level);
    const rows = r === undefined ? [...name, ''] : r ? ['RECORD', r.nickname, String(r.score)] : ['RECORD', 'LIBERO!', ''];
    lines.forEach((t, i) => t.setText(rows[i] ?? ''));
    lines[0].setColor(r === undefined ? C.ocraLight : C.pink);
    lines[1].setColor(r === undefined ? C.ocraLight : C.white);
  };
  show();
  const off = onRecords(show);
  scene.events.once('shutdown', off);
}

// New Barriera record: the host (portrait: a 96px texture key; line: what
// they say) asks for a name for the chalkboard, prefilled with the last one
// used (this is also how a player changes it). The record goes online in the
// background; skipping keeps it on this device only. done(named) afterwards.
export function askNickname(scene, { game, level, total, portrait, line }, done) {
  const o = overlay(scene);
  // High on the screen: on a phone the keyboard covers the bottom half.
  const P = { x: 60, y: 20, w: 360, h: 128 };
  panel(o.add(scene.add.graphics()), P.x, P.y, P.w, P.h, { border: N.pink });
  const g = o.add(scene.add.graphics());
  panel(g, P.x + 14, P.y + 16, 96, 96, { fill: N.black, alpha: 1 });
  o.add(scene.add.image(P.x + 14, P.y + 16, portrait).setOrigin(0));

  const X = P.x + 122;
  const cx = X + (P.w - 136) / 2;
  const title = o.add(text(scene, cx, P.y + 14, 'RECORD DI BARRIERA!', { color: C.pink, origin: [0.5, 0] }));
  blink(scene, title, 300);
  o.add(text(scene, cx, P.y + 26, String(total), { color: C.ocraLight, origin: [0.5, 0] }));
  const said = o.add(text(scene, X, P.y + 42, '', { color: C.white, wrap: P.w - 136, lineSpacing: 4 }));
  typeText(scene, said, line);

  let asking = true;
  const finish = (name) => {
    if (!asking) return;
    asking = false;
    const nickname = cleanNickname(name ?? '').trim();
    field.remove();
    o.close();
    if (nickname) {
      scene.save.nickname = nickname;
      writeSave(scene.save);
      navigator.storage?.persist?.().catch(() => {}); // fewer evictions, where the browser agrees
      submitRecord(game, level, nickname, total);
    }
    done(!!nickname);
  };
  const field = textInput(scene, cx, P.y + 82, {
    maxLength: NICKNAME_MAX,
    value: scene.save.nickname ?? '',
    placeholder: 'NOME',
    filter: cleanNickname,
    onEnter: (v) => v.trim() && finish(v),
    onEscape: () => finish(null),
  });
  button(scene, o, cx - 70, P.y + 100, 'OK', () => field.value().trim() && finish(field.value()), 64);
  button(scene, o, cx + 6, P.y + 100, 'SALTA', () => finish(null), 64);
}
