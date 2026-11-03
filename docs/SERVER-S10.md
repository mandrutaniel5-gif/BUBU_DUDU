# 📱 Samsung S10 ca server pentru Bubu & Dudu

Serverul face 3 lucruri: leagă cele două telefoane în timp real, **salvează casa** (în `server/data/`)
și **servește jocul** (deschizi `http://IP:8787` în browser și joci).

## ⚡ Varianta rapidă (direct de pe GitHub)
În Termux (de pe F-Droid), o singură comandă:
```bash
pkg install -y git nodejs && curl -fsSL https://raw.githubusercontent.com/mandrutaniel5-gif/bubu_dudu/main/server/s10-termux.sh | bash
```
Scriptul clonează repository-ul și ia jocul gata compilat de GitHub Actions (ramura `gh-pages`). Apoi pornește serverul pe portul 8787 și îl repornește singur dacă se oprește. Data viitoare rulezi doar `~/bubu_dudu/server/s10-termux.sh`: își face singur update la ultima versiune de pe GitHub.
> Dacă repository-ul e privat, `git clone` îți cere utilizatorul și un token GitHub (Settings → Developer settings → Personal access tokens, cu drept de citire). Tokenul îl introduci doar pe telefon.

## 🌍 De la distanță (rețele diferite, date mobile)
Pornește serverul cu tunel:
```bash
TUNEL=1 ~/bubu_dudu/server/s10-termux.sh
```
După câteva secunde apare o adresă de forma `https://ceva-ceva.trycloudflare.com`:
- o deschizi în browser, de pe orice telefon din lume, și joci direct;
- sau, în aplicație (APK / EXE), o pui la **Setări → Server** (merge și cu `https://`, se transformă singură în `wss://`).

Legătura e criptată (HTTPS) și nu trebuie să umbli la router. Ai doar două limite:
- **Adresa se schimbă la fiecare repornire.** Ultima adresă e salvată în `~/tunel-adresa.txt`. Pentru o adresă fixă îți faci un cont gratuit Cloudflare și un „named tunnel”, sau folosești Tailscale.
- **S10 trebuie să rămână pornit și conectat la internet.** Dacă nu e, folosiți Firebase (vezi `docs/FIREBASE.md`): merge oricând, fără telefon-server.

## 🛑 Se oprește singur („Process completed (signal 9)”)
Android 12 (S10) are un „ucigaș de procese fantomă”: închide programele din fundal ale Termux. Ca să nu mai facă asta:

1. **Bateria:** Setări → Aplicații → Termux → Baterie → **Nerestricționat**. La fel pentru **Termux:API**.
2. **Ține ecranul S10 deblocat**, sau lasă notificarea Termux cu „Acquire wakelock” (scriptul o pornește singur).
3. **Oprește limita de procese** (o singură dată). Pe S10 activezi Opțiuni dezvoltator → **Depanare USB**, conectezi telefonul la PC și rulezi pe PC:
   ```bash
   adb shell "/system/bin/device_config set_sync_disabled_for_tests persistent"
   adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
   adb shell settings put global settings_enable_monitor_phantom_procs false
   ```
   `adb` vine în „Android SDK Platform-Tools” (de la Google). Setarea rămâne și după repornirea telefonului.
4. **Nu rula două servere deodată.** Scriptul oprește singur serverul vechi.

## 📋 Cel mai simplu: linkul se copiază singur
Instalează **Termux:API** din F-Droid și rulează o dată `pkg install termux-api`. La pornirea cu tunel, linkul ajunge direct în clipboard, așa că:
- **în aplicație:** apeși **📋 Lipește** la „Adresa serverului”;
- **pentru partener:** îi trimiți linkul pe WhatsApp, iar el îl deschide în browser. Jocul se conectează singur la server.
- **ca să deschizi jocul direct pe S10:** pornești cu `TUNEL=1 JOACA=1 ~/bubu_dudu/server/s10-termux.sh`.

## 1. Instalare pe S10
1. Instalează **Termux** din **F-Droid** (versiunea din Play Store e veche): https://f-droid.org/packages/com.termux/
2. Deschide Termux și rulează:
   ```bash
   pkg update && pkg upgrade -y
   pkg install -y nodejs git
   termux-setup-storage
   ```
3. Copiază proiectul pe telefon (din GitHub cu `git clone ...` sau copiezi folderul `bubu-dudu`) și:
   ```bash
   cd bubu-dudu
   npm install
   npm run build        # creează folderul dist/ cu jocul
   ```
4. Pornește serverul:
   ```bash
   termux-wake-lock     # telefonul nu oprește serverul când se blochează ecranul
   node server/server.mjs
   ```
   Trebuie să apară: `🐼🐻 Server Bubu & Dudu pornit pe portul 8787`.
5. Setări Android pe S10: **Setări → Aplicații → Termux → Baterie → Nerestricționat**. Lasă-l la încărcat.

## 2. Joc acasă (aceeași rețea Wi-Fi)
- Află IP-ul S10: în Termux `ifconfig` (ceva de genul `192.168.1.50`).
- Pe telefoanele voastre deschideți `http://192.168.1.50:8787` → meniul jocului →
  **Serverul nostru** → adresa `ws://192.168.1.50:8787` → același **Cod al casei** pentru amândoi.

## 3. Joc de la distanță (rețele diferite) — recomandat: Tailscale
Tailscale face o rețea privată între telefoanele voastre, gratuit, fără porturi deschise în router.
1. Instalează **Tailscale** din Play Store pe S10 și pe telefoanele voastre, cu același cont.
2. Pe S10, în aplicația Tailscale vezi IP-ul lui (ex. `100.101.102.103`).
3. În joc folosiți `http://100.101.102.103:8787` și serverul `ws://100.101.102.103:8787`.

**Alternativă fără cont:** tunel Cloudflare (adresa se schimbă la fiecare pornire):
```bash
pkg install cloudflared
cloudflared tunnel --url http://localhost:8787
```
Primești o adresă `https://ceva.trycloudflare.com` → în joc serverul devine `wss://ceva.trycloudflare.com`.

**Alternativă clasică:** port forwarding în router (portul 8787 către IP-ul S10) + DNS dinamic.
E mai puțin sigur; folosește un cod al casei lung și greu de ghicit.

## 4. Pornire automată
Instalează **Termux:Boot** (F-Droid), apoi:
```bash
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/bubu-dudu.sh <<'EOS'
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
cd ~/bubu-dudu && node server/server.mjs >> server.log 2>&1
EOS
chmod +x ~/.termux/boot/bubu-dudu.sh
```

## Verificare
`http://IP:8787/health` trebuie să răspundă `{"ok":true,...}`.
Salvările sunt în `server/data/<codul-casei>.json`; fă-ți din când în când o copie.
