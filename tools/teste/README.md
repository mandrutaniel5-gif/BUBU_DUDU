# Teste automate (Playwright)

> Din 1.8.1 uneltele de test (⏭, ♾️, modul 2 tab-uri) apar doar cu `?dev` în adresă; toate scripturile de aici îl adaugă.

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
| `audit_interfata.cjs` | **Audit vizual al interfeței**, pe 5 ecrane (telefon, telefon mic, tabletă, laptop, telefon ținut vertical): elementele de bază nu se suprapun; ~30 de ferestre (obiective, inventar, hartă, albume, laptop, Primărie, proiecte, angajați, fermă, parcelă, magazin, contracte, sătean, bancă, garderobă, bucătărie, raportul…) nu ies din ecran, nu sunt tăiate, nu au butoane suprapuse, nimic nu stă peste ele; două lucruri deschise deodată (meniu + fereastră, minijoc + raport, bara de drum + harta) |
| `audit_lume.cjs` | **Audit al lumii** (toate cele ~4000 de obiecte, cu ferma și magazinul): obiecte solide suprapuse, decor pe drum sau în apă, lucruri cu acțiune ascunse în spatele copacilor / clădirilor, locuri unde nu se ajunge pe jos |
| `audit_meniuri.cjs` | Meniurile 😊 / 💞 (în ecran, deasupra minihartii), ferestrele din meniul de start, capturi din minijocuri pe telefonul mic |
| `poveste.cjs` | 1.7.0, **jucat cap-coadă**: bicicleta spre cherestea (⏸, parcarea), Podul (scena), Satul renaște (clădiri închise, 6 proiecte), Ferma (parcelă, plug, semănătoare, cisternă, combină, animale, brânză), angajații și raportul, magazinul din oraș, contractul cu camionul, cererea, nunta |
| `mp_sincronizare.cjs` | 1.7.0, **2 jucători**: telefonul cu lumea veche primește lumea nouă (toaleta nu mai „revine” înfundată); salvarea fără schimbări nu mai mută ora |
| `case_parola.cjs` | 1.6.0: casa nouă cu parolă (parola scurtă e refuzată), același cod + parolă = aceeași casă, alta parolă = altă cameră, online cere casă cu parolă |
| `mp_cumparare.cjs` | 1.6.0, **2 jucători**: bicicleta cumpărată de Dudu apare imediat la Bubu |
| `sunet_iphone.cjs` | 1.6.0: sunetul revine după suspendare + atingere și se reface după ce contextul audio e închis |
| `florarie.cjs` | 1.6.0: florăria are doar lăzi cu flori, clienții cer doar flori, morcovii rămân neatinși; taraba de acasă are 4 lăzi |
| `cherestea.cjs` | 1.6.0: cheresteaua pe drum, cântarul (preț × lemne, 5 rămân pentru sobă), gaterul, comenzile, stiva din curte nu mai vinde |
| `ajutoare.cjs` | 1.8.0: bolovanii din pădure (Dudu +3, se refac), prețul lui Dudu la cherestea, „Angajează ajutoare” peste cherestea, ziua angajaților (tăietor → spărgător → culegător → căruțaș), buchetele ieftine la florărie |
| `casa_cap0.cjs` | 1.8.2: în Capitolul 0 mizeria se mișcă și casa se redesenează curată după ce repari (toaleta, cada, frigiderul, vasele, lampa) |
| `apartament.cjs` | 1.8.4: pianul, acvariul, espressorul, consola și televizorul din apartament sunt activități animate; o cafea pe zi; perete cu ușă între baie și bucătărie |
| `adancime_lume.cjs` | 1.8.5: Dudu e pus în jurul fiecărui obiect de pe toată harta; obiectul e desenat în fața lui doar când chiar e în față; niciun obiect pus peste altul |
| `aglomerare.cjs [prag]` | 1.8.5: obiecte vecine desenate singure și comparate pixel cu pixel: cât din cel din spate e acoperit de cel din față (copac peste fântână, piatră ascunsă etc.) |
| `angajati_zi.cjs` | 1.9.0: angajații aduc lemne / flori peste zi (8–18), grădinarul udă ora de oră, noaptea nu lucrează, tăietorul lucrează lângă copac cu animație |
| `angajati_munca.cjs` | 1.9.1: tăietorul merge în pădure, taie și cară lemnele acasă; spărgătorul sparge bolovani; căruțașul duce lemne la cherestea; vânzătorul deschide taraba și servește clienții; nimeni nu trece prin obiecte |
| `autobuz_oras.cjs` | 1.9.1: înainte de Capitolul 6 autobuzul și scuterul nu merg la oraș; după, merg |
| `angajati_real.cjs` | 1.9.9: fiecare angajat muncește pas cu pas cu resursele voastre: grădinarul culege / udă / plantează și cere semințe, tăietorul și culegătorul aduc pe loc, îngrijitorul strânge ouăle, vânzătorul deschide taraba și servește din inventar (toți banii), căruțașul vinde la cherestea, tractoristul ară, tâmplarul și florarul; raportul de dimineață |
| `moara.cjs` | 1.9.9: „Du-mă” la moară (prin culoarul dintre câmpuri), vânzarea angro a porumbului și a semințelor, măcinatul grâului în făină și al porumbului în mălai |
| `unde_e_ziua.cjs` | 1.9.8: harta → „Unde e?” (4 locuri, ferma încuiată înainte de cap. 5), „Du-mă” găsește drumul și ajunge la indicatorul fermei; „Ziua X 📅” deschide evenimentul zilei și ce urmează |
| `pod_ciorba.cjs` | 1.9.7: la Podul Mare, ciorba gătită contează ca „mâncare caldă” (37 de boluri → „ai 37”, „Dă 3”); cererea unui sătean pentru mâncare primește tot ciorbă |
| `casa_conectare.cjs` | 1.9.2: din Solo casa se face online; casa de pe server e găsită și de cine are Firebase selectat; parola greșită; după creare jocul rămâne online. Pornește înainte `PORT=8799 node server/server.mjs` (dintr-o copie a folderului server) |
| `versiune_partener.cjs` | 1.9.3: doi jucători pe serverul nostru (local, port 8799): fiecare află versiunea celuilalt, fără avertismentul fals „are o versiune mai veche” |
| `taraba_x.cjs` | 1.9.3: lista goală de clienți (cum vine prin Firebase) nu mai crapă jocul; X-ul închide taraba pe tabletă |
| `ca_un_joc.cjs` | 1.9.5: pe iPhone (emulat) nu se mai selectează text / lupă; joystick-ul cu degetul și butoanele merg |
| `curte.cjs` | 1.8.6: muți / scoți copaci și pietre din curte, nu se poate în casă, rămâne salvat; fără stiva de lemne; fântâna departe de răzoare |
| `adancime_casa.cjs` | 1.8.3: Dudu plimbat prin toată casa (pas 0,3): obiectele care se acoperă au mereu aceeași ordine (fără pâlpâit) și Dudu e de partea bună a fiecărui perete și a fiecărei mobile |
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
