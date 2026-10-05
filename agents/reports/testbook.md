# Testbook — FinGenius 360

**Versione:** 1.1 (revisione post validazione UX)
**Data:** 2026-10-05
**Autore:** Agente Tester
**Ambiente:** `http://localhost:3000` — demo mode attivo (`ANTHROPIC_API_KEY` non impostata)
**Edge rilevato:** `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` — **TROVATO** ✔
**Automazione:** i casi marcati `Puppeteer` saranno automatizzati con `puppeteer-core` su Microsoft Edge (script `app/tests/e2e.mjs`). Tutti i `waitForSelector` usano opzione `{visible:true}` — nessun `sleep` fisso.

---

## 1. API — POST /api/evaluate

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-01 | API /evaluate | Server avviato in demo mode | POST `{"answers":[1,0,1,1,2],"motivations":["Il TAEG include le spese","Rata × mesi dà il totale","Il totale delle rate supera il prezzo","Con anticipo finanzio meno","21% su 3000 fa 52 euro/mese"]}` | HTTP 200; `score:5`; `percentage:100`; `lessons:[]`; `feedback[*].is_correct === true`; `encouragement` non vuoto | Alta | API |
| TC-02 | API /evaluate | Server avviato in demo mode | POST con tutte risposte corrette `[1,0,1,1,2]` e tutte motivazioni `"NON LO SO"` | HTTP 200; `score:5`; `lessons.length === 5`; ogni `feedback[i].personalized_feedback` inizia con "Risposta giusta, ma hai scritto che non lo sapevi" | Alta | API |
| TC-03 | API /evaluate | Server avviato in demo mode | POST con tutte risposte sbagliate `[0,1,0,0,0]` e motivazioni libere | HTTP 200; `score:0`; `percentage:0`; `lessons.length === 5`; `feedback[*].is_correct === false` | Alta | API |
| TC-04 | API /evaluate | Server avviato | POST senza campo `answers` (body `{"motivations":["x","x","x","x","x"]}`) | HTTP 500; body JSON con campo `error` non vuoto; richiesta valida successiva risponde HTTP 200 (server vivo) | Media | API |
| TC-05 | API /evaluate | Server avviato | POST con `answers:[99,99,99,99,99]` e motivazioni libere | HTTP 200; `score:0`; `lessons.length === 5`; nessun crash | Media | API |

---

## 2. API — POST /api/react

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-06 | API /react | Server avviato in demo mode | POST `{"question_index":0,"answer":1,"motivation":"Guardo il TAEG"}` | HTTP 200; `reaction` stringa non vuota; testo non contiene "corretto", "esatto", "sbagliato" | Alta | API |
| TC-07 | API /react | Server avviato in demo mode | POST `{"question_index":2,"answer":0,"motivation":"NON LO SO"}` | HTTP 200; `reaction` = testo `DEMO_REACTIONS[2].dontKnow`; non contiene il testo dell'opzione corretta ("Pagare subito €620"), non contiene la lettera "B", non contiene "corretto"/"esatto"/"sbagliato" | Alta | API |
| TC-08 | API /react | Server avviato | POST con body `{}` (tutti i campi mancanti) | Il server risponde (HTTP 200 o 500) senza crash; una richiesta valida successiva risponde HTTP 200 con `reaction` valida (server rimane vivo). **Difetto noto atteso**: il catch block chiama `demoReaction(undefined,…)` senza protezione → possibile HTTP 500 o connessione appesa | Media | API |

---

## 3. Flusso Chat e Selezione Cluster

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-09 | Chat — Benvenuto | Pagina aperta (`/`) | Attendere il caricamento; `waitForSelector('.bubble', {visible:true})` | Prima bubble di Genius contiene "Ciao" e "Genius"; `#progress` non ha classe `visible` | Alta | E2E — Puppeteer |
| TC-10 | Chat — Cluster cards | Dopo TC-09 | `waitForSelector('.cluster.active', {visible:true})` | 5 card `.cluster` visibili; quella con `data-id="prestiti"` ha classe `active` e tag "Disponibile"; le altre 4 hanno classe `soon` e tag "🔒 Presto" | Alta | E2E — Puppeteer |
| TC-11 | Selezione — cluster attivo | 5 cluster card visibili | Click su `.cluster.active`; `waitForSelector('.cluster.chosen')` | Card ottiene classe `chosen`; griglia ha classe `locked`; user bubble mostra "💳 Prestiti & Finanziamenti" | Alta | E2E — Puppeteer |
| TC-12 | Selezione — cluster disabilitato | 5 cluster card visibili | Click su `.cluster.soon[data-id="busta"]`; `waitForSelector('.bubble', {visible:true})` con testo "in arrivo" | Nuova bubble di Genius contiene "è in arrivo 🚧"; quiz non avanza; `.cluster.active` rimane cliccabile | Alta | E2E — Puppeteer |
| TC-13 | Chat — CTA "Sono pronto" | Intro completata, CTA visibile | Click su button.cta con testo "Sono pronto"; `waitForSelector('#stage.active', {visible:true})` | View `#stage` diventa attiva; `#chat` non è più attiva; `scene-banner` mostra titolo della situazione 1; `#progress` visibile | Alta | E2E — Puppeteer |

---

## 4. Quiz Round 1 — Validazioni e Interazione

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-14 | Round 1 — bottone disabilitato (nessun input) | `waitForSelector('.answer-card', {visible:true})` in Q1 | Leggere stato iniziale senza interagire | `button.cta` in `.answer-card` ha attributo `disabled`; `.hint` mostra "👆 Prima scegli una risposta" | Alta | E2E — Puppeteer |
| TC-15 | Round 1 — bottone disabilitato (solo opzione) | Stato iniziale Q1 | Click su `.opt:first-child`; verificare stato | `button.cta` ancora `disabled`; `.hint` mostra "✍️ Ora spiegami il perché"; `textarea` ha ricevuto focus | Alta | E2E — Puppeteer |
| TC-16 | Round 1 — bottone disabilitato (solo testo) | Stato iniziale Q1 (nessuna opzione selezionata) | Scrivere testo nel textarea senza aver cliccato opzione | `button.cta` ancora `disabled`; `.hint` mostra "👆 Prima scegli una risposta" | Alta | E2E — Puppeteer |
| TC-17 | Round 1 — bottone abilitato | Opzione e testo presenti | Click opzione + scrivere testo nel textarea | `button.cta` non ha `disabled`; `.hint` mostra "✅ Premi Invio o il pulsante" | Alta | E2E — Puppeteer |
| TC-18 | Round 1 — invio con Enter | Bottone abilitato | Premere Enter nel textarea (senza Shift) | Risposta inviata; user bubble appare con scelta e motivazione; `.answer-card` rimossa dal DOM | Alta | E2E — Puppeteer |
| TC-19 | Round 1 — Shift+Enter | Bottone abilitato | Premere Shift+Enter nel textarea | Newline aggiunto al valore del textarea; risposta non inviata; `button.cta` rimane abilitato | Alta | E2E — Puppeteer |
| TC-20 | Round 1 — placeholder textarea | Situazione aperta | Leggere attributo `placeholder` della textarea | Placeholder contiene la stringa "NON LO SO". **Difetto noto atteso (UX-04)**: colore placeholder `#A3B1BF` su bianco ha contrasto ≈ 2.0:1 < 4.5:1 richiesto | Alta | E2E — Puppeteer |
| TC-21 | Round 1 — bubble utente (escaping) | Situazione aperta | Selezionare opzione, scrivere testo normale, inviare | Bubble utente mostra la motivazione come plain text (funzione `esc()`); nessun tag HTML reso nel DOM | Alta | E2E — Puppeteer |

---

## 5. Reazioni di Genius

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-22 | Reaction — no giudizio | Risposta inviata per la situazione 1 | `waitForSelector('.bubble.reaction', {visible:true})`; leggere testo | Bubble ha classe `reaction`; testo NON contiene "corretto", "esatto", "sbagliato"; contiene calcolo o indizio numerico | Alta | E2E — Puppeteer |
| TC-23 | Reaction — motivazione "NON LO SO" | Situazione aperta | Selezionare opzione, scrivere "NON LO SO", inviare; leggere reaction | Testo reaction non contiene il testo dell'opzione corretta per quella domanda, non contiene la sua lettera (es. "B"), non contiene le parole vietate di TC-22 | Alta | API + E2E |

---

## 6. Analisi e Risultati

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-24 | Analisi — agent card | Round 1 completato, click "Vedi la mia analisi →" | `waitForSelector('.agent-card', {visible:true})`; attendere step done | 3 step diventano `done` sequenzialmente entro 3 s ± 0,5 s; nessuno step rimane `active` dopo 4 s | Bassa | E2E — Puppeteer |
| TC-25 | Analisi — score ring | Valutazione completata | `waitForSelector('.ring-inner', {visible:true})`; leggere contenuto | Ring mostra `X/5`; `encouragement` visibile. **Nota UX-05**: i colori verde/rosso saranno revisionati quando UX-05 è risolto | Alta | E2E — Puppeteer |
| TC-26 | Analisi — feedback fb-guess | Round 1 con Q1 risposta corretta e motivazione "NON LO SO" | `waitForSelector('.bubble.fb-guess', {visible:true})`; leggere intestazione e feedback | Bubble con classe `fb-guess`; `.fb-head` mostra "🤔 Giusta, ma era un tentativo"; `personalized_feedback` inizia con "Risposta giusta, ma hai scritto che non lo sapevi" (testo demo) | Alta | E2E — Puppeteer |
| TC-27 | Analisi — tutto corretto, no lesson | Round 1 con tutte corrette e motivazioni reali | Verificare assenza `.lesson` e testo di Genius | Nessun elemento `.lesson` nel DOM; bubble di Genius contiene "Nessun punto debole: complimenti! 🎉" | Alta | E2E — Puppeteer |

---

## 7. Micro-lezioni

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-28 | Micro-lezioni — blocco e conteggio | Almeno 1 risposta sbagliata o guessata | Attendere `.lesson`; contare le card | Numero card = `wrong_concepts.length + guessed_concepts.length` (verificabile contro risposta di `/api/evaluate`); ogni card ha `.lesson-top`, `h3`, `p`, `.takeaway`, `button.cta.small` | Alta | E2E — Puppeteer |
| TC-29 | Micro-lezioni — bottone "Ho capito" | Micro-lezione visibile | Click su `button.cta.small`; verificare stato | Bottone diventa `disabled` con testo "Capito ✓" | Media | E2E — Puppeteer |
| TC-30 | Micro-lezioni — CTA Round 2 | Tutte le micro-lezioni "Ho capito" completate | `waitForSelector('.cta', {visible:true})` con testo "Mettimi alla prova" | CTA "Mettimi alla prova →" visibile; click avvia Round 2 con `#stage.active` | Alta | E2E — Puppeteer |

---

## 8. Quiz Round 2

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-31 | Round 2 — no motivazione | Round 2 avviato; `waitForSelector('.opt', {visible:true})` in Q1 | Ispezionare il DOM della situazione 1 | Nessun `.answer-card` né `textarea` visibili; le opzioni `.opt` sono immediatamente cliccabili | Alta | E2E — Puppeteer |
| TC-32 | Round 2 — risposta immediata e blocco | Round 2, situazione qualsiasi | Click su `.opt`; verificare stato | Opzione ottiene classe `selected`; row ottiene `locked`; un secondo click su altra opzione non crea una seconda bubble utente; situazione successiva avanza | Alta | E2E — Puppeteer |

---

## 9. Schermata Progresso Finale

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-33 | Progresso — barre animate | Round 2 completato | `waitForSelector('.final', {visible:true})`; attendere ~1,2 s; leggere `style.width` delle `.fill` | Entrambe le `.fill` hanno `width > 0`; i valori corrispondono alle percentuali pre/post mostrate nel testo | Bassa | E2E — Puppeteer |
| TC-34 | Progresso — delta positivo | Pre-score < Post-score | Leggere classe di `.delta` | `.delta` ha classe `up` (non `same` né `down`); testo inizia con `+N%` | Alta | E2E — Puppeteer |
| TC-35 | Progresso — "NON LO SO" count | Almeno una motivazione R1 con "NON LO SO" | Leggere testo della card finale | Card contiene "All'inizio avevi risposto **"NON LO SO"** 1 volta" | Media | E2E — Puppeteer |
| TC-36 | Progresso — chip concetti | Almeno una micro-lezione seguita | Leggere `.chip` | Chips visibili con nomi corretti dei concetti (da `CONCEPT_NAMES`); sezione "CONCETTI CHE HAI STUDIATO OGGI" presente | Media | E2E — Puppeteer |
| TC-37 | Progresso — disclaimer + restart | Card finale visibile | Leggere `.disclaimer`; click su `button.cta` con testo "Ricomincia" | Disclaimer presente; dopo click la pagina si ricarica e il flusso riparte da zero (prima bubble di benvenuto visibile, `#progress` non visibile) | Media | E2E — Puppeteer |

---

## 10. Gestione Errori di Rete

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-38 | Errore rete — /api/evaluate | Puppeteer intercetta e blocca `/api/evaluate` | Completare Round 1, click "Vedi la mia analisi →"; attendere errore | Bubble di errore contiene "Ops, non riesco a contattare il server"; poi compare button.cta "Riprova →"; click Riprova rilancia la chiamata (intercettazione rimossa prima del retry) | Alta | E2E — Puppeteer |
| TC-39 | Errore rete — /api/react | Puppeteer intercetta e blocca `/api/react` | Inviare risposta a situazione 1 | Bubble reaction mostra "Ci sto ancora pensando… ne parliamo alla fine del round! 🧞"; flusso continua (button "Prossima situazione →" appare) | Alta | E2E — Puppeteer |

---

## 11. Sicurezza

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-40 | XSS — motivazione | Round 1, situazione aperta | Selezionare opzione; inserire `<script>alert('XSS')</script><img src=x onerror=alert(1)>` nel textarea; inviare | `.row.user .bubble` mostra il testo come plain text; nessun dialog `alert` aperto; nessun `<script>` o `<img>` nel DOM della bubble | Alta | E2E — Puppeteer |

---

## 12. Accessibilità (smoke test)

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-41 | A11y — logo SVG e avatar bubble | Pagina caricata; situazione 1 raggiunta | Ispezionare DOM | Logo in topbar ha `aria-label="FinGenius 360"`. **Difetto noto atteso (UX-16)**: gli avatar clonati nelle bubble `.row.bot .avatar` ripetono lo stesso `aria-label` senza `aria-hidden="true"` → annunciati inutilmente dagli screen reader. Priorità → Bassa, da correggere post-hackathon | Bassa | Verificato da codice |
| TC-42 | A11y — label textarea | Situazione Round 1 aperta | Ispezionare DOM del campo motivazione | `<label for="mot">` e `<textarea id="mot">` correttamente abbinati → screen reader annuncia etichetta | Media | Verificato da codice |

---

## 13. Esperienza, accessibilità e mobile (aggiunti da UX)

| ID | Area | Precondizioni | Passi | Risultato atteso | Priorità | Tipo |
|----|------|--------------|-------|-----------------|----------|------|
| TC-43 | Stage — separazione view chat/stage | Click "Sono pronto, iniziamo →" | Ispezionare classi `active` su `#stage` e `#chat` | Mentre `#stage.active`: `#chat` non ha `active`. Dopo "Vedi la mia analisi →": `#chat.active`, `#stage` no. Round 2 → `#stage.active`. Progresso finale → `#chat.active` | Alta | E2E — Puppeteer |
| TC-44 | Round 1 — ordine storia → domanda → opzioni | Situazione 1 aperta | Registrare ordine di aggiunta nodi in `#stage-body` | Prima tutte le bubble storia (la prima con classe `scene`), poi bubble `question`, poi `.options`, poi `.answer-card`; nessuna `.opt` visibile prima di `.bubble.question` | Alta | E2E — Puppeteer |
| TC-45 | Round 1 — motivazione solo spazi | Opzione selezionata | Scrivere `"   "` (solo spazi) nel textarea | `button.cta` resta `disabled`; la funzione `trim()` elimina gli spazi e il testo risultante è vuoto | Alta | E2E — Puppeteer |
| TC-46 | Round 1 — motivazione lunga | Opzione selezionata | Incollare testo di 2.000 caratteri; verificare textarea e bubble | Textarea si allunga (auto-resize); nessun troncamento (senza `maxlength`); `button.cta` abilitato; dopo invio la bubble mostra il testo completo con `white-space: pre-wrap` | Alta | E2E — Puppeteer |
| TC-47 | Round 1 — varianti "NON LO SO" | Risposta corretta alla situazione 1 | Inviare motivazione "non lo so" (minuscolo) | Il feedback mostra classe `fb-guess` (regex `/non\s*lo\s*so/i` case-insensitive) | Media | E2E — Puppeteer |
| TC-48 | Round 1 — doppio invio | Bottone abilitato | Doppio click rapido sul bottone "Rispondi a Genius" | Una sola bubble utente creata; una sola reaction da Genius | Media | E2E — Puppeteer |
| TC-49 | Progresso topbar — avanzamento | Round 1, situazione 3 attiva | Leggere `#phase` e `#dots span` | Testo fase "Round 1 · Situazione 3/5"; dots[0] e dots[1] hanno classe `done`; dots[2] ha classe `current`; dots[3] e dots[4] sono vuoti | Media | E2E — Puppeteer |
| TC-50 | Riepilogo — etichette esplicite (UX-05) | Risultati visibili | Leggere testo `.fb-head` per tutti i feedback | **FAIL atteso**: `.fb-head.ok` mostra "✓ Corretta" e `.fb-head.ko` mostra "✗ Da rivedere" — etichette esplicite giusta/sbagliata contrarie al requisito UX-05 | Media | Verificato da codice |
| TC-51 | A11y — tastiera end-to-end (UX-02) | Solo tastiera | Completare cluster → Round 1 → analisi con Tab/Shift+Tab/Invio/Spazio | Ogni controllo è Tab-raggiungibile; focus sempre visibile; dopo CTA il focus si sposta | Alta | Non eseguito — richiede tester umano |
| TC-52 | A11y — annunci screen reader (UX-01) | NVDA/Narrator attivo | Avviare situazione 1 | `#chat-inner` / `#stage-body` hanno `aria-live="polite"` o `role="log"`; contenuti letti automaticamente | Alta | Non eseguito — richiede NVDA/Narrator |
| TC-53 | A11y — contrasto colori (UX-03/04) | — | Calcolo da codice (sRGB) | **FAIL atteso (noti)**: "360" (`#F5B700` su bianco) ≈ 1.74:1; placeholder `#A3B1BF` su bianco ≈ 2.03:1 — entrambi sotto 4.5:1 | Alta | Verificato da codice |
| TC-54 | A11y — reduced motion (UX-07) | `prefers-reduced-motion: reduce` emulato via Puppeteer | Osservare animazioni | Nessuna animazione `pop`/`float`/`spin` attiva; `animation-duration ≈ 0s` o `animation-name: none` per gli elementi interessati | Media | E2E — Puppeteer |
| TC-55 | Mobile — 360×640 (UX-10) | Viewport 360×640, touch emulato in Puppeteer | Cluster → situazione 1 → invio motivazione | `scrollWidth <= clientWidth`; topbar non va a capo; CTA visibile; target touch ≥ 44 px altezza | Alta | E2E — Puppeteer |
| TC-56 | Mobile — tasto a capo tastiera virtuale (UX-08) | Dispositivo touch reale | Digitare motivazione e premere "a capo" | **Comportamento attuale**: invia (come Enter su desktop). Difetto UX-08: l'hint non documenta questo comportamento su mobile | Media | Non eseguito — richiede dispositivo reale |
| TC-57 | Cluster — click ripetuti su "Presto" (UX-14) | 5 cluster visibili | 3 click consecutivi rapidi su `.cluster.soon[data-id="busta"]` | Al più una bubble "in arrivo" aggiunta; `grid.dataset.busy` previene duplicati; nessun avanzamento del flusso | Bassa | E2E — Puppeteer |
| TC-58 | Videolezioni — criteri UX (futura feature) | Feature non implementata | — | Da dettagliare in TC dedicati quando la feature è pronta; sostituisce TC-28/29 per la parte lezioni | Alta | Non eseguito — feature non disponibile |

---

## Riepilogo casi per area (v1.1)

| Area | Casi | Note automazione |
|------|------|-----------------|
| API /api/evaluate | TC-01 – TC-05 (5) | Puppeteer HTTP fetch |
| API /api/react | TC-06 – TC-08 (3) | Puppeteer HTTP fetch |
| Flusso Chat / Cluster | TC-09 – TC-13 (5) | Puppeteer |
| Quiz Round 1 validazioni | TC-14 – TC-21 (8) | Puppeteer |
| Reazioni Genius | TC-22 – TC-23 (2) | Puppeteer |
| Analisi e Risultati | TC-24 – TC-27 (4) | Puppeteer |
| Micro-lezioni | TC-28 – TC-30 (3) | Puppeteer |
| Quiz Round 2 | TC-31 – TC-32 (2) | Puppeteer |
| Schermata Progresso | TC-33 – TC-37 (5) | Puppeteer |
| Errori di rete | TC-38 – TC-39 (2) | Puppeteer (request interception) |
| Sicurezza (XSS) | TC-40 (1) | Puppeteer |
| Accessibilità | TC-41 – TC-42 (2) | Verificato da codice |
| Esperienza/A11y/Mobile (UX) | TC-43 – TC-58 (16) | Puppeteer + Non eseguito |
| **Totale** | **58** | |

**Difetti noti attesi (da non conteggiare come regressioni):** TC-08 (catch clause doppia), TC-20 (contrasto placeholder UX-04), TC-41 (avatar aria-label UX-16), TC-50 (etichette esplicite UX-05), TC-53 (contrasto "360" e placeholder UX-03/04).

---

## Validazione UX

**Revisore:** Esperto UX/UI · **Data:** 2026-10-05

### Verdetto: **APPROVATO CON MODIFICHE**

Copertura funzionale e API buona. Mancavano: separazione chat/stage, ordine storia→domanda, motivazioni lunghe/vuote, tastiera, screen reader, contrasto, reduced motion, mobile e i finding di `ux-review.md`. Aggiunti TC-43 – TC-58 (marcati "aggiunto da UX"). Le modifiche ai casi esistenti elencate di seguito sono state **applicate nella versione 1.1**.

### Modifiche applicate in v1.1

| ID | Modifica applicata |
|----|-------------------|
| TC-01 | Motivazione Q3 corretta → "Il totale delle rate supera il prezzo"; atteso `lessons:[]` confermato |
| TC-03 | Rimosso "classe attesa `fb-ko`" |
| TC-04 | Specificato HTTP 500 + JSON `{error}` + verifica server vivo |
| TC-08 | Specificato comportamento atteso + nota difetto noto catch clause |
| TC-19 | Priorità → Alta |
| TC-20 | Priorità → Alta; aggiunta nota FAIL atteso UX-04 |
| TC-23 | Atteso precisato: no testo opzione corretta, no lettera, no parole vietate TC-22 |
| TC-24 | Priorità → Bassa; tolleranza "3 s ± 0,5 s" aggiunta |
| TC-25 | Aggiunta nota vincolo UX-05 su colori |
| TC-26 | Atteso specificato con testo prefisso demo esatto |
| TC-28 | Aggiunta verifica conteggio = wrong+guessed; nota TC-58 |
| TC-32 | Aggiunto controllo "altri opt non cliccabili" |
| TC-33 | Priorità → Bassa |
| TC-34 | Atteso: verifica classe `up`, non colore diretto |
| TC-37 | Aggiunta verifica stato azzerato dopo reload; priorità → Media |
| TC-41 | Aggiunta nota aria-hidden avatar; priorità → Bassa |
| Generale | Note `waitForSelector` + FAIL attesi con ID UX applicate in intestazione |
