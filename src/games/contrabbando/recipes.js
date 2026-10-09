// Levels: each recipe is an order from Mei Li.
// spawnEvery: seconds between veggie waves; waveMax: veggies per wave;
// decoys: share of veggies NOT in the recipe, to make you think before cutting;
// droneEvery: seconds between drones (0 = none); otp: seconds to type the
// position code; powerups: bonus items that can appear; size: sprite scale
// (1 = the size of Fruit Ninja's first fruits), veggies shrink as levels get harder.
export const RECIPES = [
  {
    name: 'MINESTRONE DELLA RESISTENZA',
    size: 1,
    needs: { zucchina: 8, pomodoro: 4 },
    time: 50,
    spawnEvery: 1.5,
    waveMax: 2,
    decoys: 0.2,
    droneEvery: 7,
    otp: 8,
    powerups: [],
    order: 'Primo ordine: minestrone. Zucchine e pomodori. Franco lancia, tu tagli. Droni NON toccare: ti scansionano.',
  },
  {
    name: 'CAPONATA DI CONFINE',
    size: 0.9,
    needs: { melanzana: 6, pomodoro: 5, zucchina: 4 },
    time: 55,
    spawnEvery: 1.3,
    waveMax: 3,
    decoys: 0.2,
    droneEvery: 5,
    otp: 7,
    powerups: ['laser', 'valzer', 'attivatore'],
    order: 'Caponata. Melanzane come Don Remo: grosse, viola, piene di peccato. Se sistema chiede codice, tu dai codice.',
  },
  {
    name: 'RIBOLLITA DEL COPRIFUOCO',
    size: 0.8,
    needs: { cavolo: 8, bietola: 6, zucca: 2 },
    time: 60,
    spawnEvery: 1.2,
    waveMax: 3,
    decoys: 0.35,
    droneEvery: 4,
    otp: 6,
    powerups: ['laser', 'valzer', 'attivatore'],
    order: 'Ribollita. Cavolo nero di contrabbando. Se drone vede, coprifuoco anche per minestra.',
  },
  {
    name: 'VELLUTATA DEL MURO',
    size: 0.58,
    needs: { zucca: 7, zucchina: 6, bietola: 4 },
    time: 60,
    spawnEvery: 1.1,
    waveMax: 4,
    decoys: 0.4,
    droneEvery: 3.2,
    otp: 6,
    powerups: ['laser', 'valzer', 'attivatore'],
    order: 'Vellutata di zucca. Dura come Muro, ma si scioglie. Come Muro.',
  },
  {
    name: 'BOMBONIERE PER DON REMO',
    size: 0.44,
    needs: { zucchina: 20 },
    time: 55,
    spawnEvery: 0.9,
    waveMax: 4,
    decoys: 0.6,
    droneEvery: 2.6,
    otp: 5,
    powerups: ['laser', 'valzer'], // no attivatore: its burst of zucchine would finish the order
    order: 'Don Remo si sposa. Bomboniere utili e a chilometro zero: zucchine. Tante. Non chiedere.',
  },
];

// Zio Franco's comments during play.
export const FRANCO = {
  start: ['Freschissime! Zappate stanotte.', 'Taglia piano, che sono di contrabbando.', 'Se arriva la polizia, balliamo tutti.'],
  combo: ['Che mani! Altro che uncinetto.', 'Così! Come ai tempi del mercato!', 'Mei Li ti assume. Forse.'],
  drone: ['Quello è un drone, non una melanzana!', 'Ahia. Adesso ci schedano tutti.', 'Il drone non si affetta, benedetta!'],
  valzer: ['La musica, Gino!', 'Un giro di valzer e nessuno vede niente.'],
  laser: ['Vai Mei Li! Laser giocattolo, danni veri.'],
  attivatore: ['Roba di Gigi il Chimico. Non chiedere cosa c\'è dentro.'],
  wrong: ['Quello non è in ricetta! Mei Li ci ammazza.', 'Spreco! A Barriera non si butta niente.', 'Ehi, quella non la paga nessuno.'],
};

export const MEI_END = {
  win: ['Piatto servito. Non male. Non bene. Non male.', 'Mangiabile. Per Barriera è stella Michelin.', 'Brava mano. Paga comunque il caffè.'],
  lose: ['Bruciato. Come la tua dignità.', 'Questo neanche Derossi mangia.', 'Soluzione temporanea: riprova.'],
  scanned: ['Ti hanno scansionato. Adesso droni sanno ricetta.', 'Quattro numeri. Neanche quattro numeri sai fare?', 'Codice sbagliato. Adesso schedati tutti. Brava.'],
  wasted: ['Tre sbagli. Verdura non cresce su alberi.', 'Tu taglia tutto. Io paga tutto. No.', 'Spreco. Franco piange, io conto.'],
  final: 'Bomboniere pronte. Don Remo si sposa con zucchine. Barriera piange di gioia. Io no.',
};
