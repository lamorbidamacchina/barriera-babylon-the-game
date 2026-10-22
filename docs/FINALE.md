# Il finale — documento di design

La schermata finale di Barriera Babylon, per chi vince tutti i livelli dei quattro minigiochi. Progettata e realizzata il 22 ottobre 2026.

## 1. Idea

Barriera sfila in piazza Crispi, sotto la sua tettoia, e viene verso chi guarda. La composizione si ispira al *Quarto Stato* di Pelizza da Volpedo: una folla che avanza e una prima fila davanti. Poi la scena si sposta sul Muro, e le ruspe del cantiere, ormai dalla parte del Comitato, lo buttano giù. Infine compare "FINE", con l'invito a leggere il romanzo.

Il dipinto serve solo come riferimento per la composizione. Il titolo sullo schermo è soltanto **BARRIERA BABYLON**, senza sottotitolo: "Il Quarto Stato di Barriera" non c'entrava con il romanzo.

## 2. Chi sfila

Barriera è un quartiere di molte comunità, e la folla le mostra tutte, mescolate in ogni fila: mai le comunità tutte dietro.

- **Prima fila** (64 px): Mei Li al centro; Zio Franco, con un porro del suo contrabbando; Rosanna che tiene per mano Luna. Ai lati un uomo nigeriano e una donna bengalese in sari.
- **Seconda fila** (48 px): Don Remo e Bea, insieme a una donna pakistana, un uomo nordafricano e una donna nigeriana.
- **I bambini del Comitato Caos** (36 px): Teresa (fascia da ninja, pennarello rosa), Chiara (elmetto, sacchetto di biglie), Gigi (occhialini, camice, bottiglia di cola), Samir (bandana, cuffie, cassa bluetooth), Ayoub (cappuccio, telefono), Marco (un cavolo in braccio).
- **Dietro** (40 e 28 px): tutto il quartiere mescolato.

Le persone delle comunità si riconoscono dai vestiti, mai da tratti caricaturali:
- nigeriane: stoffe wax e il *gele*;
- nordafricane: hijab, djellaba;
- bengalesi: sari, panjabi con il *tupi*;
- pakistane: shalwar kameez, dupatta;
- cinesi: un signore anziano con il berretto e la borsa della verdura.

C'è anche qualche vicino italiano: una nonna con il carrello della spesa, un operaio in tuta. Le tonalità della pelle vanno dalla più chiara alla più scura.

Le figure sono viste di fronte e hanno due fotogrammi di camminata. Sono disegnate in codice in `src/finale/figures.js`, su una griglia di 32×64 per gli adulti e di 22×40 per i bambini, ridotte per le file più lontane.

## 3. Piazza Crispi

Disegnata dalla foto della tettoia (`src/finale/piazza.js`), in prospettiva centrale verso il fondo:
- pilastri tondi azzurri coperti di adesivi e manifesti strappati, uno con un divieto di sosta;
- in cima a ogni pilastro, un "albero" di puntoni verde scuro;
- un tetto a padiglione di lastre ondulate traslucide su una griglia di travi verdi, con il lucernario rialzato al centro;
- sotto, il cemento grigio con i giunti;
- intorno, i caseggiati beige e di mattoni, con le persiane.

## 4. Il Muro

La strada a destra della piazza (`src/finale/muro.js`). Il Muro è quello di Muro Panic (`drawWall`), diviso in pannelli da 40 px. Dietro ci sono i cinque panorami di Torino dei livelli di Muro Panic, una striscia ciascuno: l'università, i poliambulatori, il parco, l'asilo nido, la casa. Quando il Muro cade si vedono tutti i diritti che nascondeva.

Le ruspe, viste di lato e firmate in rosa da Teresa, passano lungo la base del Muro. Ogni pannello che toccano si ribalta all'indietro, con polvere, calcinacci, `sfx.crash` e la telecamera che trema.

## 5. La sequenza (`src/scenes/Finale.js`)

| Tempo | Cosa succede |
|---|---|
| 0–13 s | La sfilata: un passo ogni 320 ms con il rumore dei passi, la folla avanza di qualche pixel. A 1,5 s compare il titolo. |
| 13–17 s | La telecamera scorre dalla piazza al Muro. |
| 17–29 s circa | Le ruspe buttano giù i dodici pannelli. |
| +2,5 s | FINE: Mei Li ("Muro giù. Bar aperto. Caffè costa uguale."), poi "La storia continua su BARRIERA BABYLON" e barrierababylon.it. |

- Un tocco, un clic, Invio, Spazio o Esc passano alla parte successiva; alla fine tornano al menu.
- Niente musica, solo effetti (`sfx.step`, `sfx.engine`).
- I tempi della sfilata sono contati fotogramma per fotogramma in `update()`. Un `delayedCall` impostato in `create()` poteva scattare in anticipo, quando l'orologio del gioco recupera al primo fotogramma della scena.

## 6. Quando si vede

- `allComplete(save)` in `src/data/games.js`: tutti i giochi disponibili sono completi.
- La prima volta il menu lancia il finale da solo, e il finale salva `finaleSeen`.
- Da lì in poi, sulla lavagna compare la riga **IL FINALE**, con la didascalia "OMAGGIO" e la battuta di Mei Li "Tutto finito. Muro giù. Offre la casa, una volta sola."

## 7. Video

Per mandarlo in giro (per esempio all'autore, su WhatsApp) si può registrare la scena dal browser:
1. Registrare il canvas con `MediaRecorder`. Per avere anche gli effetti sonori si intercetta `AudioNode.connect` verso un `MediaStreamDestination`.
2. Convertire con ffmpeg in MP4 H.264 + AAC, ingrandito 3× senza sfumature: `scale=1440:810:flags=neighbor`, `-pix_fmt yuv420p`, `-movflags +faststart`.

Viene fuori circa 42 secondi, sotto i 6 MB.
