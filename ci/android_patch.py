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
