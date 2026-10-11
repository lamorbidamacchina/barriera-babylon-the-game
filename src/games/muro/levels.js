// Levels of Muro Panic: each one is a stretch of the Muro with a piece of
// public Torino behind it (views.js), and an order from maestra Rosanna.
// view: the picture behind the Muro (views.js); target: % of Muro to knock
// down; time: seconds; drones: one entry per drone, speed in px/s, size
// (1 = the small 18×9 drone, 2 = "il capobranco") and chase: how fast it turns
// towards the marker while a line is being drawn, in radians per second
// (0 = never, 3 = sharp); patrols: the "ronde" running along the edge, speed in
// cells per second (the player does 20); order: Rosanna's briefing; win: her
// line on the results panel when the level is cleared.
// n small drones, all alike.
const swarm = (n, speed, chase) => Array.from({ length: n }, () => ({ speed, size: 1, chase }));

export const LEVELS = [
  {
    name: 'PALAZZO NUOVO',
    view: 'universita',
    target: 70,
    time: 120,
    drones: swarm(1, 40, 0.2),
    patrols: [{ speed: 6 }],
    order: "Dietro il Muro c'è l'università. Pubblica, aperta, piena di gente che studia. Tracciate, ritagliate, abbattete.",
    win: 'Università aperta! Domani lezione lì: si entra senza bussare.',
  },
  {
    name: 'POLIAMBULATORI DI QUARTIERE',
    view: 'salute',
    target: 72,
    time: 120,
    drones: swarm(2, 50, 0.45),
    patrols: [{ speed: 8 }],
    order: 'Lì ti curano senza chiederti la posizione. Abbattete il Muro: chi ha la gamba rotta ci deve arrivare.',
    win: 'Ora chi ha la gamba rotta ci arriva. Senza OTP e senza fila.',
  },
  {
    name: 'IL PARCO E IL VIALE',
    view: 'parco',
    target: 75,
    time: 110,
    drones: swarm(3, 60, 0.7),
    patrols: [{ speed: 9 }, { speed: 9 }],
    order: "Alberi, biciclette, tram, meno macchine. L'ambientalismo senza lotta di classe è giardinaggio. Pennarelli in pugno!",
    win: 'Chico Mendes sarebbe fiero di voi.',
  },
  {
    name: "L'ASILO NIDO",
    view: 'asilo',
    target: 78,
    time: 110,
    drones: swarm(4, 70, 0.95),
    patrols: [{ speed: 10 }, { speed: 10 }],
    order: 'Un asilo nido sul Po, con un posto per tutti. Lì si impara a stare insieme. E a dividere i giochi.',
    win: 'Brava classe. Il nido è aperto: merenda per tutti, poi sabotaggio.',
  },
  {
    name: 'IL DIRITTO ALLA CASA',
    view: 'casa',
    target: 80,
    time: 120,
    drones: [{ speed: 50, size: 2, chase: 1.2 }, ...swarm(4, 80, 1.2)],
    patrols: [{ speed: 11 }, { speed: 11 }, { speed: 11 }],
    order: "Ultima operazione. Dietro il Muro ci sono case vere: luce, balconi, cortili. Una casa è un diritto, non un premio.",
    win: 'Il Muro è giù e le case sono lì. Si torna a casa: compiti per le vacanze.',
  },
];

// Maestra Rosanna during the round and after a lost one (the win lines are
// in each level).
export const ROSANNA = {
  start: ['Classe, in posizione!', 'Pennarelli stappati. Via!', 'Silenzio e sabotaggio.'],
  patrol: ['La ronda! Fate finta di niente.', 'Ronda sul bordo! Correre, non passeggiare.'],
  hit: ['Ritirata strategica!', 'Linea spezzata! Ripartiamo dal bordo.', 'Il drone vi ha visto. Disinvolti.'],
  cut: ['Bene! Un altro pezzo.', 'Crolla, crolla!', 'Questo è un bel dieci.'],
  caught: ['Beccati. Si dice "ci hanno beccato", non "ci beccarono".', 'Tre volte presi. Nota sul registro.'],
  time: ['Campanella. Il Muro resta su. Per stavolta.', 'Tempo scaduto. Compiti: un altro Muro.'],
  record: [
    'Record di Barriera! Nome alla lavagna.',
    'Dieci e lode. Firma qui, per la bacheca.',
    'Nessuno ha fatto meglio. Nome? Per il registro.',
  ],
};
