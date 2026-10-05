# UX Review — FinGenius 360 (`app/index.html`)

**Revisore:** Esperto UX/UI · **Data:** 2026-10-05 · **Metodo:** review del codice (HTML/CSS/JS), nessun rendering visivo. I contrasti sono calcolati sui valori hex (WCAG 2.1).

## Sintesi

L'esperienza rispetta bene i principi del committente: stile chat, storia → domanda → opzioni → motivazione obbligatoria, interfaccia "stage" separata con banner di scena, reazione di Genius senza giudizio esplicito. I problemi principali riguardano **accessibilità** (contrasti di gold/teal, nessuno stato di focus, nessuna aria-live, nessuna gestione di reduced motion), il **ritmo** (ritardi fissi, non saltabili) e alcune **incoerenze col principio "niente giusto/sbagliato"** nel riepilogo.

## Contrasti misurati

| Combinazione | Dove | Rapporto | Esito (AA testo normale 4,5:1 / grande 3:1) |
|---|---|---|---|
| Gold `#F5B700` su bianco | "360" nel logotipo | ~1,8:1 | KO |
| Bianco su teal `#00B3A4` | Opzione selezionata, tag "Disponibile" | ~2,6:1 | KO |
| Teal-dark `#008C80` su bianco / teal-soft | `.q-label`, `.phase` (0,7rem) | ~4,0:1 / ~3,6:1 | KO (testo piccolo) |
| Placeholder `#A3B1BF` su bianco | Textarea motivazione (istruzione "NON LO SO") | ~2,2:1 | KO |
| `#B98900` su bianco | "Giusta, ma era un tentativo" | ~3,0:1 | KO |
| Ok `#1FA971` su bianco | "Corretta", delta "up" | ~3,0:1 | KO |
| Ko `#E5484D` su bianco | "Da rivedere", "obbligatorio" | ~3,9:1 | KO |
| Muted `#6B7C8F` su `#EEF3F7` | Hint, descrizioni | ~4,0:1 | KO (limite) |
| Navy su gold | CTA principali | ~9:1 | OK |
| Bianco su navy | Bolle utente, banner | ~15:1 | OK |

## Finding

| ID | Area | Problema | Severità | Raccomandazione |
|---|---|---|---|---|
| UX-01 | Accessibilità – screen reader | I messaggi di Genius vengono aggiunti al DOM senza `aria-live`: chi usa uno screen reader non sente né la storia né le reazioni. | Alta | Su `#chat-inner` e `#stage-body` mettere `role="log" aria-live="polite"`; indicatore "sta scrivendo" con `aria-label="Genius sta scrivendo"`; emoji decorative in `aria-hidden`. |
| UX-02 | Accessibilità – focus/tastiera | Nessuno stile `:focus-visible` su `.opt`, `.cluster`, `.cta`; la textarea ha `outline:none`. Quando un CTA viene rimosso il focus finisce sul `body`; a ogni nuova domanda il focus non viene spostato. | Alta | Stile focus globale `:focus-visible{outline:3px solid var(--gold);outline-offset:2px}` (ring navy sugli sfondi gold). Dopo ogni step spostare il focus sul nuovo controllo (prima opzione / CTA). |
| UX-03 | Contrasto | Bianco su teal (opzione selezionata) 2,6:1; "360" gold su bianco 1,8:1; etichette teal-dark piccole ~4:1. | Alta | Opzione selezionata: sfondo `--teal-soft` + bordo teal + testo navy, oppure sfondo `--teal-dark` (#008C80 → ancora 4:1: meglio `#00756B`). "360" in teal-dark o su sfondo navy. Introdurre `--teal-text: #00756B` per il testo piccolo. |
| UX-04 | Contrasto / contenuto | Il placeholder porta un'istruzione fondamentale ("scrivi NON LO SO") ma è a 2,2:1 e sparisce appena si scrive. | Alta | Mantenere il placeholder (richiesta del committente) ma scurirlo a `#6B7C8F` e duplicare l'istruzione come microcopy persistente sotto la textarea (`aria-describedby`). |
| UX-05 | Principio di prodotto | Il riepilogo usa "✓ Corretta / ✗ Da rivedere" in verde/rosso e un anello colorato rosso/verde: è proprio il "giusto/sbagliato" esplicito che il committente vuole evitare, e riporta all'estetica da questionario. | Media | Etichette neutre e narrative ("Ci hai visto giusto", "Rivediamola insieme", "Hai tirato a indovinare") con colori di brand (teal/gold/navy) anziché semaforo. L'anello può restare ma in teal. |
| UX-06 | Ritmo (typing delay) | Ritardi fissi (700/1100/800 ms per riga, +1200 ms minimi per la reazione, 5×1000 ms nel riepilogo, 3 s di "agente al lavoro") indipendenti dalla lunghezza e non saltabili: ~5–6 s di attesa per domanda, ~10 s prima delle lezioni. In demo sembra lento; per frasi lunghe troppo veloce per leggere. | Media | Delay proporzionale al testo (`clamp(400, 25ms × caratteri, 1400)`); click/tap o tasto sulla chat = "salta animazione" (mostra subito i messaggi in coda); in Round 2 mantenere i delay ridotti. |
| UX-07 | Accessibilità – reduced motion | Nessun `@media (prefers-reduced-motion)`: animazioni pop, float, spin, `scroll-behavior:smooth`, barre animate. | Media | Blocco reduced-motion che azzera animazioni/transizioni e scroll smooth; delay di typing ridotti al minimo. |
| UX-08 | Usabilità – motivazione | Invio con `Enter` mentre la motivazione "non ha limite di caratteri": chi va a capo invia per errore; Shift+Enter non è comunicato. Su mobile la tastiera virtuale invia al primo "a capo". | Media | Su touch: `Enter` = a capo, invio solo da pulsante. Su desktop esplicitare nel hint "Invio per inviare · Shift+Invio per andare a capo". |
| UX-09 | Semantica controlli | Le opzioni sono `<button>` senza stato (`aria-pressed`/radiogroup); i cluster "Presto" sono pulsanti normali senza `aria-disabled`; i gruppi bloccati usano solo opacità. | Media | Opzioni come `role="radiogroup"` + `role="radio" aria-checked`; cluster bloccati `aria-disabled="true"` con testo "disponibile prossimamente"; `disabled` reale sulle opzioni bloccate. |
| UX-10 | Mobile layout | `.app{height:100vh}` su iOS/Android taglia il fondo (barra indirizzi) e il CTA può finire sotto la tastiera; topbar con logo + 5 dots + fase può affollarsi sotto 360 px. | Media | `height:100dvh` (fallback 100vh); su `<400px` ridurre i dots a 14px e nascondere `.status`; `scrollIntoView({block:'nearest'})` sulla textarea al focus. |
| UX-11 | Gerarchia visiva – stage | Il banner di scena scorre via con il contenuto; dopo 3 bolle + domanda + opzioni + card risposta la domanda esce dallo schermo mentre si scrive la motivazione. | Media | Banner `position:sticky; top:0` in versione compatta allo scroll; ripetere la domanda come `label` della textarea ("Perché scegli B?"). |
| UX-12 | Lezioni attuali | Le micro-lezioni sono muri di testo con un solo "Ho capito ✓": nessuna interazione, nessuna visualizzazione del calcolo; bassa memorabilità. | Media | Vedi `ux-requirements-lessons.md` (videolezioni animate). |
| UX-13 | Brand | Il semaforo verde/rosso (`--ok`, `--ko`) e il gradiente teal→gold sono fuori palette; il gold è usato sia come CTA sia come "tentativo" sia come bordo storia: significati sovrapposti. | Bassa | Gold = azione/primario + highlight di Genius; teal = scelta/progresso; navy = struttura. Rosso solo per errori di sistema. |
| UX-14 | Usabilità – cluster | Cliccando più cluster "Presto" si accumulano messaggi; il cluster attivo non è evidenziato come raccomandato. | Bassa | Messaggio mostrato una sola volta (o tooltip inline); badge "Inizia da qui" sul cluster attivo. |
| UX-15 | Copy / inclusività | "Sono pronto", "Bravo!" al maschile. | Bassa | Forme neutre: "Iniziamo →", "Ottimo lavoro! 💪". |
| UX-16 | Struttura / landmark | Nessun `<h1>`; il logo SVG viene clonato come avatar con `aria-label` ripetuto in ogni riga (rumore per screen reader). | Bassa | `<h1>` visivamente nascosto; avatar con `aria-hidden="true"`; logo topbar `role="img"`. |
| UX-17 | Fine percorso | "↺ Ricomincia" fa `location.reload()` senza conferma e con handler inline. | Bassa | Accettabile per demo; eventualmente conferma o reset dello stato senza reload. |

## Top-5 quick win (≤ 30 min totali)

1. **Focus visibile + aria-live** (UX-01, UX-02): una regola CSS `:focus-visible` e due attributi `role="log" aria-live="polite"`.
2. **Fix contrasti** (UX-03, UX-04): opzione selezionata su `--teal-soft` con testo navy, "360" in teal-dark, placeholder `#6B7C8F`, variabile `--teal-text:#00756B` per le label piccole.
3. **Reduced motion** (UX-07): un blocco `@media (prefers-reduced-motion: reduce)`.
4. **Delay proporzionali e saltabili** (UX-06): una funzione `typingDelay(html)` + click-to-skip.
5. **Etichette di riepilogo neutre** (UX-05): sostituire "Corretta / Da rivedere" e il semaforo con copy narrativo e colori di brand.
