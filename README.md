# Barriera Babylon: The Game

Una raccolta di minigiochi per browser in stile retro, ispirati al romanzo *Barriera Babylon* (Golem Edizioni).

Il romanzo è ambientato in una Barriera di Milano (Torino) di un futuro molto vicino, tra droni, coprifuoco e un codice OTP con cui confermare ogni giorno la propria posizione. I clienti del Bar Stella di Mei Li e i bambini del Comitato Caos rispondono al cantiere del "Muro" con battute, sabotaggi e caos organizzato.

Nel gioco si parte dal Bar Stella: Mei Li assegna i lavori e ogni lavoro è un minigioco. Il primo è *Il contrabbando di Zio Franco*: tagliare al volo la verdura giusta per le ricette di Mei Li, senza toccare i droni. Altri minigiochi sono in arrivo.

- Gioca online: [lamorbidamacchina.github.io/barriera-babylon-the-game](https://lamorbidamacchina.github.io/barriera-babylon-the-game/)
- Il sito del romanzo, con il test "chi sei tu dentro Barriera?": [barrierababylon.it](https://barrierababylon.it)
- Per acquistare il libro: [Barriera Babylon su golemedizioni.it](https://www.golemedizioni.it/prodotto/barriera-babylon/)

Target: computer e iPad (mouse, tastiera, touch); telefono in orizzontale "best effort".

## Avvio

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

## Online

https://lamorbidamacchina.github.io/barriera-babylon-the-game/ — pubblicato da GitHub Actions a ogni push su `main`.

## Classifica

I record di Barriera (miglior punteggio per livello, con il nickname) stanno in un Google Sheet con uno script Apps Script, `tools/leaderboard/Code.gs`: le istruzioni sono all'inizio del file. Senza URL in `src/leaderboard.js` la classifica è spenta e il gioco funziona lo stesso.

## Struttura

- `src/main.js` — avvio Phaser, scaling a multipli interi, effetto CRT, tasti globali
- `src/scenes/` — `Title` (gettone/start) → `Bar` (Mei Li) → `Menu` (lavagna) → minigiochi
- `src/data/` — battute di Mei Li, elenco dei giochi
- `src/sfx.js` — effetti sonori chiptune sintetizzati (niente file audio)
- `src/leaderboard.js` — record di Barriera online; `tools/leaderboard/Code.gs` — lo script del Google Sheet (vedi "Classifica")
- `art/source/` — illustrazioni promozionali originali
- `tools/pixelize.mjs` — le converte in ritratti pixel art (`npm run pixelize`)

Risoluzione interna 480×270, font Press Start 2P (in MAIUSCOLO usare `CAFFE'` invece di `CAFFÈ`).

## Tasti

| Tasto | Azione |
|---|---|
| clic / tocco / qualsiasi tasto | gettone, poi start |
| frecce, Invio, Esc | navigazione menu |
| mouse premuto / dito + trascina | taglia (Contrabbando) |
| P o Esc | pausa |
| cifre, Backspace | codice della verifica OTP |
| F | schermo intero |
| M | audio on/off |
| F2 | effetto CRT on/off |

---

## English

A collection of retro-style browser minigames, inspired by the novel *Barriera Babylon* (Golem Edizioni).

The novel is set in Barriera di Milano, a neighbourhood of Turin, in the very near future: drones, a curfew, and an OTP code to confirm your position every day. The regulars of Mei Li's Bar Stella and the kids of the Comitato Caos answer the building site of the "Muro" (the Wall) with jokes, sabotage and organised chaos.

The game starts at the Bar Stella: Mei Li hands out jobs, and each job is a minigame. The first one is *Il contrabbando di Zio Franco* (Uncle Franco's smuggling): slice the right vegetables in mid-air for Mei Li's recipes, without touching the drones. More minigames are on the way. The game itself is in Italian.

- Play online: [lamorbidamacchina.github.io/barriera-babylon-the-game](https://lamorbidamacchina.github.io/barriera-babylon-the-game/)
- The novel's website, with the "who are you in Barriera?" quiz (in Italian): [barrierababylon.it](https://barrierababylon.it)
- To buy the book: [Barriera Babylon on golemedizioni.it](https://www.golemedizioni.it/prodotto/barriera-babylon/)

Target: computer and iPad (mouse, keyboard, touch); landscape phones are "best effort".

### Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

### Online

https://lamorbidamacchina.github.io/barriera-babylon-the-game/ — published by GitHub Actions on every push to `main`.

### Leaderboard

The Barriera records (best score per level, with the player's nickname) live in a Google Sheet behind an Apps Script, `tools/leaderboard/Code.gs`: setup steps are at the top of that file. With no URL in `src/leaderboard.js` the leaderboard is off and the game works anyway.

### Structure

- `src/main.js` — Phaser startup, integer scaling, CRT effect, global keys
- `src/scenes/` — `Title` (coin/start) → `Bar` (Mei Li) → `Menu` (chalkboard) → minigames
- `src/data/` — Mei Li's lines, list of games
- `src/sfx.js` — synthesised chiptune sound effects (no audio files)
- `src/leaderboard.js` — online Barriera records; `tools/leaderboard/Code.gs` — the Google Sheet script (see "Leaderboard")
- `art/source/` — original promotional illustrations
- `tools/pixelize.mjs` — turns them into pixel-art portraits (`npm run pixelize`)

Internal resolution 480×270, font Press Start 2P (in UPPERCASE text write `CAFFE'` instead of `CAFFÈ`: the font draws accented capitals like lowercase).

### Controls

| Key | Action |
|---|---|
| click / tap / any key | insert coin, then start |
| arrows, Enter, Esc | menu navigation |
| mouse held / finger + drag | slice (Contrabbando) |
| P or Esc | pause |
| digits, Backspace | OTP check code |
| F | fullscreen |
| M | sound on/off |
| F2 | CRT effect on/off |
