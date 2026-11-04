# Bubu & Dudu: predarea proiectului

Fișierul ăsta e pentru oricine (om sau AI) continuă proiectul: ce e jocul, cum e făcut, ce îi place și ce nu îi place proprietarului, ce merge, ce s-a testat și încotro mergem. **Citește-l tot înainte să schimbi ceva.**

Ultima actualizare: versiunea **1.3.1** (noiembrie 2026).

---

## 1. Ce e jocul

- Un joc **privat, pentru un cuplu**: **Bubu** e o panda (**fată**), **Dudu** e un urs maro deschis (**băiat**).
- Totul e în **română**, cu **genul gramatical corect** pentru fiecare: „obosit / obosită”, „l-ai invitat pe Dudu / ai invitat-o pe Bubu”. Pentru asta e funcția `g(id, masculin, feminin)` din [`src/game/gender.ts`](../src/game/gender.ts).
- Stil: **izometric 2.5D, drăguț**, desenat în cod pe Canvas, fără imagini.
- Se joacă **în doi online** (fiecare pe telefonul lui) sau **singur**, cu partenerul controlat de AI.
- Povestea are capitole:
  - casa → curtea → pădurea (tractoraș) → satul (bicicletă / scuter) → orașul (autobuz, joburi, apartament);
  - urmează lumea mare, vezi secțiunea 7.
- Joc tip „viață de cuplu”:
  - **nevoi**: foame, energie, căldură, curățenie, distracție, iubire, sănătate;
  - treburi, gătit, grădină, taraba, joburi, întâlniri, rutina de seară, bășini și pupici.

## 2. Cum îl construiești și publici

```bash
npm install
npm run dev            # http://localhost:5173 (?skipload sare peste ecranul de încărcare)
npm run build          # dist/ (jocul pentru browser / aplicații)
npm run build:single   # dist-single/index.html: tot jocul într-un singur fișier
```

- **Publicarea e automată.** Fiecare push pe `main` rulează [`.github/workflows/build.yml`](../.github/workflows/build.yml):
  - **web:** publică pe ramura `gh-pages` (GitHub Pages, iar serverul S10 îl descarcă de acolo);
  - **windows:** Electron, `Setup` și `Portable`;
  - **android:** APK prin Capacitor;
  - **ios:** IPA nesemnat;
  - **release:** creează Release-ul `v<versiunea din package.json>` cu toate fișierele.
- **Versiunea nouă** = schimbi `"version"` în [`package.json`](../package.json), apoi faci commit și push pe `main`. Tag-urile nu se pot împinge din mediul de lucru, de aceea Release-ul îl face workflow-ul.
- **Fiecare versiune are nevoie de un număr nou.** Dacă Release-ul există deja, nu se suprascrie.
- Release-ul iese și dacă iOS nu se construiește: GitHub nu are mereu servere Mac libere.
- **Semnarea Android:**
  - fără secretele `ANDROID_KEYSTORE_*`, APK-ul e semnat cu cheia de test **fixă** [`ci/debug.keystore`](../ci/debug.keystore);
  - cu cheia fixă, versiunile noi se instalează peste cele vechi și lumile rămân;
  - **nu schimba cheia**: asta obligă la dezinstalare, iar dezinstalarea pierde salvarea locală.
- **Multiplayer online:**
  - implicit prin **Firebase Realtime Database**, cu configurația inclusă în cod: [`src/game/settings.ts`](../src/game/settings.ts) → `BUILTIN_FIREBASE`;
  - alternativ, serverul propriu de pe telefonul S10: [`server/`](../server/), [`docs/SERVER-S10.md`](SERVER-S10.md).
- Alte documente:
  - [`docs/FIREBASE.md`](FIREBASE.md);
  - [`docs/APK.md`](APK.md);
  - [`docs/SUNETE.md`](SUNETE.md): sursele și licențele sunetelor;
  - [`docs/LOGICA_JOCULUI.md`](LOGICA_JOCULUI.md): regulile jocului, pe versiuni.

## 3. Structura codului

TypeScript + Canvas 2D, fără framework. Construit cu Vite.

| Unde | Ce e |
|---|---|
| [`src/main.ts`](../src/main.ts) | Pornirea: încărcare, scena de meniu sau joc, rotirea pe orizontală, ștergerea copiei offline din aplicație |
| [`src/engine/game.ts`](../src/engine/game.ts) | Bucla jocului (30/60 cadre pe secundă, modul eco), canvasul, rotirea ecranului |
| [`src/engine/sfx.ts`](../src/engine/sfx.ts) | Sunetele (înregistrări reale + sinteză de rezervă), buclele de ambianță |
| [`src/engine/soundscape.ts`](../src/engine/soundscape.ts) | Ce se aude în fiecare zonă și la fiecare activitate |
| [`src/engine/errors.ts`](../src/engine/errors.ts) | Jurnalul de erori: Meniu → 📋 Erori |
| [`src/scenes/world.ts`](../src/scenes/world.ts) | **Inima jocului** (~2100 de rânduri): lumea, personajele, activitățile, rețeaua, salvarea, desenul |
| [`src/scenes/menu.ts`](../src/scenes/menu.ts) | Meniul (cine ești, cum jucați, codul casei, salvare în fișier, credite, erori, eco) |
| [`src/scenes/townctl.ts`](../src/scenes/townctl.ts) | Logica satului și a orașului: joburi, cursuri, magazine, bancă, misiuni, ziua nouă |
| [`src/game/state.ts`](../src/game/state.ts) | Starea lumii (`WorldState`), nevoile și cât de repede scad |
| [`src/game/activities.ts`](../src/game/activities.ts) | Toate activitățile (somn, baie, toaletă, gătit, tăiat lemne…) și efectele lor |
| [`src/game/economy.ts`](../src/game/economy.ts) | Inventarul, magazinele, prețurile (`PRICE`), obiectivele și capitolele |
| [`src/game/food.ts`](../src/game/food.ts) | Rețetele (14) și ingredientele |
| [`src/game/town.ts`](../src/game/town.ts) | Joburi, cursuri, săteni, bancă, apartament, mobilă |
| [`src/world/map.ts`](../src/world/map.ts) | Harta casei și „zonele” (`AREAS`, `setArea`, `resetAreas`) |
| [`src/world/village.ts`](../src/world/village.ts), [`city.ts`](../src/world/city.ts), [`forest.ts`](../src/world/forest.ts) | Satul, orașul (+ apartamentul), pădurea |
| [`src/world/furniture.ts`](../src/world/furniture.ts) | Desenul obiectelor și al pereților |
| [`src/world/vehicles.ts`](../src/world/vehicles.ts) | Vehiculele, scenele de drum, scara blocului |
| [`src/char/`](../src/char/) | Personajele: desen, poze, animații (`anims.ts`), efecte (`fx.ts`), haine |
| [`src/minigames/`](../src/minigames/) | Minijocurile (pe fiecare îl găsești după nume în [`registry.ts`](../src/minigames/registry.ts)) |
| [`src/ui/hud.ts`](../src/ui/hud.ts) | Interfața de deasupra jocului: bare, butoane, ferestre, magazine |
| [`src/ui/icons.ts`](../src/ui/icons.ts) | **Iconițele desenate**. Emoji-urile cunoscute devin automat desene, în pagină și pe canvas |
| [`src/net/`](../src/net/) | Rețeaua: Solo, două taburi (test), serverul S10 (WebSocket), Firebase |
| [`src/save/cloud.ts`](../src/save/cloud.ts) | Copia salvării în Firebase |
| [`tools/build_sfx.py`](../tools/build_sfx.py) | Construiește sunetele din colecțiile CC0 / CC-BY |
| [`tools/teste/`](../tools/teste/) | **Testele automate** (vezi [`tools/teste/README.md`](../tools/teste/README.md)) |

**Cum circulă datele:**
- Orice schimbare a lumii trece prin `op({ k: ..., ... })` în `world.ts`: se aplică local și se trimite partenerului.
- Poziția personajului se trimite prin `sendState`, doar când te miști.
- Evenimentele speciale (emoții, invitații, minijocuri) se trimit prin `net.sendEvent({ t: ... })`.
- Tipurile sunt în [`src/net/types.ts`](../src/net/types.ts).

**Salvarea:**
- Pe telefon, la 10 secunde după fiecare schimbare importantă, și imediat la închidere sau minimizare.
- În Firebase, cel mult o dată la 45 de secunde.
- La pornire se ia salvarea cea mai nouă.

## 4. Ce îi place / ce nu îi place proprietarului

**Îi place:**
- Personajele și stilul drăguț. Sunetele reale, cu ambianță pe zone.
- Bucătăria cu rețete românești.
- Prețurile „cât de cât reale” (v1.2.5).
- Bicicleta și scuterul cu urcat împreună.
- Să vadă **capturi și video** după fiecare schimbare. Testele cu doi jucători.

**Nu îi place (de evitat):**
- **Bug după bug, animații slabe, sisteme proaste.** Vrea calitate: testezi bine, cu capturi, înainte să trimiți.
- **Emoji pentru lucruri**: totul se desenează. Dacă folosești un emoji nou, desenează-l în [`icons.ts`](../src/ui/icons.ts).
- Lucruri **complicate** fără rost:
  - rutina de seară cu multe etape i s-a părut ciudată și complicată;
  - cina la restaurant, unde trebuia să ghicești, n-a fost înțeleasă.
- Sunete care nu se potrivesc personajelor: râsul de om matur, bășina prea „reală”.
- Super-bășina: animația e slabă.
- Să fie **tras după celălalt** fără să vrea (autobuz, cinema). S-a rezolvat cu invitații în v1.3.0.
- **Hărțile care se încalecă**: de exemplu, veioza aprinsă acasă se vede în pădure, pentru că zonele folosesc aceeași scenă.
- **Lumea prea mică** și drumul ciudat pădure → casă → sat → oraș.
- „Vacanța” dintr-un meniu nu se simte reală.
- **Condus liber ca în GTA**: vehiculele trebuie să fie **semi-automate** (vezi secțiunea 7).
- Că, la un moment dat, **nu mai ai ce face**, și că la oraș trebuie să lași afacerile de la țară ca să te angajezi.
- Bateria consumată repede (s-a îmbunătățit în v1.2.8). Mesajele repetate („Bubu a intrat în joc”, rezolvat în v1.2.6).

## 5. Ce merge (verificat)

- Bucla zilnică: nevoile (o zi întreagă de muncă, 2-3 mese pe zi), somnul doar noaptea, ceasul comun.
- Capitolele 0-4, curtea cu grădina (8 culturi), pădurea, satul (joburi, misiuni, piață, florărie, tâmplărie), orașul (joburi, cursuri, bancă, apartament, mall), blocul cu scara.
- Bucătăria (14 rețete, minijoc), masa „Ce mâncăm?” cu farfuria.
- Sunetele (114, cu licențe), modul eco pentru baterie.
- Multiplayer:
  - vehiculul corect la partener;
  - invitații „Singur / Împreună” (autobuz, taxi, cinema, restaurant, roata mare);
  - prezența fără spam;
  - avertizare dacă celălalt are altă versiune.
- Salvarea: pe telefon, în cloud, export și import din fișier.
- Erorile nu mai opresc jocul și se văd în Meniu → 📋 Erori.
- Actualizarea instalează peste versiunea veche. Copia offline nu mai păstrează versiunea veche (v1.3.1).

**Ce s-a testat automat:** vezi [`tools/teste/README.md`](../tools/teste/README.md).
- Testele merg cu `mode=local`: două taburi care joacă împreună.
- **Firebase-ul adevărat nu se poate testa automat de aici**, doar pe două telefoane.

**Probleme știute / datorie tehnică:**
- Zonele împart aceeași scenă și aceleași liste globale (`FURNITURE`, `WALLS`, `w.furn`). Din cauza asta apar „scurgeri”, ca veioza care se vede în pădure. **De rezolvat în Pasul 2**, cu regiuni separate.
- Taraba (tabla de unire a produselor) e salvată doar pe telefonul celui care o folosește. Celălalt nu o vede și produsele nu se pot lua înapoi. **De rezolvat în Pasul 1c.**
- Clienții tarabei și cei ai florăriei sunt aceiași (aceeași listă de NPC). **De rezolvat în Pasul 1c.**
- Fișierul `world.ts` e prea mare și trebuie spart în module la lumea mare.
- Secretele Android de release nu sunt puse. E în regulă: cheia de test fixă merge.

## 6. Istoric scurt (detalii: `git log` și [`LOGICA_JOCULUI.md`](LOGICA_JOCULUI.md))

| Versiune | Ce a adus |
|---|---|
| 1.0.x | Joc complet până la oraș, builduri, Firebase inclus, logo la încărcare, orizontală blocată |
| 1.1.0 | Salvare sigură (cloud, export/import), program pentru instituții, taxi |
| 1.2.0–1.2.1 | Sunete reale peste tot, 14 rețete, compresor de sunet |
| 1.2.2–1.2.5 | Oboseală mai lentă, scos butonul de sărit capitolele, blocul și scara, vehicule la indicator, prețuri reale, lemnele limitate |
| 1.2.6–1.2.9 | Fără spam de prezență, cheie APK fixă, baterie, hărțile casei nu mai apar în oraș, taraba profitabilă |
| 1.3.0 | Multiplayer fără ciudățenii (invitații), animații noi (roata mare, cinema, masa, călușei, fântâna), rutina de seară variată |
| 1.3.1 | Copia offline ștearsă în aplicație, jurnal de erori, avertizare de versiune |

## 7. Direcția (stabilită cu proprietarul)

**Decizii luate:**
- **Rutina de seară = varianta A:** când vă culcați, un singur moment, „Noapte bună”, în care țineți amândoi apăsat pentru pupic, plus un bilețel opțional. Simplu.
- **Cina = varianta A:** fiecare alege ce vrea din meniu. Partenerul are mâncăruri **preferate marcate clar**; dacă i-o comanzi pe preferata lui, primești inimioare în plus. La final plătiți și aveți un moment scurt. **Nimic de ghicit.**
- **Lumea mare, legată, care crește prin voi.** Le îmbinăm pe toate:
  - **o singură hartă mare**: casa cu câmpuri în jur, pădurea, **râul cu podul rupt**, satul mare, drumul spre oraș, orașul cu cartiere;
  - **fără teleportări** între zone; interioarele (apartamentul, magazinele) rămân separate, cu ușă;
  - **hartă și minihartă**.
- **Vehicule semi-automate, nu GTA:**
  - mergi doar pe drumuri; alegi destinația pe hartă și vehiculul merge singur;
  - butoane: ▶ Pornește / ⏸ Oprește / ↩ Întoarce; la răscruci alegi direcția;
  - **bicicleta și scuterul rămân necesare**, pentru că lumea e mare;
  - **utilajele agricole** merg la fel, singure pe rânduri.
- **Capitolul Podul:** reparați podul dintre casă și sat (lemne, piatră, bani). Capitolele rămân și continuă.
- **Satul crește:** panou de proiecte la Primărie (podul, brutăria, școala, iluminatul, parcul, gara). Fiecare proiect aduce săteni, case, magazine și evenimente.
- **Ferma:**
  - cumperi parcele de câmp; arat, semănat, udat, recoltat, cu tractorul și utilaje cumpărate;
  - animale: găini, vacă, oi, albine; produsele merg în rețete și pe tarabă.
- **Angajații:**
  - angajezi săteni pentru câmp, animale, tarabă, florărie, lemne și utilaje;
  - au salariu pe zi, pricepere care crește și un raport de seară;
  - lucrează și când sunteți la oraș.
- **Orașul devine important:** magazinul vostru „Bubu & Dudu”, contracte cu restaurantele, livrări, târgul orașului.
- Mai târziu: **nunta**, **anotimpuri și sărbători** (iarnă cu zăpadă, Crăciun, Paște, târguri), evenimente.
- **Progresul actual se păstrează mereu.** De exemplu, cine a ajuns deja în sat are podul reparat.

**Ordinea de lucru** (câte o versiune pentru fiecare pas, **testată înainte**):
1. **Reparații:**
   - rutina de seară A, cina A;
   - sunete potrivite (chicoteli, bășini de desen animat), super-bășina refăcută;
   - **taraba comună** + **inventar complet** (iei / pui produse, pregătiți marfa dinainte);
   - **clienți separați** la tarabă și la florărie.
2. **Lumea mare:**
   - regiuni cu adevărat separate (fără „scurgeri”), drumuri, harta și miniharta;
   - satul și orașul mărite, păstrând clădirile de acum.
3. **Vehiculele semi-automate**, pe drumuri.
4. **Capitolul Podul** + proiectele satului.
5. **Ferma:** câmpuri, utilaje, animale.
6. **Angajații.**
7. **Orașul important:** magazinul vostru, contracte.
8. **Nunta, anotimpurile, evenimentele.**

Decizie implicită: satul și orașul de acum se **păstrează și se măresc** (nu se reproiectează de la zero). Pe jos, de acasă până în sat se fac **cam 45-60 de secunde**.

## 8. Reguli de lucru

- **Calitate înainte de toate.** Înainte de orice versiune:
  - compilare fără erori (`npx tsc --noEmit -p .`);
  - test automat cu capturi, cu **doi jucători** (`mode=local`) pentru tot ce ține de multiplayer;
  - verificat pe ecran de telefon pe orizontală (844×390), plus tabletă.
- **Genul gramatical corect** pentru Bubu (fată) și Dudu (băiat) în orice text.
- **Fără emoji pentru lucruri**: desenează iconița în [`icons.ts`](../src/ui/icons.ts).
- **Rețea:**
  - nu trimite date des fără rost (bateria);
  - Firebase nu acceptă câmpuri `undefined` (le curăță `clean()` în [`adapters.ts`](../src/net/adapters.ts)).
- **Salvarea:** câmpurile noi din `WorldState` trebuie să aibă valori implicite. Salvările vechi trebuie să meargă mai departe.
- **Sunete noi:** doar cu licență liberă, trecute în [`docs/SUNETE.md`](SUNETE.md) și în credite.
- **Securitate:**
  - nu pune parole, tokenuri sau cheia de release în repo;
  - proprietarul a expus odată un token GitHub într-o captură și i s-a spus să-l regenereze;
  - [`ci/debug.keystore`](../ci/debug.keystore) e doar cheia de test (publică, intenționat).
- **Commit-uri** în română, fără diacritice în mesaj, cu ce s-a schimbat pentru jucător.
