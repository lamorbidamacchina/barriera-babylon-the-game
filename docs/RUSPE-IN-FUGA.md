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

- La mappa è una griglia di 30×13 caselle da 16 px, vista dall'alto: strade, isolati, il cantiere del Muro, il centro commerciale.
- Le ruspe escono dal cancello del cantiere una alla volta (`interval` secondi) e vanno di casella in casella.
- In ogni casella una ruspa segue il cartello, se c'è, altrimenti va dritta. Se la strada è chiusa gira a destra, poi a sinistra, poi torna indietro. La regola è sempre la stessa, così si impara.
- Una ruspa che arriva all'ingresso secondario entra e conta.
- **Vittoria**: `need` ruspe dentro su `count`. Il livello finisce appena si arriva a `need`.
- **Sconfitta**: il tempo finisce prima, banner **ARRIVANO GLI OPERAI**.
- Nessuna ruspa si perde: una ruspa sbagliata continua a girare per il quartiere finché qualcuno la rimette sulla strada giusta.

## 3. Attrezzi: un bambino ciascuno

Gli attrezzi sono nella barra in basso a sinistra, ognuno con il volto del bambino e gli usi rimasti. Ogni livello ne aggiunge uno, come in Lemmings.

| # | Bambino | Attrezzo | Effetto | Livello |
|---|---|---|---|---|
| 1 | **Teresa** | cartello | Mette un cartello su una strada, oppure gira un cartello ufficiale (costa 1). Toccare di nuovo un proprio cartello lo gira gratis, e il cartello non punta mai verso il cantiere. | 1 |
| 2 | **Chiara** | biglie | Le ruspe slittano e tornano indietro. Dura circa 10 s. | 2 |
| 3 | **Gigi** | schiuma | Dimezza la velocità su una casella per circa 8 s, per i tempi. | 3 |
| 4 | **Samir** | cassa | La cassa bluetooth con l'inno di pernacchie del Comitato. Agli incroci vicini le ruspe vanno verso la cassa. Dura circa 8 s. | 4 |
| 5 | **Ayoub** | hacker | Il drone guida si ferma per circa 6 s. | 5 |

## 4. Il drone guida (dal livello 2)

Il drone segue un giro fisso. Ogni cartello su cui passa torna come da percorso ufficiale: i cartelli di Teresa spariscono e quelli ufficiali girati tornano com'erano. Prima di arrivare si sente il ronzio e si vede l'ombra, come in Il nodo nei ferri.

## 5. Controlli

| Dispositivo | Azione |
|---|---|
| Dito / mouse | tocca una strada: usa l'attrezzo scelto; tocca un bambino nella barra: lo sceglie |
| Tastiera | 1–5 sceglie il bambino; le frecce muovono il cursore (parte dall'uscita del cantiere); Spazio / Invio usa l'attrezzo |
| Esc / P, pulsante `II` | pausa |

## 6. Schermo (480×270)

- In alto, l'HUD (28 px): `DENTRO 3/6`, `RUSPE 5/8` (quante sono uscite), il tempo e `II`.
- La mappa: y 28–236.
- In basso, la barra degli attrezzi (34 px): i bambini a sinistra, poi il nome dell'attrezzo scelto. Le battute di Rosanna compaiono al posto del nome, su due righe al massimo. L'angolo in basso a destra resta vuoto per i pulsanti audio e schermo intero.

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
| 1 | CORSO GIULIO CESARE | un anello di strade, il corso in mezzo, l'ingresso secondario sul corso | Teresa x3 | — | 6 su 8, 90 s |
| 2 | I CARTELLI DEL NAVIGATORE | cartelli ufficiali che portano al Muro | Chiara | 1 lento | |
| 3 | LA ROTONDA DELLA SFINGE | la rotonda di corso Romania | Gigi | 1 | |
| 4 | L'INGRESSO SECONDARIO | due cancelli, due file di ruspe | Samir | 2 | |
| 5 | TRA I PROFUMI E I JEANS | dentro il centro commerciale: corsie, camerini, il fast food | Ayoub | 2 | |

Dopo la vittoria nel livello 5 compare sul pavimento la scritta blu di Teresa.

Livello 1: senza cartelli le ruspe girano sull'anello esterno e non passano mai dal corso. Bastano due cartelli: uno all'incrocio a sinistra verso il corso e uno davanti all'ingresso verso il basso. Il terzo cartello serve a correggere un errore.

## 9. Punteggio

- 100 per ruspa dentro
- \+ 30 per ogni uso di attrezzo avanzato
- \+ 5 per ogni secondo rimasto

Livello perso: nessun punteggio. `MAX_SCORE.ruspe` in `tools/leaderboard/Code.gs` è ancora il segnaposto (1.000.000). Va fissato quando i livelli sono finiti, poi lo script va ripubblicato.

## 10. Fuori, per ora

- Musica: mai.
- Ruspe che si scontrano tra loro: si sovrappongono, come i lemming.
- Avanti veloce.

## 11. Ordine di lavoro

1. ~~Livello 1 giocabile: regole, mappa, Teresa, intro e risultati, record.~~ (18 ottobre)
2. Livelli 2–5, uno alla volta, ognuno con il suo bambino, e il drone guida dal 2.
3. Effetti sonori dedicati: motore, cartello, biglie, schiuma, pernacchie, ruspa dentro.
4. `MAX_SCORE.ruspe` definitivo, poi ripubblicazione dello script; tabella "Tasti" nel README.
