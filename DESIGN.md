# STYXWORKS — design notes & the Idle CPU code review behind it

*For Scotty / HckrSlsh. The game: `styxworks.html` — one file, no dependencies, no network, saves to localStorage. Open it in any browser; wrap it in Capacitor later and it's an APK built exactly the way the original was.*

---

## Part 1 — What Idle CPU's code actually does (review summary)

Idle CPU v1.2.8 is a **Capacitor HTML5 game** — all logic is readable JavaScript under `assets/public/`, organized as `config/` (balance tables), `services/` (ads, store, social, clans, launch), `src/` (core sim: `tiers/` chip→board→rack→row→hall), and `screens/`. The full teardown lives in the mod working tree (`~/workspace/idle-cpu-mod/work/analysis/`).

**The systems that make it tick:**

1. **Request-stream bottleneck sim.** Jobs arrive as requests/second; five production tiers each expose balancing stats (cores, clock, heat, power, uplink). Income = requests actually served, so you optimize the *minimum* of your chain, not just buy the biggest number. This is the game's real brain.
2. **Boost economy.** Timed boosts (mostly ad-gated in the original) multiply clocks/throughput; jobs and client orders pay burst income for meeting specs.
3. **Cards & collections.** Card packs grant permanent per-tier modifiers — a collection layer on top of the sim.
4. **Live-ops shell.** Daily login rewards, season pass, events, clans/arena/vault social systems (Firebase-backed), welcome-back offline earnings.
5. **Prestige = "Train."** Reset to train an AI model for permanent gains — the long-term retention spine.
6. **Monetization pressure.** ~38 rewarded ad placements, IAP packs/VIP, and a hard anti-offline gate (`netgate.js`) that soft-locks the game without connectivity — the thing v2 of the mod had to kill.

**What transfers to any idle game (genre mechanics, not protectable expression):** exponential cost curves (×1.15 per purchase is the genre standard), milestone upgrades at 10/25/50 owned, offline earnings at reduced efficiency, a sqrt-scaled prestige currency, achievements as small permanent bonuses, a live event/log feed for texture.

**What I deliberately did *not* take:** their code (every line of STYXWORKS is written from scratch), their balance numbers, tier/stat names, client/card/job text, art, UI copy, and their two signature systems (the five-stat bottleneck chain and model-training prestige). If this ever ships commercially, that line is what keeps it a homage instead of a derivative work.

---

## Part 2 — STYXWORKS: the remix

**Fantasy.** You're the new sysadmin-keeper of the underworld's ledger. The dead arrive by ferry with their memories unwritten; your engines transcribe them into the Ledger, and Charon pays per memory in **obols**. Same Greek-underworld naming language as your fleet (Hades, Cerberus, Persephone), completely different fiction from "build an AI data center": this is a *bureaucracy of the dead*.

**The signature system — the Soul Queue.** Instead of bottleneck stats, STYXWORKS has a **queue with loss**:

- Souls **arrive** continuously (rate grows as you build) into a finite number of **berths** (start: 1,000; you begin with a 250-soul ancient backlog).
- Your engines **drain** the queue at their transcription capacity. Queue empty → engines starve and idle. Queue overflowing → souls **forget themselves** and are lost to the Lethe, permanently counted on your plaque as a quiet shame mechanic.
- So the tension is *arrival rate vs. capacity vs. berths* — a logistics problem, not a stat-balancing one. Upgrades pull all three levers (Charon's favor = arrivals, Widen the Styx = berths, engine ×2s = capacity).

**Active play — the Ferry.** Every ~3.5–5.5 minutes Charon docks with a bulk delivery. Unload it yourself for a queue refill **plus a tip** equal to 2× the payload's value. Hand-transcription (the click) stays relevant via upgrades and a 2% "Perfect Recall" crit at ×7.

**Prestige — Drink from the Lethe.** Reset obols/engines/upgrades for **Lethe Shards** = ⌊√(run memories / 40,000)⌋. Each shard is a permanent +2% production. And each crossing, the river **drafts you 1 of 3 Wards** (roguelite pick, ranks stack): Warden's Focus (click ×3), The Wide Styx (berths ×3), Charon's Favor (faster, richer ferries), Deep Backlog (offline gains at full strength), Gilded Mint (+50% obol value), The Tireless Dead (+25% all output), Lethe Siphon (+15% shards), Second Dawn (start each run with a Ghost Relay + 250 obols).

**Content.** 8 engines (Cursed Terminal → Styx Singularity), 17 upgrades gated behind play patterns (own-10 milestones, souls lost, ferries unloaded, click counts), 12 achievements (each +1% production, permanent), offline earnings at 50% for up to 8h (full with Deep Backlog), export/import/wipe in the footer, and a timestamped Ledger feed narrating everything in-world.

**Numbers** are all mine (base costs 15 → 990M, rates 0.3 → 86,000/s, ×1.15 growth). First crossing lands around 20–30 minutes of mixed active/idle play; Second Dawn + shard compounding make run 2 visibly faster, which is the loop's proof.

**Verification (2026-11-08).** JS syntax-checked; booted in a Node VM harness with a DOM stub and smoke-tested: 16 checks on boot state, click economy, purchasing, capacity math (measured output matched the 0.3/s spec exactly), ferry docking/payout, upgrade purchase, prestige thresholds (0 below 40k, 1 at 40k, 3 at 360k), queue-cap invariant, achievement unlock, and save round-trip — all green. Not yet render-tested in a real browser (the VM's Chromium is policy-bound to the browser service), so first open is the visual smoke test.

**Making it an Android app.** It's one static HTML file — the same architecture as the game that inspired it. `npx @capacitor/cli init`, drop the file in as `index.html`, `cap add android`, and you have your own APK: no ads because none exist, offline because there's nothing to phone home to, signed with your own key. Say the word and I'll package it.

---

## v1.1 — Expansion (2026-11-08)

**Prestige, twice over.** The Lethe crossing (layer 1) was already in v1.0 — shards at √(run memories / 40,000), +2% production each, plus the 1-of-3 Ward draft. v1.1 adds the layer for when *that* gets boring:

- **Claim the Obsidian Throne (layer 2 ascension).** Surrender shards *and* Wards for **Stygian Crowns** = √(shards earned this era). Every crown ever held adds +5% production permanently. Crowns buy six one-time **edicts** in the new THRONE tab: The Ferryman's Oath (ferries auto-unload), River of Fire (surges ×3, double length), The Eleventh Berth (berths ×5), Twin Ledgers (obol value ×2), Deep Time (offline reach 24h, +25% efficiency), The First Hound (every run starts with 2 Cerberus Arrays).

**New systems:**
- **Judgments** — the three judges issue timed contracts (transcribe X / unload 2 ferries / install 10 engines / 45 hand transcriptions) paying ~2.5 minutes of your current income. The active-play goal layer.
- **Procession of Heroes** — every ~8–13 minutes, a 60-second ×2 output surge (×3 and 120s with River of Fire).
- **The Lethe Tithe** — an upgrade that makes even overflow pay: lost souls yield 15% of a memory's value. The shame mechanic becomes a strategy.

**More content & QoL:** engines 8 → 10 (Orpheus Engine mid-ladder, Erebus Deep Core at 14B), upgrades 17 → 24 (own-25 milestone ×2s, new-engine ×2s, the Tithe), achievements 12 → 18, and a **BUY ×1/×10/×100/MAX** toggle with true geometric-series bulk pricing.

**Compatibility:** v1.0 saves migrate automatically (new fields default in `load()`); the migration and all new systems are covered in the harness — 21/21 checks green, including one real bug the tests caught and fixed (fresh-state engine map now zero-initializes inside `freshState()`).

## v1.2 — Mobile & polish (2026-11-08)

Built after the first Android build (v1.1.0 APK) proved the shell. The resource plaque is now **sticky** (obols/shards/lost always in view while scrolling); phones get a **sticky bottom action bar** with a live obol counter and a thumb-sized TRANSCRIBE button; engine cards wrap with full-width buy buttons under 640px; compact plaque, log, and tab typography; safe-area insets for notches and the Fold's creases; `touch-action: manipulation` kills double-tap zoom lag; modals pop in; affordable cards glow faintly gold; `prefers-reduced-motion` is honored. Shipped as APK **v1.2.0** (versionCode 2, same key — installs over 1.1.0, save intact) and as the updated HTML. Harness (now kept durably at `~/workspace/styxworks-app/tests/harness.js` after /tmp ate two copies) still 21/21.

## v1.3 — Bottom tab navigation (2026-11-08)

Scotty asked for the mature-idle-game structure, so at app widths (≤1020px) the single scroll becomes five tabbed screens on a fixed bottom bar: **River** (queue, transcribe, ferry, judgments, ledger feed), **Engines**, **Upgrades**, **Crossing** (the Lethe panel, Obsidian Throne, Wards, and Crown edicts in one prestige home), and **Ledger** (stats, achievements, save tools). Gold dots on the tabs signal a docked ferry, an affordable purchase, or an available crossing. The v1.2 transcribe bar floats above the tab bar so the core verb is never more than a thumb away. Desktop keeps the three-column layout (with explicit grid placement now that the left column is two sections). Also learned: chat attachments mangle multi-dot filenames (`StyxWorks-1.2.0.apk` arrived as ".0 apk" and needed a manual rename), so the deliverable is now simply `styxworks.apk`. Shipped as APK v1.3.0 (versionCode 3, same key). Harness still 21/21.

## v1.3.1 — Visual pass (2026-11-08)

"Bland, aesthetically" was a fair review of flat panels and emoji in boxes, so: an atmosphere layer behind everything (three blurred underworld glows — violet, river-teal, obol-gold — drifting on 34–48s loops, a two-density speckle of soul-dust, and a soft vignette), a genuine Greek key drawn as an inline SVG tile (the old gradient imitation retired), the wordmark set as an engraved gradient (bone into gold; WORKS in violet), and every engine promoted to a **seal medallion** whose ring and card edge carry a per-tier accent that warms as you descend the ladder: slate → periwinkle → violet → teal → violet-bright → antique gold → gold → bright gold → ember orange → blood. The queue is a river now (flowing stripe overlay), affordable buy buttons sweep a sheen, the transcribe seal breathes with a faint gold pulse, the log is bound with a brass edge, and screens fade-rise when you switch tabs. Everything is procedural CSS/SVG inside the same single file — no image assets, no fonts, nothing to fetch. APK v1.3.1, versionCode 4.

## v1.4 — Gothic Pixel (2026-11-08)

Scotty's direction: *"creepy and 8-bit — OG Castlevania, but if it met Hades the roguelike."* So the engraved-plaque look was torn down and rebuilt as gothic pixel: every radius zeroed, every panel a hard black pixel frame with a 3px drop shadow, palette pushed to deep indigo and blood red with Hades' jewel saturation kept in the accents. A pixel scene sits over the wordmark — castle silhouette with lit windows (one burns red), chunky rect-built moon, three bats — drawn as crisp-edged inline SVG. A CRT scanline overlay settles over the whole app. The queue bar is segmented like a Castlevania health bar. Display type went arcade-monospace with hard 2px shadows; body flavor text kept its serif, because Hades tells stories and Castlevania shows menus. The centerpiece: **all ten engine icons are now hand-plotted 10×10 pixel sprites** (terminal, ghost relay tower, three-fanged Cerberus, turbine pinwheel, server rack with blinking-light palette, Orpheus' lyre, the Loom, Elysium's temple, the Singularity's ember ring, Erebus' bitten moon), rendered at runtime as crisp inline SVG — zero image assets, still one file. The transcribe button is a blood-red seal with a gold rim. APK v1.4.0, versionCode 5.

## v1.4.2 — The river, explained in-game (2026-11-08)

Scotty's words, an hour after v1.4.1 shipped: *"I don't understand the arrivals mechanic."* Fair — the panel showed three numbers (waiting / berths / arrivals) and never said what they meant to each other. So the Queue panel now carries a **HOW THE RIVER WORKS** collapsible, in the same Gothic Pixel styling, that states the loop plainly — Arrivals → Queue → Engines → Obols — plus the two failure states (starving = income capped by arrivals; overflow = souls forgotten for good), the ferry's 45-seconds-of-arrivals payload and 2× tip, and the one exception (TRANSCRIBE ignores the queue entirely). The breakdown line is **live**: it recomputes every render from the player's actual state — `0.8 base + N engines × 0.06 + N crossings × 0.35`, with ×1.3 multipliers shown when Charon Likes You / A Second Ferry are etched — so the number under the bar always reconciles with the arrivals rate beside it. No economy change; display only. Harness still 21/21, JS syntax-checked, embedded HTML byte-identical, still zero permissions. APK v1.4.2, versionCode 7, same signing key — installs over v1.4.1, save intact. (Folds in v1.4.1's three-headed Cerberus, so one update covers both.)

## v1.4.1 — Cerberus, actually three-headed (2026-11-08)

Visual review of the v1.4 sprites, read as rendered grids rather than in code: nine of the ten read as intended, but the Cerberus sprite was a single wide dog head — two ears, one pair of eyes — while its own flavor text says "Three heads, three cores." Redrawn in the same 10×10 grid and palette: three 3-wide heads sharing one body, each with its own ears, one red eye, and a white fang, legs unchanged below. No other sprite changed. APK v1.4.1, versionCode 6, same signing key — installs over v1.4.0, save intact.

*— Nova, 2026-11-08*
