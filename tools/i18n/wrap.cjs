// Invaleste in $t() textele romanesti din cod (1.15.0). Ruleaza de cate ori vrei: ce e deja in $t() nu se mai atinge.
//   node tools/i18n/wrap.cjs            -> arata ce ar schimba (fara sa scrie)
//   node tools/i18n/wrap.cjs --write    -> scrie fisierele
// Sare peste: importuri, chei de obiect, `case`, tipuri, comparatii (===, !==; le listeaza ca sa le vezi de mana),
// mesajele pentru noi (Bugs.*, console.*, ErrorLog.*) si orice text marcat cu /*ro*/ chiar inainte.
const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', 'src');
const WRITE = process.argv.includes('--write');

const DIA = /[ăâîșțĂÂÎȘȚşţŞŢ]/;
const WORDS = new Set(('si de la cu pe nu ai e in sa un o din mai cand cum ce care este sunt voi tu el ea lui ei ale al a vă va iti ' +
  'acum aici gata doar inca tot toate toti dupa pana fara intai bun bine casa pentru apoi azi maine ' +
  'atinge alege pune fa ia vezi hai mergi').split(' '));
function isRo(text) {
  if (!/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(text)) return false;
  if (DIA.test(text)) return true;
  // fara diacritice: macar doua cuvinte, dintre care unul romanesc des intalnit; nu cod / css / selectori / adrese
  if (/^[\s.#:[\]()=>,\-\w"'%/]*$/.test(text) && !/\s/.test(text.trim())) return false;
  if (/^(https?:|data:|\.\/|\/|#|rgba?\(|var\(|calc\()/.test(text.trim())) return false;
  if (/[{};]\s*$/.test(text.trim()) && /:/.test(text)) return false; // css
  const ws = text.toLowerCase().replace(/<[^>]*>/g, ' ').match(/[a-z]+/g) || [];
  if (ws.length >= 2 && ws.some(w => WORDS.has(w))) return true;
  // propozitie / eticheta pentru oameni: cel putin doua cuvinte, cu majuscula sau semne (nu liste de clase CSS, fonturi, selectori)
  const t = text.replace(/<[^>]*>/g, ' ').trim();
  if (/\d+px|sans-serif|serif|monospace|rgba?\(|#[0-9a-f]{3,6}\b|=>|\(\)|[{};=]/i.test(t)) return false;
  return ws.length >= 2 && /[A-ZĂÂÎȘȚ]/.test(t) && /[a-z]{2,}/.test(t);
}
const SKIP_CALL = /^(Bugs\.|console\.|ErrorLog\.|\$t$|i18n|document\.querySelector|querySelector|root\.querySelector|m\.querySelector|this\.root\.querySelector|closest|getElementById|setAttribute|getAttribute|import|require|localStorage|matchMedia|addEventListener|createElement|Sfx\.play)/;

function calleeText(call, sf) { return call.expression.getText(sf); }
// valorile acestor campuri sunt identificatori: nu se traduc niciodata
const ID_PROPS = /^(id|key|k|tid|res|type|kind|slot|role|cat|anim|act|op|dish|crop|sym|stat|product|who|room|area|region|zone|dest|mode|place|eid|vid|icon|col|color|font|cls|sfx|snd|emote|mood)$/;
// aici e text pentru ecran: se traduce si fara diacritice (un cuvant cu majuscula, „Gata”, „ciuperci”)
const TEXT_PROPS = /^(label|text|name|title|hint|desc|info|msg|prodLabel|help|intro|say|line|done|why|tip|sub|note|lb|txt|caption|ask|question|answer|reply|toast|story|ending|what|where|ok|cancel|yes|no|unit|plural|short|long|sign|banner|lines?)$/;
const TEXT_CALLS = /(\.toast|\.text|\.log|\.choice|\.modal|\.say|\.bubble|regionBanner|fillText|strokeText|\.finish|fillTextIcons|\.confirm|staffSay|\.speak|\.note|\.popup|\.banner|^g)$/;
function textCtx(node, sf) {
  const p = node.parent; if (!p) return false;
  if (ts.isPropertyAssignment(p) && p.initializer === node) {
    const n = p.name.getText(sf).replace(/['"]/g, ''); if (ID_PROPS.test(n)) return 'id'; if (TEXT_PROPS.test(n)) return true;
    // un dictionar de texte ({ colinde: 'colindul', santa: $t('poza cu Moș Crăciun') }): daca vecinii sunt text, si el e
    const sib = p.parent.properties.filter(x => x !== p && ts.isPropertyAssignment(x)).map(x => x.initializer);
    if (sib.length && sib.filter(x => (ts.isCallExpression(x) && x.expression.getText(sf) === '$t') || ((ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) && isRo(x.text))).length * 2 >= sib.length) return true;
  }
  if (ts.isArrayLiteralExpression(p)) {
    const sib = p.elements.filter(x => x !== node);
    if (sib.length && sib.filter(x => (ts.isCallExpression(x) && x.expression.getText(sf) === '$t') || ((ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) && isRo(x.text))).length * 2 >= sib.length) return true;
  }
  if (ts.isCallExpression(p) && p.arguments.includes(node) && TEXT_CALLS.test(calleeText(p, sf))) return true;
  if (ts.isConditionalExpression(p)) {
    // perechile el / ea: daca cealalta ramura e text (romanesc sau deja in $t), si asta e
    const other = p.whenTrue === node ? p.whenFalse : p.whenTrue;
    if ((ts.isCallExpression(other) && other.expression.getText(sf) === '$t') || ((ts.isStringLiteral(other) || ts.isNoSubstitutionTemplateLiteral(other)) && isRo(other.text))) return true;
    return textCtx(p, sf);
  }
  if (ts.isArrayLiteralExpression(p) && ts.isCallExpression(p.parent) && TEXT_CALLS.test(calleeText(p.parent, sf))) return true;
  return false;
}
/** fara diacritice, dar in loc de text: are litere si arata a cuvant / propozitie, nu a identificator */
function looksText(s) { const t = s.replace(/<[^>]*>/g, " ").replace(/{x}/g, " ").trim(); if (!/[a-zA-Z]{2,}/.test(t)) return false; if (/^(#|https?:|\.|\/|rgba?\(|var\()/.test(t)) return false; if (/^[a-z0-9_-]+$/.test(t) && !/^[a-z]{3,}$/.test(t)) return false; return true; }
function skipCtx(node, sf) {
  const p = node.parent;
  if (!p) return 'nop';
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isImportTypeNode?.(p)) return 'import';
  if (ts.isLiteralTypeNode(p)) return 'type';
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isPropertySignature(p)) && p.name === node) return 'key';
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return 'index';
  if (ts.isCaseClause(p)) return 'case';
  if (ts.isPropertyAssignment(p) && p.initializer === node && ID_PROPS.test(p.name.getText(sf).replace(/['"]/g, ''))) return 'id';
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return 'compare';
  // marcat de mana sa ramana in romana
  const pre = sf.text.slice(Math.max(0, node.getStart(sf) - 8), node.getStart(sf));
  if (/\/\*ro\*\/\s*$/.test(pre)) return 'marked';
  for (let a = p, prev = node; a; prev = a, a = a.parent) {
    if (ts.isCallExpression(a)) {
      const c = calleeText(a, sf);
      if (c === '$t') { if (a.arguments[0] === prev) return 'call:$t'; continue; } // in cheia lui $t: nu; in valorile {0}, {1}: da
      if (SKIP_CALL.test(c)) return 'call:' + c; break;
    }
    if (ts.isBlock(a) || ts.isSourceFile(a) || ts.isArrowFunction(a) || ts.isFunctionDeclaration(a)) break;
  }
  return null;
}
/** textul unui literal / template (doar partile fixe) */
function litText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map(s => '{x}' + s.literal.text).join('');
  return '';
}
const roLike = (n, sf) => { const x = litText(n); return isRo(x) || (textCtx(n, sf) === true && looksText(x)); };
const isCand = (n, sf) => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) && roLike(n, sf) && !skipCtx(n, sf);
function containsCand(node, sf) { let f = false; const v = n => { if (f) return; if (isCand(n, sf)) { f = true; return; } ts.forEachChild(n, v); }; ts.forEachChild(node, v); return f; }
/** sir JS pentru cheie: ghilimele simple, cu escape */
const q = s => "'" + JSON.stringify(s).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'") + "'";

const report = { files: 0, wrapped: 0, compare: [], skipped: {} };
function processFile(file) {
  let src = fs.readFileSync(file, 'utf8'); let changed = false; let total = 0;
  for (let pass = 0; pass < 12; pass++) {
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const edits = [];
    const visit = n => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
        const txt = litText(n);
        if (roLike(n, sf)) {
          const why = skipCtx(n, sf);
          if (why) {
            if (pass === 0) { if (why === 'compare') report.compare.push(`${path.relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}  ${txt.slice(0, 70)}`); report.skipped[why.split(':')[0]] = (report.skipped[why.split(':')[0]] || 0) + 1; }
          } else if (ts.isTemplateExpression(n)) {
            if (!containsCand(n, sf)) { // frunza: cele din interior sunt deja in t()
              let key = n.head.text; const args = [];
              n.templateSpans.forEach((s, i) => { key += '{' + i + '}' + s.literal.text; args.push(s.expression.getText(sf)); });
              edits.push([n.getStart(sf), n.getEnd(), `$t(${q(key)}, ${args.join(', ')})`]);
              return;
            }
            // altfel intai textele din interior (la pasul urmator ajunge si el frunza)
          } else { edits.push([n.getStart(sf), n.getEnd(), `$t(${q(n.text)})`]); return; }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    if (!edits.length) break;
    edits.sort((a, b) => b[0] - a[0]);
    for (const [s, e, r] of edits) src = src.slice(0, s) + r + src.slice(e);
    total += edits.length; changed = true;
  }
  if (!changed) return;
  // importul lui t
  if (!/import \{[^}]*\$t\b[^}]*\} from '[./]+i18n'/.test(src)) {
    let rel = path.relative(path.dirname(file), path.join(ROOT, 'i18n')).replace(/\\/g, '/'); if (!rel.startsWith('.')) rel = './' + rel;
    const imp = `import { $t } from '${rel}';\n`;
    const m = src.match(/^(?:(?:\/\/[^\n]*|\s*)\n)*/); // dupa comentariile de la inceput
    const lastImp = [...src.matchAll(/^import [^\n]*\n/gm)].pop();
    const at = lastImp ? lastImp.index + lastImp[0].length : (m ? m[0].length : 0);
    src = src.slice(0, at) + imp + src.slice(at);
  }
  report.files++; report.wrapped += total;
  if (WRITE) fs.writeFileSync(file, src);
  else console.log(`${path.relative(ROOT, file)}: ${total}`);
}
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'i18n' ? [] : walk(path.join(d, e.name))) : e.name.endsWith('.ts') && !e.name.endsWith('.d.ts') && e.name !== 'sfx.ts' ? [path.join(d, e.name)] : []);
for (const f of walk(ROOT)) processFile(f);
console.log(`\n${WRITE ? 'scris' : 'ar schimba'}: ${report.wrapped} texte in ${report.files} fisiere; sarite: ${JSON.stringify(report.skipped)}`);
if (report.compare.length) { console.log('\nComparatii cu texte (verifica de mana):'); report.compare.forEach(l => console.log('  ' + l)); }
