# Genius — l'agente di FinGenius 360

## Descrizione

**Genius** è il coach conversazionale di FinGenius 360, un percorso adattivo di educazione finanziaria di base.
Non fornisce consulenza finanziaria né raccomandazioni: il suo scopo è far capire concetti attraverso situazioni di vita reale.

## Responsabilità

1. **Valutare** le risposte del Round 1 e le motivazioni scritte dall'utente
2. **Distinguere** comprensione reale da risposte indovinate (risposta giusta + "NON LO SO")
3. **Selezionare** le micro-lezioni sui concetti sbagliati o indovinati
4. **Generare** feedback personalizzato che parte dal ragionamento dell'utente
5. **Misurare** il miglioramento con il Round 2 (Before / After)

## Vincoli

- Non dice mai cosa scegliere nella vita reale: le domande chiedono "quale costa meno", non "quale conviene"
- Non modifica numeri né definizioni normative (TAEG, TAN)
- "NON LO SO" è una risposta valida e mai penalizzata nel tono

## Strumenti

| Tool | Tipo | Scopo |
|------|------|-------|
| `analyze_answers` | Deterministico, forzato al primo turno | Punteggio, concetti sbagliati e indovinati, lezioni da ripassare |

I calcoli sono deterministici (codice), il linguaggio è generato dall'LLM: i numeri non possono essere "allucinati".
Il punteggio non passa mai dall'LLM: `analyze_answers` lavora sulle risposte ricevute dal server e la risposta finale dell'agente fornisce solo i testi.

## Aula di Genius (videolezioni interattive)

Le micro-lezioni sono scene animate alla lavagna (`app/data/prestiti.json`, skill `agents/skills/nuova-lezione`):
- Genius spiega con sottotitoli sempre visibili e voce opzionale (sintesi vocale del browser)
- lo studente può **alzare la mano** e fare domande libere (`POST /api/ask`): l'LLM risponde usando solo i materiali della lezione (`prompts/ask_prompt.md`)
- guardrail deterministico `ADVICE_RE`: le richieste di consiglio ("quale mi conviene?", investimenti) ricevono una risposta educativa fissa, senza passare dall'LLM
- domanda di verifica finale con numeri nuovi e reazione senza "giusto/sbagliato"

## Round 2 e approfondimento con un esperto

- Il Round 2 usa **5 situazioni nuove** (`round2` nel file dati) sugli stessi 5 concetti del Round 1: misura il trasferimento del concetto, non la memoria della risposta. All'avvio il server verifica che i concetti corrispondano e che i calcoli tornino
- Se il punteggio del Round 2 è sotto 3/5, Genius propone una sessione gratuita di 30 minuti con un educatore finanziario, sui concetti ancora deboli:
  - **Fissa un appuntamento**: modalità, giorno (prossimi 5 giorni lavorativi), orario, nome, email e consenso. Il promemoria si può aggiungere al calendario (file `.ics`)
  - **Richiamami**: fascia oraria, nome, telefono e consenso
- `POST /api/contact` valida tutti i campi (consenso obbligatorio, email e telefono, data entro 30 giorni, concetti noti), restituisce un codice `FG-xxxx` e non scrive dati personali nei log. In demo i dati restano solo in memoria
- La proposta è formativa: nessuna vendita o raccomandazione di prodotti

## Robustezza

- Input validati su tutti gli endpoint (400 se non validi), body max 20 KB
- Loop agentico limitato a 6 turni, timeout di 30 secondi, fallback automatico al risultato deterministico
- Testo dell'utente racchiuso in tag (`<motivazione>`, `<domanda>`) e trattato come dato (mitigazione prompt injection)
- Calcoli delle lezioni verificati all'avvio (`npm run check`): il server non parte se un conto non torna
- Esposti solo `index.html`, `assets/` e `data/`

## Cluster tematici

| Cluster | Stato |
|---------|-------|
| 💳 Prestiti & Finanziamenti | Implementato (demo) |
| 💼 Busta paga | Roadmap |
| 💡 Bollette & Abbonamenti | Roadmap |
| 📊 Budget personale | Roadmap |
| 🏦 Conto corrente | Roadmap |

Ogni nuovo cluster richiede solo: 5 situazioni, risposte corrette, 5 micro-lezioni. Agente e tool restano invariati.

## Modello

- Provider: Anthropic — `claude-sonnet-5-5` per l'analisi di fine Round 1, `claude-haiku-4-5` per reazioni e domande in aula (testi brevi, costo ridotto)
- Senza `ANTHROPIC_API_KEY` il server gira in **demo mode** con feedback precompilati e gli stessi tool.
