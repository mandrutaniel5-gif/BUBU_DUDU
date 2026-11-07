#!/usr/bin/env python3
"""Pregateste proiectul iOS generat de Capacitor (rulat in GitHub Actions, dupa `npx cap sync ios`).

1. Sunetul: sesiunea audio a aplicatiei devine "playback" (nu mai e taiata de butonul de silentios) si se
   reporneste dupa intreruperi (apel, Siri, alarma, alta aplicatie) si cand revii in aplicatie.
2. Jocul e marcat ca JOC (Game Mode pe iOS 18+): categoria games, GCSupportsGameMode, ecran intreg fara bara de sus.
"""
import plistlib, re, sys, pathlib

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'ios/App/App')
plist_p = root / 'Info.plist'
with open(plist_p, 'rb') as f:
    pl = plistlib.load(f)
pl['LSApplicationCategoryType'] = 'public.app-category.games'
pl['GCSupportsGameMode'] = True
pl['UIRequiresFullScreen'] = True
pl['UIStatusBarHidden'] = True
pl['UIViewControllerBasedStatusBarAppearance'] = False
pl['CADisableMinimumFrameDurationOnPhone'] = True   # pana la 120 de cadre pe iPhone-urile cu ProMotion
pl['UIApplicationSupportsIndirectInputEvents'] = True
for k in ('UISupportedInterfaceOrientations', 'UISupportedInterfaceOrientations~ipad'):
    pl[k] = ['UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight']
with open(plist_p, 'wb') as f:
    plistlib.dump(pl, f)
print('Info.plist: joc (Game Mode), ecran intreg, orizontala')

app_p = root / 'AppDelegate.swift'
src = app_p.read_text()
if 'BubuAudio' not in src:
    if 'import AVFoundation' not in src:
        src = src.replace('import UIKit', 'import UIKit\nimport AVFoundation', 1)
    helper = '''
/// Sunetul jocului: sesiune "playback" (merge si cu telefonul pe silentios), repornita dupa intreruperi.
enum BubuAudio {
    static func activate() {
        let s = AVAudioSession.sharedInstance()
        try? s.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? s.setActive(true)
    }
    static func observe() {
        NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { n in
            guard let raw = n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .ended { activate() }
        }
        NotificationCenter.default.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification, object: nil, queue: .main) { _ in activate() }
    }
}
'''
    src = src.replace('@UIApplicationMain', helper + '\n@UIApplicationMain', 1) if '@UIApplicationMain' in src else src.replace('@main', helper + '\n@main', 1)
    m = re.search(r'didFinishLaunchingWithOptions[^{]*\{', src)
    if not m:
        sys.exit('AppDelegate: nu gasesc didFinishLaunchingWithOptions')
    src = src[:m.end()] + '\n        BubuAudio.activate()\n        BubuAudio.observe()' + src[m.end():]
    m = re.search(r'func applicationDidBecomeActive\([^)]*\)\s*\{', src)
    if m:
        src = src[:m.end()] + '\n        BubuAudio.activate()' + src[m.end():]
    else:
        src = src.rstrip()
        assert src.endswith('}')
        src = src[:-1] + '\n    func applicationDidBecomeActive(_ application: UIApplication) {\n        BubuAudio.activate()\n    }\n}\n'
    app_p.write_text(src)
    print('AppDelegate.swift: sesiunea audio playback + repornire dupa intreruperi')

# 3. Versiunea jocului (din package.json): fara asta, iPhone-ul arata mereu 1.0 (1), iar Sideloadly / AltStore cereau s-o scrii de mana
import json, shutil
repo = root.resolve().parents[2]
ver = json.loads((repo / 'package.json').read_text())['version']
a, b, c = (int(x) for x in ver.split('.'))
build = str(a * 10000 + b * 100 + c)   # acelasi numar ca versionCode pe Android
with open(plist_p, 'rb') as f:
    pl = plistlib.load(f)
pl['CFBundleShortVersionString'] = ver
pl['CFBundleVersion'] = build
pl['CFBundleName'] = 'Bubu & Dudu'
pl['CFBundleDisplayName'] = 'Bubu & Dudu'
with open(plist_p, 'wb') as f:
    plistlib.dump(pl, f)
pbx = root.parent / 'App.xcodeproj' / 'project.pbxproj'
if pbx.exists():
    t = pbx.read_text()
    t = re.sub(r'MARKETING_VERSION = [^;]+;', f'MARKETING_VERSION = {ver};', t)
    t = re.sub(r'CURRENT_PROJECT_VERSION = [^;]+;', f'CURRENT_PROJECT_VERSION = {build};', t)
    pbx.write_text(t)
print(f'Versiunea: {ver} (build {build})')

# 4. Iconita: cea cu Bubu si Dudu (1024x1024, fara transparenta), in locul celei goale din sablonul Capacitor
icons = root / 'Assets.xcassets' / 'AppIcon.appiconset'
icons.mkdir(parents=True, exist_ok=True)
for p in icons.glob('*.png'):
    p.unlink()
shutil.copy(repo / 'ci' / 'ios-icon-1024.png', icons / 'AppIcon-1024.png')
(icons / 'Contents.json').write_text(json.dumps({
    'images': [{'filename': 'AppIcon-1024.png', 'idiom': 'universal', 'platform': 'ios', 'size': '1024x1024'}],
    'info': {'author': 'xcode', 'version': 1},
}, indent=2))
print('Iconita: AppIcon-1024.png (Bubu si Dudu)')
