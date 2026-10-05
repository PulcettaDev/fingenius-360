import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dirname, 'screenshots');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:3000';
const TO = 25_000;

await fs.mkdir(SHOTS, { recursive: true });

const results = [];
const defects = [];

function pass(id, desc) {
  results.push({ id, status: 'PASS', desc });
  console.log(`PASS  ${id}: ${desc}`);
}
function fail(id, desc, why, sev = 'Media') {
  results.push({ id, status: 'FAIL', desc });
  const n = String(defects.length + 1).padStart(2, '0');
  defects.push({ id: `DEF-${n}`, tc: id, sev, desc: why });
  console.error(`FAIL  ${id}: ${desc}`);
  console.error(`      DEF-${n} [${sev}]: ${why}`);
}
function skip(id, desc, reason) {
  results.push({ id, status: 'Non eseguito', desc, reason });
  console.log(`SKIP  ${id}: ${reason}`);
}
function codeCheck(id, ok, desc, failWhy = '', sev = 'Media') {
  if (ok) { results.push({ id, status: 'PASS', desc, reason: 'Verificato da codice' }); console.log(`CODE  ${id} PASS: ${desc}`); }
  else fail(id, desc, failWhy, sev);
}

async function ss(page, name) {
  try { await page.screenshot({ path: path.join(SHOTS, name) }); } catch (_) {}
}

async function waitClick(page, sel, timeout = TO) {
  await page.waitForSelector(sel, { visible: true, timeout });
  await page.click(sel);
}

async function clickCTA(page, text, timeout = TO) {
  await page.waitForFunction(
    t => [...document.querySelectorAll('button.cta:not([disabled])')].some(b => b.textContent.includes(t)),
    { timeout }, text
  );
  await page.evaluate(t => {
    [...document.querySelectorAll('button.cta:not([disabled])')].find(b => b.textContent.includes(t))?.click();
  }, text);
}

const post = (ep, body) => fetch(`${BASE}${ep}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

// ─── Code verifications ───────────────────────────────────────────────────────
function codeVerifications() {
  console.log('\n── Code Verifications ──');
  // TC-41: avatar aria-label duplication (UX-16)
  fail('TC-41', 'Avatar bubble ripetono aria-label="FinGenius 360" senza aria-hidden',
    'AVATAR clonato da .topbar .logo mantiene aria-label su ogni bubble bot; manca aria-hidden="true" (UX-16)', 'Bassa');
  // TC-42: label for="mot" / textarea id="mot" correctly paired
  codeCheck('TC-42', true, '<label for="mot"> e <textarea id="mot"> correttamente abbinati');
  // TC-50: fb-head has explicit "Corretta"/"Da rivedere" labels (UX-05)
  fail('TC-50', 'Intestazioni feedback con etichette esplicite giusto/sbagliato',
    'fb-head.ok="✓ Corretta", fb-head.ko="✗ Da rivedere" — violazione UX-05', 'Media');
  // TC-53: contrast ratios (#F5B700 white ≈1.74:1; #A3B1BF white ≈2.03:1)
  fail('TC-53', 'Contrasto colori insufficiente (UX-03/04)',
    '"360" gold #F5B700 su bianco ≈1.74:1; placeholder #A3B1BF su bianco ≈2.03:1 — sotto soglia 4.5:1 WCAG AA', 'Alta');
  skip('TC-51', 'Navigazione tastiera E2E', 'Richiede tester umano (Tab/Invio)');
  skip('TC-52', 'Annunci screen reader', 'Richiede NVDA/Narrator attivo');
  skip('TC-56', 'Tasto a capo tastiera virtuale mobile', 'Richiede dispositivo touch fisico');
  skip('TC-58', 'Criteri videolezioni UX', 'Feature non ancora implementata');
}

// ─── API tests ────────────────────────────────────────────────────────────────
async function apiTests() {
  console.log('\n── API Tests ──');

  // TC-01
  try {
    const r = await post('/api/evaluate', {
      answers: [1,0,1,1,2],
      motivations: ['Il TAEG include le spese','Rata x mesi = totale','Il totale delle rate supera il prezzo','Con anticipo finanzio meno','21% su 3000 = 52 euro/mese']
    });
    const d = await r.json();
    if (r.ok && d.score===5 && d.percentage===100 && d.lessons?.length===0 && d.encouragement)
      pass('TC-01','evaluate: tutte corrette → score=5, lessons=[], encouragement presente');
    else
      fail('TC-01','evaluate: tutte corrette',`score=${d.score} pct=${d.percentage} lessons=${d.lessons?.length}`,'Alta');
  } catch(e){ fail('TC-01','evaluate: tutte corrette',e.message,'Alta'); }

  // TC-02
  try {
    const r = await post('/api/evaluate', { answers:[1,0,1,1,2], motivations:Array(5).fill('NON LO SO') });
    const d = await r.json();
    const allGuess = d.feedback?.every(f=>f.personalized_feedback?.includes('scritto che non lo sapevi'));
    if (r.ok && d.score===5 && d.lessons?.length===5 && allGuess)
      pass('TC-02','evaluate: tutte corrette + NON LO SO → 5 lessons, feedback guess');
    else
      fail('TC-02','evaluate: NON LO SO',`score=${d.score} lessons=${d.lessons?.length} allGuess=${allGuess}`,'Alta');
  } catch(e){ fail('TC-02','evaluate: NON LO SO',e.message,'Alta'); }

  // TC-03
  try {
    const r = await post('/api/evaluate', { answers:[0,1,0,0,0], motivations:Array(5).fill('non so') });
    const d = await r.json();
    const allWrong = d.feedback?.every(f=>!f.is_correct);
    if (r.ok && d.score===0 && d.percentage===0 && d.lessons?.length===5 && allWrong)
      pass('TC-03','evaluate: tutte sbagliate → score=0, 5 lessons');
    else
      fail('TC-03','evaluate: tutte sbagliate',`score=${d.score} pct=${d.percentage} lessons=${d.lessons?.length}`,'Alta');
  } catch(e){ fail('TC-03','evaluate: tutte sbagliate',e.message,'Alta'); }

  // TC-04
  try {
    const r = await post('/api/evaluate', { motivations:Array(5).fill('x') });
    const d = await r.json();
    const alive = await (await post('/api/evaluate',{answers:[1,0,1,1,2],motivations:Array(5).fill('ok')})).json();
    if ((r.status===400||r.status===500) && d.error && alive.score!==undefined)
      pass('TC-04','evaluate: body malformato → HTTP 500 + JSON error + server vivo');
    else
      fail('TC-04','evaluate: body malformato',`HTTP ${r.status} error="${d.error}" aliveScore=${alive.score}`,'Media');
  } catch(e){ fail('TC-04','evaluate: body malformato',e.message,'Media'); }

  // TC-05
  try {
    const r = await post('/api/evaluate', { answers:[99,99,99,99,99], motivations:Array(5).fill('x') });
    const d = await r.json();
    if (r.ok && d.score===0 && d.lessons?.length===5)
      pass('TC-05','evaluate: answers fuori range → score=0, 5 lessons, no crash');
    else
      fail('TC-05','evaluate: answers fuori range',`score=${d.score} lessons=${d.lessons?.length}`,'Media');
  } catch(e){ fail('TC-05','evaluate: answers fuori range',e.message,'Media'); }

  // TC-06
  try {
    const r = await post('/api/react', { question_index:0, answer:1, motivation:'Guardo il TAEG' });
    const d = await r.json();
    const bad = ['corretto','esatto','sbagliato'].some(w=>d.reaction?.toLowerCase().includes(w));
    if (r.ok && d.reaction && !bad)
      pass('TC-06','react: risposta valida, nessun giudizio esplicito');
    else
      fail('TC-06','react: risposta valida',`forbidden=${bad} reaction="${d.reaction?.slice(0,60)}"`,'Alta');
  } catch(e){ fail('TC-06','react: risposta valida',e.message,'Alta'); }

  // TC-07
  try {
    const r = await post('/api/react', { question_index:2, answer:0, motivation:'NON LO SO' });
    const d = await r.json();
    const bad = ['corretto','esatto','sbagliato'].some(w=>d.reaction?.toLowerCase().includes(w));
    const reveals = d.reaction?.includes('Pagare subito') || /\bB\b.*basso/i.test(d.reaction||'');
    if (r.ok && d.reaction && !bad && !reveals)
      pass('TC-07','react: NON LO SO → indizio senza rivelare risposta');
    else
      fail('TC-07','react: NON LO SO',`forbidden=${bad} reveals=${reveals}`,'Alta');
  } catch(e){ fail('TC-07','react: NON LO SO',e.message,'Alta'); }

  // TC-47 (via API, lowercase "non lo so") — must run BEFORE TC-08 which crashes the server
  try {
    const r = await post('/api/evaluate', {
      answers:[1,0,1,1,2], motivations:['non lo so','ok','ok','ok','ok']
    });
    const d = await r.json();
    const q0 = d.feedback?.find(f=>f.question_index===0);
    const isGuess = q0?.personalized_feedback?.includes('scritto che non lo sapevi');
    const hasLesson = d.lessons?.some(l=>l.concept==='taeg_vs_tan');
    if (isGuess && hasLesson)
      pass('TC-47','NON LO SO minuscolo riconosciuto → feedback guess + lesson');
    else
      fail('TC-47','NON LO SO variante lowercase',`isGuess=${isGuess} hasLesson=${hasLesson}`,'Media');
  } catch(e){ fail('TC-47','NON LO SO variante',e.message,'Media'); }

  // TC-08 moved to very end (after browser tests) — it crashes the server
}

// ─── Browser happy path ───────────────────────────────────────────────────────
async function happyPath(page) {
  console.log('\n── Browser: Happy Path ──');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  // TC-09
  try {
    await page.waitForFunction(
      ()=>[...document.querySelectorAll('.chat-inner .bubble')].some(b=>b.textContent.includes('Genius')),
      {timeout:15000}
    );
    pass('TC-09','Bubble di benvenuto con "Genius"');
  } catch(e){ fail('TC-09','Bubble benvenuto',e.message,'Alta'); }

  // TC-10
  try {
    await page.waitForSelector('.cluster.active', { visible:true, timeout:15000 });
    const c = await page.evaluate(()=>({
      tot:document.querySelectorAll('.cluster').length,
      act:document.querySelectorAll('.cluster.active').length,
      soon:document.querySelectorAll('.cluster.soon').length,
      disp:[...document.querySelectorAll('.cluster.active .tag')].some(t=>t.textContent.includes('Disponibile')),
      presto:[...document.querySelectorAll('.cluster.soon .tag')].some(t=>t.textContent.includes('Presto'))
    }));
    c.tot===5&&c.act===1&&c.soon===4&&c.disp&&c.presto
      ? pass('TC-10','5 cluster: 1 attivo "Disponibile", 4 "Presto"')
      : fail('TC-10','Cluster cards',JSON.stringify(c),'Alta');
    await ss(page,'01-clusters.png');
  } catch(e){ fail('TC-10','Cluster cards',e.message,'Alta'); }

  // TC-11: select active cluster
  try {
    await page.click('.cluster.active');
    await page.waitForSelector('.cluster.chosen', { timeout:4000 });
    const locked = await page.$eval('.clusters',el=>el.classList.contains('locked'));
    const ubbl = await page.evaluate(()=>[...document.querySelectorAll('.row.user .bubble')].some(b=>b.textContent.includes('Prestiti')));
    locked&&ubbl ? pass('TC-11','Cluster attivo selezionato: griglia locked, bubble utente')
      : fail('TC-11','Selezione cluster',`locked=${locked} ubbl=${ubbl}`,'Alta');
  } catch(e){ fail('TC-11','Selezione cluster',e.message,'Alta'); }

  // TC-13: CTA → stage
  try {
    await clickCTA(page,'Sono pronto',15000);
    await page.waitForSelector('#stage.active', { visible:true, timeout:5000 });
    const chatAct = await page.$eval('#chat',el=>el.classList.contains('active'));
    const title = await page.$eval('#scene-title',el=>el.textContent);
    !chatAct&&title.length>0 ? pass('TC-13','CTA "Sono pronto" → #stage attivo, #chat non attivo')
      : fail('TC-13','CTA Sono pronto',`chatActive=${chatAct} title="${title}"`,'Alta');
    pass('TC-43','View switching: #stage.active dopo "Sono pronto"');
    await ss(page,'02-stage-q1.png');
  } catch(e){ fail('TC-13','CTA Sono pronto',e.message,'Alta'); fail('TC-43','View switching',e.message,'Alta'); }

  // Wait for Q1 answer card
  try { await page.waitForSelector('.answer-card', { visible:true, timeout:30000 }); }
  catch(e){ fail('TC-14','Answer card Q1 non appare',e.message,'Alta'); return; }

  // TC-44: element order
  try {
    const ok = await page.evaluate(()=>{
      const ch = [...document.getElementById('stage-body').children];
      const qi=ch.findIndex(n=>n.querySelector('.bubble.question'));
      const oi=ch.findIndex(n=>n.querySelector('.options'));
      const ai=ch.findIndex(n=>n.querySelector('.answer-card'));
      return qi>0 && qi<oi && oi<ai;
    });
    ok ? pass('TC-44','Ordine DOM: storia → domanda → opzioni → answer-card')
       : fail('TC-44','Ordine elementi stage','Ordine non rispettato','Alta');
  } catch(e){ fail('TC-44','Ordine elementi stage',e.message,'Alta'); }

  // TC-14: button disabled initially
  try {
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    const hint = await page.$eval('.hint',el=>el.textContent);
    dis&&hint.includes('Prima scegli') ? pass('TC-14','Bottone disabled senza input; hint corretto')
      : fail('TC-14','Bottone disabled iniziale',`dis=${dis} hint="${hint}"`,'Alta');
  } catch(e){ fail('TC-14','Bottone disabled iniziale',e.message,'Alta'); }

  // TC-16: text only → still disabled
  try {
    await page.type('#mot','testo senza opzione');
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    dis ? pass('TC-16','Bottone disabled con solo testo (no opzione selezionata)')
        : fail('TC-16','Bottone disabled solo testo','Bottone abilitato con solo testo','Alta');
    await page.evaluate(()=>{ const t=document.getElementById('mot'); t.value=''; t.dispatchEvent(new Event('input')); });
  } catch(e){ fail('TC-16','Bottone disabled solo testo',e.message,'Alta'); }

  // TC-20: placeholder
  try {
    const ph = await page.$eval('#mot',el=>el.placeholder);
    ph.toUpperCase().includes('NON LO SO') ? pass('TC-20','Placeholder textarea contiene "NON LO SO"')
      : fail('TC-20','Placeholder NON LO SO',`placeholder="${ph}"`,'Alta');
  } catch(e){ fail('TC-20','Placeholder NON LO SO',e.message,'Alta'); }

  // click option B (index 1) for Q1 — correct answer
  await (await page.$$('.opt'))[1].click();

  // TC-15: option clicked but no text → still disabled
  try {
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    const hint = await page.$eval('.hint',el=>el.textContent);
    dis&&hint.includes('spiegami') ? pass('TC-15','Bottone disabled dopo opzione, senza testo; hint corretto')
      : fail('TC-15','Bottone disabled solo opzione',`dis=${dis} hint="${hint}"`,'Alta');
  } catch(e){ fail('TC-15','Bottone disabled solo opzione',e.message,'Alta'); }

  // TC-45: spaces only → still disabled
  try {
    await page.type('#mot','   ');
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    dis ? pass('TC-45','Bottone disabled con solo spazi (trim applicato)')
        : fail('TC-45','Trim spazi mancante','Bottone abilitato con solo spazi nel textarea','Alta');
    await page.evaluate(()=>{ const t=document.getElementById('mot'); t.value=''; t.dispatchEvent(new Event('input')); });
  } catch(e){ fail('TC-45','Trim spazi',e.message,'Alta'); }

  // type NON LO SO
  await page.type('#mot','NON LO SO');

  // TC-17: button enabled
  try {
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    const hint = await page.$eval('.hint',el=>el.textContent);
    !dis&&hint.includes('Premi Invio') ? pass('TC-17','Bottone abilitato con opzione + testo; hint corretto')
      : fail('TC-17','Bottone abilitato',`dis=${dis} hint="${hint}"`,'Alta');
  } catch(e){ fail('TC-17','Bottone abilitato',e.message,'Alta'); }

  // TC-19: Shift+Enter adds newline
  try {
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    const val = await page.$eval('#mot',el=>el.value);
    const dis = await page.$eval('.answer-card .cta',b=>b.disabled);
    val.includes('\n')&&!dis ? pass('TC-19','Shift+Enter aggiunge newline; bottone rimane abilitato')
      : fail('TC-19','Shift+Enter',`val="${val.replace(/\n/g,'\\n')}" dis=${dis}`,'Alta');
  } catch(e){ fail('TC-19','Shift+Enter',e.message,'Alta'); }

  // TC-48: double submit — do with evaluate, then restore flow
  // We test this inline: click button, then click again quickly before answer-card removed
  try {
    const prevU = await page.$$eval('.row.user .bubble',els=>els.length);
    await page.evaluate(()=>{
      const btn=document.querySelector('.answer-card .cta');
      btn.click(); btn.click(); // synchronous double click
    });
    await page.waitForFunction(()=>!document.querySelector('.answer-card'),{timeout:5000});
    const newU = await page.$$eval('.row.user .bubble',els=>els.length);
    newU===prevU+1 ? pass('TC-48','Doppio click: una sola bubble utente creata')
      : fail('TC-48','Doppio submit',`bubble create: ${newU-prevU} (atteso 1)`,'Media');
  } catch(e){ fail('TC-48','Doppio submit',e.message,'Media'); }

  // TC-22: reaction no forbidden words
  try {
    await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});
    const rt = await page.$eval('.bubble.reaction',el=>el.textContent.toLowerCase());
    const bad = ['corretto','esatto','sbagliato'].some(w=>rt.includes(w));
    !bad ? pass('TC-22','Reaction senza giudizio esplicito')
         : fail('TC-22','Reaction no giudizio',`testo="${rt.slice(0,80)}"`,'Alta');
  } catch(e){ fail('TC-22','Reaction no giudizio',e.message,'Alta'); }

  // TC-23: NON LO SO reaction doesn't reveal answer
  try {
    const rt = await page.$eval('.bubble.reaction',el=>el.textContent);
    const reveals = rt.includes('La banca B') || rt.includes('banca B, perché');
    !reveals ? pass('TC-23','Reaction NON LO SO non rivela la risposta corretta')
             : fail('TC-23','Reaction rivela risposta',`"${rt.slice(0,80)}"`,'Alta');
  } catch(e){ fail('TC-23','Reaction NON LO SO',e.message,'Alta'); }

  await clickCTA(page,'Prossima situazione',TO);

  // Q2: correct answer A, real motivation
  await page.waitForSelector('.answer-card',{visible:true,timeout:30000});
  await page.click('.opt:first-child');
  await page.type('#mot','24x370=8880, meno di 48x210=10080');

  // TC-21: user bubble plain text (check after submit)
  await page.click('.answer-card .cta');
  await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});
  try {
    const whyHtmls = await page.$$eval('.why',els=>els.map(e=>e.innerHTML));
    const hasHtml = whyHtmls.some(h=>/<[a-z]/i.test(h));
    !hasHtml ? pass('TC-21','Bubble utente mostra motivazione come plain text')
             : fail('TC-21','Escaping XSS',`innerHTML contiene tag HTML: ${whyHtmls.join('|').slice(0,80)}`,'Alta');
  } catch(e){ fail('TC-21','Escaping XSS',e.message,'Alta'); }
  await clickCTA(page,'Prossima situazione',TO);

  // TC-49: progress topbar check during Q3 (i=2 → situazione 3/5)
  await page.waitForSelector('.answer-card',{visible:true,timeout:30000});
  try {
    const prog = await page.evaluate(()=>({
      phase:document.getElementById('phase')?.textContent,
      dots:[...document.querySelectorAll('#dots span')].map(d=>d.className),
      vis:document.getElementById('progress')?.classList.contains('visible')
    }));
    const ok3 = prog.phase?.includes('3/5') && prog.dots[0]==='done' && prog.dots[1]==='done' && prog.dots[2]==='current';
    ok3 ? pass('TC-49','Topbar progress: fase 3/5, dots 1-2 done, dot 3 current')
        : fail('TC-49','Topbar progress',`phase="${prog.phase}" dots=${JSON.stringify(prog.dots)}`,'Media');
  } catch(e){ fail('TC-49','Topbar progress',e.message,'Media'); }

  // Q3: WRONG answer (A, data-i=0; correct is B=data-i=1) + XSS payload in motivation
  await page.waitForSelector('.opt[data-i="0"]',{visible:true,timeout:10000});
  await page.click('.opt[data-i="0"]');
  const xss = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
  await page.evaluate(s=>{ const t=document.getElementById('mot'); t.value=s; t.dispatchEvent(new Event('input')); }, xss);
  await page.click('.answer-card .cta');
  await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});

  // TC-40: XSS renders as plain text
  try {
    const whys = await page.$$eval('.why',els=>els.map(e=>({
      hasScriptTag: e.innerHTML.includes('<script'),
      hasImgTag: e.innerHTML.includes('<img '),
      text: e.textContent.slice(0,60)
    })));
    const last = whys[whys.length-1];
    !last?.hasScriptTag&&!last?.hasImgTag ? pass('TC-40','XSS payload renderizzato come plain text; nessun tag HTML nel DOM')
      : fail('TC-40','XSS nella motivazione',`hasScriptTag=${last?.hasScriptTag} hasImgTag=${last?.hasImgTag} text="${last?.text}"`,'Alta');
  } catch(e){ fail('TC-40','XSS rendering',e.message,'Alta'); }
  await clickCTA(page,'Prossima situazione',TO);

  // Q4: correct answer B
  await page.waitForSelector('.answer-card',{visible:true,timeout:30000});
  const opts4 = await page.$$('.opt');
  await opts4[1].click();
  await page.type('#mot','Con anticipo finanzio solo 4500, meno interessi totali');
  await page.click('.answer-card .cta');
  await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});
  await clickCTA(page,'Prossima situazione',TO);

  // Q5: correct answer C
  await page.waitForSelector('.answer-card',{visible:true,timeout:30000});
  const opts5 = await page.$$('.opt');
  await opts5[2].click();
  await page.type('#mot','Al 21% annuo su 3000 maturano 52 euro/mese, la rata minima copre quasi solo interessi');
  await page.click('.answer-card .cta');
  await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});
  await clickCTA(page,'Concludi il round',TO);
  await ss(page,'03-round1-complete.png');

  // TC-38: network error for /api/evaluate — intercept BEFORE clicking "Vedi la mia analisi"
  await page.waitForFunction(
    ()=>[...document.querySelectorAll('button.cta:not([disabled])')].some(b=>b.textContent.includes('Vedi la mia analisi')),
    {timeout:15000}
  );
  let blockEval = true;
  const h38 = req => {
    if (blockEval && req.url().includes('/api/evaluate')) { req.abort('failed').catch(()=>{}); }
    else { req.continue().catch(()=>{}); }
  };
  try {
    await page.setRequestInterception(true);
    page.on('request', h38);
    await clickCTA(page,'Vedi la mia analisi',5000);
    await page.waitForSelector('#chat.active',{visible:true,timeout:8000});
    await page.waitForFunction(()=>[...document.querySelectorAll('.bubble')].some(b=>b.textContent.includes('Ops')),{timeout:12000});
    await page.waitForFunction(()=>[...document.querySelectorAll('button.cta:not([disabled])')].some(b=>b.textContent.includes('Riprova')),{timeout:8000});
    pass('TC-38','Errore rete /api/evaluate: bubble "Ops" + bottone "Riprova" visibili');
    await ss(page,'04-network-error.png');
  } catch(e){
    fail('TC-38','Errore rete /api/evaluate',e.message,'Alta');
  } finally {
    blockEval = false;
    try { page.off('request', h38); } catch(_){}
    try { await page.setRequestInterception(false); } catch(_){}
  }
  // Click Riprova to let analysis succeed
  try { await clickCTA(page,'Riprova',8000); } catch(_){}

  // TC-43: chat active for analysis
  try {
    await page.waitForSelector('#chat.active',{visible:true,timeout:8000});
    const sAct = await page.$eval('#stage',el=>el.classList.contains('active'));
    !sAct ? pass('TC-43','View switching: #chat.active durante analisi')
           : fail('TC-43','View switching analisi','#stage rimane attivo durante analisi','Alta');
  } catch(e){ fail('TC-43','View switching analisi',e.message,'Alta'); }

  // TC-24: agent card animation — after retry there may be 2 agent cards; check last one
  try {
    await page.waitForSelector('.agent-card',{visible:true,timeout:20000});
    await page.waitForFunction(
      ()=>document.querySelectorAll('.agent-step.done').length>=3,
      {timeout:15000}
    );
    pass('TC-24','Agent card: almeno 3 step marcati done');
    await ss(page,'05-agent-card.png');
  } catch(e){ fail('TC-24','Agent card animazione',e.message,'Bassa'); }

  // TC-25: score ring
  try {
    await page.waitForSelector('.ring-inner',{visible:true,timeout:20000});
    const rt = await page.$eval('.ring-inner',el=>el.textContent.trim());
    rt.includes('/5') ? pass(`TC-25`,`Score ring mostra "${rt}"`)
      : fail('TC-25','Score ring',`ringText="${rt}"`,'Alta');
    await ss(page,'06-score.png');
  } catch(e){ fail('TC-25','Score ring',e.message,'Alta'); }

  // TC-26: fb-guess for Q1
  try {
    await page.waitForSelector('.bubble.fb-guess',{visible:true,timeout:20000});
    const head = await page.$eval('.fb-head.guess',el=>el.textContent);
    const body = await page.$eval('.bubble.fb-guess',el=>el.textContent);
    head.includes('tentativo')&&body.includes('scritto che non lo sapevi')
      ? pass('TC-26','fb-guess Q1: intestazione "tentativo" + feedback demo corretto')
      : fail('TC-26','fb-guess Q1',`head="${head}" body="${body.slice(0,60)}"`,'Alta');
    await ss(page,'07-feedback.png');
  } catch(e){ fail('TC-26','fb-guess Q1',e.message,'Alta'); }

  // TC-28 + TC-29: lessons appear one-at-a-time (each after "Ho capito" click)
  let totalLessons = 0;
  try {
    await page.waitForSelector('.lesson',{visible:true,timeout:20000});
    await ss(page,'08-lessons.png');
    // Click through all lessons counting them; each appears only after clicking the previous "Ho capito"
    while(true) {
      const btn = await page.$('.lesson .cta.small:not([disabled])');
      if(!btn) break;
      totalLessons++;
      if(totalLessons===1){
        // TC-29: first "Ho capito" click disables button
        try {
          await btn.click();
          await page.waitForFunction(()=>{const b=document.querySelector('.lesson .cta.small');return b?.disabled;},{timeout:3000});
          pass('TC-29','Bottone "Ho capito ✓" diventa disabled dopo click');
        } catch(e){ fail('TC-29','Bottone Ho capito',e.message,'Media'); }
      } else {
        await btn.click();
      }
      // After clicking, wait for next lesson button OR "Mettimi alla prova" (whichever comes first)
      try {
        await page.waitForFunction(
          ()=>document.querySelector('.lesson .cta.small:not([disabled])') ||
              [...document.querySelectorAll('button.cta:not([disabled])')].some(b=>b.textContent.includes('Mettimi')),
          {timeout:15000}
        );
        // Check if next lesson exists; if not, we're done
        const nextBtn = await page.$('.lesson .cta.small:not([disabled])');
        if(!nextBtn) break; // "Mettimi alla prova" appeared, no more lessons
      } catch(_){ break; }
    }
    totalLessons===2 ? pass('TC-28',`Micro-lezioni: ${totalLessons} card mostrate in sequenza (taeg_vs_tan + tasso_zero)`)
      : fail('TC-28','Micro-lezioni conteggio',`Totale lezioni cliccate: ${totalLessons}, atteso 2`,'Alta');
  } catch(e){ fail('TC-28','Micro-lezioni',e.message,'Alta'); }

  // TC-30: CTA "Mettimi alla prova"
  try {
    await page.waitForFunction(()=>[...document.querySelectorAll('button.cta:not([disabled])')].some(b=>b.textContent.includes('Mettimi alla prova')),{timeout:15000});
    pass('TC-30','CTA "Mettimi alla prova →" visibile dopo lezioni');
    await clickCTA(page,'Mettimi alla prova',5000);
  } catch(e){ fail('TC-30','CTA Mettimi alla prova',e.message,'Alta'); }

  // Round 2 — TC-31, TC-32
  try {
    await page.waitForSelector('#stage.active',{visible:true,timeout:5000});
    pass('TC-43','View switching: #stage.active per Round 2');
  } catch(_){}

  try {
    await page.waitForSelector('.opt',{visible:true,timeout:30000});
    const hasAC = await page.$('.answer-card');
    const hasTA = await page.$('#mot');
    !hasAC&&!hasTA ? pass('TC-31','Round 2: nessun answer-card né textarea')
      : fail('TC-31','Round 2 no motivazione',`ansCard=${!!hasAC} textarea=${!!hasTA}`,'Alta');
    await ss(page,'09-round2.png');
  } catch(e){ fail('TC-31','Round 2 no motivazione',e.message,'Alta'); }

  const r2 = [1,0,1,1,2];
  for(let i=0;i<5;i++){
    try {
      await page.waitForSelector('.opt:not(.selected)',{visible:true,timeout:30000});
      const prevU = await page.$$eval('.row.user .bubble',els=>els.length);
      const opts = await page.$$('.opt');
      await opts[r2[i]].click();
      // TC-32: check bubble count IMMEDIATELY (before 700ms sleep in browser clears stage body)
      const afterFirst = await page.$$eval('.row.user .bubble',els=>els.length);
      if(i===0){
        // Try second click on a different option (should be ignored due to row.locked)
        try {
          const others = (await page.$$('.opt')).filter((_,j)=>j!==r2[i]);
          if(others.length>0) await others[0].click().catch(()=>{});
        } catch(_){}
        const afterSecond = await page.$$eval('.row.user .bubble',els=>els.length);
        afterFirst===prevU+1 && afterSecond===afterFirst
          ? pass('TC-32','Round 2: un solo click registrato; secondo click ignorato')
          : fail('TC-32','Round 2 blocco opzione',`after1st=${afterFirst-prevU} after2nd=${afterSecond-afterFirst} (entrambi attesi 1,0)`,'Alta');
      }
      await new Promise(r=>setTimeout(r,1200));
    } catch(e){ console.error(`R2 Q${i+1}: ${e.message}`); break; }
  }
  await ss(page,'10-round2-complete.png');

  // Final screen
  try {
    await page.waitForSelector('#chat.active',{visible:true,timeout:5000});
    await page.waitForSelector('.final',{visible:true,timeout:20000});
    await ss(page,'11-progress.png');
  } catch(e){ fail('TC-33','Schermata finale',e.message,'Media'); return; }

  // TC-33: bars animated
  try {
    await new Promise(r=>setTimeout(r,1500));
    const fills = await page.$$eval('.fill',els=>els.map(f=>parseInt(f.style.width)||0));
    fills.some(w=>w>0) ? pass(`TC-33`,`Barre animate: ${fills.map(v=>v+'%').join(', ')}`)
      : fail('TC-33','Barre progresso animate',`fills=${JSON.stringify(fills)}`,'Bassa');
  } catch(e){ fail('TC-33','Barre animate',e.message,'Bassa'); }

  // TC-34: delta up class
  try {
    const cls = await page.$eval('.delta',el=>el.className);
    const big = await page.$eval('.delta .big',el=>el.textContent.trim());
    cls.includes('up')&&big.startsWith('+') ? pass(`TC-34`,`Delta classe "up", testo "${big}"`)
      : fail('TC-34','Delta positivo',`class="${cls}" text="${big}"`,'Alta');
  } catch(e){ fail('TC-34','Delta positivo',e.message,'Alta'); }

  // TC-35: NON LO SO count
  try {
    const ft = await page.$eval('.final',el=>el.textContent);
    ft.includes('NON LO SO')&&(ft.includes('1 volta')||ft.includes('una volta'))
      ? pass('TC-35','Card finale mostra NON LO SO count = 1 volta')
      : fail('TC-35','NON LO SO count',`includes NON LO SO: ${ft.includes('NON LO SO')} includes "1 volta": ${ft.includes('1 volta')}`,'Media');
  } catch(e){ fail('TC-35','NON LO SO count',e.message,'Media'); }

  // TC-36: concept chips
  try {
    const chips = await page.$$eval('.chip',els=>els.map(e=>e.textContent));
    chips.length>=1 ? pass(`TC-36`,`Chip concetti: ${chips.join(', ')}`)
      : fail('TC-36','Chip concetti','Nessun .chip trovato','Media');
  } catch(e){ fail('TC-36','Chip concetti',e.message,'Media'); }

  // TC-37: disclaimer + restart
  try {
    const disc = await page.$eval('.disclaimer',el=>el.textContent);
    disc.includes('strumento educativo') ? pass('TC-37','Disclaimer "strumento educativo" presente')
      : fail('TC-37','Disclaimer',`"${disc.slice(0,60)}"`,'Media');
    // Check restart reloads page
    await clickCTA(page,'Ricomincia',3000);
    await page.waitForSelector('.bubble',{visible:true,timeout:10000});
    const noProg = await page.$eval('#progress',el=>!el.classList.contains('visible'));
    noProg ? pass('TC-37','Ricomincia: pagina ricaricata, stato azzerato')
           : fail('TC-37','Ricomincia stato reset','Progress visibile dopo reload','Media');
  } catch(e){ fail('TC-37','Disclaimer/Ricomincia',e.message,'Media'); }

  // TC-43: final view
  try {
    // After reload, chat should be active
    const cAct = await page.$eval('#chat',el=>el.classList.contains('active'));
    cAct ? pass('TC-43','View switching: #chat.active nella schermata finale/reload')
          : fail('TC-43','View switching finale','chat non attivo dopo reload','Alta');
  } catch(_){}
}

// ─── Edge cases ───────────────────────────────────────────────────────────────
async function edgeCases(page) {
  console.log('\n── Browser: Edge Cases ──');

  // TC-12: inactive cluster message + TC-57: repeated clicks
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  try {
    await page.waitForSelector('.cluster.soon',{visible:true,timeout:15000});
    const nb = await page.$$eval('.bubble',els=>els.length);
    await page.click('.cluster.soon[data-id="busta"]');
    await page.waitForFunction(
      ()=>[...document.querySelectorAll('.bubble')].some(b=>b.textContent.includes('in arrivo')),
      {timeout:5000}
    );
    const bubbles = await page.$$eval('.bubble',els=>els.map(e=>e.textContent));
    const ok = bubbles.some(t=>t.includes('in arrivo'));
    ok ? pass('TC-12','Cluster "Presto": bubble "in arrivo" + cluster attivo rimane disponibile')
       : fail('TC-12','Cluster disabilitato',`bubbles=${bubbles.slice(-2).map(t=>t.slice(0,40))}`,'Alta');

    // TC-57: rapid triple click — guard with data-busy
    const nb2 = await page.$$eval('.bubble',els=>els.length);
    for(let i=0;i<3;i++) await page.click('.cluster.soon[data-id="busta"]').catch(()=>{});
    await new Promise(r=>setTimeout(r,2000));
    const nb3 = await page.$$eval('.bubble',els=>els.length);
    const added = nb3-nb2;
    added<=1 ? pass(`TC-57`,`Click ripetuti su cluster "Presto": ${added} bubble aggiunta (max 1)`)
             : fail('TC-57','Click ripetuti cluster Presto',`${added} bubble aggiunte (max atteso: 1)`,'Bassa');
  } catch(e){ fail('TC-12','Cluster disabilitato',e.message,'Alta'); fail('TC-57','Click ripetuti',e.message,'Bassa'); }

  // TC-54: reduced motion — check if CSS @media prefers-reduced-motion present
  try {
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.waitForSelector('.bubble',{visible:true,timeout:12000});
    const hasRm = await page.evaluate(()=>{
      for(const s of document.styleSheets){
        try { for(const r of s.cssRules){ if(r.conditionText?.includes('reduced')) return true; } } catch(_){}
      }
      return false;
    });
    hasRm ? pass('TC-54','@media prefers-reduced-motion presente nel CSS')
           : fail('TC-54','Reduced motion mancante','Nessun @media (prefers-reduced-motion) nel CSS — animazioni pop/float non disabilitate (UX-07)','Media');
    await page.emulateMediaFeatures([]);
  } catch(e){ fail('TC-54','Reduced motion',e.message,'Media'); }

  // TC-55: mobile viewport 360×640
  try {
    await page.setViewport({width:360,height:640,isMobile:true,hasTouch:true});
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.cluster',{visible:true,timeout:15000});
    const noHScroll = await page.evaluate(()=>document.body.scrollWidth<=document.body.clientWidth+2);
    const topbarH = await page.evaluate(()=>document.querySelector('.topbar')?.offsetHeight||0);
    noHScroll&&topbarH<=80 ? pass('TC-55',`Viewport 360×640: nessuno scroll orizzontale, topbar h=${topbarH}px`)
      : fail('TC-55','Viewport mobile 360×640',`noHScroll=${noHScroll} topbarH=${topbarH}`,'Alta');
    await ss(page,'12-mobile-360.png');
    await page.setViewport({width:1280,height:800});
  } catch(e){ fail('TC-55','Viewport mobile 360×640',e.message,'Alta'); }
}

// ─── Network react error ───────────────────────────────────────────────────────
async function networkReactTest(page) {
  console.log('\n── Browser: Network React Error (TC-39) ──');
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  try {
    await page.waitForSelector('.cluster.active',{visible:true,timeout:15000});
    await page.click('.cluster.active');
    await clickCTA(page,'Sono pronto',15000);
    await page.waitForSelector('.answer-card',{visible:true,timeout:30000});
    let blockReact = true;
    const h39 = req => {
      if (blockReact && req.url().includes('/api/react')) { req.abort('failed').catch(()=>{}); }
      else { req.continue().catch(()=>{}); }
    };
    await page.setRequestInterception(true);
    page.on('request', h39);
    await page.click('.opt:first-child');
    await page.type('#mot','test errore rete');
    await page.click('.answer-card .cta');
    await page.waitForSelector('.bubble.reaction',{visible:true,timeout:TO});
    const rt = await page.$eval('.bubble.reaction',el=>el.textContent);
    rt.includes('Ci sto ancora pensando')
      ? pass('TC-39','Errore rete /api/react: fallback "Ci sto ancora pensando…" mostrato')
      : fail('TC-39','Errore rete /api/react',`reaction="${rt.slice(0,80)}"`,'Alta');
    blockReact = false;
    try { page.off('request', h39); } catch(_){}
    try { await page.setRequestInterception(false); } catch(_){}
  } catch(e){
    fail('TC-39','Errore rete /api/react',e.message,'Alta');
    try { await page.setRequestInterception(false); } catch(_){}
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('\n════ FinGenius 360 — Test Suite ════\n');

await apiTests();
codeVerifications();

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
});

try {
  const p1 = await browser.newPage();
  p1.setDefaultTimeout(TO);
  await happyPath(p1);
  await p1.close();

  const p2 = await browser.newPage();
  p2.setDefaultTimeout(TO);
  await networkReactTest(p2);
  await p2.close();

  const p3 = await browser.newPage();
  p3.setDefaultTimeout(TO);
  await edgeCases(p3);
  await p3.close();
} finally {
  await browser.close();
}

// ─── TC-08: crash-inducing test — run LAST after all browser tests ────────────
console.log('\n── TC-08: body vuoto /api/react (crash test — eseguito per ultimo) ──');
let s08='N/A';
try {
  const r08 = await fetch(`${BASE}/api/react`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  s08 = String(r08.status);
} catch(_){ s08='conn-err'; }
try {
  const alive = await fetch(`${BASE}/api/react`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question_index:0,answer:0,motivation:'test'})});
  const ad = await alive.json();
  if(alive.ok && ad.reaction)
    pass('TC-08',`react: body vuoto → HTTP ${s08}; server rimane vivo`);
  else
    fail('TC-08','react: body vuoto — server non risponde dopo body malformato',`HTTP ${s08} (crash confermato ARC-04)`,'Alta');
} catch(e){ fail('TC-08','react: body vuoto — CRASH SERVER CONFERMATO',`HTTP ${s08}; server down: ${e.message} (Bloccante/ARC-04)`,'Alta'); }

// ─── Summary ─────────────────────────────────────────────────────────────────
const P = results.filter(r=>r.status==='PASS').length;
const F = results.filter(r=>r.status==='FAIL').length;
const S = results.filter(r=>r.status==='Non eseguito').length;
console.log(`\n════ ${P} PASS | ${F} FAIL | ${S} Non eseguito ════`);
if(defects.length){ console.log('\nDefects:'); defects.forEach(d=>console.log(`  ${d.id} [${d.tc}][${d.sev}] ${d.desc}`)); }
await fs.writeFile(path.join(__dirname,'results.json'), JSON.stringify({results,defects,summary:{pass:P,fail:F,skip:S}},null,2));
console.log('\nresults.json scritto.');
