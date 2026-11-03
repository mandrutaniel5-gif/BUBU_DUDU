# 📱 Samsung S10 ca server pentru Bubu & Dudu

Serverul face 3 lucruri: leagă cele două telefoane în timp real, **salvează casa** (în `server/data/`)
și **servește jocul** (deschizi `http://IP:8787` în browser și joci).

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
