# Bubu & Dudu: predarea proiectului

Fișierul ăsta e pentru oricine (om sau AI) continuă proiectul: ce e jocul, cum e făcut, ce îi place și ce nu îi place proprietarului, ce merge, ce s-a testat și încotro mergem. **Citește-l tot înainte să schimbi ceva.**

Ultima actualizare: versiunea **1.5.0** (noiembrie 2026).

---

## 1. Ce e jocul

- Un joc **privat, pentru un cuplu**: **Bubu** e o panda (**fată**), **Dudu** e un urs maro deschis (**băiat**).
- Totul e în **română**, cu **genul gramatical corect** pentru fiecare: „obosit / obosită”, „l-ai invitat pe Dudu / ai invitat-o pe Bubu”. Pentru asta e funcția `g(id, masculin, feminin)` din [`src/game/gender.ts`](../src/game/gender.ts).
- Stil: **izometric 2.5D, drăguț**, desenat în cod pe Canvas, fără imagini.
- Se joacă **în doi online** (fiecare pe telefonul lui) sau **singur**, cu partenerul controlat de AI.
- Povestea are capitole:
  - casa → curtea → pădurea (tractoraș) → satul (bicicletă / scuter) → orașul (autobuz, joburi, apartament);
  - lumea mare e gata (1.4.0);
  - urmează ferma, afacerea de familie, casa cea mare, excursia, cererea în căsătorie, pregătirile și **nunta lor**, vezi secțiunea 7.
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
| [`src/engine/game.ts`](../src/engine/game.ts) | Bucla jocului (30/60 cadre pe secundă, modul eco pornit implicit), canvasul (cel mult ~2,2 milioane de pixeli), **calitatea adaptivă** (scade rezoluția singură dacă nu ține ritmul; `bd-quality`), rotirea ecranului |
| [`src/engine/sfx.ts`](../src/engine/sfx.ts) | Sunetele (înregistrări reale + sinteză de rezervă), buclele de ambianță |
| [`src/engine/soundscape.ts`](../src/engine/soundscape.ts) | Ce se aude în fiecare zonă și la fiecare activitate |
| [`src/engine/errors.ts`](../src/engine/errors.ts) | Jurnalul de erori: Meniu → 📋 Erori |
| [`src/scenes/world.ts`](../src/scenes/world.ts) | **Inima jocului** (~2100 de rânduri): lumea, personajele, activitățile, drumurile cu vehiculele (`startRide`), AI-ul partenerului, rețeaua, salvarea, butoanele de test (`devSkipChapter`, `setInfinite`) |
| [`src/scenes/render.ts`](../src/scenes/render.ts) | **Desenul lumii** (scos din `world.ts` în 1.5.0): podeaua „coaptă” cu tot ce nu se mișcă, apoi doar personajele/vehiculele și bucățile de obiecte aflate în fața lor |
| [`src/scenes/menu.ts`](../src/scenes/menu.ts) | Meniul (cine ești, cum jucați, codul casei, salvare în fișier, credite, erori, eco) |
| [`src/scenes/townctl.ts`](../src/scenes/townctl.ts) | Logica satului și a orașului: joburi, cursuri, magazine, bancă, misiuni, ziua nouă |
| [`src/game/state.ts`](../src/game/state.ts) | Starea lumii (`WorldState`), nevoile și cât de repede scad |
| [`src/game/activities.ts`](../src/game/activities.ts) | Toate activitățile (somn, baie, toaletă, gătit, tăiat lemne…) și efectele lor |
| [`src/game/economy.ts`](../src/game/economy.ts) | Inventarul, magazinele, prețurile (`PRICE`), obiectivele și capitolele |
| [`src/game/food.ts`](../src/game/food.ts) | Rețetele (14) și ingredientele |
| [`src/game/town.ts`](../src/game/town.ts) | Joburi, cursuri, săteni, bancă, apartament, mobilă |
| [`src/world/layout.ts`](../src/world/layout.ts) | **Harta lumii mari**: unde stă fiecare zonă (`ORIGIN`), regiunile, drumurile (`ROADS`, `MAIN_ROAD`), râul, lacul, podurile, opririle |
| [`src/world/map.ts`](../src/world/map.ts) | Casa, curtea și asamblarea lumii (`AREAS.world`); podeaua precalculată (`floorAt`); interioarele (`setArea('apartment')`) |
| [`src/world/country.ts`](../src/world/country.ts) | Câmpia: podeaua dintre zone, decorul generat (copaci, câmpuri, case, moara, lacul, podul, poarta pădurii, bariera), zidurile nevăzute, obstacolele pe capitole (`chapterBlocks`) |
| [`src/world/village.ts`](../src/world/village.ts), [`city.ts`](../src/world/city.ts), [`forest.ts`](../src/world/forest.ts) | Satul, orașul (+ cartierele, apartamentul), pădurea, puse în lume cu offset |
| [`src/world/nav.ts`](../src/world/nav.ts) | Navigarea (A* cu heap, obstacole indexate pe dale) |
| [`src/world/floor.ts`](../src/world/floor.ts), [`cull.ts`](../src/world/cull.ts), [`sprites.ts`](../src/world/sprites.ts) | Desenul rapid: podeaua pe bucăți de 512×256 în care se „coc” și obiectele statice (copaci, case, mobilă, pereți), doar obiectele de pe ecran, imagini gata desenate |
| [`src/world/signs.ts`](../src/world/signs.ts) | Indicatoarele de drum: panoul stă de-a lungul drumului, săgeata arată spre destinație (`E`/`W`/`N`/`S`) |
| [`src/ui/minimap.ts`](../src/ui/minimap.ts) | Miniharta (colțul din dreapta) și harta mare (de sus) |
| [`src/world/furniture.ts`](../src/world/furniture.ts) | Desenul obiectelor și al pereților |
| [`src/world/vehicles.ts`](../src/world/vehicles.ts) | Desenul vehiculelor (din lateral), scara blocului |
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
- Ideea lumii mari, legate, care crește prin voi (Pasul 2 e primul pas).
- Să vadă **capturi și video** după fiecare schimbare. Testele cu doi jucători.

**Nu îi place (de evitat):**
- **Bug după bug, animații slabe, sisteme proaste.** Vrea calitate: testezi bine, cu capturi, înainte să trimiți.
- **Animații simple sau lente fără rost.** Vrea animații bine lucrate, cu detalii, cu ritm (vezi 7.6).
- Obiecte care se încalecă sau stau prost:
  - patul „prin lampă”, copacul „în casă”, masa fără perete (reparate în 1.5.0);
  - indicatoarele greșite, băncile pe care stăteai în aer (reparate în 1.5.0).
- Să depindă totul de un singur personaj: și Dudu, și Bubu trebuie să aibă rolul lor.
- Să nu găsească ce a cerut: butoanele cerute trebuie să fie **la vedere**, nu ascunse într-o fereastră.
- **Emoji pentru lucruri**: totul se desenează. Dacă folosești un emoji nou, desenează-l în [`icons.ts`](../src/ui/icons.ts).
- Lucruri **complicate** fără rost:
  - rutina de seară cu multe etape i s-a părut ciudată și complicată;
  - cina la restaurant, unde trebuia să ghicești, n-a fost înțeleasă.
- Sunete care nu se potrivesc personajelor: râsul de om matur, bășina prea „reală”.
- Super-bășina: animația e slabă.
- Să fie **tras după celălalt** fără să vrea (autobuz, cinema). S-a rezolvat cu invitații în v1.3.0.
- **Hărțile care se încalecă** (rezolvat în v1.4.0: o singură lume, fiecare lucru la locul lui).
- **Lumea prea mică** și drumul ciudat pădure → casă → sat → oraș (rezolvat în v1.4.0: lumea mare, fără teleportări).
- „Vacanța” dintr-un meniu nu se simte reală.
- **Condus liber ca în GTA**: vehiculele trebuie să fie **semi-automate** (vezi secțiunea 7).
- Că, la un moment dat, **nu mai ai ce face**, și că la oraș trebuie să lași afacerile de la țară ca să te angajezi.
- Bateria consumată repede (s-a îmbunătățit în v1.2.8). Mesajele repetate („Bubu a intrat în joc”, rezolvat în v1.2.6).

## 5. Ce merge (verificat)

- Bucla zilnică: nevoile (o zi întreagă de muncă, 2-3 mese pe zi), somnul doar noaptea, ceasul comun.
- Capitolele 0-4, curtea cu grădina (8 culturi), pădurea, satul (joburi, misiuni, piață, florărie, tâmplărie), orașul (joburi, cursuri, bancă, apartament, mall), blocul cu scara.
- **Lumea mare (v1.4.0):** casa → câmpurile → lacul cu Podul Mare → satul → pârâul → orașul, pădurea în spatele curții; pe jos casă → sat ~52 s; vehiculele merg singure pe drum (bicicletă, scuter, tractor, autobuz, taxi) și rămân parcate unde le lași; miniharta + harta mare; partenerul AI „Vino cu mine” și se întoarce singur acasă; salvările vechi se mută automat în lume.
- Bucătăria (14 rețete, minijoc), masa „Ce mâncăm?” cu farfuria.
- Sunetele (114, cu licențe), modul eco pentru baterie.
- Multiplayer:
  - vehiculul corect la partener;
  - invitații „Singur / Împreună” (autobuz, taxi, cinema, restaurant, roata mare);
  - prezența fără spam;
  - avertizare dacă celălalt are altă versiune.
- Salvarea: pe telefon, în cloud, export și import din fișier.
- Erorile nu mai opresc jocul și se văd în Meniu → 📋 Erori.
- **1.5.0:**
  - jocul e mult mai rapid pe laptop;
  - butoanele de test (în 📜);
  - casa reparată vizual;
  - indicatoarele și băncile noi;
  - ieșirea automată dintr-un obstacol;
  - Dudu are rolul lui în Capitolul 1.
- Actualizarea instalează peste versiunea veche. Copia offline nu mai păstrează versiunea veche (v1.3.1).

**Ce s-a testat automat:** vezi [`tools/teste/README.md`](../tools/teste/README.md).
- Testele merg cu `mode=local`: două taburi care joacă împreună.
- **Firebase-ul adevărat nu se poate testa automat de aici**, doar pe două telefoane.

**Probleme știute / datorie tehnică:** vezi **7.1** (ce cere proprietarul acum) și **7.7** (datoria tehnică).
- Viteza (1.5.0, în testul fără placă video):
  - orașul e locul cel mai greu de desenat: ~25-30 ms pe cadru (era ~40);
  - casa: ~11 ms (era ~42);
  - calitatea adaptivă scade rezoluția dacă tot nu ține ritmul.

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
| 1.3.2 | **Pasul 1 gata:** rutina de seară simplă (A), cina clară (A), chicoteli și bășini de desen animat, super-bășina refăcută, taraba comună + inventar complet, clienți separați la florărie |
| 1.4.0 | **Pasul 2: lumea mare** — o singură lume legată, vehiculele merg pe drum, harta și miniharta, satul și orașul mărite, câmpuri, lac, Podul Mare, partenerul AI te poate însoți |
| 1.4.1 | Ferestrele (inventar, hartă, magazine) stau deasupra butoanelor de jos pe ecranele mici; mesajele se văd și peste ferestre |
| 1.4.2 | Multiplayer: vehiculul mutat de partener (scuterul în sat, tractorul în pădure) se vede corect și pe celălalt telefon |
| 1.5.0 | **Viteză pe laptop** (lumea „coaptă” în podea, rezoluție adaptivă, eco implicit, placa video forțată în aplicația Windows); butoanele de test „Capitolul următor” și „Resurse infinite” (în fereastra cu obiective); soba fără horn (părea o lampă prin pat), laptopul lângă perete, copacul și piatra mutate din spatele casei, mașină de tuns iarba în loc de magazie; indicatoare orientate corect; bănci noi, pe care vă așezați amândoi; personajul prins într-un obstacol iese singur; **Dudu are rolul lui din Capitolul 1** (vinde lemne la cherestea cu 3 lei bucata, obiective marcate Dudu/Bubu); partenerul AI nu mai rămâne blocat dansând după un capitol nou |

## 7. Direcția și tot ce mai e de făcut

Legendă: ✅ gata (nu se mai face o dată) · 🟡 făcut pe jumătate (scrie ce lipsește) · ⬜ de făcut.

### 7.1 Ce cere proprietarul chiar acum (prioritate maximă)

- ⬜ **Butonul ⏭ „Capitolul următor” la vedere, în joc.** În 1.5.0 e doar în fereastra cu obiective (📜), iar proprietarul nu l-a găsit. Pune-l înapoi lângă ⚙, în cartonașul partenerului, ca înainte. Codul vechi e în commit-ul `0098673`: `<button class="mini-btn" data-a="skipch">⏭</button>` → `s.devSkipChapter()`. Pune lângă el și ♾️ (resurse infinite, `s.setInfinite`). Confirmarea se face cu fereastra jocului, nu cu `confirm()`.
- ⬜ **Testul pe laptopul EliteBook** (Windows). Proprietarul a spus că 1.4.x mergea „mai greu ca GTA 5”, iar 1.5.0 e mult mai rapid în teste. Întreabă-l cum merge acum. Dacă tot e greu, vezi 7.5.

### 7.2 Decizii luate (nu se mai discută)

- ✅ **Rutina de seară = varianta A** (1.3.2): un singur moment, „Noapte bună”, în care țineți amândoi apăsat pentru pupic, plus un bilețel opțional.
- ✅ **Cina = varianta A** (1.3.2): fiecare alege din meniu; preferatele partenerului sunt marcate clar; **nimic de ghicit**.
- ✅ **O singură lume mare, legată, fără teleportări** (1.4.0); interioarele (apartamentul, magazinele) rămân separate, cu ușă; hartă și minihartă.
- **Vehicule semi-automate, nu GTA:** merg doar pe drumuri, singure.
- **Bicicleta și scuterul rămân necesare**, pentru că lumea e mare.
- **Fiecare personaj are rolul lui în fiecare capitol.** Nimic nu trebuie să depindă doar de unul. Rolurile sunt etichete (`who` pe obiectiv): o poate face oricare, dar fiecare are treaba lui și câștigul lui. Început în 1.5.0, cu Dudu în Capitolul 1.
- **Progresul se păstrează mereu.** Salvările vechi merg mai departe (de exemplu, cine e deja în sat are podul reparat).
- Satul și orașul se **păstrează și se măresc**, nu se refac de la zero. Pe jos, de acasă până în sat se fac ~45-60 de secunde.

### 7.3 Ce e gata (pe scurt, ca să nu se refacă)

- ✅ **Capitolele 0-4:** căsuța → curtea → pădurea (tractoraș) → satul (bicicletă / scuter) → orașul (autobuz, joburi, diplome, apartament, mall).
- ✅ **Lumea mare** (1.4.0): câmpuri, lac, Podul Mare, pârâul, regiuni, drumuri, opriri; partenerul AI „Vino cu mine”.
- ✅ **Vehiculele:**
  - bicicletă, scuter, tractor, autobuz și taxi merg singure pe drum și rămân parcate unde le lași (1.4.0);
  - partenerul vede vehiculul corect (1.4.2).
- ✅ **Grădina** (8 culturi, udat, îngrășământ), fântâna, iarba care crește și se tunde, lemnele (limitate), cheresteaua.
- ✅ **Taraba comună** + inventarul complet; florăria lui Bubu și tâmplăria lui Dudu (cumpărate de la Primărie); piața; misiunile sătenilor; prieteniile.
- ✅ **Gătitul:** 14 rețete românești cu minijoc; masa „Ce mâncăm?” cu farfuria.
- ✅ **Sunetele** (114, cu licențe), ambianțele pe regiuni, modul eco.
- ✅ **Multiplayer:** invitații „Singur / Împreună”, prezența fără spam, avertizare de versiune diferită.
- ✅ **Salvarea:** pe telefon, în cloud, export și import; jurnalul de erori.
- ✅ **Viteza** (1.5.0): lumea „coaptă”, rezoluție adaptivă, eco implicit, placa video în aplicația de Windows.
- ✅ **Reparațiile din 1.5.0:**
  - soba fără horn, laptopul lângă perete, spatele casei închis;
  - mașina de tuns iarba în loc de magazie;
  - indicatoarele orientate corect;
  - băncile pe care vă așezați amândoi;
  - ieșirea automată dintr-un obstacol;
  - AI-ul nu mai rămâne blocat dansând.
- ✅ **Butoanele de test** „Capitolul următor” și „Resurse infinite” (în 📜). De pus și la vedere, vezi 7.1.
- ✅ **Rolul lui Dudu în Capitolul 1:**
  - vinde lemne la cherestea cu 3 lei bucata;
  - obiectivele sunt marcate Dudu / Bubu.

### 7.4 Capitolele până la nuntă

Fiecare capitol are:
- 7-10 obiective, cu **rol pentru Bubu și rol pentru Dudu**;
- un text de final (`done`) și ce deblochează;
- **o animație mare, bine lucrată, la final**;
- teste cu doi jucători.

Capitolele se adaugă în `CHAPTERS` din [`src/game/economy.ts`](../src/game/economy.ts), în continuare de la `id: 5`. Textul de final al Capitolului 4 („V-ați mutat la oraș! Povestea continuă…”) se schimbă, pentru că povestea nu se mută la oraș pentru totdeauna: **afacerile de la țară rămân** (proprietarului nu-i place să le lase pentru un job la oraș).

Ce e mai jos e **planul propus**. Detaliile personale (vezi 7.4.1) se confirmă cu proprietarul înainte de capitolele 9-11.

| Cap. | Titlu | Bubu | Dudu | Deblochează / final |
|---|---|---|---|---|
| 0-4 | ✅ Căsuța, Curtea, Pădurea, Satul, Orașul | | | gata |
| 5 | **Ferma noastră** ⬜ | albinele (miere), găinile (ouă), grădina mare, brânza din laptele vacii | parcelele de câmp: arat, semănat și recoltat cu tractorul și utilaje cumpărate; vaca și oile; fânul | produsele merg în rețete și pe tarabă; finalul: prima recoltă mare, cu sătenii la seceriș |
| 6 | **Afacerea de familie** ⬜ | magazinul „Bubu & Dudu” din oraș (flori, prăjituri, produse de la fermă), vitrina | angajații de la fermă și de la tâmplărie, duba de livrări, contractele cu restaurantele | angajații lucrează și când sunteți la oraș; raport de seară; finalul: târgul orașului, cu standul vostru |
| 7 | **Casa cea mare** ⬜ | planul camerelor, culorile, decorul, grădina de flori | construcția (lemne, piatră, cherestea, meșteri din sat), mobila de la tâmplărie | casa visurilor lângă lac sau casa voastră mărită (camere noi, verandă); un animal de companie (pisică sau cățel); Primăria are deja butonul „Casa cea mare — în curând” |
| 8 | **Excursia** ⬜ | bagajele, pozele, suvenirurile | biletele de tren de la gară, traseul | **o zonă nouă, reală** (munte sau mare), cu trenul de la gara orașului (`c-gara` spune acum „mai târziu în poveste”). Nu o „vacanță” dintr-un meniu: proprietarului nu-i place asta |
| 9 | **Cererea în căsătorie** ⬜ | ziua ei obișnuită și invitația la „o plimbare”; pregătirile lui Dudu **nu se văd** pe ecranul lui Bubu (nici în obiective, nici pe hartă) | inelul de la bijutierul din oraș, alegerea locului, decorul surpriză (lumânări, petale, muzică), emoțiile | **animația cererii**: Dudu în genunchi, cutiuța, „Vrei să fii soția mea?”, Bubu spune DA, pupic, artificii. Se joacă la amândoi deodată |
| 10 | **Pregătirile de nuntă** ⬜ | rochia de mireasă (croitoria satului + buticul elegant), buchetul din florăria ei, tortul | costumul, verighetele, lăutarii, cortul și mesele din curte | invitațiile (sătenii cu care v-ați împrietenit vin la nuntă), nașii, bugetul strâns din afaceri, lista de bifat |
| 11 | **Nunta noastră** ⬜ | mireasa: intrarea cu buchetul, dansul mirilor, aruncatul buchetului | mirele: o așteaptă la altar, toastul, o „răscumpără” la furatul miresei | **ziua nunții**: cununia la biserica din sat (`w-church` există deja), ieșirea cu petale, poza de grup, petrecerea (hora, dansul mirilor, tortul, aruncatul buchetului, „furatul miresei”), artificii; la final, genericul cu momentele voastre din jurnal; apoi jocul continuă („Proaspăt căsătoriți”, luna de miere) |

#### 7.4.1 De întrebat proprietarul (înainte de capitolele 9-11)

Sunt detalii personale. Întreabă-l pe proprietar și pune-le doar în joc, nu în documentație (repo-ul se poate vedea de alții).
- data nunții reale (poate apărea în joc);
- locul cererii (dacă există unul real), culorile, melodia;
- cum arată rochia și costumul;
- numele nașilor și ale prietenilor care să apară ca săteni.

### 7.5 Sisteme pentru tot jocul

**Vehiculele:**
- ✅ merg singure pe drum (1.4.0);
- ⬜ butoanele ⏸ Oprește / ▶ Pornește / ↩ Întoarce;
- ⬜ alegerea direcției la răscruci;
- ⬜ destinația aleasă pe harta mare;
- ⬜ utilajele agricole merg singure pe rânduri (Capitolul 5).

**Podul:**
- 🟡 în Capitolul 2, Podul Mare îl repară sătenii singuri, la final;
- ⬜ pentru jocurile noi: un obiectiv „Duceți lemne și piatră la Podul Mare” (lemne, piatră, bani);
- salvările care au trecut de Capitolul 2 rămân cu podul reparat.

**Proiectele satului:**
- 🟡 Primăria vinde azi florăria și tâmplăria;
- ⬜ panoul cu proiecte: iluminatul, parcul mărit, gara cu trenul, drumul asfaltat, terenul de joacă;
- ⬜ fiecare proiect aduce săteni, case și evenimente.

**Anotimpurile și sărbătorile** ⬜:
- primăvară, vară, toamnă, **iarnă cu zăpadă** (omul de zăpadă există deja în construcție);
- sărbătorile: Mărțișorul (1 martie), Dragobetele (24 februarie), Paștele (ouă vopsite), Crăciunul (brad, colinde, cadouri, sanie), Revelionul (artificii);
- zilele voastre: zilele de naștere și aniversarea cuplului (de întrebat datele);
- evenimentele satului: hramul, târgul, nunțile sătenilor.

**„Nu mai ai ce face”** ⬜:
- o listă de treburi pe zi pentru fiecare;
- cereri noi de la săteni;
- evenimente care apar singure, ca să existe mereu ceva de făcut în doi.

**Viteza** (✅ 1.5.0; ⬜ dacă tot e greu pe laptop):
- imaginile gata desenate pentru trecători (acum se desenează de la zero la fiecare cadru);
- măști de transparență pentru obiectele care se redesenează peste personaje;
- mai puțini trecători când calitatea scade singură.

### 7.6 Animațiile: cum trebuie să fie

**Proprietarul vrea animații bine lucrate, cu detalii, și nu lente fără rost.** Asta e regulă pentru tot ce se adaugă și pentru ce se repară.

- **Detalii, nu o poză care se clatină:**
  - se mișcă tot corpul: capul, urechile, mâinile, picioarele, burtica;
  - fața are expresie (ochi, gură, obraji);
  - obiectul de lucru se mișcă și el: toporul lovește, așchiile sar, aburul iese din oală, mașina de tuns e împinsă prin iarbă și iarba tunsă rămâne în urmă;
  - sunetul pică exact pe mișcare.
- **Ritm bun:**
  - o treabă obișnuită ține 1-3 secunde;
  - o animație nu se lungește ca să pară mai mult;
  - momentele mari (cererea, nunta, finalul unui capitol) pot fi mai lungi, dar în fiecare secundă se întâmplă ceva;
  - după prima vizionare se pot sări (atinge ca să treci mai departe).
- **Corect în spațiu:**
  - personajul stă **pe** obiect (bancă, canapea, pat), la înălțimea lui, cu fața spre jucător sau spre partener;
  - niciodată în aer, prin obiecte sau cu spatele la ce face;
  - obiectele nu se încalecă (vezi lampa, adică hornul sobei, din 1.5.0).
- **În doi:** animațiile de cuplu (pupic, îmbrățișare, dans, cererea) pornesc deodată pe ambele telefoane, printr-un eveniment de rețea.
- **Verificare înainte de release:** capturi cadru cu cadru (6-8 cadre din animație), de aproape, plus un video scurt trimis proprietarului.
- **De refăcut acum:**
  - ⬜ tunsul ierbii: azi personajul „freacă” pe loc (`act_scrub`) lângă mașina care stă; trebuie să împingă mașina prin curte;
  - ⬜ super-bășina: proprietarul a zis că e slabă; a fost refăcută în 1.3.2, întreabă-l dacă acum îi place;
  - ⬜ activitățile care folosesc o animație generală (`act_scrub` la tuns și curățenie, `flex` la vânzarea lemnelor): fiecare primește mișcarea ei.

### 7.7 Datorie tehnică

- ⬜ `world.ts` (~2100 de rânduri): desenul e scos deja în `render.ts`; de scos și drumurile cu vehiculele și AI-ul partenerului.
- ⬜ `tools/teste/cook_test.cjs` e depășit (atingerea ingredientelor).
- ⬜ Secretele Android de release nu sunt puse (cheia de test fixă merge; **nu schimba cheia**).
- ⬜ Firebase-ul adevărat se testează doar pe două telefoane, nu automat.
- ⬜ GitHub Actions: `actions/upload-artifact@v4` avertizează că folosește Node 20; de urmărit o versiune nouă.

### 7.8 Ordinea de lucru

Câte o versiune pentru fiecare pas, **testată înainte** (vezi secțiunea 8):
1. ✅ Reparații (1.3.2).
2. ✅ Lumea mare (1.4.0-1.4.2).
3. ✅ Viteză pe laptop + reparații vizuale + rolul lui Dudu în Capitolul 1 (1.5.0).
4. ⬜ **Butonul ⏭ la vedere** (7.1) + tunsul ierbii cu mașina împinsă (7.6). O versiune mică, imediat.
5. ⬜ Rolurile lui Bubu și ale lui Dudu în toate capitolele 0-4 (etichete și câștig propriu pentru fiecare) + Podul pentru jocurile noi.
6. ⬜ Vehiculele: ⏸ / ▶ / ↩, răscruci, destinația pe hartă.
7. ⬜ Capitolul 5 · Ferma noastră.
8. ⬜ Capitolul 6 · Afacerea de familie (angajații, magazinul, contractele).
9. ⬜ Capitolul 7 · Casa cea mare.
10. ⬜ Anotimpurile și sărbătorile.
11. ⬜ Capitolul 8 · Excursia (trenul și zona nouă).
12. ⬜ Capitolul 9 · Cererea în căsătorie (după întrebările din 7.4.1).
13. ⬜ Capitolul 10 · Pregătirile de nuntă.
14. ⬜ Capitolul 11 · Nunta noastră, cu genericul.

## 8. Reguli de lucru

- **Calitate înainte de toate.** Înainte de orice versiune:
  - compilare fără erori (`npx tsc --noEmit -p .`);
  - test automat cu capturi, cu **doi jucători** (`mode=local`) pentru tot ce ține de multiplayer;
  - verificat pe ecran de telefon pe orizontală (844×390), plus tabletă.
- **Animațiile:** după regulile din 7.6. Detalii, ritm, corecte în spațiu, verificate cadru cu cadru.
- **Fiecare capitol are roluri pentru amândoi** (eticheta `who` pe obiectiv) și se poate juca și singur, cu partenerul AI care își face rolul.
- **Când termini ceva**, marchează-l cu ✅ în secțiunea 7 (cu versiunea), ca să nu se mai facă o dată.
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
