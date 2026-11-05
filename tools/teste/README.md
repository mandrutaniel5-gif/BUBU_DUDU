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
| `poveste.cjs` | 1.7.0, **jucat cap-coadă**: bicicleta spre cherestea (⏸, parcarea), Podul (scena), Satul renaște (clădiri închise, 6 proiecte), Ferma (parcelă, plug, semănătoare, cisternă, combină, animale, brânză), angajații și raportul, magazinul din oraș, contractul cu camionul, cererea, nunta |
| `mp_sincronizare.cjs` | 1.7.0, **2 jucători**: telefonul cu lumea veche primește lumea nouă (toaleta nu mai „revine” înfundată); salvarea fără schimbări nu mai mută ora |
| `case_parola.cjs` | 1.6.0: casa nouă cu parolă (parola scurtă e refuzată), același cod + parolă = aceeași casă, alta parolă = altă cameră, online cere casă cu parolă |
| `mp_cumparare.cjs` | 1.6.0, **2 jucători**: bicicleta cumpărată de Dudu apare imediat la Bubu |
| `sunet_iphone.cjs` | 1.6.0: sunetul revine după suspendare + atingere și se reface după ce contextul audio e închis |
| `florarie.cjs` | 1.6.0: florăria are doar lăzi cu flori, clienții cer doar flori, morcovii rămân neatinși; taraba de acasă are 4 lăzi |
| `cherestea.cjs` | 1.6.0: cheresteaua pe drum, cântarul (preț × lemne, 5 rămân pentru sobă), gaterul, comenzile, stiva din curte nu mai vinde |
| `sat_oras.cjs` | 1.6.0: în sat și în oraș se ajunge pe jos la fiecare clădire / obiect cu acțiune; nimic solid nu se suprapune |
| `miniharta.cjs` | 1.6.0: miniharta mică și mărită nu acoperă nimic (telefon, telefon mic, tabletă, laptop) |
| `v15.cjs` | 1.5.0: butoanele de test (capitolul următor, resurse infinite), stiva de lemne + cheresteaua din Capitolul 1, ieșirea de sub pat, fâșia din spatele casei blocată, banca (amândoi pe șezut, apoi liberi) |
| `mp_lume.cjs` | **Multiplayer cu 2 jucători în lumea mare**: scuterul cu partenerul în spate (telefoane diferite), autobuz singur (celălalt îl vede pe drum), apartamentul („în apartament”), invitația la autobuz și sosirea împreună |
| `mp_vehicule.cjs` | Vehiculul mutat de unul se vede la noul loc și pe telefonul celuilalt (scuterul în sat, tractorul în pădure); nu apare de două ori cât timp e pe drum |
| `lume_drumuri.cjs` | Drumurile cu vehiculele: scuter acasă → sat (cu AI-ul în spate, rămâne parcat în sat), autobuz sat → oraș, ușa blocului, taxi oraș → acasă, tractorul la pădure și înapoi |
| `lume_capitole.cjs` | Salvare veche din sat mutată corect în lume; poarta pădurii / podul / bariera spre oraș pe capitole; AI-ul „Vino cu mine” |
| `lume_distante.cjs` | Cât durează pe jos casă → sat și sat → oraș |
| `baterie_lume.cjs` | Procesorul în curte, sat, oraș și pe drum (de comparat cu versiunea veche) |
| `presence.cjs` | „X a intrat în joc” apare o singură dată; o scurtă pierdere de semnal nu dă mesaje; ieșirea se anunță o dată |
| `repro.cjs` | Pornirea ca pe telefon (încărcare → meniu → joc), salvare în sat, repornire, câteva minute de joc; numără erorile |
| `errtest2.cjs` | Un obiect stricat nu mai oprește jocul; erorile ajung în Meniu → 📋 Erori; avertizare de versiune diferită |
| `anim2.cjs` | Capturi: masa, roata mare (în doi / singur), călușei, moneda în fântână, restaurant și cinema singur, rutina de seară |
| `table.cjs` | Stat la masă cu farfuria (captură de aproape) |
| `cook_test.cjs` | Bucătăria: meniul de rețete, minijocul (oală / tigaie / cuptor), masa „Ce mâncăm?” (de actualizat: atingerea ingredientelor) |
| `apt2.cjs` | Blocul din oraș, scara (animația), apartamentul cu ușa, ieșirea |
| `battery3.cjs` | Consum: cadre pe secundă, cât e ocupat procesorul, cât se scrie în pagină și pe rețea |
| `snd_test.cjs` | Sunetele: ambianța fiecărei zone, pașii, baia, sforăitul |
| `energy.cjs` | Cât de repede obosești tăind copaci |
| `econ.cjs` | Limitele de vânzare (cherestea, piață) |
| `stall.cjs` | Prețurile de la tarabă și tâmplăria fără limită |
| `pas1.cjs` | Pasul 1: taraba comună (2 jucători), inventarul, clienții florăriei, rutina de seară, cina |

Testele nu pot verifica Firebase-ul adevărat (serverul de test nu are acces la internetul lui Google). Pentru Firebase rămâne testul pe două telefoane.
