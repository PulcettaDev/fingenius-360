# FinGenius 360 — Workflow agentico

## Flusso completo

```
UTENTE
  │  sceglie il cluster (attivo: Prestiti & Finanziamenti)
  ▼
ROUND 1 · 5 situazioni (storia → domanda → 3 opzioni → motivazione obbligatoria)
  │  dopo ogni risposta ──► POST /api/react ──► reazione socratica (Haiku 4.5)
  ▼
AGENTE GENIUS · POST /api/evaluate (Sonnet 5.5, max 6 turni, timeout 30 s)
  │  turno 1: tool_choice forzato → analyze_answers()       [deterministico]
  │           punteggio, concetti sbagliati e indovinati, lezioni da ripassare
  │  turno 2: feedback personalizzato sulle motivazioni     [generativo, JSON]
  │  errore o JSON non valido → risultato deterministico (demo)
  ▼
AULA DI GENIUS · una lezione per concetto debole
  │  lavagna animata + sottotitoli + voce opzionale
  │  🙋 domande ──► POST /api/ask
  │       1. ADVICE_RE: richiesta di consiglio → risposta fissa       (0 token)
  │       2. domanda suggerita → risposta verificata dalle FAQ        (0 token)
  │       3. domanda libera → LLM vincolato ai materiali (Haiku 4.5)
  │  domanda di verifica con numeri nuovi
  ▼
ROUND 2 · 5 situazioni NUOVE sugli stessi concetti (nessun LLM)
  ▼
PRIMA / DOPO · confronto punteggi, concetti studiati
  │  Round 2 < 3/5
  ▼
ESPERTO · POST /api/contact (appuntamento o richiamata, consenso obbligatorio)
```

## Sequenza delle chiamate di /api/evaluate

```
→ user: 5 sintesi delle situazioni + risposta scelta + <motivazione>…</motivazione>
← tool_use: analyze_answers({})                       (forzato da tool_choice)
→ tool_result: {score, total, results[{q, concept, ok, guessed}], lessons_to_review[{concept, title}]}
← text: {"feedback": [{question_index, personalized_feedback}], "encouragement": "…"}
```

Il server usa dall'LLM solo i testi; punteggio, esiti e lezioni restano quelli calcolati dal codice.

## Ottimizzazione dei token

| Scelta | Effetto |
|---|---|
| Un solo tool senza input, forzato al primo turno | 2 chiamate invece di 3; nessun dato del punteggio passa dall'LLM |
| Il tool restituisce concetti e titoli, non il testo delle lezioni | risultato del tool più piccolo |
| Guardrail e FAQ prima dell'LLM in aula | le richieste di consiglio e le domande suggerite costano 0 token |
| Haiku 4.5 per reazioni e domande in aula, Sonnet 5.5 per l'analisi | costo basso sui testi brevi |
| Tetti di output (300 / 350 / 1500 token) e risposte di 3-4 frasi | output contenuto |
| Round 2, aula e verifiche senza LLM | contenuti statici verificati |

## Garanzie educative

| Cosa viene semplificato | Cosa NON viene alterato |
|---|---|
| Linguaggio tecnico → italiano quotidiano | Numeri e percentuali (dati statici verificati) |
| Concetti astratti → storie, analogie, lavagna | Definizioni normative (TAEG, TAN) |
| Tono neutro → incoraggiante | Rapporti causa-effetto finanziari |
