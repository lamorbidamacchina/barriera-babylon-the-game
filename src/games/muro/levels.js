// Levels of Muro Panic: each one is a stretch of the Muro with a piece of
// Torino behind it, and an order from maestra Rosanna.
// view: the picture behind the Muro (views.js); target: % of Muro to knock
// down; time: seconds; drones: one entry per drone, speed in px/s and size
// (1 = the small 18×9 drone, 2 = "il capobranco"); order: Rosanna's briefing.
export const LEVELS = [
  {
    name: 'LA MOLE ANTONELLIANA',
    view: 'mole',
    target: 70,
    time: 120,
    drones: [{ speed: 45, size: 1 }],
    order: "Ragazzi, operazione Mole! Dietro il Muro c'è la città. Tracciate, ritagliate, abbattete. Poi ripasso di grammatica.",
  },
  {
    name: 'LA BASILICA DI SUPERGA',
    view: 'superga',
    target: 72,
    time: 120,
    drones: [{ speed: 50, size: 1 }, { speed: 50, size: 1 }],
    order: 'Juvarra ci mise quattordici anni a farla. Voi avete due minuti. Due droni: la linea non la devono toccare.',
  },
  {
    name: 'LA GRAN MADRE E IL PO',
    view: 'granmadre',
    target: 75,
    time: 110,
    drones: [{ speed: 60, size: 1 }, { speed: 55, size: 1 }],
    order: 'Oltre il Muro scorre il Po. Chi ci cade dentro non è giustificato. Pennarelli in pugno!',
  },
  {
    name: 'IL LINGOTTO',
    view: 'lingotto',
    target: 78,
    time: 110,
    drones: [{ speed: 65, size: 1 }, { speed: 60, size: 1 }, { speed: 55, size: 1 }],
    order: 'Sul tetto del Lingotto giravano le macchine. Noi giriamo attorno ai droni. Stessa cosa, più o meno.',
  },
  {
    name: 'TORINO DI NOTTE',
    view: 'notte',
    target: 80,
    time: 120,
    drones: [{ speed: 45, size: 2 }, { speed: 70, size: 1 }, { speed: 65, size: 1 }],
    order: 'Ultima operazione, di notte. Coprifuoco? Verbo irregolare: si ignora. Attenti al capobranco.',
  },
];

// Maestra Rosanna during and after the round.
export const ROSANNA = {
  start: ['Classe, in posizione!', 'Pennarelli stappati. Via!', 'Silenzio e sabotaggio.'],
  hit: ['Ritirata strategica!', 'Linea spezzata! Ripartiamo dal bordo.', 'Il drone vi ha visto. Disinvolti.'],
  cut: ['Bene! Un altro pezzo.', 'Crolla, crolla!', 'Questo è un bel dieci.'],
  win: ['Muro giù. Domani interrogo su Garibaldi.', 'Brava classe. Merenda, poi sabotaggio.', 'Chico Mendes sarebbe fiero di voi.'],
  caught: ['Beccati. Si dice "ci hanno beccato", non "ci beccarono".', 'Tre volte presi. Nota sul registro.'],
  time: ['Campanella. Il Muro resta su. Per stavolta.', 'Tempo scaduto. Compiti: un altro Muro.'],
  final: 'Il Muro è giù e Torino è lì. Ora tutti a casa: compiti per le vacanze.',
};
