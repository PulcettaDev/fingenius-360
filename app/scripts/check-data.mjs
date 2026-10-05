import { loadData } from '../lib/data.js';

const { data, errors } = loadData(new URL('../data/prestiti.json', import.meta.url));
const rows = [
  ...Object.values(data.lessons).flatMap(l => l.scenes.flatMap(s => s.board.rows || [])).filter(r => r.check),
  ...(data.round2 || []).flatMap(q => q.checks || [])
];

if (errors.length) {
  console.error(`Controllo contenuti FALLITO (${errors.length} errori):`);
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
}
console.log(`Controllo contenuti OK: ${data.questions.length} + ${data.round2.length} situazioni, ${Object.keys(data.lessons).length} lezioni, ${rows.length} calcoli verificati.`);
