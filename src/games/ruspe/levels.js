// Levels of Ruspe in fuga (docs/RUSPE-IN-FUGA.md): a night of the Comitato
// Caos sending the Muro bulldozers into the shopping mall.
// map: COLS×ROWS characters (rules.js: roads, gates, signs; anything else is
// a block, drawn by sprites.js); count: bulldozers coming out of the
// construction site; need: how many must get into the mall; interval:
// seconds between two of them, firstOut: before the first; speed: cells per
// second; time: seconds; tools: how many uses of each kid; solution: tool uses
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
    solution: [
      { at: 0, tool: 'teresa', x: 1, y: 7 },
      { at: 0, tool: 'teresa', x: 1, y: 7 },
      { at: 0, tool: 'teresa', x: 21, y: 7 },
      { at: 0, tool: 'teresa', x: 21, y: 7 },
    ],
    order: 'Le ruspe del Muro guidano da sole e seguono i cartelli. Teresa, cartelli nuovi: si va al centro commerciale.',
    win: 'Ruspe tra i profumi e i jeans. Geografia: dieci e lode.',
  },
];

// Rosanna during the round (the win lines are in each level).
export const ROSANNA = {
  first: 'Tocca una strada: cartello. Toccalo ancora: gira.',
  start: ['Classe, operazione cartelli!', 'Pennarelli carichi. Si comincia.', 'Silenzio, come una pipì sulla sabbia.'],
  in: ['Dentro! Una di meno per il Muro.', 'Ingresso secondario. Da manuale.', 'Ottimo. Avanti la prossima.'],
  empty: ['Cartelli finiti, Teresa è senza.', 'Niente più cartelli. Si improvvisa.'],
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
