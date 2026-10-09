---
name: lore-voice
description: Write in-game Italian text for Barriera Babylon in the voices of the novel's characters (Mei Li's broken Italian, Zio Franco, Don Remo, maestra Rosanna, the Comitato Caos kids), and check names, places and facts against the novel. Use for dialogue, level names and orders, menu blurbs, results lines, tutorials and any new character or setting detail.
---

# Lore and voices

The game adapts the novel *Barriera Babylon*: a near-future Barriera di Milano (Turin) under drones, curfew and a daily OTP, where the regulars of the Bar Stella and a school class of saboteur kids fight the "Muro" construction project with jokes and chaos.

## Source

- The novel: `docs/Barriera Babylon2.pdf` (kept out of git). Read it with `Read` and `pages`, or `pdftotext -layout` into the scratchpad and `grep` for a name, for anything not covered below. Quote it only as a source of lines to trim, never paste long passages into the repo.
- Lines already in the game: `src/data/meili.js` (taken from the novel, lightly trimmed), `src/games/contrabbando/recipes.js` (orders, Franco's lines, Mei Li's end lines), `src/data/games.js` (`mei` lines on the menu).
- `references/characters.md`: who's who, with what each character is good for in a game.

## Scope

Audience is adult / young adult: the novel's crude jokes are fine (bodily humour, religion, police, bureaucracy). The game stays on the comic side: the Bar Stella and the Comitato Caos. Keep the dark plot out: the missing teenagers (Nina), Karim, the Adua association and its people (Andrea, Lucio, Melchiorre), Giorgia, the "polvere gialla". Don't name them in game text.

## Voices

- **Mei Li**: short sentences, no articles, verbs often in the infinitive or 3rd person, subject dropped. Dry, contemptuous, practical, secretly fond. Money and work ethic. *"Voi sempre qui. Mai lavorare? Mai casa vostra?"*, *"No sconto. Filosofia già gratis."* Never make her cute or foolish: the broken grammar is hers, the intelligence too. 4–10 words per line.
- **Zio Franco**: ex market trader, sells smuggled vegetables under the counter, knits endless scarves (rumoured to be escape ropes). Market-stall patter, a fixer's optimism, Campari. Talks about his veggies like contraband.
- **Don Remo**: defrocked priest (the Curia was tired of covering his affairs), knits with monastic seriousness, e-cigar, "cardinal in retirement" air. Clerical vocabulary used ironically; sharp one-liners at authority.
- **Bea**: phone fortune-teller and professional sceptic, the novel's protagonist; dreams of reaching "Top ISEE" and leaving Barriera. Self-deprecating, ironic.
- **Maestra Rosanna**: primary teacher and commander of the Comitato Caos. Military orders mixed with school curriculum ("ritirata strategica!", irregular verbs during a sabotage). Quotes activists.
- **Comitato Caos kids**: 8–9 years old, deadpan and over-serious about absurd plans; each has one speciality (see references). Their humour is literal logic taken too far ("murite fungoide").
- **The system** (drones, OTP, notices): cold bureaucratic second person, *"Cittadino, la tua posizione non è stata confermata."*

## Writing rules for the screen

- Italian. UI labels, titles and banners in UPPERCASE without accented capitals: `CAFFE'`, `PERCHE'`, `CITTA'` (the font draws accented capitals like lowercase). Dialogue in normal case can keep accents.
- Fit the box: dialogue in an intro panel wraps at ~300px = ~37 characters per line at 8px, 3–4 lines max. Banners at 16px: ~25 characters. Check the real result in the game (`playtest` skill).
- One joke per line. Prefer the novel's own lines, trimmed, over invented ones; when inventing, match the rhythm of a real line from the same character.
- Several variants for anything that repeats (greetings, win/lose lines), picked at random, so returning players don't see the same line every time.
- Place names are real and specific: corso Giulio Cesare, corso Vercelli, piazza Crispi, the Auchan of corso Giulio / corso Romania, via Brandizzo, the "Centrocampo". Use them for level names and settings.

When unsure whether something fits the novel, check the PDF; when it's a matter of taste (a new joke, a new character), propose two or three options to the user.
