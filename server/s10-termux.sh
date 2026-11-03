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
# pornire automata cand porneste telefonul (necesita aplicatia Termux:Boot din F-Droid)
if [ "$1" = "boot" ]; then
  mkdir -p "$HOME/.termux/boot"
  printf '#!/data/data/com.termux/files/usr/bin/sh\ntermux-wake-lock\nTUNEL=1 %s/server/s10-termux.sh > %s/server-boot.log 2>&1\n' "$DIR" "$HOME" > "$HOME/.termux/boot/bubu-server"
  chmod +x "$HOME/.termux/boot/bubu-server"
  echo "✅ Gata: serverul (cu tunel) porneste singur la fiecare pornire a telefonului. Deschide o data aplicatia Termux:Boot."
  exit 0
fi
# tokenul pentru publicarea adresei pe GitHub
if [ "$1" = "token" ]; then
  read -r -p "Lipeste tokenul GitHub (fine-grained, Contents: Read and write pe BUBU_DUDU): " T
  echo "$T" > "$HOME/.bubu_token"; chmod 600 "$HOME/.bubu_token"; echo "✅ Token salvat in ~/.bubu_token (ramane doar pe telefon)."; exit 0
fi
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
echo "Sfat: daca serverul se opreste singur (signal 9), e Android care inchide procesele din fundal -> vezi docs/SERVER-S10.md, sectiunea 'Se opreste singur'."
IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oE 'inet [0-9.]+' | cut -d' ' -f2)
echo "Server pe ws://${IP:-IP-ul-telefonului}:8787  — pune adresa asta in joc la Setari -> Server (S10)"
# --- acces de la distanta (alte retele / date mobile): tunel Cloudflare gratuit, cu HTTPS ---
# porneste cu:  TUNEL=1 ~/bubu_dudu/server/s10-termux.sh
if [ "${TUNEL:-1}" = "1" ]; then
  command -v cloudflared >/dev/null || pkg install -y cloudflared
  command -v curl >/dev/null || pkg install -y curl
  rm -f "$HOME/tunel.log" "$HOME/tunel-adresa.txt"
  # logurile merg DOAR in fisier (un pipe inchis ar opri tunelul)
  nohup cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8787 > "$HOME/tunel.log" 2>&1 &
  ( for i in $(seq 1 60); do
      U=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$HOME/tunel.log" 2>/dev/null | head -1)
      if [ -n "$U" ]; then
        echo "$U" > "$HOME/tunel-adresa.txt"
        # publica adresa pe GitHub -> aplicatia (setata pe "automat") o gaseste si se conecteaza singura
        node "$DIR/server/publish-url.mjs" "$U"
        # linkul se copiaza singur (cu aplicatia Termux:API) - il lipesti in joc sau il trimiti pe WhatsApp
        command -v termux-clipboard-set >/dev/null && echo -n "$U" | termux-clipboard-set && echo " 📋 Linkul a fost COPIAT. In joc apasa 📋 Lipeste."
        # deschide jocul direct pe S10 (optional): JOACA=1
        [ "${JOACA:-0}" = "1" ] && command -v termux-open-url >/dev/null && termux-open-url "$U"
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
