# Solution Design — Videolezioni di Genius

**Autore:** Architetto IT · **Richiesta PO:** trasformare le micro-lezioni testuali in un'esperienza "video": animata, narrata, con controlli di riproduzione e domanda di verifica finale. Nessun file video.
**Vincoli:** Node/Express + HTML/JS vanilla, nessun build step, demo mode sempre funzionante, numeri mai generati dall'LLM, ~1h di sviluppo per un developer.

## 1. Idea in breve

Una lezione è una **sequenza di scene temporizzate** descritte in JSON. Un player client-side le "recita": Genius parla (didascalia + voce opzionale `speechSynthesis`), gli elementi visivi entrano uno dopo l'altro (card, barre, calcoli che si compongono), una barra di avanzamento a segmenti mostra la posizione. Alla fine c'è una domanda di verifica con numeri **nuovi**. L'agente sceglie le lezioni (come oggi) e scrive **solo una frase di apertura personalizzata** che richiama la motivazione dell'utente, senza cifre.

```
 /api/evaluate ──► result.lessons = [{concept, title, key_takeaway, scenes[], check, intro}]
                                   │        (dati deterministici dal JSON)   │ (unico testo LLM)
                                   ▼
 showResults() ──► per ogni lezione: playLesson(lesson) ──► Promise (risolta dopo il check)
                                   │
                ┌──────────────────┴──────────────────────────────┐
                │ LessonPlayer                                     │
                │  Timeline (scene + step con "at" ms)             │
                │  Renderers: title | cards | bars | calc | rule   │
                │  Narrator (speechSynthesis, opzionale) + caption │
                │  Controls ▶/⏸  ⏮ ⏭  ↺  CC  🔊                  │
                │  CheckQuestion (fine lezione)                    │
                └──────────────────────────────────────────────────┘
```

## 2. Dove vivono i contenuti

Raccomandazione (risolve anche ARC-13 della review): **un file dati per cluster** in `app/data/prestiti.json`, fonte unica per client e server.

```
app/data/prestiti.json
{
  "cluster":   { "id": "prestiti", "name": "Prestiti & Finanziamenti", "icon": "💳" },
  "questions": [ { "concept", "icon", "chapter", "story[]", "question", "options[]", "correct", "summary" } ],
  "lessons":   { "<concept>": { ...vedi §3... } },
  "demo":      { "feedback": [ {ok, ko} ], "reactions": [ {options[], dontKnow} ], "encouragement": {high, low} }
}
```

- **Server:** `const DATA = JSON.parse(fs.readFileSync(new URL('./data/prestiti.json', import.meta.url)))` (evitare `import ... with {type:'json'}`: dipende dalla versione di Node). `CONCEPTS`, `CORRECT_ANSWERS`, `QUESTION_SUMMARIES`, `LESSONS`, `DEMO_*` diventano derivati di `DATA`.
- **Client:** `const DATA = await fetch('/data/prestiti.json').then(r => r.json())` all'avvio di `start()`; `QUESTIONS = DATA.questions`.
- Le risposte corrette restano visibili al client (già oggi è così): rischio accettato, è un prodotto educativo.
- **Versione minima se manca tempo:** lasciare le domande dove sono e spostare solo `lessons` nel JSON, letto dal server.

## 3. Modello dati della lezione

```
Lesson
├─ concept, title, icon, key_takeaway
├─ intro_fallback { wrong, guessed, dont_know }   ← frasi demo / fallback senza LLM
├─ scenes[]                                        ← la "videolezione"
│   ├─ id
│   ├─ narration     testo di Genius: didascalia + voce. "{{intro}}" = frase personalizzata
│   ├─ min_ms        durata minima della scena
│   └─ visual { type, ...props, items/steps con "at" (ms dall'inizio scena) }
└─ check { question, options[], correct, calc[], explain_ok, explain_ko }
```

Tipi di `visual` (5, sufficienti per tutte le lezioni del cluster):

| type | Props | Resa |
|------|-------|------|
| `title` | `text`, `icon` | Icona grande + titolo che entra in scala |
| `cards` | `items[{at, title, lines[], tone}]` | Card affiancate che compaiono in sequenza (`tone`: neutral/a/b) |
| `bars` | `unit`, `items[{at, label, value, highlight}]`, `delta{at, value, label}` | Barre orizzontali proporzionali al valore massimo, crescono con transizione CSS; `delta` = badge differenza |
| `calc` | `label`, `a`, `a_unit`, `op`, `b`, `b_fmt`, `result`, `result_fmt`, `steps{a,op,b,eq,result}` (ms) | Calcolo che si compone pezzo per pezzo; il risultato fa un count-up |
| `rule` | `formula`, `sub` | Formula su "lavagna" + sottotitolo (il takeaway) |

Regole sui numeri:
- Tutti i numeri sono **scritti nel JSON** da chi cura i contenuti (validati dal finance expert), mai dall'LLM.
- Il player verifica `calc`: se `a op b !== result` scrive `console.error` e mostra la scena comunque (rete di sicurezza in sviluppo).
- La durata effettiva della scena = `max(min_ms, ultimo "at" + 1500, fine della voce se attiva)`.
- Formattazione euro **manuale**: `'€' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')`. Attenzione: `toLocaleString('it-IT')` non raggruppa i numeri a 4 cifre (`8880` invece di `8.880`) mentre raggruppa `10.080`: incoerenza visibile.

## 4. Esempio completo — `rata_costo_totale`

Numeri controllati: 24 × 370 = 8.880; 48 × 210 = 10.080; differenza 1.200; costo oltre il prezzo 880 vs 2.080. Check: 12 × 265 = 3.180; 30 × 115 = 3.450; differenza 270 (coerenti con un tasso di circa l'11% annuo su €3.000).

```json
{
  "concept": "rata_costo_totale",
  "title": "La rata piccola può costare di più",
  "icon": "🚗",
  "key_takeaway": "Rata × mesi = costo totale. A parità di importo, una durata più lunga costa quasi sempre di più.",
  "intro_fallback": {
    "wrong": "Nel quiz la rata più bassa sembrava la strada più leggera. Guardiamo insieme cosa succede quando conti fino all'ultima rata.",
    "guessed": "Hai scelto bene, ma mi hai detto che non eri sicuro: in un minuto ti do il trucco per esserlo sempre.",
    "dont_know": "Grazie per l'onestà! Partiamo da zero: ti mostro un trucco semplice che funziona con qualsiasi finanziamento."
  },
  "scenes": [
    {
      "id": "intro",
      "narration": "{{intro}}",
      "min_ms": 4500,
      "visual": { "type": "title", "icon": "🚗", "text": "La rata piccola può costare di più" }
    },
    {
      "id": "setup",
      "narration": "Stessa auto usata, stesso prezzo: ottomila euro. Il venditore ti propone due piani.",
      "min_ms": 6000,
      "visual": {
        "type": "cards",
        "items": [
          { "at": 0,    "title": "Auto usata", "lines": ["Prezzo: €8.000"], "tone": "neutral" },
          { "at": 1500, "title": "Piano A",    "lines": ["24 rate", "€370 al mese"], "tone": "a" },
          { "at": 3000, "title": "Piano B",    "lines": ["48 rate", "€210 al mese"], "tone": "b" }
        ]
      }
    },
    {
      "id": "trappola",
      "narration": "Se guardi solo la rata mensile, il piano B sembra molto più leggero: duecentodieci euro contro trecentosettanta.",
      "min_ms": 6500,
      "visual": {
        "type": "bars",
        "unit": "eur",
        "caption": "Rata mensile",
        "items": [
          { "at": 0,    "label": "Piano A", "value": 370 },
          { "at": 1200, "label": "Piano B", "value": 210, "highlight": true }
        ]
      }
    },
    {
      "id": "calcolo_a",
      "narration": "Ma il prestito non dura un mese. Facciamo il conto del piano A: ventiquattro rate per trecentosettanta euro fanno ottomilaottocentottanta euro.",
      "min_ms": 7500,
      "visual": {
        "type": "calc",
        "label": "Piano A — quanto paghi in totale",
        "a": 24, "a_unit": "rate",
        "op": "×",
        "b": 370, "b_fmt": "eur",
        "result": 8880, "result_fmt": "eur",
        "steps": { "a": 0, "op": 800, "b": 1600, "eq": 2600, "result": 3200 }
      }
    },
    {
      "id": "calcolo_b",
      "narration": "Ora il piano B: quarantotto rate per duecentodieci euro fanno diecimilaottanta euro.",
      "min_ms": 6500,
      "visual": {
        "type": "calc",
        "label": "Piano B — quanto paghi in totale",
        "a": 48, "a_unit": "rate",
        "op": "×",
        "b": 210, "b_fmt": "eur",
        "result": 10080, "result_fmt": "eur",
        "steps": { "a": 0, "op": 800, "b": 1600, "eq": 2600, "result": 3200 }
      }
    },
    {
      "id": "confronto",
      "narration": "Mettiamoli vicini. Oltre al prezzo dell'auto, con il piano A paghi ottocentottanta euro in più, con il piano B duemilaottanta. La rata più bassa ti costa milleduecento euro in più.",
      "min_ms": 9000,
      "visual": {
        "type": "bars",
        "unit": "eur",
        "caption": "Costo totale",
        "baseline": { "value": 8000, "label": "prezzo dell'auto" },
        "items": [
          { "at": 0,    "label": "Piano A", "value": 8880 },
          { "at": 1200, "label": "Piano B", "value": 10080, "highlight": true }
        ],
        "delta": { "at": 3500, "value": 1200, "label": "in più con il piano B" }
      }
    },
    {
      "id": "regola",
      "narration": "Ecco il trucco da ricordare: rata per numero di mesi uguale costo totale. Più mesi, di solito, vogliono dire più interessi.",
      "min_ms": 7000,
      "visual": { "type": "rule", "formula": "Rata × mesi = costo totale", "sub": "A parità di importo, una durata più lunga costa quasi sempre di più." }
    }
  ],
  "check": {
    "question": "Ti servono €3.000. Piano 1: 12 rate da €265. Piano 2: 30 rate da €115. Quale costa meno in totale?",
    "options": ["Piano 1: 12 rate da €265", "Piano 2: 30 rate da €115", "Costano uguale"],
    "correct": 0,
    "calc": [
      { "label": "Piano 1", "a": 12, "op": "×", "b": 265, "result": 3180 },
      { "label": "Piano 2", "a": 30, "op": "×", "b": 115, "result": 3450 }
    ],
    "explain_ok": "Esatto! 12 × €265 = €3.180, mentre 30 × €115 = €3.450. La rata più bassa costa €270 in più in totale.",
    "explain_ko": "Usiamo il trucco: 12 × €265 = €3.180, mentre 30 × €115 = €3.450. La rata più bassa sembra comoda, ma costa €270 in più in totale."
  }
}
```

Note: la `narration` scrive i numeri **in lettere** per una pronuncia corretta della sintesi vocale; i numeri visualizzati vengono dai campi `value`/`a`/`b`/`result`. Didascalia: mostrare la `narration` così com'è (in alternativa aggiungere un campo `caption` con le cifre; per l'hackathon non serve).

## 5. Frontend: il player

Riusa la vista **stage** già esistente (`setScene('🎬', 'Videolezione 1 di N', title)` + contenuto in `#stage-body`): niente nuova view.

```
┌──────────────────────────────────────────────────────┐
│ 🎬  VIDEOLEZIONE 1 DI 2                               │  ← scene-banner esistente
│     La rata piccola può costare di più               │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │              SCREEN (16:9, navy)               │  │
│  │   Piano A — quanto paghi in totale             │  │
│  │      24 rate  ×  €370  =  €8.880  (count-up)   │  │
│  └────────────────────────────────────────────────┘  │
│  (🧞) "Ma il prestito non dura un mese..."           │  ← caption (CC)
│  ▬▬▬▬ ▬▬▬▬ ▬▬▬▬ ▬▬░░ ░░░░ ░░░░ ░░░░                 │  ← un segmento per scena
│  [⏮] [⏸] [⏭] [↺]                     [CC] [🔊 off] │
└──────────────────────────────────────────────────────┘
          poi: domanda di verifica → spiegazione → [Continua →]
```

Componenti (tutti funzioni nello stesso `<script>`, ~150-200 righe):

| Funzione | Responsabilità |
|----------|----------------|
| `playLesson(lesson, idx, total)` | Monta il player, gestisce lo stato `{scene, playing}`, ritorna una Promise risolta dopo il check |
| `renderScene(scene)` | Svuota lo screen, chiama il renderer del `visual.type`, imposta la caption, avvia il timer della scena |
| `R.title / R.cards / R.bars / R.calc / R.rule` | Creano DOM con `textContent` (mai `innerHTML` con dati) e `style.animationDelay = at + 'ms'` sugli elementi |
| `narrator.speak(text) / stop()` | `speechSynthesis` con voce `it-*` se presente; se assente o disattivata → solo caption |
| `renderCheck(check)` | 3 opzioni, feedback `explain_ok/ko`, mostra i `calc`, poi bottone "Continua →" |
| `fmtEur(n)` | Formattazione manuale (vedi §3) |

Meccanica di riproduzione (semplice e robusta):
- **Build degli step:** solo CSS (`@keyframes` + `animation-delay`). Pausa = classe `.paused` sullo screen con `animation-play-state: paused` + stop del timer della scena.
- **Avanzamento:** un `setTimeout` per scena (durata §3); con voce attiva la scena avanza a `max(durata, utterance.onend)`.
- **Pausa con voce:** `speechSynthesis.pause()` è inaffidabile in Chrome → in pausa si fa `cancel()`; alla ripresa **la scena corrente riparte dall'inizio**. Comportamento accettabile e senza bug di sincronizzazione.
- **⏮/⏭** = scena precedente/successiva, **↺** = dalla scena 0, fine lezione → check automatico.
- **Voce off di default**: si attiva col 🔊 (il click soddisfa le policy di autoplay). Caption on di default.
- `prefers-reduced-motion`: niente animazioni, tutti gli step visibili subito.
- Tastiera: Spazio = play/pausa.
- `{{intro}}` sostituita con `lesson.intro` via `textContent` (testo LLM mai interpretato come HTML).

Integrazione: in `showResults()` sostituire il ciclo delle card (`index.html:589-603`) con `useView('stage'); for (...) await playLesson(l, k, n); useView('chat');`. Il resto del flusso (Round 2, before/after) non cambia. Le lezioni senza `scenes` usano un adattatore `textToScenes(lesson)`: una scena `title`, una scena con sola narrazione per ogni frase di `content`, una scena `rule` con `key_takeaway` → **tutte e 5 le lezioni funzionano subito nel player**, anche se solo una è "ricca".

## 6. Endpoint

Nessun endpoint nuovo. Cambia solo la composizione della risposta di `POST /api/evaluate`:

```
richiesta: invariata { answers[], motivations[] }
risposta:  { score, total, percentage, feedback[], encouragement,
             lessons: [ { concept, title, content, key_takeaway, scenes?, check?, intro } ] }
```

- `lessons` è composto **dal server** a partire da `DATA.lessons` (non più copiato dall'LLM, vedi ARC-06/07).
- `intro` = frase LLM validata, altrimenti `intro_fallback[wrong|guessed|dont_know]`.
- Opzionale (cut): `GET /data/prestiti.json` statico per il client.

## 7. Ruolo dell'agente

```
score_quiz ──► select_lessons ──► LLM: feedback[] + encouragement + lesson_intros[]
 (codice)        (codice)           (solo linguaggio, nessuna cifra nelle intro)
```

- **Selezione:** invariata (`wrong_concepts + guessed_concepts`), ma il server usa i propri risultati dei tool.
- **Intro personalizzata:** aggiungere al `SYSTEM_PROMPT`:
  `"lesson_intros": [{"concept": string, "intro": string}]` — "Per ogni lezione selezionata scrivi 1 frase (max 25 parole) che colleghi la lezione a ciò che l'utente ha scritto nella motivazione. Non usare numeri né cifre, non dire se la risposta era giusta o sbagliata."
- **Validazione server:** stringa, ≤ 200 caratteri, nessuna cifra (`/\d/`) → altrimenti fallback. Così l'LLM non può introdurre numeri nella lezione.
- **Demo mode:** `intro_fallback` scelto in base a `guessed` / "NON LO SO" / errore. Stessa shape di risposta del live → parità garantita.

## 8. Piano di implementazione (1 developer, ~60')

| # | Step | Tempo | Done quando |
|---|------|-------|-------------|
| 1 | Creare `app/data/prestiti.json` con `lessons` (lezione ricca del §4 + le altre 4 come oggi); il server lo legge e `selectLessons` usa `DATA.lessons` | 10' | `/api/evaluate` in demo restituisce `scenes` per `rata_costo_totale` |
| 2 | Server: `lessons` composto server-side + `intro` da `intro_fallback` (demo e fallback live) | 5' | Stessa shape in demo e live |
| 3 | Player: markup + CSS screen/caption/segmenti/controlli, timeline a scene, renderer `title`, `cards`, `bars`, `calc`, `rule`, adattatore `textToScenes` | 25' | La lezione gira da sola, ⏸/▶/↺ funzionano |
| 4 | Check finale + integrazione in `showResults()` | 8' | Il flusso completo arriva al Round 2 |
| 5 | Narrazione `speechSynthesis` + toggle 🔊/CC | 7' | Voce italiana se disponibile, altrimenti solo caption |
| 6 | Agente: `lesson_intros` nel prompt + validazione + merge | 5' | In live l'intro cita la motivazione; senza chiave usa il fallback |
| — | Test: demo mode (0/5, 5/5, risposte "NON LO SO"), live mode, Chrome + Edge | incluso | — |

**Se il tempo finisce, tagliare in quest'ordine:**
1. Narrazione vocale (step 5) → solo caption: l'effetto "video" resta.
2. Intro LLM (step 6) → solo `intro_fallback`: già personalizzata per caso.
3. ⏮/⏭ → solo ▶/⏸ e ↺.
4. Renderer `cards` → la scena `setup` usa `bars` o sola narrazione.
5. Spostamento delle domande nel JSON condiviso → solo `lessons` nel JSON (versione minima §2).

**Non tagliare:** numeri dal JSON, check finale (è la prova "before/after" della singola lezione), demo mode.

## 9. Rischi

| Rischio | Mitigazione |
|---------|-------------|
| Voci italiane assenti o diverse tra browser | Caption sempre disponibile; voce opzionale |
| Lezione troppo lunga (5 lezioni × 60 s) | Scene ≤ 9 s, lezione ≤ 60 s; ⏭ sempre attivo; mostrare "~1 min" nel banner |
| Numeri errati nel JSON | Check automatico `a op b === result` + review del finance expert |
| Testo LLM nell'intro con HTML o istruzioni | `textContent`, validazione lunghezza/cifre, fallback |
