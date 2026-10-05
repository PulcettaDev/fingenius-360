---
name: nuova-lezione
description: Crea o modifica una lezione in aula di FinGenius 360 (scene alla lavagna, domande frequenti, domanda di verifica) in app/data/<cluster>.json. Usala quando serve aggiungere un concetto o un nuovo cluster.
---

# Skill: nuova lezione in aula

Una lezione è un oggetto in `lessons.<concept_id>` del file dati del cluster (`app/data/prestiti.json`).

## Struttura

```json
{
  "title": "…", "content": "testo base (usato dall'agente)", "key_takeaway": "…",
  "scenes": [ { "say": "battuta di Genius (sottotitolo e voce)", "board": { "type": "…" } } ],
  "faq":   [ { "q": "domanda suggerita", "keys": ["parole", "chiave"], "a": "risposta verificata" } ],
  "check": { "question": "…", "options": ["", "", ""], "correct": 0, "reactions": ["", "", ""] }
}
```

Tipi di lavagna (`board.type`), tutti con `title` opzionale:
- `title`: `text`, `sub`
- `compare`: `cols[{head, lines[], hl}]`
- `calc`: `rows[{show, check:{a, b, op: mul|div|add|sub, plus, result, tol}}]`
- `bars`: `items[{label, value}]`, `unit`, `max`
- `rule`: `text`

## Regole

1. 3-5 scene: apertura (`title`), meccanismo, numeri dell'esempio del quiz, regola finale (`rule`)
2. Ogni calcolo mostrato va in `calc.rows` con il campo `check`: il server non parte se un conto non torna
3. La domanda di verifica usa **numeri nuovi** rispetto al quiz; le `reactions` mostrano il calcolo senza dire "giusto" o "sbagliato"
4. Nessun consiglio: mai "conviene", "scegli", "devi". Si descrivono fatti e meccanismi
5. 4 FAQ per lezione, con almeno una domanda "da consiglio" a cui Genius risponde senza consigliare
6. Al termine esegui `npm run check` in `app/` e fai validare i numeri all'esperto finanza (`agents/team/finance-expert.md`)
