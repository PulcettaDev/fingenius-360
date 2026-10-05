# FinanzIO — Workflow Agentivo

## Flusso completo

```
┌─────────────────────────────────────────────────────────────┐
│                        UTENTE                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                    [Avvia la sessione]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     PRE-QUIZ (5 domande)                    │
│  • Scenario reale → 3 opzioni                               │
│  • Motivazione obbligatoria (testo libero)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    [Invia risposte]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE GENIUS                            │
│                                                             │
│  Step 1: score_quiz(answers)                               │
│    → score: N/5                                            │
│    → wrong_concepts: [lista concetti da ripassare]         │
│                                                             │
│  Step 2: select_lessons(wrong_concepts)                    │
│    → lessons: [contenuto micro-lezioni rilevanti]          │
│                                                             │
│  Step 3: genera feedback personalizzato per ogni domanda   │
│    → analizza la motivazione dell'utente                   │
│    → spiega PERCHÉ la risposta è corretta/errata           │
│    → tono incoraggiante, senza giudizi                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   RISULTATI PRE-QUIZ                        │
│  • Punteggio: N/5 (X%)                                     │
│  • Feedback personalizzato per ogni risposta               │
│  • Micro-lezioni sui concetti da ripassare                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                    [Legge le micro-lezioni]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     POST-QUIZ (5 domande)                   │
│  • Stesse domande, senza campo motivazione                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               MIGLIORAMENTO (Before / After)                │
│  • Score prima: X%    Score dopo: Y%                        │
│  • Delta: +Z punti percentuali                              │
│  • Concetti appresi evidenziati                             │
└─────────────────────────────────────────────────────────────┘
```

## Tool Call Sequence (esempio)

```
→ User message: "Risposte: [0, 0, 1, 0, 1]. Motivazioni: [...]"

← Tool call: score_quiz({answers: [0,0,1,0,1]})
→ Tool result: {score: 2, wrong_concepts: ["taeg_vs_tan","rata_costo_totale","anticipo"]}

← Tool call: select_lessons({wrong_concepts: ["taeg_vs_tan","rata_costo_totale","anticipo"]})
→ Tool result: {lessons: [{concept:"taeg_vs_tan", title:"...", content:"..."},...]}

← Final text: JSON con score, feedback[], lessons[]
```

## Garanzie educative

| Cosa viene semplificato | Cosa NON viene alterato |
|------------------------|------------------------|
| Linguaggio tecnico → plain Italian | Numeri e percentuali reali |
| Concetti astratti → esempi concreti | Definizioni normative (TAEG, TAN) |
| Tono neutro → incoraggiante | Rapporto causa-effetto finanziario |
