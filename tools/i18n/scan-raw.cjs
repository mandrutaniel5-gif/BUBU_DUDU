// Cauta texte romanesti scrise direct in cod (fara $t): siruri si sabloane care arata a text pentru jucator.
// node tools/i18n/scan-raw.cjs [--all]   (--all arata si ce pare id / cheie)
const ts = require('typescript'), fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '../../src');
const ro = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n/locales/en.json'), 'utf8'));
const words = s => (s.replace(/<[^>]*>|\$\{[^}]*\}|\{\d+\}/g, ' ').match(/[A-Za-zĂÂÎȘȚăâîșțŞşŢţ]{2,}/g) || []);
const VOC = new Set(Object.keys(ro).flatMap(words).map(w => w.toLowerCase()));
const DIA = /[ăâîșțşţĂÂÎȘȚŞŢ]/;
const out = [];
function walk(dir) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) { if (f !== 'i18n') walk(p); } else if (/\.ts$/.test(f) && !/\.d\.ts$/.test(f)) scan(p); } }
function isT(node) { const c = node.parent; return c && ts.isCallExpression(c) && c.arguments[0] === node && ts.isIdentifier(c.expression) && c.expression.text === '$t'; }
function marked(src, node) { const pre = src.text.slice(Math.max(0, node.pos), node.getStart(src)); return /\/\*ro\*\//.test(pre); }
function scan(file) {
  const text = fs.readFileSync(file, 'utf8'), src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const visit = node => {
    let s = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) s = node.text;
    else if (ts.isTemplateExpression(node)) s = node.head.text + node.templateSpans.map(x => ' ' + x.literal.text).join('');
    if (s != null && !isT(node) && !marked(src, node)) {
      const p = node.parent;
      const skip = ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || (ts.isPropertyAssignment(p) && p.name === node) || ts.isLiteralTypeNode(p) || ts.isElementAccessExpression(p) || ts.isCaseClause(p)
        || (ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText(src)));
      const plain = s.replace(/<[^>]*>/g, ' ').replace(/\$\{[^}]*\}/g, ' ');
      const ws = words(plain), roW = ws.filter(w => VOC.has(w.toLowerCase()));
      const looks = ws.length > 0 && !/^[a-z0-9_.:\-\/#]+$/.test(plain.trim()) // nu e id / cale / clasa
        && (DIA.test(plain) || /\s/.test(plain.trim()) || /^[A-ZĂÂÎȘȚ]/.test(plain.trim()))
        && roW.length / ws.length >= 0.6;
      if (!skip && looks && !/^(Bubu|Dudu|Twogether|ACM|Code|OK|TV|BUS|TAXI|CINEMA)$/i.test(plain.trim())) {
        const { line } = src.getLineAndCharacterOfPosition(node.getStart(src));
        out.push(`${path.relative(SRC, file)}:${line + 1}\t${s.replace(/\s+/g, ' ').slice(0, 110)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
}
walk(SRC);
console.log(out.join('\n')); console.error(`\n${out.length} texte posibile fara $t`);
