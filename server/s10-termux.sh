#!/data/data/com.termux/files/usr/bin/bash
# Serverul Bubu & Dudu pe Samsung S10 (Termux), luat direct de pe GitHub.
# Prima data:  pkg install -y git nodejs && curl -fsSL https://raw.githubusercontent.com/mandrutaniel5-gif/bubu_dudu/main/server/s10-termux.sh | bash
# Apoi, oricand:  ~/bubu_dudu/server/s10-termux.sh   (isi ia singur ultima versiune si porneste)
set -e
REPO=https://github.com/mandrutaniel5-gif/bubu_dudu.git
DIR=$HOME/bubu_dudu
command -v git >/dev/null || pkg install -y git
command -v node >/dev/null || pkg install -y nodejs
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only || true; else git clone --depth 1 "$REPO" "$DIR"; fi
cd "$DIR"
npm install --omit=dev --no-audit --no-fund
# jocul gata compilat (construit automat de GitHub Actions pe ramura gh-pages)
rm -rf dist && git clone --depth 1 -b gh-pages "$REPO" dist && rm -rf dist/.git
# tine telefonul treaz cat ruleaza serverul
command -v termux-wake-lock >/dev/null && termux-wake-lock || true
IP=$(ip -4 addr show wlan0 2>/dev/null | grep -oE 'inet [0-9.]+' | cut -d' ' -f2)
echo "Server pe ws://${IP:-IP-ul-telefonului}:8787  — pune adresa asta in joc la Setari -> Server (S10)"
# reporneste automat daca se opreste
while true; do PORT=8787 node server/server.mjs || true; echo "Repornesc in 3s..."; sleep 3; done
