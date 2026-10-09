# Barriera Babylon — The Game

Un gioco per browser in stile 8/16 bit: una raccolta di minigiochi ispirati al romanzo *Barriera Babylon* (Golem Edizioni).

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

## Struttura

- `src/main.js` — avvio Phaser, scaling a multipli interi, effetto CRT, tasti globali
- `src/scenes/` — `Title` (gettone/start) → `Bar` (Mei Li) → `Menu` (lavagna) → minigiochi
- `src/data/` — battute di Mei Li, elenco dei giochi
- `src/sfx.js` — effetti sonori chiptune sintetizzati (niente file audio)
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
