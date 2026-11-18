// Toate textele din $t('…') din cod, cu locul lor (1.15.0).
//   node tools/i18n/keys.cjs                 -> cate texte sunt si cat e tradus din fiecare limba
//   node tools/i18n/keys.cjs --json out.json -> lista completa [{ k, at: ['fisier:linie'] }] (pentru traducere)
//   node tools/i18n/keys.cjs --missing en    -> ce lipseste din en.json
//   node tools/i18n/keys.cjs --prune         -> scoate din fisierele de limba traducerile pentru texte care nu mai exista
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', 'src');
const LOC = path.join(ROOT, 'i18n', 'locales');

function collect() {
  const keys = new Map();
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.ts') ? [path.join(d, e.name)] : []);
  for (const file of walk(ROOT)) {
    const src = fs.readFileSync(file, 'utf8'); if (!src.includes('$t(')) continue;
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const v = n => {
      if (ts.isCallExpression(n) && n.expression.getText(sf) === '$t' && n.arguments[0] && (ts.isStringLiteral(n.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(n.arguments[0]))) {
        const k = n.arguments[0].text, at = `${path.relative(ROOT, file).replace(/\\/g, '/')}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
        if (!keys.has(k)) keys.set(k, []); keys.get(k).push(at);
      }
      ts.forEachChild(n, v);
    };
    v(sf);
  }
  return keys;
}
const keys = collect();
const langs = fs.readdirSync(LOC).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const load = l => JSON.parse(fs.readFileSync(path.join(LOC, l + '.json'), 'utf8'));
const a = process.argv;
if (a.includes('--json')) {
  const out = a[a.indexOf('--json') + 1];
  fs.writeFileSync(out, JSON.stringify([...keys].map(([k, at]) => ({ k, at })), null, 1));
  console.log(`${keys.size} texte -> ${out}`);
} else if (a.includes('--missing')) {
  const l = a[a.indexOf('--missing') + 1], d = load(l);
  for (const [k, at] of keys) if (!d[k]) console.log(`${at[0]}\t${k}`);
} else if (a.includes('--prune')) {
  for (const l of langs) { const d = load(l), o = {}; let n = 0; for (const k of Object.keys(d)) { if (keys.has(k)) o[k] = d[k]; else n++; } fs.writeFileSync(path.join(LOC, l + '.json'), JSON.stringify(o, null, 1) + '\n'); console.log(`${l}: scoase ${n}`); }
} else {
  const words = [...keys.keys()].reduce((s, k) => s + k.replace(/<[^>]*>|\{\d+\}/g, ' ').split(/\s+/).filter(Boolean).length, 0);
  console.log(`${keys.size} texte (${words} cuvinte)`);
  for (const l of langs) { const d = load(l); const n = [...keys.keys()].filter(k => d[k]).length; console.log(`  ${l}: ${n}/${keys.size} (${Math.round(n * 100 / Math.max(1, keys.size))}%)`); }
}
