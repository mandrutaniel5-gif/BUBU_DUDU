// Reclamele (1.15.0). Jocul se joaca la fel de bine si fara ele: o reclama nu deblocheaza nimic ce n-ai putea obtine jucand,
// doar scurteaza drumul (energie, foame, boala, incasari, lemne vandute peste limita, angajat mai priceput).
//  - cu recompensa: le alegi tu (butonul 📺); recompensa vine doar daca reclama s-a vazut pana la capat
//  - intercalate: doar cat dormiti (cand timpul trece repede), niciodata in timpul unei activitati in doi
// Pe Android vin prin pluginul AdMob, adaugat de ci/android_patch.py la build (nu e in package.json: pe iOS ramanem pe
// Capacitor 6). In browser / pe calculator nu sunt reclame; in modul dezvoltator o „reclama de test” de 3 secunde.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { DEV } from '../game/dev';
import { Settings } from '../game/settings';
import { Sfx } from './sfx';
import { $t } from '../i18n';

/** reclame adevarate (dupa aprobarea AdMob, cu aplicatia publica pe Google Play); pana atunci reclamele de test ale Google */
const REAL = false;
const ID = REAL
  ? { rewarded: 'ca-app-pub-6912029136609798/1945420217', interstitial: 'ca-app-pub-6912029136609798/4052708804' }
  : { rewarded: 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' };

type Listener = { remove: () => Promise<void> };
interface AdMobPlugin {
  initialize(o?: object): Promise<void>;
  requestConsentInfo(o?: object): Promise<{ status: string; isConsentFormAvailable?: boolean }>;
  showConsentForm(): Promise<{ status: string }>;
  prepareRewardVideoAd(o: { adId: string; isTesting?: boolean }): Promise<unknown>;
  showRewardVideoAd(): Promise<unknown>;
  prepareInterstitial(o: { adId: string; isTesting?: boolean }): Promise<unknown>;
  showInterstitial(): Promise<void>;
  addListener(ev: string, cb: (x: unknown) => void): Promise<Listener>;
}
const AdMob = registerPlugin<AdMobPlugin>('AdMob');
const native = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('AdMob');
const fake = () => !native() && (DEV || new URLSearchParams(location.search).has('fakeads'));

let ready = false, starting: Promise<void> | null = null, rewardLoaded = false, interLoaded = false, showing = false;
async function prepReward() { if (!native() || rewardLoaded) return; try { await AdMob.prepareRewardVideoAd({ adId: ID.rewarded, isTesting: !REAL, immersiveMode: true } as any); rewardLoaded = true; } catch { rewardLoaded = false; } }
async function prepInter() { if (!native() || interLoaded) return; try { await AdMob.prepareInterstitial({ adId: ID.interstitial, isTesting: !REAL, immersiveMode: true } as any); interLoaded = true; } catch { interLoaded = false; } }

/** pornire: acordul pentru reclame (GDPR, in UE) si prima reclama pregatita, ca sa porneasca pe loc cand o ceri */
function init() {
  if (starting) return starting;
  starting = (async () => {
    if (!native()) { ready = fake(); return; }
    try {
      await AdMob.initialize({ initializeForTesting: !REAL });
      try { const c = await AdMob.requestConsentInfo(); if (c.isConsentFormAvailable && c.status === 'REQUIRED') await AdMob.showConsentForm(); } catch { /* fara mesaj de acord configurat: AdMob decide singur */ }
      ready = true; void prepReward(); void prepInter();
    } catch (e) { console.warn('AdMob', e); }
  })();
  return starting;
}

/** sunetul jocului tace cat merge reclama (si revine cum era) */
function quiet<T>(p: Promise<T>): Promise<T> { Sfx.setMuted(true); showing = true; const back = () => { showing = false; Sfx.setMuted(Settings.get().muted); }; return p.then(v => { back(); return v; }, e => { back(); throw e; }); }

/** reclama de test (browser, modul dezvoltator): un ecran negru cu numaratoare, ca sa se vada fluxul fara telefon */
function fakeAd(kind: string, secs: number): Promise<boolean> {
  return new Promise(res => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:800 20px "Baloo 2",sans-serif;gap:14px';
    let left = secs; const lbl = () => `📺 ${kind} (test) · ${left}s`; d.textContent = lbl();
    const close = document.createElement('button'); close.textContent = '✖'; close.style.cssText = 'position:absolute;top:14px;right:14px;font-size:22px;background:none;border:0;color:#fff';
    close.onclick = () => { clearInterval(iv); d.remove(); res(false); }; d.appendChild(close);
    document.body.appendChild(d);
    const iv = setInterval(() => { left--; if (left <= 0) { clearInterval(iv); d.remove(); res(true); } else d.firstChild!.textContent = lbl(); }, 1000);
  });
}

export const Ads = {
  /** pe telefonul asta se pot vedea reclame cu recompensa (altfel butoanele 📺 nu apar deloc) */
  can(): boolean { void init(); return native() || fake(); },
  /** porneste din timp (la intrarea in joc) */
  init() { void init(); },
  get showing() { return showing; },
  /**
   * Reclama cu recompensa. Rezolva true DOAR daca reclama s-a vazut pana la capat (atunci dai recompensa).
   * `toast` primeste mesajul pentru jucator cand reclama nu se poate incarca.
   */
  async rewarded(toast: (m: string) => void): Promise<boolean> {
    if (showing) return false;
    await init();
    if (fake()) { showing = true; const ok = await fakeAd($t('Reclamă'), 3); showing = false; return ok; }
    if (!native() || !ready) { toast($t('📺 Reclamele nu merg pe acest dispozitiv')); return false; }
    if (!rewardLoaded) { toast($t('📺 Se încarcă reclama…')); await prepReward(); }
    if (!rewardLoaded) { toast($t('📺 Nu am găsit nicio reclamă acum. Mai încearcă puțin mai târziu')); return false; }
    rewardLoaded = false;
    // pluginul rezolva showRewardVideoAd DOAR cand se castiga recompensa; inchisa mai devreme, nu raspunde deloc.
    // Asa ca nu-l asteptam: asteptam evenimentul de inchidere (sau de eroare) si ne uitam daca a venit recompensa.
    let got = false; const subs: Listener[] = [];
    try {
      let end!: () => void; const done = new Promise<void>(r => { end = r; });
      subs.push(await AdMob.addListener('onRewardedVideoAdReward', () => { got = true; }));
      subs.push(await AdMob.addListener('onRewardedVideoAdDismissed', () => end()));
      subs.push(await AdMob.addListener('onRewardedVideoAdFailedToShow', () => end()));
      await quiet((async () => {
        AdMob.showRewardVideoAd().then(() => { got = true; }, () => end());
        await done;
        await new Promise(r => setTimeout(r, 400)); // recompensa poate sosi imediat dupa inchidere
      })());
    } catch { /* */ } finally { subs.forEach(s => void s.remove()); void prepReward(); }
    return got;
  },
  /** reclama pe tot ecranul (doar in somn); nu blocheaza jocul daca nu e gata */
  async interstitial(): Promise<void> {
    if (showing) return;
    await init();
    if (fake()) { showing = true; await fakeAd($t('Reclamă'), 2); showing = false; return; }
    if (!native() || !ready || !interLoaded) { void prepInter(); return; }
    interLoaded = false;
    try { await quiet(AdMob.showInterstitial()); } catch { /* */ } finally { void prepInter(); }
  },
};
