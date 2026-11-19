# STYXWORKS

An idle game about running the underworld's paperwork. The dead arrive by
ferry with their memories unwritten; your engines transcribe them into the
Ledger, and Charon pays per memory in obols.

One HTML file. No dependencies, no network, no build step to play — open
`styxworks.html` in any browser. Saves live in localStorage.

## The game

- **Soul Queue, with loss.** Souls arrive continuously into a finite number
  of berths. Your engines drain the queue at their transcription capacity.
  Starve the queue and the engines idle; overflow it and souls forget
  themselves and are lost to the Lethe — permanently, and counted.
- **The Ferry.** Every few minutes Charon docks with a bulk delivery.
  Unload it yourself for the refill plus a tip worth 2× the payload.
  Hand-transcription (the click) stays relevant, with a 2% "Perfect Recall"
  crit at ×7.
- **Prestige 1 — Drink from the Lethe.** Reset for Lethe Shards
  (√-scaled, +2% production each), and draft 1 of 3 Wards per crossing.
  Ward ranks stack.
- **Prestige 2 — Claim the Obsidian Throne.** Reset shards and Wards for
  Stygian Crowns (+5% each, forever) and choose from 6 permanent Crown
  edicts.
- Judgment contracts, Procession of Heroes surges, 10 engines, 24
  upgrades, 18 achievements, offline earnings, and an in-game "How the
  River Works" panel that shows the live arrivals math.

Design notes — the systems, the balance reasoning, and the genre-mechanics
review they were built from — are in `DESIGN.md`.

## Android app

A thin native WebView shell around the same file. Package
`com.hckrslsh.styxworks`, **zero permissions** — no INTERNET, no storage,
nothing. Fully offline by construction.

Current build: **v1.4.2 (versionCode 7)**, minSdk 24, targetSdk 34.

### Building the APK (no Gradle)

`android/build.sh` runs the pipeline by hand:
aapt2 → javac → d8 → zipalign → uber-apk-signer. On every build it copies
`styxworks.html` from the repo root into the app assets fresh, so the game
file here is the single source of truth.

Prerequisites — none of them in this repo:

- Android SDK: platform android-34, build-tools 34.0.0
- JDK 17
- The uber-apk-signer jar
- Your own signing keystore, with its password in the environment:
  `export STYXWORKS_KS_PASS=...`

As shipped, the script's paths assume the author's workspace layout
(toolchain under `~/workspace/styxworks-app/`, signer jar under
`~/workspace/idle-cpu-mod/`). Adjust the variables at the top to your
machine. Signing is not optional and the author's key is not shared: an
APK signed with a different key will not install over the released build.

## Tests

`tests/harness.js` boots the game headlessly in Node with a DOM /
localStorage stub and exercises the economy end to end:

```bash
node tests/harness.js
```

## Status

v1.4.2 is the current build. Verified headlessly (harness, 21 checks) and
by static inspection of the APK; the first-launch smoke test happens on a
real device.

## License

**TODO — owner to decide before publishing.** No LICENSE file is included
yet; until one is added, this code is all-rights-reserved by default.
