// Levels of Il nodo nei ferri: each one is a tangle on Don Remo's table, and
// once it's undone it becomes a stripe of his scarf (docs/IL-NODO-NEI-FERRI.md).
// lines: how many straight lines the tangle is built from (lines·(lines−1)/2
// knots); drop: knots taken away from that; seed: the same tangle for
// everyone, so the Barriera records compare; minCrossings: how tangled it
// starts at least; time: seconds before Irene arrives; drone: first = seconds
// before the first pass, every = seconds between passes, speed in px/s, band =
// width of its scan in px; hintColors: one yarn colour per line (the threads
// of a colour end up in a row), otherwise mixed colours; stripe: how the
// stripe is knitted (sprites.js); order: Don Remo's briefing; win: his line on
// the results panel.
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
