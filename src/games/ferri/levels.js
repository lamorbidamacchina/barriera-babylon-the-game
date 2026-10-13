// Levels of Il nodo nei ferri: each one is a tangle on Don Remo's table, and
// once it's undone it becomes a stripe of his scarf (docs/IL-NODO-NEI-FERRI.md).
// lines: how many straight lines the tangle is built from (lines·(lines−1)/2
// knots); drop: knots taken away from that; seed: the same tangle for
// everyone, so the Barriera records compare; minCrossings: how tangled it
// starts at least; time: seconds before Irene arrives; drone: first = seconds
// before the first pass, every = seconds between passes, speed in px/s, band =
// width of its scan in px, count = drones flying together (1 if missing);
// hintColors: one yarn colour per line (the threads of a colour end up in a
// row), otherwise mixed colours; stripe: how the stripe is knitted
// (sprites.js); order: Don Remo's briefing; win: his line on the results panel.
export const LEVELS = [
  {
    name: 'IL PRIMO GIRO',
    lines: 4,
    drop: 0,
    seed: 1013,
    minCrossings: 4,
    time: 90,
    drone: { first: 20, every: 30, speed: 60, band: 40 },
    hintColors: true,
    stripe: 'bands',
    order: 'Tre mesi su questa sciarpa e un nodo mi blocca tutto. Non tagliare: se tagli, cade tutto. Sciogli i fili.',
    win: 'Prima riga di sciarpa. Tre mesi per una riga: è un miracolo.',
  },
  {
    name: 'I GOMITOLI DI MEI LI',
    lines: 5,
    drop: 0,
    seed: 2024,
    minCrossings: 8,
    time: 120,
    drone: { first: 15, every: 22, speed: 70, band: 40 },
    hintColors: true,
    stripe: 'pois',
    order: 'Mei Li distribuisce gomitoli come pastiglie di libertà. Lei li lancia, io li sbroglio. Tu mi aiuti.',
    win: 'Mei Li dice che non è bella. Però è calda. Basta e avanza.',
  },
  {
    name: 'SFERRUZZAMENTO SOLIDALE',
    lines: 6,
    drop: 2,
    seed: 3033,
    minCrossings: 12,
    time: 150,
    drone: { first: 12, every: 18, speed: 75, band: 40 },
    hintColors: false,
    stripe: 'patchwork',
    order: 'Diciotto maglioni e sei coperte entro fine mese, dice Rosanna. Io intanto ho questo nodo. Priorità.',
    win: 'Rosanna mi ha dato nove. In seminario non ho mai superato il quattro.',
  },
  {
    name: 'IL TRENTOTTESIMO NO',
    lines: 6,
    drop: 0,
    seed: 4044,
    minCrossings: 16,
    time: 170,
    drone: { first: 10, every: 15, speed: 85, band: 40 },
    hintColors: false,
    stripe: 'hearts',
    order: 'Trentasette volte Irene ha detto no. Stasera ci riprovo, con la sciarpa quasi finita.',
    win: 'No, ha detto. Trentotto. Ma stavolta ha sorriso.',
  },
  {
    name: 'IL MATRIMONIO',
    lines: 7,
    drop: 3,
    seed: 5055,
    minCrossings: 20,
    time: 180,
    drone: { first: 10, every: 12, speed: 85, band: 40, count: 2 },
    hintColors: false,
    stripe: 'wedding',
    order: "Alla trentanovesima Irene ha detto sì. Ultimo nodo, poi all'altare. Stavolta dall'altra parte.",
    win: 'Sciarpa finita, anello di plastica verde. Finché nodo non ci separi.',
  },
];

// Don Remo during the round and after a lost one (the win lines are in each
// level).
export const DON_REMO = {
  start: ['Nel nome del ferro, del filo e del gomitolo.', 'Pazienza e ferri. Via.', 'Niente forbici. È un ordine.'],
  first: 'Trascina i gomitoli: nessun filo deve incrociarsi.',
  drone: ['Drone! Mani ferme, faccia da rosario.', 'Occhio in cielo. E non è il Signore.', 'Arriva il drone. Fai finta di pregare.'],
  caught: ['Mani in grembo, come in chiesa!', 'Il drone ha preso nota. Peggio del confessionale.'],
  time: ['Irene è arrivata. La sciarpa no.', 'Irene è qui. Dice: chi tardi arriva, male alloggia.'],
  strikes: ['Tre movimenti sospetti. Adesso hai un fascicolo, come me.', 'Fascicolo aperto. Ti faccio compagnia, io ne ho tre.'],
  record: ['Record di Barriera! Firma qui, come un ex voto.', 'Miracolo certificato. Il nome, per il registro.'],
};
