#!/usr/bin/env python3
"""Pregateste proiectul Android generat de Capacitor (in GitHub Actions, dupa `npx cap sync android`).

Jocul se deschide ca un JOC: pe tot ecranul (imersiv), fara bara de sus si fara bara cu butoanele telefonului
(inapoi / acasa / aplicatii), care ramaneau peste joc si acopereau butoane. Barele apar doar daca tragi cu degetul
de la margine si se ascund singure. Se reaplica la revenirea in aplicatie si cand jocul primeste din nou focusul.
"""
import pathlib, re, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'android')
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
    man.write_text(xml)
print(f'{man}: ecranul orizontal / vertical declarate optionale (aplicatia apare pe toate dispozitivele)')
