# Finance Review — FinGenius 360 (cluster: Prestiti & Finanziamenti)

**Revisore:** Esperto Finanza | **Data:** 2026-10-05

---

## Tabella di revisione

| Punto | File / riga | Problema | Severità | Correzione proposta |
|-------|-------------|----------|----------|---------------------|
| 1 | `index.html` Q4 story; `server.js` riga 24 | **Piani con TAN impliciti diversi (Q4 scooter).** Piano A (36×€185 su €6.000) implica TAN ≈ 6,9%; Piano B (24×€205 su €4.500) implica TAN ≈ 8,7%. La lezione "più anticipo = meno interessi" è corretta in linea di principio, ma i numeri della storia non la supportano in modo pulito: il risparmio di Piano B dipende sia dal minor capitale finanziato sia dal minor numero di rate, che in parte compensa il tasso più alto. Lo studente che prova a fare il calcolo non riesce a isolare l'effetto anticipo. | **Alta** | Usare lo stesso TAN per entrambi i piani (es. 7% ann.): Piano A → 36×€184 = €6.624; Piano B → 1.500 + 24×€202 = €6.348. La differenza di €276 è attribuibile solo all'anticipo. |
| 2 | `index.html` Q2 story; `server.js` riga 22 | **Piani con TAN impliciti diversi (Q2 auto).** 24×€370 su €8.000 implica TAN ≈ 9,6%; 48×€210 su €8.000 implica TAN ≈ 12%. I due piani appaiono come alternative dello stesso venditore ma nascondono tassi molto diversi, amplificando artificialmente la differenza. La risposta corretta (A) e i totali (€8.880 vs €10.080) sono comunque corretti. | **Media** | Uniformare il TAN (es. 10%): Piano A → 24×€369 = €8.856; Piano B → 48×€203 = €9.744. Il messaggio non cambia, la coerenza interna migliora. |
| 3 | `server.js` LESSONS `tasso_zero` riga 44-46 | **TAEG non mostrato nel racconto Q3 pur essendo citato nella lezione.** La storia mostra solo "TASSO ZERO!" senza indicare il TAEG implicito del piano rateale (≈ 22,8% annuo, calcolato come r che attualizza 12 rate da €58,33 a €620). La lezione poi consiglia "Guarda il TAEG, non solo il TAN": lo studente non ha il dato su cui applicare il consiglio. | **Media** | Aggiungere al racconto o alla scheda della lezione il TAEG implicito del finanziamento, es.: "Il prezzo rateale equivale a un TAEG di circa 23%". Rafforza la coerenza lesson–storia. |
| 4 | `index.html` Q3 story | **Arrotondamento 12 × €58,33 = €699,96 ≠ €700.** Il totale citato nei testi è €700 ma il calcolo esatto è €699,96. Discrepanza di €0,04. | **Bassa** | Cambiare la rata a €58,34 (totale €700,08 ≈ €700) oppure scrivere "12 rate da €58,33 + €0,04 di saldo finale". |
| 5 | `server.js` CORRECT_ANSWERS riga 18 | **Indici risposta corretta.** Verificati tutti: Q1→1 (TAEG bassa), Q2→0 (24 rate), Q3→1 (pagare subito), Q4→1 (con anticipo), Q5→2 (≈10 anni). Tutti corretti. | — | — |
| 6 | `server.js` Q5 LESSONS `revolving` riga 56 | **Calcolo revolving corretto.** €3.000 al 21% ann.: interessi mensili = €52,50; capitale rimborsato/mese ≈ €7,50; tempo a zero ≈ 120 mesi (formula: n = -ln(1 − r·B/P) / ln(1+r) = 119,9 mesi); totale interessi ≈ €4.184 > €4.000. I dati esposti nell'app sono accurati. | — | — |
| 7 | `server.js` LESSONS (tutte) | **Definizioni TAN/TAEG/tasso zero/revolving.** Conformi a TUB art. 121 e D.Lgs. 141/2010 (recepimento dir. 2008/48/CE). Nessuna frase prescrittiva ("conviene", "dovresti", "scegli"). Disclaimer finale completo. | — | — |

---

## Verdetto

**CONDIZIONATAMENTE APPROVATO.** I calcoli esposti, le definizioni normative e la risposta corretta di tutte e 5 le domande sono esatti. Nessun linguaggio prescrittivo rilevato. Due problemi di coerenza interna (piani con TAN impliciti diversi in Q2 e Q4) richiedono correzione prima del demo: il punto Alta (Q4) mina la lezione sull'anticipo, il punto Media (Q2) è meno critico ma introduce rumore pedagogico.
