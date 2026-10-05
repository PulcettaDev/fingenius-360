# Requisiti UX — "Videolezioni" animate di Genius

**Autore:** Esperto UX/UI · **Data:** 2026-10-05 · **Stato:** pronto per sviluppo · **Effort target:** ~1 h, 1 sviluppatore, vanilla JS, nessuna dipendenza.

## 1. Obiettivo

Trasformare le micro-lezioni testuali (oggi: una card in chat per ogni concetto sbagliato o indovinato) in una **videolezione simulata**: scene animate guidate da Genius che si costruiscono passo passo, calcoli visualizzati, controlli da player, voce opzionale (Web Speech API) con **sottotitoli sempre visibili** e una **domanda di verifica** finale. Nessun video reale.

## 2. Entry point e collocazione

| Aspetto | Requisito |
|---|---|
| Dove vive | **Vista dedicata** `#lesson` (terza `.view`, come `#stage`), non in chat. La chat resta il "corridoio" narrativo, la vista lezione è il "cinema". |
| Ingresso | Dopo il riepilogo in chat, Genius dice: "Ho preparato *N* videolezioni solo per te (~1 min l'una)". Segue una **card playlist** in chat: elenco lezioni (icona del capitolo, titolo, durata stimata, stato ○ da vedere / ✓ vista) + CTA gold "▶ Guarda le videolezioni". |
| Sequenza | Le lezioni si susseguono nella vista `#lesson`; a fine dell'ultima → ritorno in chat, playlist aggiornata (tutte ✓), poi il messaggio attuale "Ora vediamo se è cambiato qualcosa…" e CTA Round 2. |
| Nessuna lezione | Comportamento attuale invariato (vista non mostrata). |
| Topbar | Fase = "Videolezione k di N"; dots non usati (o nascosti) per non confondersi con le 5 situazioni. |

## 3. Struttura della schermata

```
┌ Banner (riuso .scene-banner) ─────────────────────────┐
│ [icona capitolo]  VIDEOLEZIONE 1 DI 3                 │
│                   La rata piccola può costare di più  │
└───────────────────────────────────────────────────────┘
┌ Schermo 16:9 (sfondo navy, max-height 50vh) ──────────┐
│  elementi della scena che appaiono uno dopo l'altro   │
│  (cifre, barre, confronti A/B, formula)               │
│                                    [avatar Genius]    │
└───────────────────────────────────────────────────────┘
┌ Sottotitolo (sempre visibile, aria-live) ─────────────┐
│ 🧞 "Moltiplica la rata per i mesi: 48 × 210 = …"      │
└───────────────────────────────────────────────────────┘
┌ Controlli ────────────────────────────────────────────┐
│ ⏮  ▶/⏸  ⏭   ▮▮▮▯▯ (segmenti = scene)   🔊   Salta ⤼  │
└───────────────────────────────────────────────────────┘
```

| Elemento | Specifica |
|---|---|
| Schermo | `div` con `aspect-ratio:16/9`, sfondo navy, testo bianco; elementi con classe `.beat` che entrano con fade+slide (300 ms, sfalsati di ~600 ms). Cifre chiave in gold (su navy il contrasto è OK ~9:1). |
| Tipi di scena (data-driven) | `intro` (titolo + gancio dalla storia dell'utente), `calc` (righe di calcolo che si compongono: "24 × €370 = **€8.880**"), `compare` (due barre A/B che crescono proporzionali al costo totale), `analogy` (frase + emoji grande), `takeaway` (riuso `key_takeaway` nel box gold). 3–5 scene per lezione. |
| Sottotitolo | Testo della scena corrente, min 1rem, navy su bianco; mai nascosto, anche con voce attiva. |
| Controlli | `<button>` reali, target ≥ 44×44 px: Ricomincia scena (⏮), Play/Pausa, Scena successiva (⏭), Voce on/off (🔊/🔇, `aria-pressed`), "Salta lezione". Barra progresso a segmenti cliccabili (una per scena). |
| Fine lezione | Overlay sullo schermo: domanda di verifica (1 domanda, 2–3 opzioni, stile `.opt`). Dopo la scelta Genius reagisce con il calcolo/analogia **senza dire giusto/sbagliato** (coerente col Round 1). Poi CTA "Prossima videolezione →" / "Torna da Genius →" e link "↻ Rivedi". |

## 4. Contenuti (script lato client)

- Nuovo oggetto `LESSON_SCRIPTS[concept]` in `index.html` (le lezioni restano selezionate dal server: si usa `lesson.concept` come chiave; `title`/`key_takeaway` dal server).
- Fallback: se manca lo script per un concept → lezione a 2 scene (`intro` con `lesson.content`, `takeaway`).
- Bozze di calcolo (**da validare con l'Esperto Finanza**):

| Concept | Scena chiave |
|---|---|
| `rata_costo_totale` | 24 × €370 = €8.880 vs 48 × €210 = €10.080 → barre A/B, "€1.200 in più per respirare ogni mese" |
| `tasso_zero` | 12 × €58,33 = €699,96 vs €620 → "+€79,96: lo zero era solo sul TAN" |
| `anticipo` | 36 × €185 = €6.660 vs €1.500 + 24 × €205 = €6.420 → "−€240" |
| `revolving` | Mese 1: €3.000 × 21% ÷ 12 = €52,50 di interessi → dei €60 solo €7,50 riducono il debito → ~120 rate ≈ 10 anni, ~€7.200 pagati |
| `taeg_vs_tan` | Analogia "prezzo del biglietto (TAN) vs biglietto + bagaglio + posto (TAEG)"; confronto 6,2% vs 5,8% |

## 5. Stati

| Stato | Descrizione | Controlli |
|---|---|---|
| `ready` | Poster: titolo, durata stimata, grande ▶ "Avvia" | Solo Avvia, Salta |
| `playing` | Le scene avanzano automaticamente | Tutti; Play mostra ⏸ |
| `paused` | Animazione e voce ferme sulla scena corrente | ▶ riprende **dall'inizio della scena** (semplifica la sincronia voce) |
| `check` | Domanda di verifica visibile, player bloccato | Opzioni; ⏮ = rivedi lezione |
| `answered` | Reazione di Genius + CTA avanti | Avanti, Rivedi |
| `done` | Lezione marcata ✓ nella playlist | — |

Durata scena: con voce → avanza a `utterance.onend` + 600 ms; senza voce → `max(3500 ms, 60 ms × caratteri del sottotitolo)`.

## 6. Interazioni e voce

- Voce: `speechSynthesis` con voce `it-IT` se disponibile; **default OFF** (attivabile con 🔊, preferenza ricordata per la sessione). Se l'API o una voce italiana non esiste → pulsante 🔊 nascosto, solo sottotitoli.
- Pausa/scena successiva/salta/uscita dalla vista → `speechSynthesis.cancel()`.
- Tastiera (vista attiva, focus non in un campo): `Spazio`/`K` play-pausa, `→` scena successiva, `←` ricomincia scena, `M` voce on/off.
- Click sullo schermo = play/pausa.
- Navigazione indietro sui segmenti consentita; in avanti consentita (nessun blocco: l'utente è adulto).

## 7. Accessibilità

- Sottotitoli in contenitore `aria-live="polite"`; gli elementi animati dello schermo `aria-hidden="true"` (il contenuto equivalente sta nel sottotitolo).
- All'ingresso nella vista il focus va sul pulsante ▶ Avvia; dopo la verifica sul CTA successivo.
- Tutti i controlli con `aria-label` in italiano; barra progresso `role="group"` con segmenti `aria-label="Scena 2 di 4"` e `aria-current="step"`.
- `:focus-visible` evidente (ring gold su navy, navy su bianco).
- `prefers-reduced-motion: reduce` → nessuna transizione: gli elementi appaiono istantaneamente; autoplay sostituito da avanzamento manuale (⏭).
- Contrasti ≥ 4,5:1 per tutto il testo; mai gold su bianco per testo.
- Nessun lampeggio > 3 Hz.

## 8. Mobile

- Schermo a piena larghezza, `max-height: 45dvh`; controlli in una sola riga (Salta come icona) sotto 400 px.
- Target touch ≥ 44 px; sottotitolo sempre sopra i controlli, mai coperto dalla tastiera (non ci sono input testuali).

## 9. Fuori scope (hackathon)

Video reali, avatar parlante con lip-sync, velocità di riproduzione, persistenza tra sessioni, tracciamento del punteggio della verifica nel Round 2.

## 10. Criteri di accettazione

1. Con ≥ 1 lezione, dopo il riepilogo appare in chat una card playlist con N voci (titolo + stato) e il CTA "▶ Guarda le videolezioni".
2. Il CTA apre la vista `#lesson` (chat e stage nascosti); il banner mostra "Videolezione 1 di N" e il titolo restituito dal server.
3. Con 0 lezioni la vista lezione non viene mai mostrata e il flusso attuale verso il Round 2 resta invariato.
4. Ogni lezione ha almeno 3 scene; ogni scena mostra i propri elementi in sequenza (non tutti insieme) quando reduced-motion è disattivo.
5. Il sottotitolo della scena corrente è sempre visibile, con voce attiva o no.
6. ⏸ ferma avanzamento e voce entro 300 ms; ▶ riprende dall'inizio della scena corrente.
7. ⏭ passa alla scena successiva; ⏮ riavvia la scena corrente; cliccando un segmento si va a quella scena.
8. Il segmento della scena corrente è evidenziato e ha `aria-current="step"`; i precedenti risultano completati.
9. Senza voce le scene avanzano da sole con durata ≥ 3,5 s; con voce avanzano al termine della frase.
10. Se `speechSynthesis` non è disponibile, il pulsante voce non è mostrato e non compaiono errori in console.
11. La voce è disattivata di default; attivandola, la scena corrente viene letta in italiano e `aria-pressed="true"`.
12. Uscire dalla lezione (Salta, Avanti, fine) interrompe sempre la voce.
13. A fine scene compare una domanda di verifica con 2–3 opzioni; dopo la scelta la reazione di Genius contiene il calcolo/analogia e **non** contiene le parole "giusto", "sbagliato", "corretto", "errato".
14. Dopo la verifica: "Prossima videolezione →" (se presente) oppure "Torna da Genius →"; "↻ Rivedi" riparte dalla scena 1.
15. Al ritorno in chat la playlist mostra ✓ su tutte le lezioni completate o saltate (saltata = icona distinta "⤼") e segue il CTA del Round 2.
16. Tutti i controlli sono raggiungibili con Tab nell'ordine visivo, hanno focus visibile e `aria-label`; Spazio, ←, →, M funzionano come specificato.
17. Con `prefers-reduced-motion: reduce` non ci sono transizioni e le scene avanzano solo con ⏭.
18. A 360 px di larghezza nessun elemento esce dallo schermo orizzontalmente e tutti i controlli sono visibili senza scroll orizzontale.
19. Le cifre mostrate nelle scene corrispondono ai dati delle storie del quiz (validazione Esperto Finanza registrata).
20. Se un concept non ha script, viene mostrata la lezione di fallback (2 scene) senza errori.

## 11. Suggerimento di implementazione (≤ 1 h)

| Passo | Tempo |
|---|---|
| Markup vista `#lesson` + CSS schermo/controlli (riuso banner, `.opt`, `.cta`, `.takeaway`) | 15' |
| Motore player: array scene, `playScene(i)` con `setTimeout` sfalsati per i `.beat`, stato, controlli, tastiera | 20' |
| Voce (speak/cancel/onend) + reduced motion | 10' |
| `LESSON_SCRIPTS` per i 5 concept + verifica finale | 15' |
