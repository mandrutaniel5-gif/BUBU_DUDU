# Revizia de lansare (1.12.0, noiembrie 2026)

Revizia jocului înainte de lansare, făcută pornind de la ce a cerut proprietarul. Jocul e făcut pentru doi, deci totul s-a verificat cu doi jucători (două taburi, plus Firebase-ul adevărat pentru case).

---

## 1. Testul cu un jucător nou

Un browser curat, telefon ținut pe orizontală (844×390), fără `?dev`. Ce vede și unde se blochează:

| Unde | Ce s-a întâmplat | Stare |
|---|---|---|
| Meniul | Trebuia să aleagă între „Joc solo”, „Online (Firebase)” și „Serverul nostru (Samsung S10 / PC)”. „Firebase” și „S10” nu înseamnă nimic pentru un jucător. | ✅ acum: **🌍 Online** / **📴 Offline**; serverul S10 e în Setări → Avansat |
| Meniul | Casa se găsea printr-un buton mic („🔑 Casa”). Codul și parola se cereau din nou la fiecare intrare. | ✅ casele rămân într-o listă; butoane mari **✨ Casă nouă** și **🔑 Intră la partener** |
| Meniul | „Intră în casă” fără casă deschidea direct o fereastră cu două formulare. | ✅ fila Online explică întâi ce e o casă și cine ce apasă |
| **Prima intrare în Solo** | **Jucătorul nou intra în lumea altcuiva** (Capitolul 3, ziua 8, cu jurnalul altui cuplu). Jocul solo fără casă folosea camera comună `casuta-noastra`, iar copia din cloud era aceeași pentru toți jucătorii noi. La lansare, toți ar fi jucat (și suprascris) aceeași lume. | ✅ reparat: Offline stă doar pe telefon; cloud doar pentru casele cu cod și parolă |
| Primul obiectiv | „Aprinde focul în sobă”: soba nu se recunoaște ușor, iar cartonașul nu spune unde e. | ✅ cartonașul obiectivului arată și locul (📍 „Soba din sufragerie…”) |
| Ziua 1 | Jocul nou începe pe 1 Martie: dimineața te chema la masa din curte, dar ușile casei sunt încuiate în Capitolul 0. | ✅ sărbătorile apar doar unde puteți ajunge (curtea din Cap. 1, satul după pod) |
| Bara de sus | Șirul de numere `4 0 2 0 0 2 5·` fără nume: un jucător nou nu știe ce înseamnă. | ⬜ propunere: iconițe mai mari sau o singură iconiță 🎒 cu inventarul |
| Ecranul | Joystick-ul e peste casă, iar butoanele din dreapta-jos sunt doar iconițe (😊 💞 💨 🔨). | ⬜ propunere: la prima pornire, câte un balonaș pe fiecare buton („Emoții”, „Împreună”, „Construiește”) |
| Fereastra „Cât ai lipsit” | Mesajele de foame / baie apăreau peste ea. | ⬜ de mutat sub ferestre (ca la sărbători) |

## 2. Ce am reparat în 1.12.0

**Meniul și casele**
- Online / Offline. Online = casele voastre; Offline = singur, pe telefonul ăsta (partenerul e jucat de calculator).
- Casele rămân în listă (cod, capitol, zi). Le atingi și intri; ✕ le scoate din listă (progresul rămâne în cloud).
- La fiecare casă se vede cine e acum în ea: **0/2, 1/2, 2/2**, și pe fiecare personaj „tu”, „liber” sau „🟢 e în joc”.
- **Nu poți intra peste altcineva:** dacă Bubu e deja în casă pe alt telefon, locul lui nu se poate alege; iar dacă două telefoane apasă deodată, al doilea e trimis înapoi în meniu cu mesaj. Locul se eliberează imediat când ieși.
- „Joc nou” șterge doar jocul Offline (înainte ștergea toate salvările, și pe ale caselor).
- Salvarea din fișier intră în Offline; de acolo o muți într-o casă nouă („Mută aici progresul din Offline”).

**Multiplayer (activitățile în doi)**
- **Sărbătorile nu te mai trag după celălalt.** Cine atinge sărbătoarea îl cheamă pe partener („🎉 Bubu te cheamă… Vin! / Nu acum”), ca la bicicletă. Dacă refuză, e ocupat sau nu răspunde în 25 s: sărbătorile de cuplu (Paștele, Dragobetele, bradul, petrecerile, Revelionul, nunta Inei) se fac când sunteți amândoi; cele care au sens singur (mărțișorul, lozul, concursul de pescuit, patinoarul, căluțeii) se pot face singur, iar partenerul nu mai apare în scenă.
- **Mărțișorul:** îl faci singur, la masa din curte. Dacă partenerul nu e lângă tine, mărțișorul pleacă la el într-un plic; partenerul vede deasupra lui „🎀 Un mărțișor pentru tine!” și mesajul, și îl poartă în piept toată primăvara. Înainte apăreau amândoi în scenă, deși doar unul era acolo.
- **X-ul se închide la amândoi, pe loc** (sub o secundă), la toate sărbătorile. Înainte, celălalt rămânea așteptând până dădea și el X.
- **„Noapte bună”:** X-ul partenerului închide rutina la tine imediat (înainte, încă ~4 s de „noapte bună”); bilețelul deschis nu mai rămâne pe ecran după X; inimile și jurnalul nu se mai numără de două ori.
- Scenele mari (podul, cererea, nunta) pornite de partener nu-ți mai strică minijocul în care ești: le vezi când termini.
- Cartonașul „Bună dimineața” îl vede și partenerul (înainte doar telefonul gazdei).

**Povestea: evenimente cu logică și urmări**
- **Nunta Inei vine după nunta voastră:** la nunta voastră Ina prinde buchetul, iar Rex o cere de nevastă; nunta lor e peste 3 zile. La nunta lor: „Ina a prins buchetul vostru… și uite!”, iar dacă sunteți prieteni apropiați (treapta 4), voi sunteți nașii. Secretele Inei pregătesc povestea: „Mă plimb cu Rex seara pe lângă lac…”, „Rex zice că ne luăm când prind eu un buchet de mireasă!”. Salvările deja căsătorite primesc nunta Inei peste 2 zile.
- Sărbătorile apar doar unde puteți ajunge (vezi testul de mai sus).

**Angajații**
- Lucrează de la 8 la 18. Seara spun „👋 Gata pe azi! Pe mâine”, pleacă pe drum spre sat și nu se mai văd noaptea; dimineața vin pe drum la muncă.
- Tractoristul chiar urcă pe tractor și merge pe rândurile parcelei (înainte stătea la marginea câmpului și „freca”).
- Tâmplarul taie și șlefuiește, florarul aranjează florile, vânzătorul din oraș pune marfa pe raft, apoi vând (înainte stăteau pe loc și salutau 20 de secunde).

**Salvarea**
- Jocul Offline și casele nu se mai amestecă (aceeași salvare locală, dar copii diferite în cloud, era sursa salvărilor „ciudate”).
- Care lume e mai nouă se decide după ora serverului, nu după ceasul telefonului. Un telefon cu ora greșită putea face ca lumea lui veche să o înlocuiască pe cea bună.

**Apartamentul:** ușă din baie direct în bucătărie (lângă masă; rămâne și ușa din dormitor).

**Teste noi:** `mp_1120.cjs` (invitații, X, mărțișor, noapte bună în doi), `case_locuri.cjs` (casele pe Firebase-ul adevărat: 1/2, 2/2, locul ocupat), `angajati_program.cjs` (program, tractor, tâmplar).

## 3. A doua tură (după răspunsul proprietarului)

- **Angajații lucrează oriunde ați fi:** și când sunteți în apartament (înainte stăteau), în minijocuri, pe drum.
- **Inimile (💗) scoase de tot:** din bara de sus, din obiective, sărbători, albume. Nu mai e nimic de strâns fără rost.
- **Serverul S10 scos de tot:** codul serverului, adaptorul, setările, documentația. Online = doar Firebase.
- **Modul dezvoltator ascuns:** Meniu → ⚙ Setări → atingi de 5 ori „Bubu & Dudu v…” de jos → apare locul pentru cod. Codul nu stă nicăieri în repo (care e public), doar amprenta lui criptată. După cod, în Setări apar **🧪 Lumea de test** și **👥 Test în 2 tab-uri**, iar în joc butonul **🧪** (sus, lângă ⚙):
  - ♾️ totul nelimitat, 😊 nevoi pline și vindecați, 🛒 cumpără tot, 🧑‍🌾 câte un angajat din fiecare meserie;
  - capitolul: oricare, înainte sau înapoi;
  - timpul: ziua −1 / +1 / +7 sau ziua aleasă, ora, viteza ×1 / ×5 / ×20 / ×60;
  - fiecare sărbătoare: „📅 ziua ei” (sari acolo) sau „▶ acum”;
  - drumuri rapide (acasă, pădure, sat, oraș, apartament);
  - 📊 FPS, poziția, zona; 📋 copiază lumea sau erorile.
  - Uneltele merg **doar în lumea de test / 2 tab-uri**. În casele online nu fac nimic, deci nu se scrie nimic în Firebase pentru partener.
- Reparat pe drum: cartonașul „Bună dimineața” acoperea chemarea partenerului la o sărbătoare; acum așteaptă să închizi fereastra.

## 4. Probleme găsite, încă nereparate

- Pe telefonul care nu e gazdă, angajații merg pe alte trasee și nu apare „+2 🪵” deasupra lor (doar gazda calculează munca). Nu se pierde nimic, dar arată diferit pe cele două telefoane.
- „Recompensa o singură dată” (`once`): dacă ambele telefoane termină aceeași sărbătoare în aceeași secundă, recompensa comună se poate da de două ori.
- Ziua 1 = 1 Martie: primul mărțișor se pierde (ești încă în casă).
- Testul vechi `case_parola.cjs` folosește meniul vechi (`case_locuri.cjs` acoperă deja casele).

## 5. Ideile (bani, oraș, urmări)

Puse deoparte: proprietarului nu i-au plăcut așa cum au fost scrise. Se reiau pe rând, fiecare explicată pe larg, cu exemple din joc.
