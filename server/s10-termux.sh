#!/data/data/com.termux/files/usr/bin/bash
# Serverul Bubu & Dudu pe Samsung S10 (Termux), luat direct de pe GitHub.
# Prima data:  pkg install -y git nodejs && curl -fsSL https://raw.githubusercontent.com/mandrutaniel5-gif/bubu_dudu/main/server/s10-termux.sh | bash
# Apoi, oricand:  ~/bubu_dudu/server/s10-termux.sh   (isi ia singur ultima versiune si porneste)
# Oprire:         ~/bubu_dudu/server/s10-termux.sh stop
set -e
REPO=https://github.com/mandrutaniel5-gif/bubu_dudu.git
DIR=$HOME/bubu_dudu
command -v git >/dev/null || pkg install -y git
command -v node >/dev/null || pkg install -y nodejs
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only || true; else git clone --depth 1 "$REPO" "$DIR"; fi
cd "$DIR"
# opreste serverul / tunelul pornite inainte (altfel portul 8787 e ocupat: EADDRINUSE)
pkill -f "node server/server.mjs" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1
if [ "$1" = "stop" ]; then echo "Serverul Bubu & Dudu a fost oprit."; exit 0; fi
npm install --omit=dev --no-audit --no-fund
# jocul gata compilat (construit automat de GitHub Actions pe ramura gh-pages)
rm -rf dist && git clone --depth 1 -b gh-pages "$REPO" dist && rm -rf dist/.git
# tine telefonul treaz cat ruleaza serverul
command -v termux-wake-lock >/dev/null && termux-wake-lock || true
IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oE 'inet [0-9.]+' | cut -d' ' -f2)
echo "Server pe ws://${IP:-IP-ul-telefonului}:8787  — pune adresa asta in joc la Setari -> Server (S10)"
# --- acces de la distanta (alte retele / date mobile): tunel Cloudflare gratuit, cu HTTPS ---
# porneste cu:  TUNEL=1 ~/bubu_dudu/server/s10-termux.sh
if [ "${TUNEL:-0}" = "1" ]; then
  command -v cloudflared >/dev/null || pkg install -y cloudflared
  command -v curl >/dev/null || pkg install -y curl
  rm -f "$HOME/tunel.log" "$HOME/tunel-adresa.txt"
  # logurile merg DOAR in fisier (un pipe inchis ar opri tunelul)
  nohup cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8787 > "$HOME/tunel.log" 2>&1 &
  ( for i in $(seq 1 60); do
      U=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$HOME/tunel.log" 2>/dev/null | head -1)
      if [ -n "$U" ]; then
        echo "$U" > "$HOME/tunel-adresa.txt"
        echo ""; echo "=============================================================="
        echo " DE LA DISTANTA: deschide $U"
        echo " (sau in joc: Serverul nostru -> Adresa serverului: $U)"
        echo "=============================================================="
        # verificare: serverul raspunde prin tunel?
        sleep 6
        R=$(curl -s -m 10 "$U/health" || true)
        if echo "$R" | grep -q '"ok":true'; then echo " ✅ Tunelul merge: $R"; else echo " ❌ Tunelul NU raspunde ($R). Vezi: tail -30 ~/tunel.log"; fi
        break
      fi; sleep 1
    done ) &
fi
# reporneste automat daca se opreste
trap 'pkill -f "cloudflared tunnel" 2>/dev/null; exit 0' INT TERM
while true; do
  PORT=8787 node server/server.mjs 2> "$HOME/server-err.log" || true
  if grep -q EADDRINUSE "$HOME/server-err.log"; then
    echo "Portul 8787 e ocupat de alt program. Opresc ce era pornit si reincerc..."
    pkill -f "node server/server.mjs" 2>/dev/null; fuser -k 8787/tcp 2>/dev/null || true
  else cat "$HOME/server-err.log"; fi
  echo "Repornesc in 3s... (CTRL+C ca sa opresti)"; sleep 3
done
