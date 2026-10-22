# Ruspe in fuga — documento di design

Quarto e ultimo minigioco di Barriera Babylon, scelto il 18 ottobre 2026. Ospite: **maestra Rosanna**.

## 1. Idea e lore

Nel romanzo (fine del capitolo 8 e scena al Bar Stella che segue), il Comitato Caos e la sua comandante passano la notte a:
- sostituire i cartelli stradali;
- manomettere i percorsi dei "droni guida";
- piazzare falsi segnali luminosi, con frecce colorate e lucine stroboscopiche.

Le ruspe del Muro si guidano da sole e li seguono "obbedienti e ignare". Arrivano alla rotonda della sfinge di corso Romania ed entrano nel centro commerciale dall'ingresso secondario. Lì scavano tra la corsia dei profumi e quella dei jeans scontati, "con entusiasmo robotico". I media lo chiamano "il più grande disguido infrastrutturale dell'anno". Teresa firma sul pavimento, in blu: "Oggi tocca a noi entrare da dietro".

Il gioco è un **Lemmings visto dall'alto**. Le ruspe vanno avanti da sole e chi gioca non le guida mai: cambia la strada con gli attrezzi dei bambini del Comitato, uno per bambino.

**Niente marchi veri** (deciso il 18 ottobre): né Auchan né McDonald's, né nei testi né nella grafica. Nel gioco si dice solo "il centro commerciale" e "il fast food". Il logo del centro commerciale è inventato: un piccione rosso, grasso e zoppo, con l'ala verde (il "piccione zoppo" del romanzo). Le battute riprese dal romanzo perdono i nomi dei marchi. Le strade invece restano vere: corso Giulio Cesare, corso Romania, la rotonda della sfinge.

## 2. Regole

- La mappa è una griglia di 15×7 caselle da 32 px, vista dall'alto: strade, isolati, il cantiere del Muro, il centro commerciale. Su un iPhone in orizzontale una casella misura circa 44 punti, la misura di un dito. All'inizio le caselle erano da 16 px su una griglia di 30×13, ma il 19 ottobre sul telefono il gioco era ingiocabile: cartelli e incroci troppo piccoli.
- Le regole avanzano sempre a passi fissi di 1/60 di secondo (`SIM_DT`), qualunque sia la velocità dello schermo. Il risultato dipende dal passo: con gli stessi tocchi un passo diverso può far entrare una ruspa in più o in meno. Così la partita vera, la previsione (`forecast`) e i test danno sempre lo stesso risultato.
- Le ruspe escono dal cancello del cantiere una alla volta (`interval` secondi) e vanno di casella in casella.
- In ogni casella una ruspa segue il cartello, se c'è, altrimenti va dritta. La ruspa va sempre dove punta la freccia, anche indietro: la freccia non mente mai. (Per un giorno i cartelli che puntavano all'indietro venivano ignorati, ma sull'iPad girare i cartelli sembrava non funzionare: due posizioni su tre mandavano le ruspe dritte.) Sulle biglie di Chiara la ruspa slitta e torna indietro, qualunque cosa dica il cartello. Se la strada è chiusa gira a destra, poi a sinistra, poi torna indietro. La regola è sempre la stessa, così si impara.
- Una ruspa che arriva all'ingresso secondario entra e conta.
- **Vittoria**: `need` ruspe dentro su `count`. Il livello finisce appena si arriva a `need`.
- **Sconfitta**: il tempo finisce prima, banner **ARRIVANO GLI OPERAI**.
- Nessuna ruspa si perde: una ruspa sbagliata continua a girare per il quartiere finché qualcuno la rimette sulla strada giusta.
- **Partita senza speranza** (provata sull'iPad il 18 ottobre: aspettare più di un minuto la fine era noioso). Quando gli attrezzi sono finiti il resto della partita è già scritto, perché le regole non hanno niente di casuale. Allora il gioco la gioca in anticipo in una copia (`forecast` in `rules.js`), dopo ogni tocco e dopo ogni cartello rimesso dal drone. Se è persa:
  - se restano cartelli di Teresa da girare gratis, Rosanna lo dice e nell'HUD compare **RIPROVA** (anche il tasto R);
  - se non si può più cambiare niente, la partita finisce subito con il banner **NON CE LA FANNO** e il titolo **NIENTE DA FARE**.

## 3. Attrezzi: un bambino ciascuno

Gli attrezzi sono nella barra in basso a sinistra, ognuno con il volto del bambino e gli usi rimasti. Ogni livello ne aggiunge uno, come in Lemmings.

| # | Bambino | Attrezzo | Effetto | Livello |
|---|---|---|---|---|
| 1 | **Teresa** | cartello | Mette un cartello su una strada, oppure gira un cartello ufficiale (costa 1). Il cartello nuovo punta in una direzione a caso, diversa a ogni partita, e un cartello ufficiale preso in mano cambia sempre direzione: poi lo si tocca (gratis) finché punta dove serve. Il cartello non punta mai verso il cantiere. All'inizio puntava già dalla parte giusta quasi sempre, e il gioco era troppo facile (19 ottobre). | 1 |
| 2 | **Chiara** | biglie | Le ruspe slittano e tornano indietro. Dura circa 10 s. | 2 |
| 3 | **Gigi** | schiuma | Il cemento montato a meringa: il cartello sulla casella resta cementato per 12 s e il drone non lo può spostare (compare **CEMENTATO!**). Le ruspe ci passano sopra normalmente. È disegnata sopra il cartello come un anello di schiuma, così la freccia si vede in mezzo. | 3 |
| 4 | **Samir** | cassa | La cassa bluetooth con l'inno di pernacchie del Comitato, per 8 s. Le ruspe a 3 caselle o meno vanno verso la cassa, qualunque cosa dicano i cartelli, e il drone non ci può fare niente. Si può mettere sull'ingresso del centro commerciale. Intorno si vedono le onde rosa della musica. | 4 |
| 5 | **Ayoub** | hacker | Si tocca il drone (la sua casella o una vicina): resta fermo per 6 s, lampeggia verde (**HACKERATO!**) e non rimette nessun cartello. Toccando una strada lontana dal drone Rosanna ricorda di toccare il drone. | 5 |

## 4. Il drone guida (dal livello 2)

Il drone fa sempre lo stesso giro, avanti e indietro in linea retta, ed è sempre visibile. Il suo giro è segnato sulla mappa: le caselle sono colorate di giallo chiaro e c'è una linea a puntini, così si può aggirarlo. Ogni cartello su cui passa torna come da percorso ufficiale: i cartelli di Teresa spariscono e quelli ufficiali girati tornano com'erano. Quando succede, la casella lampeggia e compare la scritta **RIMESSO!**. La prima volta Rosanna spiega cosa fare ("Il drone rimette i cartelli sul suo giro. Cambiate incrocio!"). Le biglie e la schiuma non le tocca, e un cartello nella schiuma non lo sposta.

Nel livello 2 il drone vola sempre. Dal livello 3 può anche fare il **pisolino**, come i droni del romanzo che "si concedono un pisolino digitale". Dorme sul suo trespolo con una Z che sale e non tocca niente. Qualche secondo prima di partire si sveglia: ronza, trema, la sua ombra lampeggia e la prima volta Rosanna avverte. Poi fa un giro e torna a dormire. Nel livello si scrivono `first` (quando parte la prima volta) e `rest` (quanto dorme tra un giro e l'altro).

## 5. Controlli

| Dispositivo | Azione |
|---|---|
| Dito / mouse | tocca una strada: usa l'attrezzo scelto; tocca un bambino nella barra: lo sceglie |
| Tastiera | 1–5 sceglie il bambino; le frecce muovono il cursore (parte dall'uscita del cantiere); Spazio / Invio usa l'attrezzo |
| Esc / P, pulsante `II` | pausa |

## 6. Schermo (480×270)

- In alto, l'HUD (22 px): `DENTRO 3/6`, `RUSPE 5/8` (quante sono uscite), il tempo e `II`.
- La mappa: y 22–246. I cartelli sono disegnati sopra le ruspe, così una ruspa ferma su un incrocio non nasconde la freccia.
- In basso, la barra degli attrezzi (24 px), i cui pulsanti accettano anche i tocchi un po' sopra la barra: i bambini a sinistra, poi il nome dell'attrezzo scelto. L'angolo in basso a destra resta vuoto per i pulsanti audio e schermo intero.
- Le battute di Rosanna compaiono su una striscia scura in cima alla mappa, 40 caratteri per riga e due righe al massimo. La prima volta che si gioca un livello Rosanna spiega il bambino nuovo (`tip`). La riga in cima alle mappe è sempre fatta di edifici.

## 7. Testi

- **Rosanna** nell'intro: un ordine per livello. Durante la partita commenta in breve (inizio, ruspa dentro, attrezzi finiti).
- **Risultati**: la mattina dopo al Bar Stella, uno dei clienti fissi commenta a caso, con il suo ritratto:
  - Zio Franco: "Ruspe dritte dritte al centro commerciale di corso Giulio";
  - Don Remo: "Un drone ha dato l'ok, e puff. Adesso scavano accanto al fast food";
  - Mei Li: "intelligenza artificiale e stupidità naturale".

  Per i livelli persi ci sono battute diverse.
- Testi neutri dal punto di vista del genere ("Classe", non "Ragazzi").

## 8. Livelli

I numeri sono di partenza e si tarano dopo le prove su iPad. Ogni livello ha una `solution`, una lista di usi degli attrezzi con il loro tempo. I test la rigiocano con le regole vere e controllano che vinca con almeno il 20% del tempo avanzato. Controllano anche che il livello senza attrezzi sia perso.

| # | Nome | Ambientazione | Nuovo bambino | Drone | Ruspe |
|---|---|---|---|---|---|
| 1 | CORSO GIULIO CESARE | un anello di strade, il corso in mezzo, l'ingresso secondario sul corso | Teresa x3 | — | 6 su 8, 80 s |
| 2 | I CARTELLI DEL NAVIGATORE | cartelli ufficiali che girano attorno al Muro; il centro commerciale in basso a sinistra | Chiara, Teresa x3 | 1, sulla strada in basso | 8 su 10, 80 s |
| 3 | LA ROTONDA DELLA SFINGE | la rotonda di corso Romania, con la sfinge al centro | Gigi x2, Teresa x1 (niente biglie) | 1, dorme sul cantiere e ogni tanto fa il giro della rotonda | 12 su 14, 75 s |
| 4 | L'INGRESSO SECONDARIO | due cancelli, le ruspe girano attorno al Muro e passano davanti all'ingresso sulla strada in basso | Samir x3, Teresa x2 | 1, avanti e indietro davanti all'ingresso | 10 su 12, 55 s |
| 5 | TRA I PROFUMI E I JEANS | dentro il centro commerciale: profumi, jeans, camerini, il fast food; si scava tra profumi e jeans | Ayoub x4, Teresa x2 | 1, il drone della sicurezza gira attorno al punto dello scavo | 10 su 12, 60 s |

Dopo la vittoria nel livello 5 compare sul pavimento la scritta blu di Teresa: "OGGI TOCCA A NOI ENTRARE DA DIETRO". Il pannello dei risultati aspetta qualche secondo in più, per lasciarla leggere.

Il livello 5 si gioca dentro il centro commerciale (`inside: true`): pavimento a piastrelle, scaffali dei profumi (`P`), dei jeans (`J`), camerini (`F`), il bancone del fast food (`D`). Il fast food ha un logo inventato, una M gialla fatta di due benne di ruspa. Le ruspe entrano dalla porta sul retro (`C`, sul bordo sinistro) e scavano nel punto `A`.

Livello 1: uscite dal cantiere, le ruspe girano a sinistra sul corso e poi per sempre sull'anello esterno. Bastano due cartelli: uno dove la strada del cantiere incontra il corso, verso destra, e uno davanti all'ingresso, verso il basso. Il terzo cartello serve a correggere un errore. Vince anche mettendo i cartelli dopo 8 s.

Livello 2: i cartelli ufficiali fanno girare le ruspe attorno al Muro. La mossa ovvia è girare il cartello all'incrocio in basso, ma lì passa il drone, che lo rimette a posto in pochi secondi. Con le sole biglie non entra nessuna ruspa. La strada giusta aggira il drone: si gira il cartello sotto il cancello verso sinistra e quello vicino al centro commerciale nell'altro verso. Le biglie rimandano indietro le prime ruspe già finite nel giro. Teresa ha tre cartelli: con due, chi spendeva il primo sulla mossa ovvia non poteva più vincere (provato sull'iPad il 19 ottobre). Con tre la deviazione vince anche trovata a 25 s.

Livello 3: le ruspe girano sulla rotonda e Teresa ha un cartello solo, all'uscita verso il centro commerciale. Il drone dorme sul cantiere e a 16 s fa il primo giro della rotonda: se il cartello non è cementato lo rimette a posto, e da lì non entra più nessuno (al massimo 6). Con la schiuma sul cartello mentre il drone dorme, tra 6 e 16 s, il cartello resta ed entrano tutte. Messa prima di 6 s la schiuma asciuga prima che il drone arrivi. La seconda schiuma è di scorta, per rimediare a un errore.

Livello 4: tutte le ruspe girano attorno al Muro e passano davanti all'ingresso sulla strada in basso, dove il drone va avanti e indietro. Con i soli cartelli entrano al massimo 8 ruspe su 10. La cassa di Samir sull'ingresso le tira dentro: due casse, a un istante a e poi ad a + 10 s, vincono con a tra 12 e 22 s. La terza cassa è di scorta, e anche sprecandone una all'inizio si vince.

Livello 5: le ruspe entrano lungo la corsia principale; il punto dello scavo si raggiunge da lì e dalla corsia in alto. Il drone della sicurezza ci gira attorno senza sosta e un cartello dura pochi secondi: da soli i cartelli ne fanno entrare al massimo 8. Con il cartello sulla corsia principale (verso l'alto) e Ayoub che blocca il drone ogni volta che sta per arrivarci, si vince mettendo il cartello in qualsiasi momento dei primi 10 s, anche sprecando un hack.

Storia della schiuma, per non rifare gli stessi errori. All'inizio rallentava le ruspe, poi le tratteneva e le faceva ripartire in colonna. In tutte e due le versioni non serviva a niente: un cartello si può sempre rimettere subito dopo il passaggio del drone, e sull'iPad il livello 3 si poteva vincere solo con un piano difficile da indovinare. Un cartello manda tutte le ruspe nella stessa direzione, da qualunque parte arrivino, quindi la schiuma conta solo se qualcosa cambia nel tempo, cioè il drone. Da qui la schiuma che cementa il cartello (19 ottobre).

## 9. Punteggio

- 100 per ruspa dentro
- \+ 30 per ogni uso di attrezzo avanzato
- \+ 5 per ogni secondo rimasto

Livello perso: nessun punteggio. Il livello finisce appena si arriva a `need`, quindi il massimo è `need` × 100 + 30 per ogni attrezzo + 5 per ogni secondo: il più alto è il livello 3, circa 1.700. `MAX_SCORE.ruspe` in `tools/leaderboard/Code.gs` è 2000; dopo la modifica va ripubblicato lo script.

## 10. Fuori, per ora

- Musica: mai.
- Ruspe che si scontrano tra loro: si sovrappongono, come i lemming.
- Avanti veloce.

## 11. Ordine di lavoro

1. ~~Livello 1 giocabile: regole, mappa, Teresa, intro e risultati, record.~~ (18 ottobre)
2. ~~Livello 2: Chiara, il drone guida.~~ ~~Livello 3: Gigi, la rotonda.~~ (18 ottobre) ~~Livelli 4–5: Samir, Ayoub, dentro il centro commerciale.~~ (22 ottobre)
3. Effetti sonori dedicati: motore, cartello, biglie, schiuma, pernacchie, ruspa dentro.
4. ~~`MAX_SCORE.ruspe` definitivo~~ (22 ottobre), poi ripubblicazione dello script; ~~tabella "Tasti" nel README~~.
