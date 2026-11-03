# 🐼🐻 Bubu & Dudu – Căsuța Noastră

Un joc de familie pentru doi, făcut doar pentru noi: Bubu (panda) și Dudu (ursulețul) locuiesc
într-o căsuță izometrică, au nevoi, emoții, se îmbolnăvesc și au grijă unul de altul, fac minijocuri
amuzante (desfundat toaleta 🪠, clătite 🥞, pârțuri-rachetă 💨) și își lasă bilețele în Borcanul cu iubire 🫙.

## Cum îl pornești (pe PC, pentru dezvoltare)

```bash
npm install
npm run dev          # http://localhost:5173
```

## Moduri de joc
| Mod | Ce face |
|---|---|
| 🏠 Singur(ă) | Partenerul e jucat de AI; salvarea rămâne pe telefon |
| 📱 Serverul nostru | `server/server.mjs` rulează pe Samsung S10 (sau PC) → vezi [docs/SERVER-S10.md](docs/SERVER-S10.md) |
| 🔥 Firebase | Online fără server propriu → vezi [docs/FIREBASE.md](docs/FIREBASE.md) |
| 🧪 Test 2 tab-uri | Deschide jocul în două tab-uri, unul Bubu, altul Dudu |

Când partenerul nu e online, personajul lui e controlat de AI și primești la întoarcere „Cât ai lipsit…”.

## Comenzi
- **Telefon:** joystick în stânga-jos (trage cu degetul), atinge un obiect ca să mergi la el, butoanele din dreapta-jos.
- **PC:** `WASD`/săgeți = mers · `E`/`Spațiu` = acțiune · `Q` = emote-uri · `R` = împreună · `F` = super-salt cu pârț · `1-9` emote rapide.

## Aplicație pe telefon
- **Cel mai simplu:** deschide jocul servit de S10 în Chrome → meniu ⋮ → „Adaugă pe ecranul de pornire” (PWA).
- **APK adevărat:** vezi [docs/APK.md](docs/APK.md) (Capacitor).

## Structura
```
src/char/      personajele: desen vectorial, poze, animații, emote-uri, efecte
src/world/     harta casei, mobila, izometrie, navigare
src/scenes/    meniu, casa, studio de animații
src/game/      nevoi, boli, activități, setări
src/minigames/ minijocurile
src/net/       rețea: solo / tab-uri / WebSocket (S10) / Firebase
server/        serverul Node.js (multiplayer + salvare + servește jocul)
tools/         capturi de ecran și filmări automate
```
