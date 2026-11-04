# Sunetele jocului

Toate sunetele sunt înregistrări reale, libere de folosit, prelucrate cu `tools/build_sfx.py`
(tăiat liniștea, volum egalizat, fade-uri, bucle continue) în `src/assets/sfx/` (MP3 mono).
Dacă un sunet lipsește, jocul folosește varianta sintetizată (`src/engine/sfx.ts`).

## Colecții și licențe

- **Oculus Audio Pack (Meta Open Sound)** — https://github.com/facebookincubator/Meta-open-sound — CC BY 4.0 — © Meta Platforms, Inc. (atribuire obligatorie)
- **CC0 Public Domain Sounds (lavenderdotpet)** — https://github.com/lavenderdotpet/CC0-Public-Domain-Sounds — CC0 1.0
- **Free-SFX (EternityForest)** — https://github.com/EternityForest/Free-SFX — CC0 1.0
- **SFX Kit (Wyzowl)** — https://github.com/wyzowl/sfx-kit — CC0 1.0
- **Kenney RPG Audio + Impact Sounds (prin open-game-sfx-index)** — https://kenney.nl — CC0 1.0
- **Înregistrări Freesound CC0 (prin abetusk/noixer)** — https://freesound.org — CC0 1.0
- **Omarchy Ambient (înregistrări Freesound CC0)** — https://github.com/funcoder/omarchy-ambient — CC0 1.0
- **TerminalFart (npm)** — https://www.npmjs.com/package/terminalfart — Apache-2.0 — Copyright 2026 Electric Wolfe Marshmallow Hypertext

### Atribuiri obligatorii

- Unele sunete (fanfara de nivel/victorie, unele efecte) provin din *Oculus Audio Pack* de Meta Platforms, Inc., licențiat [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Sunetele au fost tăiate, normalizate și convertite.
- Bășinile „terminalfart”: Apache License 2.0. NOTICE:

  > TerminalFart — Copyright 2026 Electric Wolfe Marshmallow Hypertext. This product includes software developed by Electric Wolfe Marshmallow Hypertext.

Creditele apar și în joc: Meniu → 📜 Credite (licențele complete: `docs/licente/`).

## Lista sunetelor

| id | tip | colecție | fișiere sursă |
|---|---|---|---|
| `click` | efect | SFX Kit | click-tap-soft.wav, click-button-soft.wav |
| `coin` | efect | Kenney RPG Audio + Impact Sounds, SFX Kit | money-coin-drop.wav, handleCoins.ogg, handleCoins2.ogg |
| `register` | efect | SFX Kit | money-register.wav |
| `good` | efect | SFX Kit | notification-success-chime.wav, notification-success-bubble.wav |
| `bad` | efect | SFX Kit | notification-failure-pluck.wav, notification-failure-minor.wav |
| `pop` | efect | SFX Kit | pop-small-bubble.wav, pop-medium-bubble.wav, pop-small-in.wav |
| `levelup` | efect | Oculus Audio Pack | MUSCStngr_LevelUpMallet_OS_01.ogg |
| `victory` | efect | Oculus Audio Pack | MUSCStngr_VictoryMallet_OS_01.ogg, MUSCStngr_VictoryOrchestral_OS_01.ogg |
| `applause` | efect | SFX Kit | celebration-applause-small.wav |
| `whoosh` | efect | Oculus Audio Pack | WHSH_WhooshSmall_OS_01.ogg, WHSH_WhooshSmall_OS_02.ogg, WHSH_WhooshSmall_OS_03.ogg |
| `boing` | efect | Oculus Audio Pack | TOONBoing_BounceCartoony_OS_01.ogg, TOONBoing_BounceCartoony_OS_02.ogg, TOONBoing_BounceCartoony_OS_03.ogg |
| `page` | efect | Kenney RPG Audio + Impact Sounds | bookFlip1.ogg, bookFlip2.ogg, bookFlip3.ogg |
| `shopbell` | efect | SFX Kit | props-shop-bell.wav |
| `door_open` | efect | Oculus Audio Pack, Kenney RPG Audio + Impact Sounds | DOORWood_FrontDoorOpen_OS_01.ogg, doorOpen_1.ogg |
| `door_close` | efect | Oculus Audio Pack, Kenney RPG Audio + Impact Sounds | DOORWood_FrontDoorClose_OS_01.ogg, doorClose_1.ogg |
| `drawer` | efect | Oculus Audio Pack | DRWRWood_DrawerOpen_OS_01.ogg, DRWRWood_DrawerClose_OS_01.ogg |
| `switch` | efect | Oculus Audio Pack | MECHSwtch_SwitchSmallOn_OS_01.ogg, MECHSwtch_SwitchSmallOff_OS_01.ogg |
| `typing` | efect | SFX Kit | keyboard-typing-quick-short.wav, keyboard-typing-steady-short.wav |
| `cloth` | efect | Oculus Audio Pack | CLOTHMvmt_ClothingMovement_OS_01.ogg, CLOTHMvmt_ClothingMovement_OS_02.ogg, CLOTHMvmt_ClothingMovement_OS_03.ogg |
| `zip` | efect | SFX Kit | props-zip.wav |
| `paper` | efect | Oculus Audio Pack | PAPRHndl_PaperCrumple_OS_01.ogg |
| `step_grass` | efect | Oculus Audio Pack | FEETHmn_ShoeGrassWalk_OS_01.ogg, FEETHmn_ShoeGrassWalk_OS_02.ogg, FEETHmn_ShoeGrassWalk_OS_03.ogg … |
| `step_wood` | efect | Oculus Audio Pack | FEETHmn_ShoeWoodWalk_OS_01.ogg, FEETHmn_ShoeWoodWalk_OS_02.ogg, FEETHmn_ShoeWoodWalk_OS_03.ogg … |
| `step_stone` | efect | Oculus Audio Pack | FEETHmn_ShoeConcreteWalk_OS_01.ogg, FEETHmn_ShoeConcreteWalk_OS_02.ogg, FEETHmn_ShoeConcreteWalk_OS_03.ogg … |
| `step_dirt` | efect | Oculus Audio Pack | FEETHmn_ShoeDirtWalk_OS_01.ogg, FEETHmn_ShoeDirtWalk_OS_02.ogg, FEETHmn_ShoeDirtWalk_OS_03.ogg … |
| `run_grass` | efect | Oculus Audio Pack | FEETHmn_ShoeGrassRun_OS_01.ogg, FEETHmn_ShoeGrassRun_OS_02.ogg, FEETHmn_ShoeGrassRun_OS_03.ogg … |
| `run_wood` | efect | Oculus Audio Pack | FEETHmn_ShoeWoodRun_OS_01.ogg, FEETHmn_ShoeWoodRun_OS_02.ogg, FEETHmn_ShoeWoodRun_OS_03.ogg … |
| `run_stone` | efect | Oculus Audio Pack | FEETHmn_ShoeConcreteRun_OS_01.ogg, FEETHmn_ShoeConcreteRun_OS_02.ogg, FEETHmn_ShoeConcreteRun_OS_03.ogg … |
| `run_dirt` | efect | Oculus Audio Pack | FEETHmn_ShoeDirtRun_OS_01.ogg, FEETHmn_ShoeDirtRun_OS_02.ogg, FEETHmn_ShoeDirtRun_OS_03.ogg … |
| `jump_land` | efect | Oculus Audio Pack | FEETHmn_ShoeGrassLand_OS_01.ogg, FEETHmn_ShoeDirtLand_OS_01.ogg |
| `fart` | efect | TerminalFart | toot.mp3, dry.mp3 |
| `fart_wet` | efect | TerminalFart | wet.mp3 |
| `bigfart` | efect | TerminalFart | hellacious.mp3, poop-toot.mp3 |
| `burp` | efect | Oculus Audio Pack | HMNBurp_Burp_OS_01.ogg, HMNBurp_Burp_OS_02.ogg, HMNBurp_Burp_OS_03.ogg |
| `laugh_f` | efect | Oculus Audio Pack | VOXLaff_Female01Laugh_OS_01.ogg, VOXLaff_Female01Laugh_OS_02.ogg, VOXLaff_Female02Laugh_OS_01.ogg |
| `laugh_m` | efect | Oculus Audio Pack | VOXLaff_Male01Laugh_OS_01.ogg, VOXLaff_Male02Laugh_OS_01.ogg, VOXLaff_Male02Laugh_OS_02.ogg |
| `yawn` | efect | Free-SFX | yawn1.opus, yawn2.opus |
| `cough` | efect | Free-SFX | cough1.opus, cough2.opus, cough3.opus |
| `sniff` | efect | Free-SFX | sniff.opus |
| `gasp` | efect | Free-SFX | gasp1.opus |
| `snore` | efect | Free-SFX | breath-male.opus |
| `gulp` | efect | Free-SFX | gulp1.opus, gulp2.opus |
| `drink` | efect | Free-SFX, Înregistrări Freesound CC0 | drink-sip-and-swallow.opus, 564037__siteflight__drink-slurping-sound-from-a-cup.mp3 |
| `crunch` | efect | Înregistrări Freesound CC0 | 707733__lizelle__eating-chips.mp3, 551997__legnalegna55__eating-sound-asmr-crunchy-sound.mp3 |
| `shh` | efect | Free-SFX | shh1.opus |
| `faucet_on` | efect | Oculus Audio Pack | WATRPlmb_FaucetOn_OS_01.ogg |
| `faucet_off` | efect | Oculus Audio Pack | WATRPlmb_FaucetOff_OS_01.ogg |
| `flush` | efect | CC0 Public Domain Sounds, Oculus Audio Pack | WATRPlmb_ToiletFlushEuropean_OS_01.ogg, toilet_01.ogg |
| `splash` | efect | CC0 Public Domain Sounds, SFX Kit | splash_01.ogg, splash_03.ogg, splash_05.ogg … |
| `bubble` | efect | CC0 Public Domain Sounds | bubble_01.ogg, bubble_02.ogg, bubble_03.ogg |
| `squelch` | efect | CC0 Public Domain Sounds | slime_01.ogg, slime_02.ogg, slime_03.ogg … |
| `dishes` | efect | CC0 Public Domain Sounds | dishes_01.ogg, dishes_02.ogg, dishes_03.ogg … |
| `clink` | efect | CC0 Public Domain Sounds | glass_01.ogg, glass_02.ogg, glass_03.ogg |
| `fridge` | efect | CC0 Public Domain Sounds | microwave_door_open.ogg, microwave_door_close.ogg |
| `knife` | efect | Kenney RPG Audio + Impact Sounds | knifeSlice.ogg, knifeSlice2.ogg |
| `pan` | efect | Kenney RPG Audio + Impact Sounds | metalPot1.ogg, metalPot2.ogg, metalPot3.ogg |
| `spoon` | efect | Oculus Audio Pack | FOODTware_SpoonDrop_OS_01.ogg, CERMImpt_CeramicSmallImpact_OS_01.ogg |
| `kettle` | efect | Free-SFX | kettle-boil.opus |
| `tea` | efect | Free-SFX | 322393__glitchedtones__cup-stir-making-tea.opus |
| `clock_tick` | efect | SFX Kit | time-clock.wav |
| `alarm` | efect | SFX Kit | time-alarm.wav |
| `doorbell` | efect | SFX Kit | props-doorbell.wav |
| `spray` | efect | Free-SFX | spray-bottle.opus |
| `pour` | efect | CC0 Public Domain Sounds | sfx100v2_loop_water_01.ogg |
| `chop` | efect | Kenney RPG Audio + Impact Sounds | chop.ogg, impactWood_heavy_000.ogg, impactWood_heavy_002.ogg |
| `tree_fall` | efect | Free-SFX | wood_falling_01.opus, wood_cracking_01.opus |
| `mine` | efect | Kenney RPG Audio + Impact Sounds | impactMining_000.ogg, impactMining_002.ogg, impactMining_004.ogg |
| `hammer` | efect | Free-SFX | hammer_01.opus, hammer_02.opus, wood_hammer_01.opus |
| `saw` | efect | Oculus Audio Pack | TOOLHand_WoodCutSaw_OS_01.ogg |
| `dig` | efect | Free-SFX | 260130__splicesound__hand-digging-dirt-leaves-crunch.opus |
| `leaves` | efect | Oculus Audio Pack | VEGELeaf_MovementThroughBushes_OS_01.ogg, VEGELeaf_MovementThroughBushes_OS_02.ogg, VEGELeaf_MovementThroughBushes_OS_03.ogg |
| `bucket` | efect | Oculus Audio Pack | METLImpt_BucketDrop_OS_01.ogg |
| `reel` | efect | Free-SFX | 507077__paulprit__angel-fly-fish-reel-slow-wind_2.opus |
| `wood_drop` | efect | Oculus Audio Pack, Kenney RPG Audio + Impact Sounds | WOODImpt_LargeWoodDrop_OS_01.ogg, impactPlank_medium_000.ogg |
| `metal_hit` | efect | Kenney RPG Audio + Impact Sounds | impactMetal_light_000.ogg, impactMetal_light_002.ogg |
| `chicken` | efect | Oculus Audio Pack | BIRDFowl_Chicken_OS_01.ogg |
| `duck` | efect | Oculus Audio Pack | BIRDFowl_Duck_OS_01.ogg |
| `dog` | efect | Oculus Audio Pack | ANMLDog_DogBark_OS_01.ogg, ANMLDog_DogBark_OS_02.ogg, ANMLDog_DogAttention_OS_01.ogg |
| `sheep` | efect | Oculus Audio Pack | ANMLFarm_Sheep_OS_01.ogg, ANMLFarm_Sheep_OS_02.ogg |
| `horse` | efect | Oculus Audio Pack | ANMLHors_HorseNeighAmbient_OS_01.ogg |
| `pig` | efect | Oculus Audio Pack | ANMLFarm_PigSqueal_OS_01.ogg |
| `cat` | efect | CC0 Public Domain Sounds | Cat Meows - Food Time 1.wav, Cat Meows - Food Time 3.wav, Cat Meows - Tiny Tito.wav |
| `purr` | efect | Înregistrări Freesound CC0 | 252645__yetcop__cat-purr-gato-ronroneando.mp3 |
| `owl` | efect | Free-SFX | 465697__breviceps__owl-hoot.opus |
| `birds` | efect | Oculus Audio Pack | AMBForst_ForestBirds_OS_01.ogg, AMBForst_ForestBirds_OS_02.ogg, AMBForst_ForestBirds_OS_03.ogg |
| `bells` | efect | Înregistrări Freesound CC0 | 501115__felix-blume__peal-of-church-bells-on-sunday-in-paris.mp3 |
| `car_start` | efect | Oculus Audio Pack | VEHCar_CarStartRunStop_OS_01.ogg |
| `car_door` | efect | Oculus Audio Pack | VEHDoor_CarDoorClose_OS_01.ogg |
| `bus_doors` | efect | Oculus Audio Pack | TRNDoor_TrainDoorsOpen_OS_01.ogg, TRNDoor_TrainDoorsClose_OS_01.ogg |
| `bike_bell` | efect | CC0 Public Domain Sounds | bell_01.ogg, bell_02.ogg |
| `train` | efect | Oculus Audio Pack | TRNElec_TrainPassby_OS_01.ogg |
| `chimes` | efect | Înregistrări Freesound CC0 | 525052__smand__wind-chime-small.mp3 |
| `popcorn` | efect | Înregistrări Freesound CC0 | 585463__guiller1220__20-crispetas_s.mp3 |
| `amb_room` | buclă | Oculus Audio Pack | AMBHome_RoomTone_LOOP_01.ogg |
| `amb_yard` | buclă | Oculus Audio Pack | AMBFarm_FarmGeneric_LOOP_01.ogg |
| `amb_night` | buclă | Oculus Audio Pack | AMBForst_Night_LOOP_01.ogg |
| `amb_crickets` | buclă | Omarchy Ambient | crickets.ogg |
| `amb_forest` | buclă | Oculus Audio Pack | AMBForst_Forest_LOOP_01.ogg |
| `amb_wind` | buclă | Oculus Audio Pack | WINDVege_LightWindTreesBirds_LOOP_01.ogg |
| `amb_lake` | buclă | Oculus Audio Pack | AMBLake_LakeShore_LOOP_01.ogg |
| `amb_city` | buclă | Oculus Audio Pack | AMBUrbn_CityEuroDaytime_LOOP_01.ogg |
| `amb_restaurant` | buclă | Oculus Audio Pack | CRWDConv_Restaurant_LOOP_01.ogg |
| `amb_rain` | buclă | Oculus Audio Pack | RAIN_CityRain_LOOP_01.ogg |
| `fire_loop` | buclă | Free-SFX | fire_loop.opus |
| `water_loop` | buclă | Oculus Audio Pack | WATRPlmb_FaucetWaterRun_LOOP_01.ogg |
| `bath_loop` | buclă | Oculus Audio Pack | WATRBubl_WaterBubbles_LOOP_01.ogg |
| `fountain_loop` | buclă | Oculus Audio Pack | WATRFall_Waterfall_LOOP_01.ogg |
| `stream_loop` | buclă | Oculus Audio Pack | WATRFlow_CreekInWoods_LOOP_01.ogg |
| `boil_loop` | buclă | CC0 Public Domain Sounds | water_boiling.ogg |
| `sizzle_loop` | buclă | Oculus Audio Pack | RAIN_CityRain_LOOP_01.ogg |
| `engine_slow` | buclă | Oculus Audio Pack | VEHCar_CarEngineSlow_LOOP_01.ogg |
| `engine_high` | buclă | Oculus Audio Pack | VEHCar_CarEngineHigh_LOOP_01.ogg |
| `machine_loop` | buclă | Oculus Audio Pack | MACHMisc_MachineHum_LOOP_01.ogg |
| `pedal_loop` | buclă | Oculus Audio Pack | CLOTHMvmt_MovementWithGear_OS_01.ogg |

## Cum le reconstruiești

```bash
python3 tools/build_sfx.py <folder-cu-colectiile-clonate>
```
