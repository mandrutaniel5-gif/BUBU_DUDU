# Teste automate (Playwright)

Scripturi care pornesc jocul într-un browser fără ecran și verifică ce s-a reparat. Fiecare scrie în consolă ce a găsit, iar în folderul curent pune capturi de ecran (`.png`).

## Cum le rulezi

```bash
npm install            # o dată
npx playwright install chromium   # doar dacă nu ai deja Chromium pentru Playwright
npm run dev            # serverul de dezvoltare pe http://localhost:5173 (lasă-l pornit)
```

Într-un alt terminal, dintr-un folder gol (ca să nu umpli proiectul cu poze):

```bash
mkdir -p /tmp/teste && cd /tmp/teste
node /cale/catre/proiect/tools/teste/mp2.cjs
```

`repro.cjs` și `errtest2.cjs` folosesc build-ul de producție: `npm run build && npx vite preview --port 4173`.

Adresele de test folosesc `?skipload` (sare peste ecranul de încărcare), `who=bubu|dudu` (personajul) și `mode=solo|local` (`local` = două taburi în același browser care joacă împreună, prin BroadcastChannel; așa se testează multiplayerul fără Firebase).

## Ce verifică fiecare

| Script | Ce testează |
|---|---|
| `mp2.cjs` | **Multiplayer cu 2 jucători**: vehiculul văzut corect de celălalt, autobuz „singur” (celălalt rămâne), invitație „împreună” (celălalt acceptă și vine), cinema în doi |
| `presence.cjs` | „X a intrat în joc” apare o singură dată; o scurtă pierdere de semnal nu dă mesaje; ieșirea se anunță o dată |
| `repro.cjs` | Pornirea ca pe telefon (încărcare → meniu → joc), salvare în sat, repornire, câteva minute de joc; numără erorile |
| `errtest2.cjs` | Un obiect stricat nu mai oprește jocul; erorile ajung în Meniu → 📋 Erori; avertizare de versiune diferită |
| `leak.cjs` | După ieșirea în meniu din oraș și revenire, obiectele casei nu apar în oraș |
| `anim2.cjs` | Capturi: masa, roata mare (în doi / singur), călușei, moneda în fântână, restaurant și cinema singur, rutina de seară |
| `table.cjs` | Stat la masă cu farfuria (captură de aproape) |
| `cook_test.cjs` | Bucătăria: meniul de rețete, minijocul (oală / tigaie / cuptor), masa „Ce mâncăm?” |
| `apt2.cjs` | Blocul din oraș, scara (animația), apartamentul cu ușa, ieșirea |
| `park.cjs` | Bicicleta/scuterul parcate la indicator; sosirea din sat / cu taxiul / de la pădure |
| `battery3.cjs` | Consum: cadre pe secundă, cât e ocupat procesorul, cât se scrie în pagină și pe rețea |
| `snd_test.cjs` | Sunetele: ambianța fiecărei zone, pașii, baia, sforăitul |
| `energy.cjs` | Cât de repede obosești tăind copaci |
| `econ.cjs` | Limitele de vânzare (cherestea, piață) |
| `stall.cjs` | Prețurile de la tarabă și tâmplăria fără limită |
| `pas1.cjs` | Pasul 1: taraba comună (2 jucători), inventarul, clienții florăriei, rutina de seară, cina |

Testele nu pot verifica Firebase-ul adevărat (serverul de test nu are acces la internetul lui Google). Pentru Firebase rămâne testul pe două telefoane.
