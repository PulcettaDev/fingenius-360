---
name: verifica-contenuti
description: Verifica deterministica e revisione finanziaria dei contenuti di FinGenius 360 (calcoli, coerenza dei tassi, assenza di consigli). Usala prima di ogni consegna o dopo aver modificato app/data/.
---

# Skill: verifica contenuti

## 1. Controllo automatico
```bash
cd app && npm run check
```
Verifica che ogni calcolo con `check` torni, che ogni situazione abbia la sua lezione e che ogni domanda di verifica sia completa. Lo stesso controllo gira all'avvio del server, che non parte se trova errori.

## 2. Controllo dell'esperto finanza
- I numeri delle due alternative di una situazione devono essere coerenti con uno stesso tasso implicito
- Le cifre arrotondate vanno scritte come tali ("circa", "oltre")
- Il testo descrive meccanismi e non indica mai cosa scegliere

## 3. Guardrail anti-consulenza (domande libere in aula)
- `ADVICE_RE` in `app/server.js` intercetta le richieste di consiglio prima dell'LLM e restituisce una risposta fissa
- Prova: chiedi "quale prestito mi conviene?" o "devo investire in azioni?": deve arrivare il rifiuto educativo
