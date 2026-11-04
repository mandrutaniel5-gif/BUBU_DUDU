// Jurnalul de erori: le tinem minte (ultimele 30) ca sa le poti copia din meniu si sa mi le trimiti.
const KEY = 'bd-errors';
export interface ErrRec { t: number; msg: string; where: string; ver: string }
let list: ErrRec[] = [];
try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { list = []; }
let lastToast = 0;
let toaster: ((msg: string) => void) | null = null;
export const ErrorLog = {
  ver: '',
  setToaster(fn: ((msg: string) => void) | null) { toaster = fn; },
  add(e: unknown, where = '') {
    const err = e as { message?: string; stack?: string };
    const msg = String(err?.message ?? e).slice(0, 300);
    const stack = (err?.stack ?? '').split('\n').slice(1, 4).map(s => s.trim()).join(' | ').slice(0, 400);
    const last = list[list.length - 1];
    if (last && last.msg === msg && Date.now() - last.t < 5000) return; // aceeasi eroare in fiecare cadru: o tinem o singura data
    list.push({ t: Date.now(), msg, where: (where + ' ' + stack).trim(), ver: ErrorLog.ver });
    if (list.length > 30) list = list.slice(-30);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ }
    console.warn('[eroare]', where, e);
    if (toaster && Date.now() - lastToast > 30000) { lastToast = Date.now(); toaster('⚠️ A apărut o eroare. Jocul merge mai departe · Meniu → 📋 Erori'); }
  },
  all() { return list.slice(); },
  clear() { list = []; try { localStorage.removeItem(KEY); } catch { /* */ } },
  text() { return list.map(e => `${new Date(e.t).toLocaleString('ro-RO')} v${e.ver}: ${e.msg}\n   ${e.where}`).join('\n'); },
};
if (typeof window !== 'undefined') {
  addEventListener('error', ev => ErrorLog.add(ev.error ?? ev.message, 'global'));
  addEventListener('unhandledrejection', ev => ErrorLog.add(ev.reason, 'promise'));
}
