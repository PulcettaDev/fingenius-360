# FinGenius 360 — Finanza personale, una storia alla volta

**Il tuo Genius agentico personale per l'educazione finanziaria di base.**

FinGenius 360 è un percorso adattivo di educazione finanziaria guidato da **Genius**, un coach agentico. L'utente vive situazioni di tutti i giorni, sceglie e motiva la risposta, va in aula sui concetti che non ha capito e poi mette alla prova quanto ha imparato su situazioni nuove. Non fornisce consulenza finanziaria: spiega i concetti, non dice cosa scegliere.

Cluster dimostrativo: **Prestiti & Finanziamenti** (TAEG vs TAN, rata vs costo totale, tasso zero, anticipo, carte revolving).

## Avvio rapido

```bash
cd app
npm install
npm start              # http://localhost:3000
```

Senza `ANTHROPIC_API_KEY` l'app gira in **demo mode**: stesso flusso e stessi tool deterministici, con testi precompilati. Per usare l'agente reale:

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
npm start
```

Controllo dei contenuti (calcoli, coerenza tra Round 1 e Round 2, verifiche delle lezioni):

```bash
npm run check
```

## Il percorso

1. **Scegli il tema**: 5 cluster, attivo Prestiti & Finanziamenti
2. **Round 1**: 5 situazioni raccontate come storie. Ognuna ha una domanda puntuale, 3 opzioni e una motivazione obbligatoria; "NON LO SO" è una risposta valida
3. **Genius reagisce** dopo ogni risposta con un calcolo o un'analogia, senza dire "giusto" o "sbagliato"
4. **Analisi agentica**: punteggio, concetti sbagliati e risposte giuste ma indovinate
5. **L'aula di Genius**: una lezione animata per ogni concetto debole
   - lavagna con calcoli, confronti e barre; sottotitoli sempre visibili, voce opzionale, comandi da player
   - **🙋 Alza la mano**: domande suggerite o libere a Genius
   - domanda di verifica con numeri nuovi
6. **Round 2**: 5 **situazioni nuove** sugli stessi concetti, per misurare se il concetto è stato capito e non solo ricordato
7. **Prima e dopo**: confronto dei punteggi e concetti studiati
8. **Esperto** (se il Round 2 è sotto 3/5): Genius propone una sessione gratuita con un educatore finanziario
   - 📅 **Fissa un appuntamento**: modalità, giorno, orario; promemoria scaricabile in `.ics`
   - 📞 **Richiamami**: fascia oraria e numero di telefono

## Struttura

```
├── app/                    → prototipo
│   ├── index.html          → UI: chat, stage del quiz, aula, prenotazione esperto
│   ├── server.js           → agente Genius, tool, API
│   ├── data/prestiti.json  → contenuti verificati: situazioni, Round 2, lezioni, FAQ, verifiche
│   ├── lib/ · scripts/     → controllo deterministico dei calcoli
│   └── tests/              → test E2E (puppeteer-core su Edge) e screenshot
├── agents/                 → architettura agentica
│   ├── agent.md            → Genius: responsabilità, vincoli, tool, guardrail
│   ├── workflow.md         → flusso
│   ├── prompts/            → system, reaction, ask
│   ├── tools/              → analyze_answers
│   ├── skills/             → nuova-lezione, verifica-contenuti
│   ├── team/               → commissione di agenti di sviluppo (finanza, UX, architetto, sviluppatore, tester)
│   └── reports/            → review, solution design, testbook, test report
├── presentation/           → presentazione HTML (brand Accenture)
└── README.md
```

## Architettura agentica

**Principio guida: i numeri sono deterministici, il linguaggio è generativo.**

| Componente | Tipo | Scopo |
|---|---|---|
| `analyze_answers` | Tool deterministico, forzato al primo turno | Punteggio, concetti sbagliati e indovinati, lezioni da ripassare: calcolati sulle risposte reali, mai passati dall'LLM |
| Feedback di fine Round 1 | LLM (`claude-sonnet-5-5`) | Testi personalizzati a partire dalla motivazione dell'utente |
| Reazioni e domande in aula | LLM veloce (`claude-haiku-4-5`) | Testi brevi; in aula solo con i materiali della lezione |
| `ADVICE_RE` e FAQ | Codice | Richieste di consiglio bloccate e domande suggerite risposte senza chiamare l'LLM |

**Token:** una sessione completa usa circa 4.500 token in ingresso (prima dell'ottimizzazione circa 9.500). L'analisi richiede 2 chiamate invece di 3, il tool restituisce solo concetti e titoli, guardrail e FAQ costano 0 token, Haiku gestisce i testi brevi. Dettagli in `agents/workflow.md`.

| Endpoint | Quando |
|---|---|
| `POST /api/react` | dopo ogni risposta del Round 1 |
| `POST /api/evaluate` | a fine Round 1 (loop agentico con tool use) |
| `POST /api/ask` | domande libere in aula |
| `POST /api/contact` | appuntamento o richiamata con un esperto |

**Robustezza e sicurezza**
- Input validati su tutti gli endpoint; body massimo 20 KB
- Loop agentico al massimo di 6 turni, timeout di 30 secondi, fallback al risultato deterministico
- Testo dell'utente trattato come dato (mitigazione della prompt injection)
- Il server espone solo `index.html`, `assets/` e `data/`
- I contatti richiedono il consenso esplicito; nessun dato personale nei log; in demo i dati restano solo in memoria

## Deliverable

- **01 · User Difficulty Statement**: chi ha poca familiarità con la finanza ha un doppio punto cieco: non sa di non sapere e prova imbarazzo ad ammetterlo. Davanti a un'offerta di credito guarda la rata, non il costo. La motivazione obbligatoria e il "NON LO SO" senza giudizio fanno emergere il vero livello di comprensione.
- **02 · Before/After Simplicity Evidence**: dal testo normativo all'analogia di Genius ("il TAN è il biglietto base, il TAEG il prezzo finale"), dal questionario astratto alla storia con calcolo visibile. Il miglioramento è misurato: Round 1 contro Round 2 su situazioni nuove.
- **03 · Risk & Clarity Note**: semplificato il linguaggio, non i contenuti. Numeri e definizioni vengono da dati statici verificati, mai dall'LLM. Le domande sono fattuali ("quale costa meno", mai "quale conviene") e le richieste di consiglio vengono bloccate. Il rinvio a un esperto è formativo, non commerciale. Disclaimer sempre visibile: strumento educativo, non consulenza.

## Presentazione

Apri `presentation/index.html` nel browser. Frecce o spazio per navigare, `f` per lo schermo intero.
