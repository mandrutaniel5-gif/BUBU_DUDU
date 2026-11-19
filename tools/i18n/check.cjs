// Cauta texte puse in $t() care sunt de fapt identificatori (chei, coduri, sare pentru hash) — ar strica jocul in alta limba.
//   node tools/i18n/check.cjs
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', 'src');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.ts') ? [path.join(d, e.name)] : []);
const RX = [
  /\[\$t\(/,                                                    // obiect[$t('…')]
  /\b(stat|key|id|k|tid|room|code|eid|vid|kind|type)\s*[:=]\s*\$t\(/, // campuri-identificator
  /'[a-z]+-' \+ \$t\(/,                                         // 'goal-' + $t(…)
  /(sha256|hash|crypto|digest)\([^)]*\$t\(/,                     // sare pentru hash
  /(setItem|getItem|removeItem|ref)\([^)]*\$t\(/,                // chei de stocare / Firebase
  /\$t\('[a-z0-9_]+'\)/,                                        // un singur cuvant mic, fara spatii (adesea id)
];
let n = 0;
for (const f of walk(ROOT)) {
  if (f.includes(path.sep + 'i18n' + path.sep)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (l.includes('$t(') && RX.some(r => r.test(l))) { n++; console.log(`${path.relative(ROOT, f)}:${i + 1}  ${l.trim().slice(0, 150)}`); }
  });
}
console.log(`${n} randuri de verificat`);
