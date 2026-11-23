#!/usr/bin/env python3
"""Pregateste proiectul Android generat de Capacitor (in GitHub Actions, dupa `npx cap sync android`).

Jocul se deschide ca un JOC: pe tot ecranul (imersiv), fara bara de sus si fara bara cu butoanele telefonului
(inapoi / acasa / aplicatii), care ramaneau peste joc si acopereau butoane. Barele apar doar daca tragi cu degetul
de la margine si se ascund singure. Se reaplica la revenirea in aplicatie si cand jocul primeste din nou focusul.
"""
import pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'android')

# ---- reclamele (1.15.0): pluginul AdMob doar pentru Android. Nu sta in package.json: cere Capacitor 8, iar iOS-ul e inca
# pe Capacitor 6. Il instalam aici impreuna cu acelasi Capacitor 8 pe care l-a pus workflow-ul (un `npm i` separat ar
# intoarce @capacitor/* la versiunea din package-lock), apoi `cap sync` il leaga in proiectul Android.
import json, subprocess, os
ADMOB_PLUGIN = '@capacitor-community/admob@8.3.0'
ADMOB_APP_ID = 'ca-app-pub-6912029136609798~9879750558'
if os.environ.get('SKIP_ADMOB') != '1':
    cap = json.loads(pathlib.Path('node_modules/@capacitor/android/package.json').read_text())['version']
    sh = os.name == 'nt'
    subprocess.run(['npm', 'i', '--no-save', '--legacy-peer-deps', f'@capacitor/cli@{cap}', f'@capacitor/core@{cap}', f'@capacitor/android@{cap}', ADMOB_PLUGIN], check=True, shell=sh)
    # 1.15.1: `cap sync` ia pluginurile DOAR din package.json (nu din node_modules): fara linia asta, v1.15.0 a iesit fara
    # reclame. Scriem pluginul in package.json doar aici, in copia din GitHub Actions (in repo nu se schimba nimic).
    pj = pathlib.Path('package.json'); pkgj = json.loads(pj.read_text(encoding='utf-8'))
    name, ver = ADMOB_PLUGIN.rsplit('@', 1); pkgj.setdefault('dependencies', {})[name] = ver
    pj.write_text(json.dumps(pkgj, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    subprocess.run(['npx', 'cap', 'sync', 'android'], check=True, shell=sh)
    # verificare: pluginul chiar e legat in aplicatie (altfel oprim build-ul, nu scoatem o versiune fara reclame)
    plugins = json.loads((root / 'app/src/main/assets/capacitor.plugins.json').read_text(encoding='utf-8'))
    if not any('admob' in json.dumps(p).lower() for p in plugins):
        sys.exit(f'AdMob nu apare in capacitor.plugins.json: {plugins}')
    print(f'AdMob: {ADMOB_PLUGIN} (Capacitor {cap}) · pluginuri: {plugins}')

acts = list(root.glob('app/src/main/java/**/MainActivity.java'))
if not acts:
    sys.exit('Nu gasesc MainActivity.java')
act = acts[0]
pkg = re.search(r'^package\s+([\w.]+);', act.read_text(), re.M).group(1)
act.write_text(f'''package {pkg};

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/** Bubu & Dudu: jocul pe tot ecranul (imersiv), ca un joc. */
public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        immersive();
    }}

    @Override
    public void onResume() {{
        super.onResume();
        immersive();
    }}

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {{
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }}

    private void immersive() {{
        // jocul intra si in zona camerei (decupajul ecranului), ca sa nu ramana o dunga neagra
        if (Build.VERSION.SDK_INT >= 28) {{
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }}
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }}
}}
''')
print(f'{act}: ecran complet (imersiv), fara barele sistemului')

# Jocul sta pe orizontala (screenOrientation, pus de workflow). Android deduce de aici ca ecranul orizontal e
# OBLIGATORIU (android.hardware.screen.landscape), iar Google Play ascunde aplicatia de pe dispozitivele care nu
# declara asa ceva (tablete, Chromebook, Play Games pe PC, XR). Il declaram optional: orientarea ramane aceeasi.
man = root / 'app/src/main/AndroidManifest.xml'
xml = man.read_text()
feats = ''.join(f'\n    <uses-feature android:name="android.hardware.screen.{o}" android:required="false" />'
                for o in ('landscape', 'portrait') if f'android.hardware.screen.{o}' not in xml)
if feats:
    xml = re.sub(r'(<manifest\b[^>]*>)', lambda m: m.group(1) + feats, xml, count=1)
# codul aplicatiei AdMob: fara el, SDK-ul de reclame opreste aplicatia la pornire
if 'com.google.android.gms.ads.APPLICATION_ID' not in xml:
    xml = re.sub(r'(<application\b[^>]*>)', lambda m: m.group(1) + f'\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="{ADMOB_APP_ID}" />', xml, count=1)
man.write_text(xml)
print(f'{man}: ecranul orizontal / vertical declarate optionale (aplicatia apare pe toate dispozitivele)')
