// Levels of Ruspe in fuga (docs/RUSPE-IN-FUGA.md): a night of the Comitato
// Caos sending the Muro bulldozers into the shopping mall.
// map: COLS×ROWS characters (rules.js: roads, gates, signs; anything else is
// a block, drawn by sprites.js); count: bulldozers coming out of the
// construction site; need: how many must get into the mall; interval:
// seconds between two of them, firstOut: before the first; speed: cells per
// second; time: seconds; tools: how many uses of each kid; drone: the guide
// drone's patrol (path: cells it flies to in turn, in straight lines, then
// back to the first; speed: cells per second); tip: Rosanna's hint on the
// new kid, the first time the level is played; solution: tool uses
// that win the level ({ at: seconds, tool, x, y }, the same cell twice turns
// the sign twice), replayed by the tests; order: Rosanna's briefing; win: her
// line on the results panel when the level is cleared.
export const LEVELS = [
  {
    name: 'CORSO GIULIO CESARE',
    map: [
      '##KKKC#TTTT####',
      '#.............#',
      '#.###.#######.#',
      '#.............#',
      '#.####MMMAMMM.#',
      '#.............#',
      '###############',
    ],
    count: 8,
    need: 6,
    interval: 2.5,
    firstOut: 2,
    speed: 1.5,
    time: 80,
    tools: { teresa: 3 },
    tip: 'Tocca un incrocio: cartello. Toccalo ancora: gira.',
    // Out of the site they turn left at the corso and loop round the outer
    // ring for ever. Right at the corso, then down into the mall.
    solution: [
      { at: 0, tool: 'teresa', x: 5, y: 3 },
      { at: 0, tool: 'teresa', x: 5, y: 3 },
      { at: 0, tool: 'teresa', x: 9, y: 3 },
    ],
    order: 'Le ruspe del Muro guidano da sole e seguono i cartelli. Teresa, cartelli nuovi: si va al centro commerciale.',
    win: 'Ruspe tra i profumi e i jeans. Geografia: dieci e lode.',
  },
  {
    name: 'I CARTELLI DEL NAVIGATORE',
    map: [
      '#TTTT####KCK###',
      '#TTTT.....v...#',
      '#####.####.##.#',
      '#MMMM.........#',
      '#MMMM.####.WW.#',
      '#A...>....>...#',
      '###############',
    ],
    count: 10,
    need: 8,
    interval: 2,
    firstOut: 2,
    speed: 1.5,
    time: 80,
    tools: { teresa: 2, chiara: 2 },
    drone: { path: [[6, 5], [12, 5]], speed: 1.2 },
    // The obvious move, turning the sign at the bottom crossing, fails: the
    // drone puts it back. Round the drone: the sign under the gate to the
    // left, the one by the mall the other way; marbles turn back the first
    // bulldozers already in the loop. Wins wherever it starts up to 10 s.
    solution: [
      { at: 8, tool: 'teresa', x: 10, y: 1 },
      { at: 8, tool: 'teresa', x: 5, y: 5 },
      { at: 9, tool: 'chiara', x: 12, y: 5 },
    ],
    tip: 'Chiara: biglie in strada, le ruspe tornano indietro.',
    order: 'I cartelli del navigatore portano al Muro. Girateli. E il drone guida li rimette a posto: Chiara, biglie pronte.',
    win: 'Biglie, cartelli e niente Muro. Educazione stradale: ottimo.',
  },
  {
    name: 'LA ROTONDA DELLA SFINGE',
    map: [
      '#MMMM#KCK######',
      '#MMMM.........#',
      '#MMMM.SSS.WWW.#',
      '#A....SSS>....#',
      '#TTTT.SSS.#####',
      '#TTTT.....#####',
      '###############',
    ],
    count: 10,
    need: 8,
    interval: 1.5,
    firstOut: 2,
    speed: 1.5,
    time: 90,
    tools: { teresa: 1, gigi: 2 },
    drone: { path: [[5, 1], [5, 5], [9, 5], [9, 1]], speed: 1.5 },
    // The drone laps the roundabout with the traffic and wipes the sign to
    // the mall at every lap: one sign alone catches 7 at best. Foam where
    // they come out of the site holds them; when it dries they come out in
    // a convoy, and one sign catches it. With foam at 2 s (and again at 6 s
    // or not), the sign wins anywhere from 23 to 28 s.
    solution: [
      { at: 2, tool: 'gigi', x: 7, y: 1 },
      { at: 6, tool: 'gigi', x: 7, y: 1 },
      { at: 25, tool: 'teresa', x: 5, y: 3 },
    ],
    tip: 'Gigi: schiuma. Le ruspe si fermano finché asciuga.',
    order: 'Rotonda della sfinge, corso Romania. Il drone ci gira attorno come un avvoltoio. Gigi, schiuma: tempismo.',
    win: 'Rotonda superata. La sfinge non ha fatto domande.',
  },
];

// Rosanna during the round (the win lines are in each level).
export const ROSANNA = {
  start: ['Classe, operazione cartelli!', 'Pennarelli carichi. Si comincia.', 'Silenzio, come una pipì sulla sabbia.'],
  in: ['Dentro! Una di meno per il Muro.', 'Ingresso secondario. Da manuale.', 'Ottimo. Avanti la prossima.'],
  drone: ['Drone guida! Rimette i cartelli a posto.', 'Il drone sistema i cartelli. Che zelo.'],
  firstReset: 'Il drone rimette i cartelli sul suo giro. Cambiate incrocio!',
  hopeless: 'Attrezzi finiti: così non entrano. Girate i cartelli o RIPROVA.',
  empty: ['Finito. Si improvvisa.', 'Munizioni finite. Ingegno, classe.'],
  record: ['Record di Barriera! Nome sul registro, in stampatello.', 'Dieci e lode. Il nome, per il registro di classe.'],
};

// The morning after, at the Bar Stella: the regulars comment the night's
// sabotage on the results panel. portrait: a 96px texture key.
export const BAR = {
  win: [
    { who: 'ZIO FRANCO', portrait: 'zio-franco-96', line: 'Avete sentito? Ruspe dritte dritte al centro commerciale di corso Giulio.' },
    { who: 'DON REMO', portrait: 'don-remo-96', line: 'Un drone ha dato l\'ok, e puff. Adesso scavano accanto al fast food.' },
    { who: 'MEI LI', portrait: 'mei-li-96', line: 'Scavano tutto con intelligenza artificiale e stupidità naturale.' },
  ],
  lose: [
    { who: 'ZIO FRANCO', portrait: 'zio-franco-96', line: 'Le ruspe hanno girato in tondo tutta la notte. Come il mio Campari.' },
    { who: 'DON REMO', portrait: 'don-remo-96', line: 'Tutta la notte a girare a vuoto. Come me in seminario.' },
    { who: 'MEI LI', portrait: 'mei-li-96', line: 'Ruspe ancora per strada. Domani riprovare. Caffè costa uguale.' },
  ],
};
