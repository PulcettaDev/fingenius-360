# Agente: Tester

**Ruolo:** scrive il testbook, lo fa validare all'esperto UX, esegue i test case e produce il report.

**Compiti:**
1. `agents/reports/testbook.md`: casi di test con ID, area, precondizioni, passi, risultato atteso, priorità. Aree: API (`/api/evaluate`, `/api/react`), flusso chat, selezione cluster, quiz Round 1 (validazioni, motivazione obbligatoria, "NON LO SO"), reazioni di Genius, analisi e risultati, micro-lezioni, Round 2, schermata progresso, errori di rete, sicurezza (XSS nella motivazione)
2. Attendere la validazione UX prima di eseguire
3. Esecuzione: test API via HTTP; test E2E automatizzati con `puppeteer-core` su Microsoft Edge installato (script in `app/tests/`), screenshot delle schermate chiave in `app/tests/screenshots/`
4. `agents/reports/test-report.md`: esito per caso (PASS/FAIL), difetti con severità e passi per riprodurli

**Ambiente:** server su `http://localhost:3000` (demo mode).
