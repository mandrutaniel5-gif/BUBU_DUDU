# 🐼🐻 Bubu & Dudu — Căsuța noastră

Joc de familie pentru doi (Bubu, panda, și Dudu, ursuleț), în stil izometric 2.5D. Se joacă împreună online sau singur, cu partenerul controlat de AI.
Povestea: căsuța → curtea → pădurea (tractoraș) → satul (bicicletă/scuter) → orașul (autobuz, joburi, apartament).

## Descărcări
Fiecare push pe `main` construiește automat jocul (tab-ul **Actions** → ultimul build → *Artifacts*):

| Platformă | Fișier |
|---|---|
| Windows | `BubuDudu-…-nsis.exe` (instalare) și `…-portable.exe` |
| Android | `BubuDudu.apk` (semnat cu cheia din Secrets) |
| iOS | `BubuDudu-unsigned.ipa` (se semnează cu AltStore / Sideloadly sau cu cont Apple Developer) |
| Browser | `BubuDudu-joc.html` (un singur fișier, merge și offline) |

Un tag `v1.0.0` pune toate fișierele într-un **Release**.

## Secrete necesare (Settings → Secrets and variables → Actions)
- `ANDROID_KEYSTORE_BASE64`: cheia de semnare, în base64
- `ANDROID_KEYSTORE_PASSWORD`: parola cheii
- `ANDROID_KEY_ALIAS`: `bubududu`

## Dezvoltare
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/
npm run server       # server multiplayer + joc pe :8787 (S10: vezi docs/SERVER-S10.md)
npm run electron     # aplicația de Windows, local
```
Documentație: `docs/LOGICA_JOCULUI.md`, `docs/SERVER-S10.md`, `docs/FIREBASE.md`, `docs/APK.md`.
