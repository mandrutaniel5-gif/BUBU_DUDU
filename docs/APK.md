# 📦 APK pentru Android (Capacitor)

Necesită pe PC: Node.js, **Android Studio** (include SDK + JDK).

```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android      # în Android Studio: Build → Build APK(s)
```
APK-ul apare în `android/app/build/outputs/apk/debug/app-debug.apk` → îl copiezi pe telefoane și îl instalezi.

`capacitor.config.json` permite deja conexiuni `ws://` (cleartext) către serverul de pe S10.
Dacă Android blochează totuși conexiunea, în `android/app/src/main/AndroidManifest.xml` la `<application>` adaugă
`android:usesCleartextTraffic="true"`.

Varianta fără APK: Chrome → `http://IP-S10:8787` → ⋮ → **Adaugă pe ecranul de pornire**.
