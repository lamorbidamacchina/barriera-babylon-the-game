# Barriera Babylon — The Game

Raccolta di minigiochi 8/16 bit ispirati al romanzo *Barriera Babylon*.
Target: computer e iPad (mouse, tastiera, touch); telefono in orizzontale "best effort".

## Avvio

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

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
| F | schermo intero |
| M | audio on/off |
| F2 | effetto CRT on/off |
