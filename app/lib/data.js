import { readFileSync } from 'fs';

const OPS = { mul: (a, b) => a * b, div: (a, b) => a / b, add: (a, b) => a + b, sub: (a, b) => a - b };

export function checkData(data) {
  const errors = [];
  const verify = (check, label) => {
    const { a, b, op = 'mul', plus = 0, result, tol = 0.01 } = check;
    const got = OPS[op](a, b) + plus;
    if (Math.abs(got - result) > tol) errors.push(`${label} → indicato ${result}, calcolato ${got}`);
  };
  for (const q of data.questions) {
    if (!data.lessons[q.concept]) errors.push(`Manca la lezione per il concetto "${q.concept}"`);
  }
  if (!Array.isArray(data.round2) || data.round2.length !== data.questions.length) {
    errors.push('Il Round 2 deve avere lo stesso numero di situazioni del Round 1');
  } else {
    data.round2.forEach((q, i) => {
      if (q.concept !== data.questions[i].concept) errors.push(`Round 2, situazione ${i + 1}: concetto diverso dal Round 1`);
      if (q.options.length !== 3 || !(q.correct in q.options)) errors.push(`Round 2, situazione ${i + 1}: opzioni non valide`);
      (q.checks || []).forEach((c, k) => verify(c, `Round 2, situazione ${i + 1}, calcolo ${k + 1}`));
    });
  }
  for (const [concept, l] of Object.entries(data.lessons)) {
    for (const s of l.scenes) {
      for (const r of s.board.rows || []) {
        if (r.check) verify(r.check, `${concept}: "${r.show}"`);
      }
    }
    const c = l.check;
    if (!c || c.options.length !== 3 || c.reactions.length !== 3 || !(c.correct in c.options)) {
      errors.push(`${concept}: domanda di verifica incompleta`);
    }
  }
  return errors;
}

export function loadData(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  return { data, errors: checkData(data) };
}
