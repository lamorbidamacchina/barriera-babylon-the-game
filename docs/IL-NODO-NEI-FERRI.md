# Il nodo nei ferri — documento di design

Terzo minigioco di Barriera Babylon, scelto il 13 ottobre 2026. Ospite: **Don Remo**.

## 1. Idea e lore

Nel romanzo Bea non sa dove mettere un piccolo magone, e Mei Li le risponde:

> "È come un nodo nei ferri. Non lo puoi tagliare, perché poi cade tutto. Devi scioglierlo sferruzzando."

Il gioco è proprio questo: un groviglio di fili di lana da sciogliere **senza tagliare niente**. Dopo due giochi di riflessi (Contrabbando, Muro Panic) serve un rompicapo calmo, ma con un po' di pressione.

Dal romanzo:
- Don Remo, ex prete (la Curia non ce la faceva più a coprire le sue tresche), lavora a maglia "con una serietà monastica, infilando ferri e pentimenti". Sigaro elettronico, aria da cardinale in pensione.
- Prova a finire **la stessa sciarpa da tre mesi**.
- Si fidanza con **Irene**, "la madamina della chiesa" conosciuta tra i banchi della chiesa della Pace: cappello viola, mangia un panino durante la messa, parla solo per proverbi.
- Irene accetta di sposarlo **dopo trentotto rifiuti**. L'anello è di plastica verde, "lucido come una biglia".
- Mei Li organizza lo "Sferruzzamento solidale con tè e melissa": Rosanna vuole diciotto maglioni e sei coperte entro fine mese, e Mei Li distribuisce gomitoli "come fossero pastiglie di libertà".

Filo conduttore: ogni groviglio sciolto diventa una **riga della sciarpa** di Don Remo. All'ultimo livello la sciarpa è finita ed è il regalo per il matrimonio con Irene.

## 2. Regole

- Sul tavolo ci sono dei **gomitoli** (i nodi) collegati da **fili di lana**.
- Si trascinano i gomitoli finché **nessun filo ne incrocia un altro** e nessun filo passa sopra un gomitolo che non è uno dei suoi capi.
- I fili che si incrociano sono rossi, con un puntino rosso su ogni incrocio. I fili liberi tornano del loro colore.
- La vittoria si controlla quando si lascia un gomitolo.
- Non si taglia niente: non esiste un'azione per tagliare.

Il groviglio si costruisce a partire da alcune rette che si incrociano (gli incroci diventano i gomitoli, i tratti tra due incroci diventano i fili), poi i gomitoli vengono sparpagliati su un cerchio. Così **ogni livello ha sempre una soluzione**. Ogni livello ha un seme fisso: chiunque gioca lo stesso groviglio, quindi i record di Barriera sono confrontabili. Se lo sparpagliamento lascia troppo pochi incroci, si rimescola.

## 3. Pressione: il tempo

Ogni livello ha un tempo ("Irene arriva tra..."). A zero il livello è perso con il banner **IRENE E' ARRIVATA**.

## 4. Il drone

- Prima un avviso (~1,5 s): il ronzio del drone e la sua ombra sul bordo del tavolo.
- Poi il drone attraversa il tavolo trascinando una **fascia di scansione** verticale.
- Un gomitolo **tenuto in mano** dentro la fascia costa una **X**: il gomitolo torna dov'era all'inizio del trascinamento, banner **MOVIMENTO SOSPETTO!**
- I gomitoli fermi non rischiano niente: sembra che si stia solo sferruzzando. Mentre il drone passa si può continuare a lavorare dall'altra parte del tavolo.
- Tre X: livello perso, banner **FASCICOLO APERTO!**

## 5. Controlli

| Dispositivo | Azione |
|---|---|
| Dito / mouse | trascina un gomitolo (si prende il più vicino entro ~14 px, senza farlo saltare sotto il dito) |
| Tastiera | Tab / Maiusc+Tab sceglie un gomitolo, le frecce lo spostano (tenere premuta una freccia conta come tenerlo in mano, per il drone) |
| Esc / P, pulsante `II` | pausa |

## 6. Schermo (480×270)

- HUD in alto (28 px): punti, tempo, le tre X, pulsante `II`.
- Il tavolo con la tovaglia a quadri: x 8–404, y 34–262.
- La sciarpa appesa a destra (x ~414–470): solo decorativa, così l'angolo in basso a destra (dove stanno i pulsanti audio e schermo intero) non serve mai.

## 7. La sciarpa

- Una riga per ogni livello superato, con i colori dei fili di quel livello e un punto diverso: righe (livello 1), pois come le "pastiglie di libertà" di Mei Li (livello 2), patchwork come le coperte dello sferruzzamento solidale (livello 3), due cuori su lilla, il colore del cappello di Irene, il secondo spezzato per il trentottesimo no (livello 4), frange e anello verde per il matrimonio.
- Alla vittoria i fili scivolano nella sciarpa e la nuova riga si lavora una fila alla volta (un tic per fila).
- La sciarpa mostra le righe già guadagnate (dal salvataggio), quindi cresce da una partita all'altra.

## 8. Livelli

Numeri di partenza: si tarano dopo le prove su iPad, a piccoli passi come per Muro Panic.

| # | Nome | Rette | Gomitoli | Fili | Tempo | Drone | Colori |
|---|---|---|---|---|---|---|---|
| 1 | IL PRIMO GIRO | 4 | 6 | 8 | 90 s | ogni 30 s, il primo a 20 s, lento | un colore per retta (aiuto) |
| 2 | I GOMITOLI DI MEI LI | 5 | 10 | 15 | 120 s | ogni 22 s | un colore per retta |
| 3 | SFERRUZZAMENTO SOLIDALE | 6 (−2 gomitoli) | 13 | 19 | 150 s | ogni 18 s | casuali |
| 4 | IL TRENTOTTESIMO NO | 6 | 15 | 24 | 170 s | ogni 15 s, più veloce | casuali |
| 5 | IL MATRIMONIO | 7 (−3 gomitoli) | 18 | ~27 | 180 s | ogni 12 s, due droni | casuali |

Massimo 18 gomitoli: con 21 su un iPhone i gomitoli diventano troppo fitti (deciso il 13 ottobre). Per avere 13 o 18 gomitoli si parte da 6 o 7 rette e si tolgono gomitoli: una delle due rette passa dritta nel buco, l'altra si interrompe; nessun gomitolo resta attaccato a un filo solo.

Con un colore per retta, i fili dello stesso colore nella soluzione stanno in fila: è l'aiuto dei primi due livelli.

### Testi dei livelli (ordine di Don Remo / riga di vittoria)

1. **IL PRIMO GIRO**
   - "Tre mesi su questa sciarpa e un nodo mi blocca tutto. Non tagliare: se tagli, cade tutto. Sciogli i fili."
   - "Prima riga di sciarpa. Tre mesi per una riga: è un miracolo."
2. **I GOMITOLI DI MEI LI**
   - "Mei Li distribuisce gomitoli come pastiglie di libertà. Lei li lancia, io li sbroglio. Tu mi aiuti."
   - "Mei Li dice che non è bella. Però è calda. Basta e avanza."
3. **SFERRUZZAMENTO SOLIDALE**
   - "Diciotto maglioni e sei coperte entro fine mese, dice Rosanna. Io intanto ho questo nodo. Priorità."
   - "Rosanna mi ha dato nove. In seminario non ho mai superato il quattro."
4. **IL TRENTOTTESIMO NO**
   - "Trentasette volte Irene ha detto no. Stasera ci riprovo, con la sciarpa quasi finita."
   - "No, ha detto. Ma con un proverbio nuovo. È un passo avanti."
5. **IL MATRIMONIO**
   - "Alla trentanovesima Irene ha detto sì. Ultimo nodo, poi all'altare. Stavolta dall'altra parte."
   - "Sciarpa finita, anello di plastica verde. Finché nodo non ci separi."

### Battute di Don Remo durante la partita

- **Inizio**: "Nel nome del ferro, del filo e del gomitolo." / "Pazienza e ferri. Via." / "Niente forbici. È un ordine."
- **Arriva il drone**: "Drone! Mani ferme, faccia da rosario." / "Occhio in cielo. E non è il Signore." / "Arriva il drone. Fai finta di pregare."
- **Preso dal drone**: "Mani in grembo, come in chiesa!" / "Il drone ha preso nota. Peggio del confessionale."
- **Tempo scaduto**: "Irene è arrivata. La sciarpa no." / "Irene è qui. Dice: chi tardi arriva, male alloggia."
- **Tre X**: "Tre movimenti sospetti. Adesso hai un fascicolo, come me." / "Fascicolo aperto. Ti faccio compagnia, io ne ho tre."
- **Record di Barriera**: "Record di Barriera! Firma qui, come un ex voto." / "Miracolo certificato. Il nome, per il registro."

Testi neutri dal punto di vista del genere: niente "bravo/brava", "tutti", "beccati".

## 9. Punteggio

Nello stesso ordine di grandezza degli altri giochi (un livello vinto ~500–900):

- 30 punti per gomitolo
- \+ 5 per ogni secondo rimasto
- \+ 50 per ogni X non usata
- \+ bonus mosse: `max(0, 2 × gomitoli − mosse) × 10` (una mossa = un gomitolo preso e lasciato)

Livello perso: nessun punteggio, come negli altri giochi. Record di Barriera per livello. Quando i cinque livelli ci sono tutti, `MAX_SCORE.ferri` in `tools/leaderboard/Code.gs` scende dal segnaposto (1.000.000) al punteggio massimo credibile; poi va ripubblicato lo script.

## 10. Fuori, per ora

- Musica: mai.
- Verifiche OTP.
- Uno sprite di Irene (forse più avanti, per il livello del matrimonio).

## 11. Ordine di lavoro

1. Livello 1 giocabile da provare su iPad: regole, groviglio, drone, tempo, sciarpa, record.
2. Dopo la prova: taratura, poi livelli 2–5 e i punti della sciarpa.
3. `MAX_SCORE.ferri` definitivo e ripubblicazione dello script.
