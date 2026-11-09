# Bubu & Dudu: predarea proiectului

Fișierul ăsta e pentru oricine (om sau AI) continuă proiectul: ce e jocul, cum e făcut, ce îi place și ce nu îi place proprietarului, ce merge, ce s-a testat și încotro mergem. **Citește-l tot înainte să schimbi ceva.**

Ultima actualizare: versiunea **1.10.1** (noiembrie 2026).

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
  - **casele (1.6.0):** fiecare cuplu are o casă cu **cod unic + parolă** ([`src/net/house.ts`](../src/net/house.ts), [`docs/FIREBASE.md`](FIREBASE.md)); online se joacă doar într-o astfel de casă;
  - ⚠️ **regulile Firebase** din [`database.rules.json`](../database.rules.json) trebuie puse o dată în consola Firebase (le pune proprietarul; din mediul de lucru nu se poate);
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
| [`src/net/house.ts`](../src/net/house.ts) | Casele cu cod unic + parolă (SHA-256 pe telefon, rezervarea codului în Firebase / pe server) |
| [`src/minigames/sawmill.ts`](../src/minigames/sawmill.ts) | Cheresteaua lui Nea Vasile: cântarul, comenzile zilei, gaterul (scânduri) |
| [`src/game/state.ts`](../src/game/state.ts) | Starea lumii (`WorldState`), nevoile și cât de repede scad |
| [`src/game/activities.ts`](../src/game/activities.ts) | Toate activitățile (somn, baie, toaletă, gătit, tăiat lemne…) și efectele lor |
| [`src/game/economy.ts`](../src/game/economy.ts) | Inventarul, magazinele, prețurile (`PRICE`), obiectivele și capitolele |
| [`src/game/food.ts`](../src/game/food.ts) | Rețetele (14) și ingredientele |
| [`src/game/town.ts`](../src/game/town.ts) | Joburi, cursuri, săteni, bancă, apartament, mobilă |
| [`src/world/layout.ts`](../src/world/layout.ts) | **Harta lumii mari**: unde stă fiecare zonă (`ORIGIN`), regiunile, drumurile (`ROADS`, `MAIN_ROAD`), râul, lacul, podurile, opririle |
| [`src/world/map.ts`](../src/world/map.ts) | Casa, curtea și asamblarea lumii (`AREAS.world`); podeaua precalculată (`floorAt`); interioarele (`setArea('apartment')`) |
| [`src/world/country.ts`](../src/world/country.ts) | Câmpia: podeaua dintre zone, decorul generat (copaci, câmpuri, case, moara, lacul, podul, poarta pădurii, bariera), zidurile nevăzute, obstacolele pe capitole (`chapterBlocks`) |
| [`src/world/village.ts`](../src/world/village.ts), [`city.ts`](../src/world/city.ts), [`forest.ts`](../src/world/forest.ts) | Satul și orașul (din 1.6.0 în coordonate de lume, pe rețea de ulițe / bulevarde: `V`, `CITY_STREETS`), apartamentul, pădurea |
| [`src/world/houses.ts`](../src/world/houses.ts) | Casele de locuit (vecinii, sătenii); le desenează `country.ts` |
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
| 1.7.1 | **Audit vizual complet** (scripturile `audit_*` din `tools/teste`): meniul cu emote-uri nu mai rămâne deschis sub ferestre și nu mai e acoperit de minihartă / tăiat sus; ferestrele care vin singure (raportul, capitolul nou) așteaptă să termini minijocul; numele zonei nu mai intră peste ceas; mesajele din minijocuri stau sus; harta mare fără etichete încălecate (un singur nume când sunteți împreună); sperietoarea, casa „Livada Mariei”, un gard, indicatorul din sat și o bancă din parc mutate de unde se suprapuneau / erau ascunse; Nea Vasile nu mai stă peste cântar |
| 1.8.0 | **Echilibrarea economiei** (după testul de joc cu diagrama): 8 bolovani în pădure (piatra nu mai e gâtuire); Dudu câștigă mai mult (cheresteaua cumpără 25 de lemne/zi, 3-5 lei + 2 lei Dudu, scânduri 12 lei, comenzi mai bine plătite; tâmplăria plătește ~65% mai mult, +30% Dudu); florăria are clienți la 9-18 s, dar buchetele costă ~5 ori mai puțin; oamenii de muncă se angajează din Capitolul 1, și de la cherestea (butonul „Angajează ajutoare”); meserii noi: spărgător de piatră, căruțaș (vinde lemnele la cherestea), vânzător la tâmplărie, culegător de flori; candidații zilei sunt doar meserii care au de lucru. Joc întreg: ~3,2 ore eficient, ~5,8 ore relaxat |
| 1.8.1 | **Pregătit pentru testarea de lansare:** butoanele de test (⏭ capitolul următor, ♾️ resurse infinite, modul „2 tab-uri”) nu mai apar în joc; apar doar cu `?dev` în adresă (testele automate îl pun singure). Resursele infinite pornite pe un telefon se opresc singure fără `?dev` |
| 1.8.2 | **Casa din Capitolul 0 nu mai e „o poză”:** mobila casei era desenată o dată și ținută în memorie fără starea ei, așa că toaleta / cada / frigiderul / vasele rămâneau murdare după ce le curățai și lampa nu se aprindea (obiectivele se bifau totuși). Acum imaginile se refac la fiecare schimbare (și în Capitolul 0), iar mizeria e desenată vie (aburii se mișcă); la fel televizorul pornit și aragazul. Test: `tools/teste/casa_cap0.cjs` |
| 1.8.3 | **Fără pâlpâit în casă:** ordinea de desen (cine e în față) era un `sort` cu o comparație netranzitivă, așa că patul / lampa / pereții / mașina de spălat / ghivecele își schimbau ordinea când te mișcai. Acum: o ordine topologică doar între obiectele care se acoperă pe ecran; peretele subțire se compară cu partea din care e centrul celuilalt; obiectele pe diagonală nu se constrâng. „Purecii” televizorului stricat se mișcă. Test: `tools/teste/adancime_casa.cjs` (Dudu plimbat în ~940 de poziții, Capitolul 0 și 1) |
| 1.8.4 | **Apartamentul, cu adevărat:** pianul, acvariul, espressorul și consola de la mall erau butoane care nu făceau nimic (acțiunile `a-…` nu ajungeau nicăieri). Acum sunt activități ca restul casei: mergi la obiect, animație (cânți pe taburet cu note și melodie, presari mâncare și peștii vin la geam, faci cafeaua și o bei din ceașcă, jucați pe canapea și televizorul arată jocul), partenerul AI vine la pian și la consolă. Cafeaua: una pe zi. Televizorul din apartament are starea lui (nu se strică odată cu cel de acasă) și arată un desen animat. Espressorul stă pe un dulap de bucătărie; perete cu ușă între baie și bucătărie; apartament „de lux”: parchet, marmură, mochetă, lambriu cu brâu auriu, ferestre mari spre oraș cu draperii. Test: `tools/teste/apartament.cjs` |
| 1.8.5 | **Bucătăriile și lucrurile „intrate” unele în altele:** frigiderul, aragazul și blatul stăteau în coloană lângă peretele din față (ușa frigiderului dădea în aragaz, totul cu spatele la noi). Acum sunt în linie pe peretele din spatele bucătăriei, cu fața spre cameră (casa: pe peretele cu baia, y = 6; apartamentul: perete plin între baie și bucătărie, y = 8, cu espressorul pe dulapul lui). Curtea aerisită: copacii mutați din fața fântânii, a mașinii de spălat, a pietrelor și a tufei. Pe toată harta, la construirea lumii (`declutter` în `map.ts`), se scot copacii de decor care ar acoperi o piatră / bancă / felinar / stație / fântână și copacii din pădure ascunși aproape de tot după alt copac. Teste: `tools/teste/aglomerare.cjs` (acoperire pixel cu pixel între obiecte vecine), `tools/teste/adancime_lume.cjs` (Dudu pus în jurul fiecărui obiect de pe hartă: de partea bună) |
| 1.9.0 | **Angajații chiar ajută, peste zi:** tăietorul, spărgătorul, culegătoarea, florăreasa și vânzătorul de la tarabă produc ora de ora între 8 și 18 (`Story.staffHour`, apelat din tick-ul de economie pe gazdă; aceeași cantitate pe zi ca înainte, `acc` adună fracțiunile), cu „+1 🪵” deasupra lor; raportul de dimineață spune ce au făcut ieri. Grădinarul udă răzoarele ora de oră (înainte uda doar dimineața și apa ținea 3 ore). Îngrijitorul strânge de la animale când e gata. În curte stau lângă obiectul lor (copac, piatră, flori, răzoare), lucrează 7–13 s cu animație (`act_chop` cu fața spre noi, `act_garden`, `act_water`), apoi trec la următorul. Test: `tools/teste/angajati_zi.cjs` |
| 1.9.1 | **Angajații muncesc la vedere:** fiecare angajat are o listă de pași (`staffPlan` / `updateStaff` în world.ts: mergi pe drum ocolind obiectele, lucrează cu animație, trece mai departe) și lucrează și când nu-l vezi. Tăietorul merge în pădure (din Capitolul 2; înainte, copacii din curte), caută 3 copaci apropiați, îi taie cu toporul (`act_chop` cu `axe`), apoi cară brațul de lemne la stiva de acasă (`act_haul_logs`). Spărgătorul la fel cu târnăcopul (`act_mine`) și coșul cu pietre. Căruțașul duce lemne de acasă la cherestea. Vânzătorul de la tarabă deschide taraba la 8 și servește el clienții care vin (`stallStaff` în `updateNpcs`, ia un sfert); banii tarabei vin doar din clienții serviți. Producția pe zi e mai mare (lemne 8+3·pricepere, piatră 5+2·p, flori 8+3·p); „+n” apare când termină copacul / piatra. Autobuzul din sat merge la oraș abia din Capitolul 6 (drumul deschis), ca și scuterul. Teste: `angajati_munca.cjs`, `autobuz_oras.cjs` |
| 1.9.2 | **Casa nu se găsea la partener:** fereastra „Casa voastră” apare și în modul Solo; acolo casa se făcea doar pe telefon (codul nu ajungea pe internet), iar „Intrăm în joc” intra tot în Solo, deci partenerul primea „Nu există nicio casă”. Acum (menu.ts: `houseNet` / `useMode`) din Solo casa se face online (Firebase), iar după ce ați făcut / găsit casa jocul trece pe modul în care e casa. La „Intră la partener”, dacă nu e pe Firebase, o caută și pe serverul nostru (S10), și invers. Test: `casa_conectare.cjs` (cu `PORT=8799 node server/server.mjs` dintr-o copie) |
| 1.9.3 | **„Bubu are o versiune mai veche” (fals) și erori `e.map`:** telefonul se conecta la casă înainte să fie gata lumea; ce trimitea partenerul atunci (versiunea, cererea de sincronizare, „e aici”) se pierdea (Firebase șterge evenimentul după ce l-a dat). Acum adaptorul (`Base` în net/adapters.ts) le ține într-o coadă până când lumea pune `onEvent` / `onPresence` (la sfârșitul `enter`); la `ver` se răspunde o dată, iar avertismentul vine abia după 25 s. Firebase nu păstrează listele / obiectele goale și `null`: lista goală de clienți (`npcs`) venea fără câmp și crăpa telefonul care nu e gazdă (`e.map`); la fel `plots`, `plot: null`, `town` gol — acum sunt tratate. X-ul minijocurilor are zona de apăsare mai mare. Teste: `versiune_partener.cjs`, `taraba_x.cjs` |
| 1.9.4 | **iPhone: iconița și versiunea.** Proiectul iOS e generat în CI cu `npx cap add ios`, care pune iconița goală a șablonului și versiunea 1.0 (1); de aceea iPhone-ul n-avea iconița jocului, iar Sideloadly / AltStore cereau versiunea de mână. Acum `ci/ios_patch.py` pune versiunea din `package.json` (CFBundleShortVersionString, iar build-ul = același număr ca versionCode pe Android) și numele „Bubu & Dudu”, și înlocuiește iconița cu `ci/ios-icon-1024.png` (Bubu și Dudu, 1024×1024, fără transparență). CI verifică după build că versiunea și iconița sunt în aplicație (altfel pică) |
| 1.9.5 | **Jocul se deschide ca un joc, nu ca o pagină.** Android: `ci/android_patch.py` rescrie `MainActivity` (ecran complet imersiv: barele sistemului ascunse, apar doar trăgând de la margine și se ascund singure; jocul intră și în zona camerei); înainte bara cu butoanele telefonului rămânea peste joc și acoperea butoane. iOS: `ci/ios_patch.py` pune ecranul jocului pe `BubuViewController` (bara home se ascunde, gesturile de la margini sunt amânate, fără bara de stare, WebView fără scroll / bounce / previzualizare de linkuri); `capacitor.config.json` → `ios.scrollEnabled: false`. Peste tot: fără selecție de text, lupă și meniul „Copiază” la apăsare lungă (`-webkit-user-select`, `-webkit-touch-callout`, `contextmenu` / `selectstart` / `gesture*` oprite, `touchstart` pe canvas oprit — jocul folosește pointer events); în câmpurile de scris se poate selecta în continuare. Test: `ca_un_joc.cjs` |
| 1.9.6 | **Ferma nu se găsea:** indicatorul de la poarta fermei (`st-farmgate`, lângă gardul curții, spre dreapta) se desena ca orice `signpost`, cu „🏘️ Spre sat”. Acum scrie „🐔 Ferma voastră”, cu săgeata spre fermă; indiciul obiectivului „Luați găini” spune unde e |
| 1.9.7 | **Podul nu primea ciorba:** „porții de mâncare caldă” număra doar `meals` (mâncarea gata cumpărată), nu mâncărurile gătite (`dish_ciorba`, `dish_sarmale`...). Acum `hotMealKeys` (food.ts) pune la socoteală și tot ce e gătit cald (fără salată/limonadă), la pod și la cererile sătenilor care vor mâncare |
| 1.9.8 | **Jucătorii noi nu găseau locurile; evenimentele se vedeau doar dimineața:** harta mare are „📍 Unde e?” (`PLACES` în hud.ts: cheresteaua/scândurile, ferma, pădurea, Podul Mare) cu ce faci acolo, de la ce capitol și „🚶 Du-mă” (`walkToPlace`); pe hartă apar „Ferma” și „Cheresteaua (scânduri)”. „Ziua X 📅” de sus se apasă oricând (`openDay`): evenimentele de azi, de făcut azi, raportul de dimineață al zilei, ce urmează în 10 zile |
| 1.9.9 | **Angajații muncesc de-adevăratelea, pas cu pas, cu resursele voastre** (nu mai „produc din tabel” pe ore): fiecare pas din `staffPlan` (world.ts) are `fx`/`tid`, iar când îl termină `Story.staffWork` aplică rezultatul real pe loc. Tăietorul: fiecare copac = lemne; spărgătorul: pietre; culegătorul: flori; grădinarul plantează din semințele voastre, udă (de la fântână) și culege, și vă cere semințe când n-are (`staffNote`, o dată pe zi); îngrijitorul trece pe la animalele care au dat ceva; vânzătorul de la tarabă vine dimineața, deschide taraba când ajunge și servește clienții din inventar (`orderCost` în merge.ts: produsul gata sau 2^nivel bucăți din sursă), toți banii intră pe loc; căruțașul vinde lemne la cherestea pe drum; tâmplarul 4 lemne → scăunel; florarul 3 flori → buchet; tractoristul ară/seamănă/udă/recoltează cu utilajele voastre; magazinul vinde de pe rafturi. Raportul de dimineață: ce a făcut fiecare ieri (`Staff.got`). **Moara satului** (`w-mill`, lângă câmpuri, din Cap. 5): cerealele se vând angro fără limită (grâu 5, porumb 6, floarea-soarelui 8 lei) și se macină 1 la 1 în făină / mălai (`openMill`). Gardurile câmpurilor nu mai ies în culoarele dintre parcele (te opreai în ele) |
| 1.10.0 | **Anotimpurile pe toată lumea** (`world/seasonlook.ts`, setat în `render.ts` din ziua jocului, cheia imaginilor coapte include anotimpul): primăvara verde crud și flori prin iarbă, toamna copaci arămii și frunze căzute pe jos, iarna zăpadă pe jos, pe copaci, pe brazi (pe fiecare etaj), peste flori (movilițe) și peste răzoare; apa mai pală. **Furtuna se vede și se aude** (`drawStorm` + `lightning` în `season.ts`, `stormLevel` în story.ts: cer întunecat, ploaie piezișă, fulgere cu trăsnet, tunete sintetizate, frunzele zboară); **acoperișul reparat dispare pe loc** (op `furn roofBroken` → `syncPlaced`, cheia `storyKey` are `R`). **Harta mare**: butonul „🗺️ Harta” lângă miniharta; toate clădirile (iconițe; numele când mărești, fără să se încalece), ＋/－/📍, tras cu degetul, două degete, rotița; atingi o clădire → „🚶 Du-mă” (`walkToFurn`, `reachWhyAt`). **Pădurea pe parcele** (`FOREST_CORE`, `FOREST_LOTS` în story.ts): gărdulețul vostru (bucăți de 1 dală, `forestBlocks` în `worldBlocks` / `blockKey`), 3 parcele de cumpărat (apus 500, răsărit 500, sus 700 lei; tăblițe „De vânzare”), pe fiecare 14 copaci, bolovani, ciuperci, mure; angajații lucrează și acolo. **Vânzătorul de la tarabă** deschide și când ești departe / în apartament, cumpără singur făina / lămâile lipsă doar dacă iese câștig (`orderShortfall`, `BUYABLE`), altfel îți cere marfa pe ecran. **Rutina de seară**: X-ul se trimite partenerului (`quit`), iar orele sărite de ceasul gazdei îți refac energia (`applyLocal` clock) — nu te mai trezești obosit. **Mulsul** și alte animații de lucru scurte se opresc singure (`brief`). **Scuterul parcat** la cherestea / lac / oraș nu mai rămâne desenat cât mergi cu el (`parkedHidden`). **Apartamentul** are calorifere (nu mai îngheți). Florăria fără răsaduri (ce era se întoarce în semințe de lalele). Obiectivul cafenelei: o singură tură. |
| 1.10.1 | **Parcelele de pădure refăcute**: pe ele nu mai crește decorul sălbatic de pe marginea hărții (dreptunghiurile `FOREST_LOT_RECTS` din `layout.ts` sunt în `CORES` în country.ts). Fiecare parcelă are aranjamentul ei (`lotLayout` în story.ts), la aceeași desime ca pădurea din Capitolul 2: copaci, bolovani, mure, ciuperci pe un caroiaj de 3 dale cu puțin joc, deci între oricare două obiecte rămâne o dală liberă și treci peste tot; locurile goale sunt poieni. Toți copacii se taie. Înainte de cumpărare se vede același aranjament peste gard (fără acțiuni). Pădurea veche (lacul, podețul) e neschimbată. |
| 1.8.9 | Pianul din apartament: taburet mai lung, la cântatul în doi Bubu și Dudu stau unul lângă altul (nu unul peste altul) |
| 1.8.8 | **Google Play:** build-ul de Android trece pe Capacitor 8 (Android 16 / API 36, cerut de Play din 31 aug 2026; Java 21), doar în jobul de Android (iOS rămâne pe Capacitor 6). `versionCode` = A·10000 + B·100 + C din package.json (1.8.8 → 10808), `versionName` = versiunea. APK-ul pentru testeri rămâne mereu semnat cu cheia de test din `ci/` (se instalează peste cel vechi); în plus, **AAB** pentru Play (`BubuDudu-…-google-play.aab` în Release), semnat cu cheia de încărcare din Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`). Cheia NU stă în repo |
| 1.8.6 | **Curtea aranjată de voi:** în 🔨 Construim → „Aranjează curtea” atingi un copac, o piatră, o tufă, florile, banca, cutia poștală, fântâna sau mașina de tuns și alegi ✋ Mută (apoi locul nou, doar în curte, pe loc liber) sau 🗑️ Scoate (copac +4 🪵, piatră +3 🪨). Salvat în `w.yard` (id → loc sau 0 = scos; op `yard`), aplicat în `syncPlaced`. Stiva de lemne din mijlocul curții, scoasă de tot. Fântâna mutată la (14,14), departe de răzoare. Bucătăriile: aragazul și blatul cu vasele înapoi unde erau; frigiderul în colț (casa 13,6; apartamentul 16,8, cu espressorul lângă el pe peretele dinspre baie, 15,8, cu fața spre cameră). Casa (1.8.7): ușa dintre bucătărie și baie rămâne; închisă în schimb ușa din peretele din dreapta, care dădea direct în blatul cu vase. Test: `tools/teste/curte.cjs` |
| 1.7.0 | **Viziunea, toată:** 9 capitole (Podul și Ferma inserate, salvările mutate fără pierderi); **Podul** reparat de voi (lemne, scânduri, pietre, mâncare, bani) cu scenă animată; **Satul renaște**: satul pe moarte (case părăsite, brutăria / școala / piața / parcul închise) readus la viață prin 6 proiecte la Primărie; **Ferma**: 4 parcele de cumpărat, plug / semănătoare / cisternă / combină care merg singure pe rânduri, grâu / porumb / floarea-soarelui, găini, vacă (lapte → brânză), oi, stupi; **angajații** (7 meserii, salariu, pricepere, pleacă dacă nu-i plătiți, raport dimineața, lucrează și când sunteți la oraș); **orașul important**: supermarketul cumpără marfa, magazinul „Bubu & Dudu” pe teren (rafturi, vitrină, vânzări zilnice), contracte cu camionul, târgul orașului; **Nunta** la biserica din sat: inelul, cererea la lac (scenă), rochia, voalul, costumul, tortul, lăutarii, invitații (săteni prieteni), cununia, hora, buchetul, artificii, genericul; **vehicule semi-automate**: destinații pe drum (Acasă, Cheresteaua, Lacul, Satul, Orașul), ⏸ / ▶ / ↩, „Oprește la…”, „Mergi la” de pe hartă, bicicleta ×3 și scuterul ×5 față de mers; **anotimpuri** (ninsoare, frunze, petale), **sărbători și evenimente** (Mărțișor, Paște, Crăciun, Dragobete, Revelion, furtuna cu acoperișul, vizita bunicilor, zilele voastre, târgul lunar, nunta Inei); **prietenii pe 5 trepte** cu secrete și daruri; **albume** (pești, flori, rețete, haine); reparații: lumea se sincronizează între telefoane (toaleta care „revenea” înfundată), conectarea dintr-o apăsare, meniul încape pe telefon, podul nu mai scrie „rupt” după reparare |
| 1.6.0 | **Case cu cod și parolă** (camere unice; online doar așa); bicicleta / scuterul cumpărate se văd imediat la partener; **iPhone**: sunetul nu se mai oprește (sesiune audio „playback”, repornire după întreruperi), jocul e marcat ca joc (Game Mode); **florăria** e un magazin adevărat (interior, clopoțel la ușă) și vinde doar flori: de câmp, buchete din grădină, răsaduri în ghiveci; **Cheresteaua lui Nea Vasile** pe drum (cântar, comenzile zilei, gaterul cu scânduri) = afacerea lui Dudu din Capitolul 1; roluri Bubu / Dudu în Capitolele 0-2; **satul și orașul refăcute** (ulițe, piață, bulevarde, ușile spre stradă, casele sătenilor au ușă: bați și vorbești cu ei); miniharta clară, care se mărește (⤢) și nu acoperă nimic; ⏭ și ♾️ la vedere |
| 1.5.0 | **Viteză pe laptop** (lumea „coaptă” în podea, rezoluție adaptivă, eco implicit, placa video forțată în aplicația Windows); butoanele de test „Capitolul următor” și „Resurse infinite” (în fereastra cu obiective); soba fără horn (părea o lampă prin pat), laptopul lângă perete, copacul și piatra mutate din spatele casei, mașină de tuns iarba în loc de magazie; indicatoare orientate corect; bănci noi, pe care vă așezați amândoi; personajul prins într-un obstacol iese singur; **Dudu are rolul lui din Capitolul 1** (vinde lemne la cherestea cu 3 lei bucata, obiective marcate Dudu/Bubu); partenerul AI nu mai rămâne blocat dansând după un capitol nou |

## 7. Direcția și tot ce mai e de făcut

Legendă: ✅ gata (nu se mai face o dată) · 🟡 făcut pe jumătate (scrie ce lipsește) · ⬜ de făcut.

### 7.1 Ce cere proprietarul chiar acum (prioritate maximă)

- ✅ (1.6.0) **Butonul ⏭ „Capitolul următor” la vedere, în joc** (lângă ⚙, cu ♾️; confirmarea în fereastra jocului). Textul vechi: În 1.5.0 e doar în fereastra cu obiective (📜), iar proprietarul nu l-a găsit. Pune-l înapoi lângă ⚙, în cartonașul partenerului, ca înainte. Codul vechi e în commit-ul `0098673`: `<button class="mini-btn" data-a="skipch">⏭</button>` → `s.devSkipChapter()`. Pune lângă el și ♾️ (resurse infinite, `s.setInfinite`). Confirmarea se face cu fereastra jocului, nu cu `confirm()`.
- ⬜ **Testul pe laptopul EliteBook** (Windows). Proprietarul a spus că 1.4.x mergea „mai greu ca GTA 5”, iar 1.5.0 e mult mai rapid în teste. Întreabă-l cum merge acum. Dacă tot e greu, vezi 7.5.

### 7.2 Decizii luate (nu se mai discută)

- ✅ **Rutina de seară = varianta A** (1.3.2): un singur moment, „Noapte bună”, în care țineți amândoi apăsat pentru pupic, plus un bilețel opțional.
- ✅ **Cina = varianta A** (1.3.2): fiecare alege din meniu; preferatele partenerului sunt marcate clar; **nimic de ghicit**.
- ✅ **O singură lume mare, legată, fără teleportări** (1.4.0); interioarele (apartamentul, magazinele) rămân separate, cu ușă; hartă și minihartă.
- **Vehicule semi-automate, nu GTA:** merg doar pe drumuri, singure.
- **Bicicleta și scuterul rămân necesare**, pentru că lumea e mare.
- **Fiecare personaj are rolul lui în fiecare capitol.** Nimic nu trebuie să depindă doar de unul. Rolurile sunt etichete (`who` pe obiectiv): o poate face oricare, dar fiecare are treaba lui și câștigul lui. Început în 1.5.0, cu Dudu în Capitolul 1.
- **Progresul se păstrează mereu.** Salvările vechi merg mai departe (de exemplu, cine e deja în sat are podul reparat).
- Satul și orașul s-au **refăcut în 1.6.0** (proprietarul a cerut: extinderea veche era doar vizuală, înghesuită, fără logică). Regula de 2.5D: **ușa fiecărei clădiri e pe fața +x sau +y și dă direct într-o stradă**; nimic nu stă în fața ușilor; tot ce e nou trebuie să facă ceva. Pe jos, de acasă până în sat se fac ~45-60 de secunde.
- **Online doar în case cu cod + parolă** (1.6.0). Parola nu se salvează nicăieri.
- **Florăria vinde doar flori.** Taraba de acasă vinde de toate.
- **Lemnele se vând la Cheresteaua lui Nea Vasile**, pe drum, nu din curte.

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
- ✅ **Rolul lui Dudu în Capitolele 0-2** (1.6.0): soba, toaleta, televizorul (Cap. 0); Cheresteaua lui Nea Vasile: cântarul cu prețul zilei (2-4 lei, Dudu +1), două comenzi pe zi, gaterul (2 lemne → o scândură, tăietura perfectă dă una în plus) (Cap. 1-2); tractorul și pădurea. Bubu: curățenia, grădina, taraba, florile, ciupercile, peștii, animalele.
- ✅ **1.6.0:** casele cu parolă, bicicleta vizibilă la partener, sunetul pe iPhone, Game Mode, florăria, cheresteaua, satul și orașul refăcute, miniharta nouă.
- ⬜ **De verificat de proprietar:** Firebase-ul adevărat cu două telefoane (casa nouă + intrarea partenerului), Game Mode și sunetul pe iPhone (din aici nu se poate testa: nu avem Mac / iPhone).

### 7.4 Viziunea, exact cum a stabilit-o proprietarul (4 noiembrie 2026)

Proprietarul a ales să **îmbine toate cele trei direcții** propuse. Cuvintele lui: „le îmbinăm pe toate și atunci avem o lume mare pe care o creștem, ne facem ferme pe câmpuri, câmpuri de agricultură, angajăm oameni, cumpărăm utilaje… trebuie totuși să ținem capitolele, să reparăm podul care face legătura dintre sat și casa noastră… semi-automate, nu GTA… orașul devine și el la un moment dat important”.

**1. Lumea mare și legată** (✅ făcută în 1.4.0):
- casa și curtea, cu **câmpuri** în jur, cumpărate bucată cu bucată; pădurea în spate;
- **râul cu podul rupt** între casă și sat;
- satul peste râu, de câteva ori mai mare; drumul mare spre oraș; orașul pe cartiere;
- **locuri noi care se deschid pe hartă**: un pod reparat duce la o fermă nouă, un drum nou duce la lacul de munte. **Fără vacanțe dintr-un meniu**: proprietarul a zis clar că nu se simt reale.

**2. Povestea: satul care renaște prin voi:**
- la început **satul e pe moarte**: case părăsite, podul rupt, școala închisă, tinerii plecați la oraș;
- voi îl readuceți la viață prin **proiecte** (bani + lemn, piatră, recolte, produse), la panoul de la Primărie: podul, brutăria, școala, iluminatul, parcul, gara;
- după fiecare proiect se **vede pe hartă**: se mută săteni noi, apar case, magazine și evenimente; satul devine treptat un orășel;
- orașul e vecinul mare (vindeți marfa, lucruri rare, slujbe), dar **inima jocului rămâne acasă**.

**3. Viața bogată, adăugată treptat:**
- **animale de fermă:** găini (ouă), vacă (lapte, brânză), oi (lână pentru croitorie), stupi (miere);
- **anotimpuri:**
  - primăvara cu flori; vara cu lacul și înotul; toamna cu culesul;
  - iarna cu zăpadă, sanie, om de zăpadă, Crăciun;
  - culturile se schimbă după anotimp;
- **evenimente:** târgul lunar, nunta unui sătean, furtuna (reparați acoperișul), vizita bunicilor, ziua lui Bubu și a lui Dudu;
- **prietenii cu sătenii:** fiecare are povestea lui pe 5 trepte (cereri, cadouri, secrete);
- **albume de colectat:** pești, flori, rețete, haine (cu recompensă);
- **afacerile cresc**, nu le lași: ferma, taraba, florăria și tâmplăria se măresc, cu angajați, utilaje și clienți din oraș.

**Vehiculele, semi-automate, nu GTA:**
- mergi doar pe drumuri; alegi destinația pe hartă, iar vehiculul merge singur;
- butoanele ▶ Pornește / ⏸ Oprește / ↩ Întoarce; la răscruci alegi direcția cu săgeți;
- bicicleta și scuterul rămân necesare: pe jos casă → sat ~1 minut, cu bicicleta de 3 ori mai repede, cu scuterul de 5 ori;
- bicicleta are coș (marfă la piață); tractorul trage remorca;
- utilajele agricole merg singure pe rânduri, cu aceleași butoane.

**Ferma:**
- cumperi parcele de câmp;
- lucrul pe câmp: **ari** cu plugul, **semeni** cu semănătoarea, **uzi** cu cisterna, **recoltezi** cu combina;
- produsele animalelor și ale câmpului merg în rețete și pe tarabă.

**Angajații** (ideea proprietarului):
- angajezi săteni pentru: câmp, animale, tarabă, florărie, lemne, condusul utilajelor. Exemple: grădinar (udă, recoltează, replantează), tăietor de lemne, vânzător la tarabă (ia un procent), florăreasă, culegător de flori și fructe de pădure;
- salariu pe zi; mai buni sau mai slabi; pricepere care crește; mulțumiți dacă îi plătești la timp, pleacă dacă nu;
- **seara primești un raport**, de exemplu: „Azi: Ina a vândut 12 produse, +86 lei. Salarii −40 lei”;
- lucrează și când sunteți la oraș, ca să nu lăsați afacerile de la țară.

**Orașul devine important:**
- magazinul vostru **„Bubu & Dudu”**, cu produsele de la fermă;
- contracte cu restaurantele din oraș, aprovizionate cu camionul;
- mai târziu vă extindeți și organizați **târgul orașului**.

#### Capitolele stabilite (9), ținute și continuate

| # | Capitol | Stare | În cod azi / ce lipsește |
|---|---|---|---|
| 1 | **Casa** | ✅ | `CHAPTERS` id 0 (Căsuța) |
| 2 | **Curtea** | ✅ | id 1 (Curtea); Dudu are rolul lui din 1.5.0 |
| 3 | **Pădurea** | ✅ | id 2 (Pădurea, tractorașul) |
| 4 | **Podul** | ✅ 1.7.0 | azi podul îl repară sătenii singuri la finalul capitolului de pădure. Trebuie să devină un capitol: aduceți lemne din pădure, piatră și bani; reparați podul care leagă casa de sat |
| 5 | **Satul renaște** | ✅ 1.7.0 | id 3 (Satul) are magazine, croitorie, școală, parc, florăria lui Bubu, tâmplăria lui Dudu. Lipsesc: satul „pe moarte” la început, panoul de proiecte, sătenii noi, casele și evenimentele care apar după fiecare proiect |
| 6 | **Ferma** | ✅ 1.7.0 | parcele, utilaje, animale (vezi mai sus); angajații încep aici |
| 7 | **Drumul spre oraș** | ✅ 1.7.0 | id 4 (Orașul): autobuz, joburi, diplome, apartament, mall; bariera spre oraș se deschide aici. Trebuie legat de afacerile de la țară, nu „lași tot și te angajezi” |
| 8 | **Afacerea din oraș** | ✅ 1.7.0 | magazinul „Bubu & Dudu”, contractele cu restaurantele, camionul, târgul orașului |
| 9 | **Nunta** | ✅ 1.7.0 (la biserica din sat, cum a hotărât proprietarul) | ideile propuse atunci: cererea în căsătorie (inelul), rochia și costumul, locul (biserica din sat, `w-church` există, sau restaurantul), **invitații sunt sătenii** cu care v-ați împrietenit, petrecerea cu un minijoc de dans |

După capitole, **anotimpurile și sărbătorile** merg pe toată durata jocului.

**Cum e făcut în cod (1.7.0):** `CHAPTERS` din `src/game/economy.ts` are acum 9 capitole, cu id-urile 0-8: Casa (0), Curtea (1), Pădurea (2), **Podul (3)**, Satul renaște (4), **Ferma (5)**, Drumul spre oraș (6), **Afacerea din oraș (7)**, **Nunta (8)**. Constantele `BRIDGE_CHAPTER`, `VILLAGE_CHAPTER`, `FARM_CHAPTER`, `CITY_CHAPTER`, `SHOP_CHAPTER`, `WEDDING_CHAPTER`. Sistemele noi sunt în [`src/scenes/story.ts`](../src/scenes/story.ts), scenele mari animate în [`src/minigames/cutscene.ts`](../src/minigames/cutscene.ts), anotimpurile și desenele fermei în [`src/world/season.ts`](../src/world/season.ts). Migrarea: `migrateChapters()` din `world.ts` (`stats.chapV = 2`).

**Atenție la numerotare:** capitolul e salvat în `w.stats.chapter`. Dacă se inserează Podul și Ferma între cele de azi, salvările vechi se mută (migrare). Cine e deja în sat are podul reparat; nimeni nu pierde progres.

Alte idei propuse atunci, care se potrivesc viziunii (**neconfirmate încă**, întreabă-l pe proprietar):
- casa visurilor (etaj, cameră nouă, grădină mare, seră);
- un animăluț (cățel sau pisică: îl hrănești, îl plimbi, îi dai jucării);
- afacerea voastră ca o cafenea sau patiserie.

Pentru nuntă, detaliile personale (data, locul cererii, rochia, nașii) se întreabă la proprietar. Se pun doar în joc, nu în documentație: repo-ul e public.

### 7.5 Sisteme pentru tot jocul

**Vehiculele:**
- ✅ merg singure pe drum (1.4.0);
- ✅ butoanele ⏸ Oprește / ▶ Pornește / ↩ Întoarce (1.7.0);
- ✅ la fiecare oprire de pe drum: „⤵ Oprește la…” (1.7.0); drumul mare e unul singur, deci răscrucile sunt opririle lui;
- ✅ destinația aleasă pe harta mare: cu vehiculul sau pe jos (1.7.0);
- ✅ utilajele agricole merg singure pe rânduri (1.7.0).

**Podul:**
- ✅ Capitolul 3 · Podul (1.7.0): lemne, scânduri, pietre, mâncare caldă și bani, apoi scena cu meșterii;
- salvările care au trecut de Capitolul 2 rămân cu podul reparat.

**Proiectele satului:**
- ✅ Primăria → Proiectele satului (1.7.0): brutăria, piața, școala, parcul, iluminatul, drumul pietruit; fiecare redeschide clădirea, repară două case părăsite și aduce o familie nouă;
- ⬜ mai târziu: gara cu trenul (pentru o zonă nouă, de munte), terenul de joacă.

**Anotimpurile și sărbătorile** ✅ 1.7.0 (de întrebat proprietarul datele adevărate ale zilelor de naștere și ale aniversării; acum: Bubu vara ziua 2, Dudu toamna ziua 5):
- primăvară, vară, toamnă, **iarnă cu zăpadă** (omul de zăpadă există deja în construcție);
- sărbătorile: Mărțișorul (1 martie), Dragobetele (24 februarie), Paștele (ouă vopsite), Crăciunul (brad, colinde, cadouri, sanie), Revelionul (artificii);
- zilele voastre: zilele de naștere și aniversarea cuplului (de întrebat datele);
- evenimentele satului: hramul, târgul, nunțile sătenilor.

**„Nu mai ai ce face”** ✅ 1.7.0 (cartonașul de dimineață: evenimentele zilei, raportul angajaților, ce are de făcut fiecare):
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

### 7.8 Ordinea de lucru (stabilită cu proprietarul)

Câte o versiune pentru fiecare pas, **testată înainte** (vezi secțiunea 8):
1. ✅ **Reparații** (1.3.2): rutina de seară A, cina A, sunete potrivite, super-bășina, taraba comună + inventarul, clienți separați.
2. ✅ **Lumea mare** (1.4.0-1.4.2): o singură lume legată, drumuri, harta și miniharta, satul și orașul mărite.
   - ✅ (1.5.0) viteză pe laptop, reparații vizuale, rolul lui Dudu în Capitolul 1.
   - ✅ (1.6.0) butonul ⏭ la vedere; case cu parolă, iPhone, florăria, cheresteaua, satul și orașul refăcute, miniharta.
   - ⬜ tunsul ierbii cu mașina împinsă (7.6).
3. 🟡 **Vehiculele semi-automate:** merg singure pe drum; lipsesc ▶ / ⏸ / ↩, săgețile la răscruci, destinația pe hartă, coșul bicicletei, remorca tractorului.
4. ⬜ **Capitolul Podul** + proiectele satului (**Satul renaște**).
5. ⬜ **Ferma:** câmpuri, utilaje, animale.
6. ⬜ **Angajații.**
7. ⬜ **Orașul important:** magazinul vostru, contractele, târgul.
8. ⬜ **Nunta, anotimpurile, evenimentele** (plus prieteniile pe 5 trepte și albumele).

În fiecare pas: **roluri pentru Bubu și pentru Dudu** și **animații bine lucrate** (7.6).

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
