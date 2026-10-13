import { RECIPES } from '../games/contrabbando/recipes.js';
import { LEVELS as MURO_LEVELS } from '../games/muro/levels.js';
import { LEVELS as FERRI_LEVELS } from '../games/ferri/levels.js';

// The "menu del giorno" on Mei Li's chalkboard. Each entry is a minigame;
// levels: how many it has, to tick the ones played to the end.
export const GAMES = [
  {
    id: 'contrabbando',
    scene: 'Contrabbando',
    title: 'IL CONTRABBANDO DI ZIO FRANCO',
    desc: 'Affetta la verdura, schiva i droni.',
    portrait: 'zio-franco-96',
    available: true,
    levels: RECIPES.length,
    mei: 'Zucchine di Franco. Fresche. Forse rubate. Io non chiedo.',
  },
  {
    id: 'muro',
    scene: 'MuroPanic',
    title: 'MURO PANIC',
    desc: 'Il Comitato Caos contro il Muro.',
    portrait: 'rosanna-96',
    available: true,
    levels: MURO_LEVELS.length,
    mei: 'Bambini di Rosanna buttano giù Muro. Io vendo merenda.',
  },
  {
    id: 'ferri',
    scene: 'NodoNeiFerri',
    title: 'IL NODO NEI FERRI',
    desc: 'Sciogli i fili, non tagliare niente.',
    portrait: 'don-remo-96',
    available: true,
    levels: FERRI_LEVELS.length,
    mei: 'Don Remo prima finisce sciarpa. Tre mesi che ci prova.',
  },
  {
    id: 'ruspe',
    title: 'RUSPE IN FUGA',
    desc: 'Devia le ruspe dentro il centro commerciale.',
    portrait: 'barriera-96',
    available: false,
    mei: 'Ruspe in Auchan? Già successo. Cucina chiusa.',
  },
];

// Every level of the game won at least once (each game saves under its id
// how many levels it has unlocked: one more than the last one won).
export const isComplete = (game, save) => !!game.levels && (save[game.id]?.unlocked ?? 0) >= game.levels;
