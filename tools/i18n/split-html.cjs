// Desface $t('<html cu text>', …) in HTML-ul din cod cu $t() doar pe bucatile de text (1.15.0):
//   $t('<h3>⚙ Setări</h3><button title="Mai încet">{0}</button>', a)
//   -> `<h3>${$t('⚙ Setări')}</h3><button title="${$t('Mai încet')}">${a}</button>`
// Asa se traduc propozitii, nu ferestre intregi, iar o schimbare in HTML nu pierde traducerile.
//   node tools/i18n/split-html.cjs [--write]
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', 'src');
const WRITE = process.argv.includes('--write');
const TEXT_ATTR = /^(title|placeholder|alt|aria-label|data-tip)$/;

const esc = s => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const q = s => "'" + JSON.stringify(s).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'") + "'";
const hasWords = s => /[A-Za-zĂÂÎȘȚăâîșț]{2,}/.test(s.replace(/\{\d+\}/g, ''));

/** o bucata de text (cu {i} din cheia mare) -> cod pentru template */
function textPiece(txt, args) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(txt); const [, lead, core, trail] = m;
  if (!hasWords(core)) return esc(core.replace(/\{(\d+)\}/g, '\u0000$1\u0000')).replace(/\u0000(\d+)\u0000/g, (_, i) => '${' + args[+i] + '}').replace(/^/, esc(lead)) + esc(trail);
  const used = []; const k = core.replace(/\{(\d+)\}/g, (_, i) => { let j = used.indexOf(+i); if (j < 0) { used.push(+i); j = used.length - 1; } return '{' + j + '}'; });
  return esc(lead) + '${$t(' + q(k) + (used.length ? ', ' + used.map(i => args[i]).join(', ') : '') + ')}' + esc(trail);
}
/** o eticheta <...>: atributele de text se traduc, restul ramane */
function tagPiece(tag, args) {
  return tag.replace(/([\w-]+)="([^"]*)"|\{(\d+)\}|([\s\S])/g, (all, name, val, ph, other) => {
    if (name !== undefined) {
      if (TEXT_ATTR.test(name) && hasWords(val)) return name + '="' + textPiece(val, args) + '"';
      return name + '="' + esc(val).replace(/\{(\d+)\}/g, (_, i) => '${' + args[+i] + '}') + '"';
    }
    if (ph !== undefined) return '${' + args[+ph] + '}';
    return esc(all);
  });
}
function convert(key, args) {
  let out = '';
  for (const part of key.split(/(<[^>]*>)/)) { if (!part) continue; out += part.startsWith('<') && part.endsWith('>') ? tagPiece(part, args) : textPiece(part, args); }
  return '`' + out + '`';
}

let total = 0, files = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'i18n' ? [] : walk(path.join(d, e.name))) : e.name.endsWith('.ts') ? [path.join(d, e.name)] : []);
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, 'utf8'); if (!src.includes('$t(')) continue;
  let n = 0;
  for (let pass = 0; pass < 10; pass++) {
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const edits = [];
    const v = node => {
      if (ts.isCallExpression(node) && node.expression.getText(sf) === '$t' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && /<[a-zA-Z/][^>]*>/.test(node.arguments[0].text)) {
        // intai cele din interior (argumentele pot avea si ele $t cu HTML)
        let inner = false; node.arguments.slice(1).forEach(a => { const w = x => { if (ts.isCallExpression(x) && x.expression.getText(sf) === '$t' && x.arguments[0] && ts.isStringLiteral(x.arguments[0]) && /<[a-zA-Z/][^>]*>/.test(x.arguments[0].text)) inner = true; ts.forEachChild(x, w); }; w(a); });
        if (!inner) { edits.push([node.getStart(sf), node.getEnd(), convert(node.arguments[0].text, node.arguments.slice(1).map(a => a.getText(sf)))]); return; }
      }
      ts.forEachChild(node, v);
    };
    v(sf);
    if (!edits.length) break;
    edits.sort((a, b) => b[0] - a[0]);
    for (const [s, e, r] of edits) src = src.slice(0, s) + r + src.slice(e);
    n += edits.length;
  }
  if (n) { files++; total += n; if (WRITE) fs.writeFileSync(file, src); else console.log(path.relative(ROOT, file) + ': ' + n); }
}
console.log(`${WRITE ? 'desfacute' : 'de desfacut'}: ${total} in ${files} fisiere`);
