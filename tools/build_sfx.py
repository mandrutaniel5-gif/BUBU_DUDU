#!/usr/bin/env python3
"""Construieste bancul de sunete al jocului din colectii CC0 / CC-BY (vezi docs/SUNETE.md).

Folosire:  python3 tools/build_sfx.py <folder-cu-colectii>
 - fiecare sunet: taie linistea, limiteaza durata, egalizeaza volumul, fade-uri scurte
 - buclele (ambiante): bucata de N secunde, inceputul si sfarsitul se impletesc (crossfade) -> bucla continua
 - iesire: src/assets/sfx/<id>_<n>.mp3 (mono, 44.1 kHz) + src/assets/sfx/manifest.json
Sursele (relativ la <folder>):
  meta = facebookincubator/Meta-open-sound (corpora/oculus-audio-pack, CC BY 4.0)
  lav  = lavenderdotpet/CC0-Public-Domain-Sounds (CC0)
  free = EternityForest/Free-SFX (CC0)
  wyz  = wyzowl/sfx-kit (CC0)
  ogsi = Mcamento8/open-game-sfx-index (Kenney + OpenGameArt, CC0)
  noix = abetusk/noixer (Freesound CC0)
  amb  = funcoder/omarchy-ambient (Freesound CC0)
  npm/terminalfart/package = terminalfart (Apache-2.0)
"""
import json, os, subprocess, sys
import numpy as np

SR = 44100
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'sfx')
M = 'meta/corpora/oculus-audio-pack/ogg/'

def r(prefix, names): return [prefix + n for n in names]
def seq(fmt, a, b): return [fmt % i for i in range(a, b + 1)]

# id: (fisiere, optiuni)   optiuni: max (s), db (castig), hp/lp (Hz), loop (secunde), start (s), bites (taie in bucati)
SFX = {
  # ---------- interfata / bani
  'click':   (['wyz/sounds/interface/click-tap-soft.wav', 'wyz/sounds/interface/click-button-soft.wav'], {'max': 0.4, 'db': -8}),
  'coin':    (['wyz/sounds/money/money-coin-drop.wav', 'ogsi/audio/rpg-audio/handleCoins.ogg', 'ogsi/audio/rpg-audio/handleCoins2.ogg'], {'max': 1.0, 'db': -4}),
  'register': (['wyz/sounds/money/money-register.wav'], {'max': 1.6, 'db': -5}),
  'good':    (['wyz/sounds/notifications/notification-success-chime.wav', 'wyz/sounds/notifications/notification-success-bubble.wav'], {'max': 1.4, 'db': -6}),
  'bad':     (['wyz/sounds/notifications/notification-failure-pluck.wav', 'wyz/sounds/notifications/notification-failure-minor.wav'], {'max': 1.0, 'db': -7}),
  'pop':     (['wyz/sounds/pops/pop-small-bubble.wav', 'wyz/sounds/pops/pop-medium-bubble.wav', 'wyz/sounds/pops/pop-small-in.wav'], {'max': 0.6, 'db': -6}),
  'levelup': ([M + 'MUSCStngr_LevelUpMallet_OS_01.ogg'], {'max': 3.0, 'db': -6}),
  'victory': ([M + 'MUSCStngr_VictoryMallet_OS_01.ogg', M + 'MUSCStngr_VictoryOrchestral_OS_01.ogg'], {'max': 4.0, 'db': -6}),
  'applause': (['wyz/sounds/celebration/celebration-applause-small.wav'], {'max': 3.5, 'db': -8}),
  'whoosh':  (r(M, ['WHSH_WhooshSmall_OS_01.ogg', 'WHSH_WhooshSmall_OS_02.ogg', 'WHSH_WhooshSmall_OS_03.ogg']), {'max': 0.9, 'db': -8}),
  'boing':   (r(M, ['TOONBoing_BounceCartoony_OS_01.ogg', 'TOONBoing_BounceCartoony_OS_02.ogg', 'TOONBoing_BounceCartoony_OS_03.ogg']), {'max': 1.0, 'db': -6}),
  'page':    (['ogsi/audio/rpg-audio/bookFlip1.ogg', 'ogsi/audio/rpg-audio/bookFlip2.ogg', 'ogsi/audio/rpg-audio/bookFlip3.ogg'], {'max': 0.8, 'db': -6}),
  'shopbell': (['wyz/sounds/everyday-props/props-shop-bell.wav'], {'max': 1.8, 'db': -7}),
  'door_open':  ([M + 'DOORWood_FrontDoorOpen_OS_01.ogg', 'ogsi/audio/rpg-audio/doorOpen_1.ogg'], {'max': 1.4, 'db': -6}),
  'door_close': ([M + 'DOORWood_FrontDoorClose_OS_01.ogg', 'ogsi/audio/rpg-audio/doorClose_1.ogg'], {'max': 1.2, 'db': -6}),
  'drawer':  (r(M, ['DRWRWood_DrawerOpen_OS_01.ogg', 'DRWRWood_DrawerClose_OS_01.ogg']), {'max': 1.0, 'db': -6}),
  'switch':  (r(M, ['MECHSwtch_SwitchSmallOn_OS_01.ogg', 'MECHSwtch_SwitchSmallOff_OS_01.ogg']), {'max': 0.4, 'db': -6}),
  'typing':  (['wyz/sounds/keyboard/keyboard-typing-quick-short.wav', 'wyz/sounds/keyboard/keyboard-typing-steady-short.wav'], {'max': 1.6, 'db': -9}),
  'cloth':   (r(M, ['CLOTHMvmt_ClothingMovement_OS_01.ogg', 'CLOTHMvmt_ClothingMovement_OS_02.ogg', 'CLOTHMvmt_ClothingMovement_OS_03.ogg']), {'max': 1.0, 'db': -6}),
  'zip':     (['wyz/sounds/everyday-props/props-zip.wav'], {'max': 0.8, 'db': -8}),
  'paper':   (r(M, ['PAPRHndl_PaperCrumple_OS_01.ogg']), {'max': 1.0, 'db': -8}),
  # ---------- pasi (mers / fuga) pe suprafete
  'step_grass': (r(M, seq('FEETHmn_ShoeGrassWalk_OS_%02d.ogg', 1, 5)), {'max': 0.45, 'db': -12}),
  'step_wood':  (r(M, seq('FEETHmn_ShoeWoodWalk_OS_%02d.ogg', 1, 5)), {'max': 0.45, 'db': -12}),
  'step_stone': (r(M, seq('FEETHmn_ShoeConcreteWalk_OS_%02d.ogg', 1, 5)), {'max': 0.45, 'db': -13}),
  'step_dirt':  (r(M, seq('FEETHmn_ShoeDirtWalk_OS_%02d.ogg', 1, 5)), {'max': 0.45, 'db': -12}),
  'run_grass':  (r(M, seq('FEETHmn_ShoeGrassRun_OS_%02d.ogg', 1, 5)), {'max': 0.4, 'db': -10}),
  'run_wood':   (r(M, seq('FEETHmn_ShoeWoodRun_OS_%02d.ogg', 1, 5)), {'max': 0.4, 'db': -10}),
  'run_stone':  (r(M, seq('FEETHmn_ShoeConcreteRun_OS_%02d.ogg', 1, 5)), {'max': 0.4, 'db': -11}),
  'run_dirt':   (r(M, seq('FEETHmn_ShoeDirtRun_OS_%02d.ogg', 1, 5)), {'max': 0.4, 'db': -10}),
  'jump_land':  (r(M, ['FEETHmn_ShoeGrassLand_OS_01.ogg', 'FEETHmn_ShoeDirtLand_OS_01.ogg']), {'max': 0.6, 'db': -6}),
  # ---------- corpul
  'fart':     (['npm/terminalfart/package/sounds/toot.mp3', 'npm/terminalfart/package/sounds/dry.mp3'], {'max': 1.6, 'db': -3}),
  'fart_wet': (['npm/terminalfart/package/sounds/wet.mp3'], {'max': 1.8, 'db': -3}),
  'bigfart':  (['npm/terminalfart/package/sounds/hellacious.mp3', 'npm/terminalfart/package/sounds/poop-toot.mp3'], {'max': 2.6, 'db': -2}),
  'burp':     (r(M, ['HMNBurp_Burp_OS_01.ogg', 'HMNBurp_Burp_OS_02.ogg', 'HMNBurp_Burp_OS_03.ogg']), {'max': 1.4, 'db': -4}),
  'laugh_f':  (r(M, ['VOXLaff_Female01Laugh_OS_01.ogg', 'VOXLaff_Female01Laugh_OS_02.ogg', 'VOXLaff_Female02Laugh_OS_01.ogg']), {'max': 2.2, 'db': -6}),
  'laugh_m':  (r(M, ['VOXLaff_Male01Laugh_OS_01.ogg', 'VOXLaff_Male02Laugh_OS_01.ogg', 'VOXLaff_Male02Laugh_OS_02.ogg']), {'max': 2.2, 'db': -6}),
  'yawn':     (['free/Owlish/Sound Effects Pack/Human/yawn1.opus', 'free/Owlish/Sound Effects Pack/Human/yawn2.opus'], {'max': 2.6, 'db': -6}),
  'cough':    (['free/Owlish/Sound Effects Pack/Human/cough1.opus', 'free/Owlish/Sound Effects Pack/Human/cough2.opus', 'free/Owlish/Sound Effects Pack/Human/cough3.opus'], {'max': 1.4, 'db': -7}),
  'sniff':    (['free/Owlish/Sound Effects Pack/Human/sniff.opus'], {'max': 1.0, 'db': -7}),
  'gasp':     (['free/Owlish/Sound Effects Pack/Human/gasp1.opus'], {'max': 1.0, 'db': -7}),
  'snore':    (['free/Owlish/Sound Effects Pack/Human/breath-male.opus'], {'bites': 3, 'max': 2.4, 'db': -4, 'lp': 1400, 'snore': True}),
  'gulp':     (['free/Owlish/Sound Effects Pack/Impacts/gulp1.opus', 'free/Owlish/Sound Effects Pack/Impacts/gulp2.opus'], {'max': 0.9, 'db': -5}),
  'drink':    (['free/Owlish/Sound Effects Pack/Human/drink-sip-and-swallow.opus', 'noix/assets/564037__siteflight__drink-slurping-sound-from-a-cup.mp3'], {'max': 1.8, 'db': -6}),
  'crunch':   (['noix/assets/707733__lizelle__eating-chips.mp3', 'noix/assets/551997__legnalegna55__eating-sound-asmr-crunchy-sound.mp3'], {'bites': 6, 'max': 0.6, 'db': -5}),
  'shh':      (['free/Owlish/Sound Effects Pack/Human/shh1.opus'], {'max': 1.2, 'db': -7}),
  # ---------- casa
  'faucet_on':  ([M + 'WATRPlmb_FaucetOn_OS_01.ogg'], {'max': 1.2, 'db': -7}),
  'faucet_off': ([M + 'WATRPlmb_FaucetOff_OS_01.ogg'], {'max': 1.0, 'db': -7}),
  'flush':      ([M + 'WATRPlmb_ToiletFlushEuropean_OS_01.ogg', 'lav/100-CC0-SFX/toilet_01.ogg'], {'max': 5.0, 'db': -5}),
  'splash':     (['lav/40-cc0-water-splash-slime-sfx/splash_01.ogg', 'lav/40-cc0-water-splash-slime-sfx/splash_03.ogg', 'lav/40-cc0-water-splash-slime-sfx/splash_05.ogg', 'wyz/sounds/everyday-props/props-splash.wav'], {'max': 1.4, 'db': -6}),
  'bubble':     (['lav/40-cc0-water-splash-slime-sfx/bubble_01.ogg', 'lav/40-cc0-water-splash-slime-sfx/bubble_02.ogg', 'lav/40-cc0-water-splash-slime-sfx/bubble_03.ogg'], {'max': 0.6, 'db': -8}),
  'squelch':    (['lav/40-cc0-water-splash-slime-sfx/slime_01.ogg', 'lav/40-cc0-water-splash-slime-sfx/slime_02.ogg', 'lav/40-cc0-water-splash-slime-sfx/slime_03.ogg', 'lav/40-cc0-water-splash-slime-sfx/slime_04.ogg'], {'max': 0.9, 'db': -5}),
  'dishes':     (['lav/100-CC0-SFX/dishes_01.ogg', 'lav/100-CC0-SFX/dishes_02.ogg', 'lav/100-CC0-SFX/dishes_03.ogg', 'lav/100-CC0-SFX/dishes_04.ogg'], {'max': 1.4, 'db': -7}),
  'clink':      (['lav/100-CC0-SFX/glass_01.ogg', 'lav/100-CC0-SFX/glass_02.ogg', 'lav/100-CC0-SFX/glass_03.ogg'], {'max': 1.2, 'db': -8}),
  'fridge':     (['lav/100-CC0-SFX/microwave_door_open.ogg', 'lav/100-CC0-SFX/microwave_door_close.ogg'], {'max': 1.0, 'db': -6}),
  'knife':      (['ogsi/audio/rpg-audio/knifeSlice.ogg', 'ogsi/audio/rpg-audio/knifeSlice2.ogg'], {'max': 0.6, 'db': -6}),
  'pan':        (['ogsi/audio/rpg-audio/metalPot1.ogg', 'ogsi/audio/rpg-audio/metalPot2.ogg', 'ogsi/audio/rpg-audio/metalPot3.ogg'], {'max': 0.9, 'db': -6}),
  'spoon':      ([M + 'FOODTware_SpoonDrop_OS_01.ogg', M + 'CERMImpt_CeramicSmallImpact_OS_01.ogg'], {'max': 0.8, 'db': -8}),
  'kettle':     (['free/Owlish/Sound Effects Pack/Water/kettle-boil.opus'], {'max': 4.0, 'db': -9}),
  'tea':        (['free/Freesound/Foley/322393__glitchedtones__cup-stir-making-tea.opus'], {'max': 2.4, 'db': -8}),
  'clock_tick': (['wyz/sounds/time/time-clock.wav'], {'max': 2.0, 'db': -14}),
  'alarm':      (['wyz/sounds/time/time-alarm.wav'], {'max': 2.0, 'db': -9}),
  'doorbell':   (['wyz/sounds/everyday-props/props-doorbell.wav'], {'max': 2.0, 'db': -8}),
  'spray':      (['free/Owlish/Sound Effects Pack/Water/spray-bottle.opus'], {'max': 1.0, 'db': -8}),
  'pour':       (['lav/100-cc0-sfx-2/sfx100v2_loop_water_01.ogg'], {'max': 1.6, 'db': -8}),
  # ---------- curte / padure / unelte
  'chop':     (['ogsi/audio/rpg-audio/chop.ogg', 'ogsi/audio/impact-sounds/impactWood_heavy_000.ogg', 'ogsi/audio/impact-sounds/impactWood_heavy_002.ogg'], {'max': 0.8, 'db': -4}),
  'tree_fall': (['free/rubberduck/WoodMetal/wood_falling_01.opus', 'free/rubberduck/WoodMetal/wood_cracking_01.opus'], {'max': 2.0, 'db': -5}),
  'mine':     (['ogsi/audio/impact-sounds/impactMining_000.ogg', 'ogsi/audio/impact-sounds/impactMining_002.ogg', 'ogsi/audio/impact-sounds/impactMining_004.ogg'], {'max': 0.8, 'db': -5}),
  'hammer':   (['free/rubberduck/WoodMetal/hammer_01.opus', 'free/rubberduck/WoodMetal/hammer_02.opus', 'free/rubberduck/WoodMetal/wood_hammer_01.opus'], {'max': 0.7, 'db': -6}),
  'saw':      ([M + 'TOOLHand_WoodCutSaw_OS_01.ogg'], {'max': 2.5, 'db': -7}),
  'dig':      (['free/Freesound/Foley/260130__splicesound__hand-digging-dirt-leaves-crunch.opus'], {'bites': 3, 'max': 0.9, 'db': -6}),
  'leaves':   (r(M, ['VEGELeaf_MovementThroughBushes_OS_01.ogg', 'VEGELeaf_MovementThroughBushes_OS_02.ogg', 'VEGELeaf_MovementThroughBushes_OS_03.ogg']), {'max': 1.2, 'db': -7}),
  'bucket':   ([M + 'METLImpt_BucketDrop_OS_01.ogg'], {'max': 1.2, 'db': -7}),
  'reel':     (['free/Freesound/Mechanical/507077__paulprit__angel-fly-fish-reel-slow-wind_2.opus'], {'max': 2.0, 'db': -8}),
  'wood_drop': ([M + 'WOODImpt_LargeWoodDrop_OS_01.ogg', 'ogsi/audio/impact-sounds/impactPlank_medium_000.ogg'], {'max': 1.0, 'db': -6}),
  'metal_hit': (['ogsi/audio/impact-sounds/impactMetal_light_000.ogg', 'ogsi/audio/impact-sounds/impactMetal_light_002.ogg'], {'max': 0.6, 'db': -8}),
  # ---------- animale
  'chicken':  ([M + 'BIRDFowl_Chicken_OS_01.ogg'], {'max': 2.5, 'db': -10}),
  'duck':     ([M + 'BIRDFowl_Duck_OS_01.ogg'], {'max': 2.0, 'db': -10}),
  'dog':      (r(M, ['ANMLDog_DogBark_OS_01.ogg', 'ANMLDog_DogBark_OS_02.ogg', 'ANMLDog_DogAttention_OS_01.ogg']), {'max': 1.6, 'db': -9}),
  'sheep':    (r(M, ['ANMLFarm_Sheep_OS_01.ogg', 'ANMLFarm_Sheep_OS_02.ogg']), {'max': 2.0, 'db': -11}),
  'horse':    ([M + 'ANMLHors_HorseNeighAmbient_OS_01.ogg'], {'max': 2.4, 'db': -12}),
  'pig':      ([M + 'ANMLFarm_PigSqueal_OS_01.ogg'], {'max': 1.4, 'db': -12}),
  'cat':      (['lav/Micro Pack - Cat Meows/Cat Meows - Food Time 1.wav', 'lav/Micro Pack - Cat Meows/Cat Meows - Food Time 3.wav', 'lav/Micro Pack - Cat Meows/Cat Meows - Tiny Tito.wav'], {'max': 1.4, 'db': -8}),
  'purr':     (['noix/assets/252645__yetcop__cat-purr-gato-ronroneando.mp3'], {'max': 3.0, 'db': -9}),
  'owl':      (['free/Freesound/Animals/465697__breviceps__owl-hoot.opus'], {'max': 2.5, 'db': -11}),
  'birds':    (r(M, ['AMBForst_ForestBirds_OS_01.ogg', 'AMBForst_ForestBirds_OS_02.ogg', 'AMBForst_ForestBirds_OS_03.ogg']), {'max': 4.0, 'db': -11}),
  'bells':    (['noix/assets/501115__felix-blume__peal-of-church-bells-on-sunday-in-paris.mp3'], {'max': 9.0, 'start': 2.0, 'db': -12}),
  # ---------- vehicule / oras
  'car_start': ([M + 'VEHCar_CarStartRunStop_OS_01.ogg'], {'max': 5.0, 'db': -10}),
  'car_door':  ([M + 'VEHDoor_CarDoorClose_OS_01.ogg'], {'max': 1.0, 'db': -8}),
  'bus_doors': (r(M, ['TRNDoor_TrainDoorsOpen_OS_01.ogg', 'TRNDoor_TrainDoorsClose_OS_01.ogg']), {'max': 2.4, 'db': -9}),
  'bike_bell': (['lav/100-CC0-SFX/bell_01.ogg', 'lav/100-CC0-SFX/bell_02.ogg'], {'max': 1.4, 'db': -8}),
  'train':     ([M + 'TRNElec_TrainPassby_OS_01.ogg'], {'max': 6.0, 'db': -16}),
  'chimes':    (['noix/assets/525052__smand__wind-chime-small.mp3'], {'max': 3.0, 'db': -14}),
  'popcorn':   (['noix/assets/585463__guiller1220__20-crispetas_s.mp3'], {'bites': 4, 'max': 0.8, 'db': -8}),
}

# bucle de fundal (ambiante): (fisier, secunde, start, castig dB, hp, lp)
LOOPS = {
  'amb_room':     (M + 'AMBHome_RoomTone_LOOP_01.ogg', 16, 0, -20, 0, 0),
  'amb_yard':     (M + 'AMBFarm_FarmGeneric_LOOP_01.ogg', 28, 2, -16, 0, 0),
  'amb_night':    (M + 'AMBForst_Night_LOOP_01.ogg', 26, 2, -16, 0, 0),
  'amb_crickets': ('amb/sounds/crickets.ogg', 24, 10, -20, 0, 0),
  'amb_forest':   (M + 'AMBForst_Forest_LOOP_01.ogg', 28, 2, -14, 0, 0),
  'amb_wind':     (M + 'WINDVege_LightWindTreesBirds_LOOP_01.ogg', 28, 2, -15, 0, 0),
  'amb_lake':     (M + 'AMBLake_LakeShore_LOOP_01.ogg', 22, 2, -17, 0, 0),
  'amb_city':     (M + 'AMBUrbn_CityEuroDaytime_LOOP_01.ogg', 30, 2, -14, 0, 0),
  'amb_restaurant': (M + 'CRWDConv_Restaurant_LOOP_01.ogg', 22, 2, -16, 0, 0),
  'amb_rain':     (M + 'RAIN_CityRain_LOOP_01.ogg', 20, 2, -18, 0, 0),
  'fire_loop':    ('free/PagDev/fire_loop.opus', 10, 0, -12, 0, 0),
  'water_loop':   (M + 'WATRPlmb_FaucetWaterRun_LOOP_01.ogg', 8, 0.5, -12, 0, 0),
  'bath_loop':    (M + 'WATRBubl_WaterBubbles_LOOP_01.ogg', 10, 0.5, -14, 0, 0),
  'fountain_loop': (M + 'WATRFall_Waterfall_LOOP_01.ogg', 12, 1, -16, 0, 0),
  'stream_loop':  (M + 'WATRFlow_CreekInWoods_LOOP_01.ogg', 14, 1, -15, 0, 0),
  'boil_loop':    ('lav/30-cc0-sfx-loops/water_boiling.ogg', 8, 0.5, -15, 0, 0),
  'sizzle_loop':  (M + 'RAIN_CityRain_LOOP_01.ogg', 8, 4, -12, 2600, 9000),   # ploaie filtrata = sfaraitul tigaii
  'engine_slow':  (M + 'VEHCar_CarEngineSlow_LOOP_01.ogg', 6, 0.5, -12, 0, 0),
  'engine_high':  (M + 'VEHCar_CarEngineHigh_LOOP_01.ogg', 6, 0.5, -13, 0, 0),
  'machine_loop': (M + 'MACHMisc_MachineHum_LOOP_01.ogg', 8, 0.5, -16, 0, 0),
  'pedal_loop':   (M + 'CLOTHMvmt_MovementWithGear_OS_01.ogg', 0, 0, -18, 0, 0),
}

def decode(path, start=0.0, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(start)]
    if dur: cmd += ['-t', str(dur)]
    cmd += ['-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def filt(x, hp=0, lp=0):
    if not hp and not lp: return x
    af = ','.join(f for f in ([f'highpass=f={hp}'] if hp else []) + ([f'lowpass=f={lp}'] if lp else []))
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', af, '-f', 'f32le', '-'], input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()

def trim_silence(x, thr_db=-45):
    thr = 10 ** (thr_db / 20); a = np.abs(x)
    idx = np.where(a > thr * max(1e-9, a.max()))[0]
    if not len(idx): return x
    s = max(0, idx[0] - int(0.01 * SR)); e = min(len(x), idx[-1] + int(0.04 * SR))
    return x[s:e]

def fades(x, fi=0.004, fo=0.05):
    n1 = min(len(x), int(fi * SR)); n2 = min(len(x), int(fo * SR))
    if n1: x[:n1] *= np.linspace(0, 1, n1)
    if n2: x[-n2:] *= np.linspace(1, 0, n2)
    return x

def normalize(x, rms_db=-18.0, peak_db=-1.0, gain_db=0.0):
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9; pk = np.abs(x).max() + 1e-9
    g = min(10 ** (rms_db / 20) / rms, 10 ** (peak_db / 20) / pk) * 10 ** (gain_db / 20)
    return np.clip(x * g, -1, 1)

def make_loop(x, xf=1.2):
    n = int(xf * SR)
    if len(x) < 3 * n: return x
    body = x[:-n].copy(); tail = x[-n:]
    t = np.linspace(0, np.pi / 2, n)
    body[:n] = body[:n] * np.sin(t) + tail * np.cos(t)   # sfarsitul se impleteste in inceput (putere egala)
    return body

def encode(x, path, kbps=64):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', path], input=x.astype(np.float32).tobytes(), check=True)

def bites(x, n, maxs):
    # imparte un sunet lung (mestecat, crispete) in "muscaturi": varfurile de energie
    win = int(0.02 * SR); e = np.convolve(np.abs(x), np.ones(win) / win, mode='same')
    out = []; gap = int(0.35 * SR); i = int(0.2 * SR)
    while i < len(x) - int(maxs * SR) and len(out) < n:
        j = i + int(np.argmax(e[i:i + gap])); s = max(0, j - int(0.05 * SR))
        out.append(x[s:s + int(maxs * SR)].copy()); i = s + int(maxs * SR) + int(0.1 * SR)
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.mp3'): os.remove(os.path.join(OUT, f))
    man = {}; total = 0
    for sid, (files, o) in SFX.items():
        vars_ = []
        for f in files:
            p = os.path.join(ROOT, f)
            if not os.path.exists(p): print('LIPSESTE', sid, f); continue
            x = decode(p, o.get('start', 0))
            if o.get('snore'):
                # sforait: respiratie reala, incetinita, cu "vibratia" moale a sforaitului (modulatie ~26 Hz)
                t = np.arange(len(x)) / SR
                x = x * (0.55 + 0.45 * np.sin(2 * np.pi * 26 * t)) * 2.2
                idx = np.arange(0, len(x) - 1, 0.82); x = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
            x = filt(x, o.get('hp', 0), o.get('lp', 0))
            chunks = bites(x, o['bites'], o['max']) if o.get('bites') else [x]
            for c in chunks:
                c = trim_silence(c)[: int(o.get('max', 3) * SR)]
                if len(c) < int(0.03 * SR): continue
                vars_.append(fades(normalize(c, gain_db=o.get('db', 0))))
        names = []
        for i, c in enumerate(vars_):
            fn = f'{sid}_{i}.mp3'; encode(c, os.path.join(OUT, fn)); names.append(fn); total += os.path.getsize(os.path.join(OUT, fn))
        man[sid] = {'files': names}
    for sid, (f, secs, start, db, hp, lp) in LOOPS.items():
        p = os.path.join(ROOT, f)
        if not os.path.exists(p): print('LIPSESTE', sid, f); continue
        x = decode(p, start, (secs + 1.2) if secs else None)
        x = filt(x, hp, lp)
        if not secs: x = trim_silence(x)
        x = make_loop(x, 1.2 if secs else 0.3)
        x = normalize(x, rms_db=-20, gain_db=db + 20 - 14)
        fn = f'{sid}.mp3'; encode(x, os.path.join(OUT, fn), 56); total += os.path.getsize(os.path.join(OUT, fn))
        man[sid] = {'files': [fn], 'loop': True}
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=0)
    print(f'{len(man)} sunete, {sum(len(v["files"]) for v in man.values())} fisiere, {total / 1e6:.2f} MB')

if __name__ == '__main__':
    main()
