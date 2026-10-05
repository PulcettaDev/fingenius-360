# Commissione di test e sviluppo — FinGenius 360

Squadra di agenti che valida e fa evolvere il prodotto. Ogni agente ha un ruolo, input e output definiti; i report finiscono in `agents/reports/`.

| # | Agente | File | Output |
|---|--------|------|--------|
| 1 | Esperto finanza | [finance-expert.md](finance-expert.md) | `reports/finance-review.md` |
| 2 | Esperto UX/UI | [ux-expert.md](ux-expert.md) | `reports/ux-review.md`, `reports/ux-requirements-lessons.md`, validazione testbook |
| 3 | Architetto IT | [architect.md](architect.md) | `reports/architecture-review.md`, `reports/solution-design-lessons.md` |
| 4 | Sviluppatore | [developer.md](developer.md) | codice in `app/` |
| 5 | Tester | [tester.md](tester.md) | `reports/testbook.md`, `reports/test-report.md`, script in `app/tests/` |

## Workflow

```
Fase A — Verifica dell'esistente
  [Finanza] ─┐
  [UX]      ─┼─ in parallelo
  [Architetto]┤
  [Tester: bozza testbook] ─► [UX: validazione testbook] ─► [Tester: esecuzione]

Fase B — Sviluppo lezioni
  [UX: requisiti] + [Architetto: solution design] ─► [Sviluppatore] ─► [Tester: regressione + nuovi casi] ─► [Finanza: check contenuti]
```

## Regole comuni

- Vincolo di dominio: solo educazione finanziaria, mai consulenza o indicazioni su cosa scegliere.
- I numeri nei contenuti devono essere verificabili con un calcolo.
- Ogni finding ha severità: **Bloccante / Alta / Media / Bassa**.
- Report concisi: tabelle e punti elenco, niente prosa superflua.
