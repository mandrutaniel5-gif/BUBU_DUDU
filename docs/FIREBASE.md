# 🔥 Firebase și casele cu parolă

Jocul vine cu Firebase-ul lui inclus (`BUILTIN_FIREBASE` din `src/game/settings.ts`), deci merge online fără configurare.

## Casele (din v1.6.0)

Fiecare cuplu are **casa lui**, cu un **cod unic** (ex. `LALEA-7K3P`) și o **parolă**:

- **Casă nouă:** Meniu → 🏠 → alegi o parolă → jocul face un cod care nu mai există (tranzacție în `houses/`).
  Bifa „Mută aici progresul de acum” duce salvarea veche în casa nouă.
- **Partenerul:** Meniu → 🏠 → „Intră în casa partenerului” → același cod și aceeași parolă.
- **Ce se vede în baza de date:**
  - `houses/<amprenta codului>`: doar ora la care s-a făcut casa (ca un cod să nu se dea de două ori);
  - `rooms/<cheie>`: cheia (40 de caractere) e calculată pe telefon din **cod + parolă** (SHA-256);
  - parola nu se trimite și nu se salvează nicăieri;
  - fără parolă nu se poate afla în ce cameră e o casă.
- **Online cere o casă cu parolă.** Camerele vechi, cu nume (ex. `casuta-noastra`), merg doar în jocul solo.
  Cine le avea face o casă nouă cu bifa „Mută aici progresul”, iar partenerul intră în ea cu codul și parola.
- **Parola uitată:** nu se poate recupera. Salvați progresul în fișier (Meniu → 💾), faceți o casă nouă și încărcați fișierul.

## Regulile bazei de date (de pus o dată în consolă)

Firebase Console → proiectul `bubu-dudu-76256` → **Realtime Database → Rules** → lipește conținutul fișierului
[`database.rules.json`](../database.rules.json) → **Publish**:

- nimeni nu poate citi lista tuturor caselor sau camerelor (`.read: false` la rădăcină);
- un cod rezervat nu mai poate fi suprascris;
- o cameră se poate citi și scrie doar de cine îi știe cheia (deci codul și parola).

Fără regulile astea, casele merg la fel, dar cineva care descarcă toată baza de date ar putea vedea camerele.

## Firebase propriu (opțional)

1. https://console.firebase.google.com → **Add project** (fără Analytics).
2. **Build → Realtime Database → Create database** → *europe-west1* → *Start in locked mode*.
3. La **Rules** pune conținutul lui `database.rules.json`.
4. **Project settings → Your apps → Web (</>)** → copiază `firebaseConfig` (cu `databaseURL`) în `BUILTIN_FIREBASE`.

Planul gratuit (Spark) ajunge din belșug. Evenimentele se șterg singure după ce le citește partenerul; salvarea e în `rooms/<cheie>/save`.
