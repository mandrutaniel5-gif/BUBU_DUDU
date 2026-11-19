// Pune traducerile dintr-o bucata in fisierul limbii (1.15.0).
//   node tools/i18n/merge.cjs <bucata.json> <traducere.txt> <limba>
// bucata.json = [[loc, text romanesc], ...] (din keys.cjs --json, impartit); traducere.txt = linii „N|traducere” (N de la 1).
// Verifica: acelasi numar de randuri si aceleasi locuri {0}, {1}… ca in romana; ce nu se potriveste se raporteaza si nu se pune.
const fs = require('fs');
const path = require('path');
const [, , chunkF, trF, lang] = process.argv;
const chunk = JSON.parse(fs.readFileSync(chunkF, 'utf8'));
const lines = fs.readFileSync(trF, 'utf8').split(/\r?\n/).filter(l => /^\d+\|/.test(l));
const tr = new Map(lines.map(l => { const i = l.indexOf('|'); return [+l.slice(0, i), l.slice(i + 1).replace(/\\n/g, '\n')]; }));
const LOC = path.join(__dirname, '..', '..', 'src', 'i18n', 'locales', lang + '.json');
const dict = JSON.parse(fs.readFileSync(LOC, 'utf8'));
const ph = s => (s.match(/\{\d+\}/g) || []).sort().join(',');
let ok = 0; const bad = [];
chunk.forEach(([at, ro], i) => {
  const t = tr.get(i + 1);
  if (t === undefined) { bad.push(`${i + 1} lipseste (${at}: ${ro})`); return; }
  if (ph(t) !== ph(ro)) { bad.push(`${i + 1} locuri diferite: „${ro}” -> „${t}”`); return; }
  // spatiile de la capete conteaza (texte lipite de altele)
  const lead = /^\s*/.exec(ro)[0], trail = /\s*$/.exec(ro)[0];
  dict[ro] = lead + t.trim() + trail; ok++;
});
if (tr.size !== chunk.length) bad.push(`numar de randuri: ${tr.size} traduse, ${chunk.length} in bucata`);
fs.writeFileSync(LOC, JSON.stringify(dict, null, 1) + '\n');
console.log(`${lang}: +${ok} (${Object.keys(dict).length} in total)`); bad.forEach(b => console.log('  ! ' + b));
