// Copie de siguranta in cloud (Firebase-ul jocului), pentru orice mod de joc.
// Salvarea sta la rooms/<codul casei>/save, la fel ca in modul Online: dupa o reinstalare,
// cu acelasi cod al casei, jocul isi ia progresul inapoi.
import { BUILTIN_FIREBASE } from '../game/settings';

let dbP: Promise<{ fb: any; db: any } | null> | null = null;
function db() {
  if (!dbP) dbP = (async () => {
    try {
      const [{ initializeApp, getApps }, fb] = await Promise.all([import('firebase/app'), import('firebase/database')]);
      const app = getApps()[0] ?? initializeApp(BUILTIN_FIREBASE);
      return { fb, db: fb.getDatabase(app) };
    } catch { return null; }
  })();
  return dbP;
}
const safe = (r: string) => String(r || 'casuta-noastra').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 48) || 'casuta-noastra';
const timeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), ms))]);

export async function saveCloud(room: string, json: string, ts: number) {
  if (!navigator.onLine) return false;
  const d = await timeout(db(), 4000); if (!d) return false;
  try { await timeout(d.fb.set(d.fb.ref(d.db, `rooms/${safe(room)}/save`), { json, ts }), 6000); return true; } catch { return false; }
}
export async function loadCloud(room: string): Promise<{ json: string; ts: number } | null> {
  if (!navigator.onLine) return null;
  return timeout(loadInner(room), 3000); // nu tinem jocul in loc daca netul e prost
}
async function loadInner(room: string): Promise<{ json: string; ts: number } | null> {
  const d = await timeout(db(), 4000); if (!d) return null;
  try { const snap: any = await timeout(d.fb.get(d.fb.ref(d.db, `rooms/${safe(room)}/save`)), 3500); const v = snap?.val?.(); return v && typeof v.json === 'string' ? v : null; } catch { return null; }
}
