# 🔥 Firebase (fără server propriu)

1. Intră pe https://console.firebase.google.com → **Add project** (fără Analytics).
2. **Build → Realtime Database → Create database** → locație *europe-west1* → *Start in locked mode*.
3. La **Rules** pune (codul casei funcționează ca o parolă, alege-l lung):
   ```json
   {
     "rules": {
       "rooms": {
         "$room": { ".read": true, ".write": true,
           "events": { ".indexOn": ["ts"] } }
       }
     }
   }
   ```
4. **Project settings → Your apps → Web (</>)** → înregistrează aplicația → copiază obiectul `firebaseConfig`
   (trebuie să conțină `databaseURL`).
5. În joc: meniu → **Firebase** → lipește config-ul → același **Cod al casei** pentru amândoi.

Planul gratuit (Spark) ajunge din belșug pentru doi jucători.
Notă: evenimentele se adună în `rooms/<cod>/events`; dacă vreodată crește mult, le poți șterge din consolă (salvarea e în `rooms/<cod>/save`).
