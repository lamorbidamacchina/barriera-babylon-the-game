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
      '##############################',
      '#KKKKKK#######TTTTTT##########',
      '#KKKKKC#######TTTTTT##########',
      '#............................#',
      '#.##########.###############.#',
      '#.##########.###############.#',
      '#.##########.###############.#',
      '#............................#',
      '#.##########.####MMMMAMMMMMM.#',
      '#.##########.####MMMMMMMMMMM.#',
      '#.##########.####MMMMMMMMMMM.#',
      '#............................#',
      '##############################',
    ],
    count: 8,
    need: 6,
    interval: 2.5,
    firstOut: 2,
    speed: 2,
    time: 90,
    tools: { teresa: 3 },
    tip: 'Tocca una strada: cartello. Toccalo ancora: gira.',
    solution: [
      { at: 0, tool: 'teresa', x: 1, y: 7 },
      { at: 0, tool: 'teresa', x: 21, y: 7 },
    ],
    order: 'Le ruspe del Muro guidano da sole e seguono i cartelli. Teresa, cartelli nuovi: si va al centro commerciale.',
    win: 'Ruspe tra i profumi e i jeans. Geografia: dieci e lode.',
  },
  {
    name: 'I CARTELLI DEL NAVIGATORE',
    map: [
      '##############################',
      '#TTTTTTTTT###KKKKKKK##########',
      '#TTTTTTTTT###KKKCKKK##########',
      '#TTTTTTTTT#.....v............#',
      '#TTTTTTTTT#.####.###########.#',
      '#TTTTTTTTT#.####.###########.#',
      '###########.####.###########.#',
      '#MMMMMMMMM#..................#',
      '#MMMMMMMMM#.####.WWWWWWWWWWW.#',
      '#MMMMMMMMM#.####.WWWWWWWWWWW.#',
      '#MMMMMMMMM#.####.WWWWWWWWWWW.#',
      '#A.........>....>............#',
      '##############################',
    ],
    count: 10,
    need: 8,
    interval: 2,
    firstOut: 2,
    speed: 2,
    time: 90,
    tools: { teresa: 2, chiara: 2 },
    drone: { path: [[13, 11], [24, 11]], speed: 1.5 },
    // Round the drone: the sign under the gate to the left, the one by the
    // mall back the other way; marbles turn back the first bulldozers.
    solution: [
      { at: 8, tool: 'teresa', x: 16, y: 3 },
      { at: 8, tool: 'teresa', x: 11, y: 11 },
      { at: 9, tool: 'chiara', x: 25, y: 11 },
    ],
    tip: 'Chiara: biglie in strada, le ruspe tornano indietro.',
    order: 'I cartelli del navigatore portano al Muro. Girateli. E il drone guida li rimette a posto: Chiara, biglie pronte.',
    win: 'Biglie, cartelli e niente Muro. Educazione stradale: ottimo.',
  },
  {
    name: 'LA ROTONDA DELLA SFINGE',
    map: [
      '##############################',
      '#MMMMMMMMM#KKKCKKK############',
      '#MMMMMMMMM####.###############',
      '#MMMMMMMMM##.....#############',
      '#MMMMMMMMM##.SSS.#############',
      '#A...........SSS>............#',
      '############.SSS.###########.#',
      '#TTTTTTTTTT#.....WWWWWWWWWWW.#',
      '#TTTTTTTTTT###.##WWWWWWWWWWW.#',
      '#TTTTTTTTTT###.##WWWWWWWWWWW.#',
      '#TTTTTTTTTT###.##WWWWWWWWWWW.#',
      '#TTTTTTTTTT###...............#',
      '##############################',
    ],
    count: 12,
    need: 9,
    interval: 2,
    firstOut: 2,
    speed: 2,
    time: 100,
    tools: { teresa: 2, gigi: 2 },
    drone: { path: [[12, 3], [12, 7], [16, 7], [16, 3]], speed: 2 },
    // The drone laps the roundabout with the traffic and wipes the sign to
    // the mall every 8 s: two signs alone catch 7 bulldozers at best. Foam
    // on the way out of the site holds them back, and they come out in a
    // convoy that a sign catches whole (each sign works from 9 to 12 s and
    // from 20 to 22 s).
    solution: [
      { at: 2, tool: 'gigi', x: 14, y: 2 },
      { at: 10.5, tool: 'teresa', x: 12, y: 5 },
      { at: 12, tool: 'gigi', x: 14, y: 2 },
      { at: 21, tool: 'teresa', x: 12, y: 5 },
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
