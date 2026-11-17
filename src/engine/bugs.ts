// Colectorul de erori pentru testeri (1.12.1). Strange trei feluri de probleme, fiecare cu poza ecranului si contextul
// (zona, pozitia, capitolul, ziua, minijocul, ultimele actiuni):
//  - „eroare”: erorile de cod (din ErrorLog), automat;
//  - „auto”:   probleme vizuale gasite singur de joc (personaj blocat in obiecte, obiecte suprapuse, ferestre iesite
//              din ecran, texte taiate, pozitii stricate, joc sacadat) — vezi engine/autocheck.ts;
//  - „tester”: butonul 🐞: testerul atinge locul problemei pe poza, alege ce e gresit si scrie ce vede.
// Rapoartele stau pe telefon (Meniu → ⚙ Setări → 🐞 Rapoarte: trimiti fisierul) si se urca in Firebase la bugs/
// (daca regulile din database.rules.json sunt puse in consola). Le citesti cu tools/erori.html.
import { BUILTIN_FIREBASE } from '../game/settings';
import { GAME_NAME } from '../game/names';

export interface BugRep {
  id: string; ts: number; ver: string; kind: 'eroare' | 'auto' | 'tester'; cat: string; title: string; note?: string;
  ctx: Record<string, unknown>; crumbs: string[]; shot?: string; up?: boolean; dev?: string;
}
const KEY = 'bd-bugs', MAX = 40, SHOTS = 20;
let list: BugRep[] = [];
try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { list = []; }
const crumbs: string[] = [];
const seen = new Set<string>();
let lastAuto = 0;
let busy = false;

function persist() {
  // pozele sunt mari: le pastram doar la ultimele SHOTS rapoarte (restul raman ca text)
  list = list.slice(-MAX);
  list.forEach((r, i) => { if (i < list.length - SHOTS) delete r.shot; });
  for (let tries = 0; tries < 4; tries++) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return; }
    catch { const r = list.find(x => x.shot); if (!r) return; delete r.shot; } // plin: scoatem cea mai veche poza
  }
}

export const Bugs = {
  ver: '',
  /** jocul spune unde esti si ce faci (WorldScene) */
  ctx: (() => ({})) as () => Record<string, unknown>,
  canvas: null as HTMLCanvasElement | null,
  /** modul tester: pornit din Setari (sau in modul dezvoltator) */
  on(): boolean { try { return localStorage.getItem('bd-tester') === '1' || localStorage.getItem('bd-dev-unlock') !== null || new URLSearchParams(location.search).has('dev'); } catch { return false; } },
  setOn(v: boolean) { try { if (v) localStorage.setItem('bd-tester', '1'); else localStorage.removeItem('bd-tester'); } catch { /* */ } },
  /** ce a facut jucatorul inainte (ultimele 30 de pasi) */
  crumb(t: string) { const s = `${new Date().toLocaleTimeString('ro-RO')} ${t}`; if (crumbs[crumbs.length - 1]?.slice(9) === t) return; crumbs.push(s); if (crumbs.length > 30) crumbs.shift(); },
  /** poza ecranului jocului (micsorata), cu un cerc rosu unde arata testerul (x, y intre 0 si 1) */
  shot(mark?: { x: number; y: number } | null, src?: string): Promise<string | undefined> {
    return new Promise(res => {
      try {
        const draw = (img: CanvasImageSource, w0: number, h0: number) => {
          const k = Math.min(1, 720 / w0), c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
          const g = c.getContext('2d')!; g.drawImage(img, 0, 0, c.width, c.height);
          if (mark) { g.strokeStyle = '#ff1744'; g.lineWidth = 4; g.beginPath(); g.arc(mark.x * c.width, mark.y * c.height, 26, 0, 7); g.stroke(); g.beginPath(); g.arc(mark.x * c.width, mark.y * c.height, 3, 0, 7); g.fillStyle = '#ff1744'; g.fill(); }
          res(c.toDataURL('image/jpeg', 0.62));
        };
        if (src) { const im = new Image(); im.onload = () => draw(im, im.width, im.height); im.onerror = () => res(undefined); im.src = src; return; }
        const cv = Bugs.canvas; if (!cv || !cv.width) { res(undefined); return; }
        draw(cv, cv.width, cv.height);
      } catch { res(undefined); }
    });
  },
  /** un raport nou; key = o singura data pe sesiune (problemele automate si aceeasi eroare nu se repeta) */
  async add(r: { kind: BugRep['kind']; cat: string; title: string; note?: string; key?: string; shot?: string; extra?: Record<string, unknown> }) {
    if (!Bugs.on()) return;
    const key = r.key ?? (r.kind === 'tester' ? '' : r.kind + '|' + r.title);
    if (key) { if (seen.has(key)) return; seen.add(key); }
    if (r.kind === 'auto') { if (Date.now() - lastAuto < 8000) { seen.delete(key); return; } lastAuto = Date.now(); }
    let ctx: Record<string, unknown> = {};
    try { ctx = { ...Bugs.ctx(), ...(r.extra ?? {}) }; } catch { /* */ }
    const rep: BugRep = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), ver: Bugs.ver, kind: r.kind, cat: r.cat, title: r.title.slice(0, 300), note: r.note?.slice(0, 1000),
      ctx: { ...ctx, ecran: `${innerWidth}×${innerHeight} @${devicePixelRatio}`, ua: navigator.userAgent.slice(0, 160) }, crumbs: crumbs.slice(-15), shot: r.shot ?? await Bugs.shot() };
    try { rep.dev = localStorage.getItem('bd-dev') ?? ''; } catch { /* */ }
    list.push(rep); persist();
    Bugs.upload();
  },
  all() { return list.slice(); },
  count() { return list.length; },
  clear() { list = []; try { localStorage.removeItem(KEY); } catch { /* */ } },
  /** urca in Firebase ce n-a ajuns inca (bugs/<id>); fara reguli puse sau fara internet raman pe telefon */
  async upload() {
    if (busy || !navigator.onLine) return; const todo = list.filter(r => !r.up); if (!todo.length) return;
    busy = true;
    try {
      const [{ initializeApp, getApps }, fb] = await Promise.all([import('firebase/app'), import('firebase/database')]);
      const db = fb.getDatabase(getApps()[0] ?? initializeApp(BUILTIN_FIREBASE));
      for (const r of todo) { try { await fb.set(fb.ref(db, 'bugs/' + r.id), JSON.parse(JSON.stringify(r))); r.up = true; } catch { break; } }
      persist();
    } catch { /* */ } finally { busy = false; }
  },
  /** toate rapoartele intr-un fisier (il trimiti pe WhatsApp / mail), se deschide cu tools/erori.html */
  exportFile() {
    const name = `BubuDudu-erori-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    const blob = new Blob([JSON.stringify({ app: 'bubu-dudu-erori', ver: Bugs.ver, reports: list })], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' }); const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) nav.share({ files: [file], title: 'Erori ' + GAME_NAME }).catch(() => {});
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  },
};
