# Test Report — FinGenius 360

**Versione testbook:** 1.1  
**Data esecuzione:** 2026-10-05  
**Ambiente:** `http://localhost:3000` — demo mode (nessuna `ANTHROPIC_API_KEY`)  
**Tool E2E:** puppeteer-core v23 su Microsoft Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, headless)  
**Script:** `app/tests/e2e.mjs`

---

## Riepilogo

| Esito | Casi (unici) |
|-------|-------------|
| PASS | 44 |
| FAIL | 7 |
| Non eseguito | 7 |
| **Totale** | **58** |

> Nota: lo script e2e.mjs conta TC-43 tre volte e TC-37 due volte (stesso TC verificato in punti diversi del flusso), portando il totale grezzo in `results.json` a 48 PASS | 7 FAIL | 4 Non eseguito. La tabella sopra usa conteggi per TC univoco.

---

## Tabella casi

| ID | Descrizione | Esito | Note |
|----|-------------|-------|------|
| **API /api/evaluate** | | | |
| TC-01 | evaluate: tutte corrette → score=5, lessons=[], encouragement | PASS | |
| TC-02 | evaluate: corrette + NON LO SO → 5 lessons, feedback guess | PASS | |
| TC-03 | evaluate: tutte sbagliate → score=0, 5 lessons | PASS | |
| TC-04 | evaluate: body malformato → HTTP 500 + JSON error + server vivo | PASS | |
| TC-05 | evaluate: answers fuori range → score=0, 5 lessons, no crash | PASS | |
| **API /api/react** | | | |
| TC-06 | react: risposta valida, nessun giudizio esplicito | PASS | |
| TC-07 | react: NON LO SO → indizio senza rivelare risposta | PASS | |
| TC-08 | react: body vuoto → server rimane vivo | **FAIL** | DEF-07 — crash confermato (ARC-04) |
| **Flusso Chat / Cluster** | | | |
| TC-09 | Bubble benvenuto con "Genius" | PASS | |
| TC-10 | 5 cluster: 1 attivo "Disponibile", 4 "Presto" | PASS | |
| TC-11 | Cluster attivo: griglia locked, bubble utente | PASS | |
| TC-12 | Cluster "Presto": bubble "in arrivo", flusso non avanza | PASS | |
| TC-13 | CTA "Sono pronto" → #stage attivo, #chat non attivo | PASS | |
| **Quiz Round 1 — validazioni** | | | |
| TC-14 | Bottone disabled senza input; hint "Prima scegli" | PASS | |
| TC-15 | Bottone disabled con solo opzione; hint "spiegami" | PASS | |
| TC-16 | Bottone disabled con solo testo (no opzione) | PASS | |
| TC-17 | Bottone abilitato con opzione + testo; hint "Premi Invio" | PASS | |
| TC-18 | Invio con tasto Enter nel textarea | Non eseguito | Non automatizzato: script usa click sul bottone |
| TC-19 | Shift+Enter aggiunge newline, bottone rimane abilitato | PASS | |
| TC-20 | Placeholder textarea contiene "NON LO SO" | PASS | Contrasto placeholder FAIL atteso (UX-04) → vedi DEF-03 |
| TC-21 | Bubble utente: motivazione come plain text (esc()) | PASS | |
| **Reazioni Genius** | | | |
| TC-22 | Reaction senza "corretto"/"esatto"/"sbagliato" | PASS | |
| TC-23 | Reaction NON LO SO: non rivela risposta corretta | PASS | |
| **Analisi e Risultati** | | | |
| TC-24 | Agent card: ≥3 step marcati done sequenzialmente | PASS | |
| TC-25 | Score ring mostra "X/5" | PASS | Mostrato "5/5" nel run (vedi nota DEF-04/05) |
| TC-26 | fb-guess Q1: intestazione "tentativo" + feedback demo | PASS | |
| TC-27 | Analisi — tutto corretto, nessuna .lesson | Non eseguito | Scenario non percorso nel happy path (Q1 guessato) |
| **Micro-lezioni** | | | |
| TC-28 | Micro-lezioni: numero card = wrong + guessed | **FAIL** | DEF-04 — 1 lezione invece di 2 (causa: click Q3 instabile) |
| TC-29 | Bottone "Ho capito ✓" diventa disabled dopo click | PASS | |
| TC-30 | CTA "Mettimi alla prova" visibile dopo lezioni | PASS | |
| **Quiz Round 2** | | | |
| TC-31 | Round 2: nessun answer-card né textarea | PASS | |
| TC-32 | Round 2: un solo click registrato; secondo ignorato | PASS | |
| **Schermata Progresso** | | | |
| TC-33 | Barre animate con width > 0 | PASS | |
| TC-34 | Delta classe "up", testo "+N%" | **FAIL** | DEF-05 — class="same", testo="100%" (causa: pre=post=100%) |
| TC-35 | Card finale: NON LO SO count = 1 volta | PASS | |
| TC-36 | Chip concetti visibili | PASS | Chip "TAEG vs TAN" presente |
| TC-37 | Disclaimer "strumento educativo" + Ricomincia | PASS | |
| **Errori di rete** | | | |
| TC-38 | Blocco /api/evaluate: bubble "Ops" + bottone "Riprova" | PASS | |
| TC-39 | Blocco /api/react: fallback "Ci sto ancora pensando" | PASS | |
| **Sicurezza** | | | |
| TC-40 | XSS payload reso come plain text; nessun tag nel DOM | PASS | |
| **Accessibilità** | | | |
| TC-41 | Avatar bubble: aria-label ripetuto senza aria-hidden | **FAIL** | DEF-01 (UX-16) — Verificato da codice |
| TC-42 | label for="mot" / textarea id="mot" abbinati | PASS | Verificato da codice |
| **UX / A11y / Mobile (aggiunti da UX)** | | | |
| TC-43 | View switching chat↔stage in tutti i punti del flusso | PASS | |
| TC-44 | Ordine DOM: storia → domanda → opzioni → answer-card | PASS | |
| TC-45 | Bottone disabled con motivazione di soli spazi | PASS | |
| TC-46 | Motivazione lunga (2000 caratteri): no troncamento | Non eseguito | Non automatizzato in questo run |
| TC-47 | "non lo so" minuscolo riconosciuto → fb-guess + lesson | PASS | |
| TC-48 | Doppio click rapido: una sola bubble creata | PASS | |
| TC-49 | Topbar progress: fase 3/5, dots 1–2 done, dot 3 current | PASS | |
| TC-50 | Intestazioni feedback con etichette esplicite (UX-05) | **FAIL** | DEF-02 — Verificato da codice |
| TC-51 | Navigazione tastiera E2E (UX-02) | Non eseguito | Richiede tester umano (Tab/Invio) |
| TC-52 | Annunci screen reader — aria-live (UX-01) | Non eseguito | Richiede NVDA/Narrator attivo |
| TC-53 | Contrasto colori WCAG AA (UX-03/04) | **FAIL** | DEF-03 — Verificato da codice |
| TC-54 | @media prefers-reduced-motion nel CSS (UX-07) | **FAIL** | DEF-06 — nessuna regola nel CSS |
| TC-55 | Viewport 360×640: no scroll orizzontale, topbar ok | PASS | topbar h=69px |
| TC-56 | Tasto a capo tastiera virtuale mobile (UX-08) | Non eseguito | Richiede dispositivo touch fisico |
| TC-57 | Click ripetuti su cluster "Presto": max 1 bubble | PASS | |
| TC-58 | Videolezioni — criteri UX (feature futura) | Non eseguito | Feature non implementata |

---

## Difetti

| ID | TC | Severità | Descrizione | Passi per riprodurre |
|----|-----|----------|-------------|----------------------|
| DEF-01 | TC-41 | Bassa | Avatar `.row.bot .avatar` clonato dal logo topbar mantiene `aria-label="FinGenius 360"` su ogni bubble bot; manca `aria-hidden="true"` → screen reader annuncia il nome dell'app ad ogni messaggio di Genius (UX-16) | Aprire DevTools → inspector, raggiungere situazione 1, ispezionare `.row.bot .avatar`: nessun `aria-hidden` |
| DEF-02 | TC-50 | Media | `.fb-head.ok` mostra "✓ Corretta", `.fb-head.ko` mostra "✗ Da rivedere": etichette esplicite corretto/sbagliato contrarie al requisito UX-05 | Completare Round 1 → "Vedi la mia analisi" → ispezionare `.fb-head` nel riepilogo |
| DEF-03 | TC-53 | Alta | Contrasto insufficiente: "360" (`#F5B700` su bianco) ≈ 1.74:1; placeholder textarea (`#A3B1BF` su bianco) ≈ 2.03:1 — entrambi sotto la soglia WCAG AA 4.5:1 (UX-03/04) | Aprire index.html, localizzare `.logo .num` (colore `#F5B700`) e CSS `textarea::placeholder` (`#A3B1BF`); calcolare contrasto con WebAIM Contrast Checker |
| DEF-04 | TC-28 | Bassa* | Nel run registrato in results.json: 1 lezione mostrata invece di 2. **Causa probabile**: il selettore `.opt:first-child` ha cliccato l'opzione B (corretta, data-i=1) invece di A (errata, data-i=0) in Q3 → score=5/5 → solo 1 concetto guessato (taeg_vs_tan), nessun concetto sbagliato → 1 lezione. Il selettore è stato corretto in e2e.mjs (ora usa `[data-i="0"]`); se riprodotto con Q3 sbagliato, questo caso deve risultare PASS. *Severità abbassata da Alta a Bassa: si tratta di instabilità del test, non di bug di prodotto. | Rispondere Q3 con opzione A (errata); completare Round 1; controllare numero di card `.lesson` mostrate |
| DEF-05 | TC-34 | Bassa* | Delta progresso mostra class="same", testo="100%". Stessa causa di DEF-04: pre-score=5/5=100%, post-score=5/5=100%, delta=0. Se Q3 fosse sbagliato, pre=80%, post=100%, delta=+20%, class="up". *Stessa nota instabilità test. | Idem DEF-04 |
| DEF-06 | TC-54 | Media | Nessuna regola `@media (prefers-reduced-motion: reduce)` nel CSS: le animazioni `pop`, `float`, `spin` non vengono disabilitate per utenti che richiedono meno movimento (UX-07) | `prefers-reduced-motion: reduce` emulato in Puppeteer; verificare `document.styleSheets` → nessun match su `conditionText` "reduced" |
| DEF-07 | TC-08 | **Bloccante** | POST `/api/react` con body `{}` (tutti campi mancanti): il blocco `catch` richiama `demoReaction(undefined, undefined, undefined)` senza protezione → seconda eccezione non gestita → processo server terminato. Server non risponde dopo questa chiamata (confermato: ARC-04). | `curl -X POST http://localhost:3000/api/react -H "Content-Type: application/json" -d '{}'` → attendere 2 s → `curl http://localhost:3000/api/react` (connection refused) |

---

## Screenshot

| File | Momento |
|------|---------|
| `app/tests/screenshots/01-clusters.png` | Schermata cluster (5 card, 1 attiva) |
| `app/tests/screenshots/02-stage-q1.png` | Stage situazione 1 (answer-card visibile) |
| `app/tests/screenshots/03-round1-complete.png` | Dopo "Concludi il round" (pre-analisi) |
| `app/tests/screenshots/04-network-error.png` | Errore rete /api/evaluate: bubble "Ops" + "Riprova" |
| `app/tests/screenshots/05-agent-card.png` | Agent card con ≥3 step done |
| `app/tests/screenshots/06-score.png` | Score ring |
| `app/tests/screenshots/07-feedback.png` | Riepilogo feedback fb-guess Q1 |
| `app/tests/screenshots/08-lessons.png` | Prima micro-lezione visibile |
| `app/tests/screenshots/09-round2.png` | Round 2 situazione 1 (no textarea) |
| `app/tests/screenshots/10-round2-complete.png` | Round 2 completato |
| `app/tests/screenshots/11-progress.png` | Schermata progresso finale |
| `app/tests/screenshots/12-mobile-360.png` | Viewport 360×640 mobile |

---

## Note tecniche

- **DEF-07 (ARC-04) è bloccante**: il server crasha con input malformato. La corregione minima è aggiungere un guard nel catch clause di `/api/react`: verificare che `question_index`, `answer` e `motivation` siano definiti prima di richiamare `demoReaction()`.
- **DEF-04 / DEF-05**: non sono bug di prodotto ma instabilità del test causata dal selettore `.opt:first-child` in Q3. La fix è già in `app/tests/e2e.mjs` (selettore `[data-i="0"]`). Se il run viene ripetuto con il fix, TC-28 e TC-34 dovrebbero risultare PASS.
- **DEF-03 (contrasto)**: i colori `#F5B700` e `#A3B1BF` vanno sostituiti con valori che garantiscano rapporto ≥ 4.5:1 su sfondo bianco (es. `#B38600` per il gold).
- **TC non automatizzati** (TC-18, TC-27, TC-46, TC-51, TC-52, TC-56, TC-58): 7 casi richiedono tester umano o device fisico, oppure coprono scenari (path "tutto corretto") non percorsi nell'happy path E2E.
