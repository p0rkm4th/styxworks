
"use strict";
/* ============================================================
   STYXWORKS — an underworld idle engine.
   Original game written for Scotty (HckrSlsh), 2026.
   Single file, no network, no dependencies. Saves to localStorage.
   Design notes: DESIGN.md alongside this file.
   ============================================================ */

/* ---------- DATA: engines (generators) ---------- */
const GROWTH = 1.15;                       // per-purchase cost multiplier
const GENS = [
  { id:"terminal",  icon:"🖥️", name:"Cursed Terminal",   base:15,      rate:0.3,   flavor:"It types on its own. Nobody asks how." },
  { id:"relay",     icon:"📡", name:"Ghost Relay",       base:140,     rate:1.6,   flavor:"Repeats the last words of the newly dead, verbatim." },
  { id:"cerberus",  icon:"🐺", name:"Cerberus Array",    base:1500,    rate:9,     flavor:"Three heads, three cores, zero dropped packets." },
  { id:"turbine",   icon:"🌀", name:"Acheron Turbine",   base:18000,   rate:55,    flavor:"The river of woe turns the wheels. Woe is renewable." },
  { id:"rack",      icon:"🗄️", name:"Tartarus Rack",     base:230000,  rate:330,   flavor:"Hums in a key that makes the wardens weep." },
  { id:"orpheus",   icon:"🎵", name:"Orpheus Engine",    base:1150000, rate:980,   flavor:"It charms the queue into order. Do not let it look back." },
  { id:"loom",      icon:"🧵", name:"Mnemosyne Loom",    base:3400000, rate:1950,  flavor:"Weaves memory into thread. The Fates subcontract here now." },
  { id:"mainframe", icon:"🏛️", name:"Elysium Mainframe", base:58000000,rate:12500, flavor:"Paradise-grade hardware. The blessed dead sysadmin it." },
  { id:"singularity",icon:"🕳️", name:"Styx Singularity", base:990000000,rate:86000,flavor:"A black hole with a ticketing system." },
  { id:"erebus",    icon:"🌑", name:"Erebus Deep Core",  base:14000000000,rate:640000,flavor:"Primordial darkness, purpose-built. Older than the gods; better documented." },
];

/* ---------- DATA: upgrades (one-time obol purchases) ---------- */
/* vis(state) gates appearance; fx applied via recompute() multipliers. */
const UPGRADES = [
  { id:"fingers1", name:"Ink-Stained Fingers", cost:400,        vis:s=>s.stats.clicks>=25,        ds:"Transcribing by hand is worth ×2.", },
  { id:"fingers2", name:"Ambidextrous Dead",   cost:60000,      vis:s=>s.stats.clicks>=150,       ds:"Transcribing by hand is worth ×2 again.", },
  { id:"fingers3", name:"The Mnemonist's Hands",cost:9000000,   vis:s=>s.stats.clicks>=400,       ds:"Transcribing by hand is worth ×3. He remembers everything. It is a curse.", },
  { id:"term2",  name:"Overclocked Damnation", cost:900,        vis:s=>s.gens.terminal>=10,       ds:"Cursed Terminals transcribe ×2." },
  { id:"relay2", name:"Séance Protocol",       cost:8000,       vis:s=>s.gens.relay>=10,          ds:"Ghost Relays transcribe ×2." },
  { id:"cerb2",  name:"A Fourth Head (Prototype)",cost:90000,   vis:s=>s.gens.cerberus>=10,       ds:"Cerberus Arrays transcribe ×2. The head has opinions." },
  { id:"turb2",  name:"Sorrow, Pressurized",   cost:1100000,    vis:s=>s.gens.turbine>=10,        ds:"Acheron Turbines transcribe ×2." },
  { id:"rack2",  name:"Deeper Floors",         cost:14000000,   vis:s=>s.gens.rack>=10,           ds:"Tartarus Racks transcribe ×2. There is always a deeper floor." },
  { id:"loom2",  name:"Golden Thread",         cost:210000000,  vis:s=>s.gens.loom>=10,           ds:"Mnemosyne Looms transcribe ×2." },
  { id:"mint1",  name:"The Mint of Hades",     cost:25000,      vis:s=>s.lifetime.memories>=5000, ds:"Every memory is stamped in better metal: obol value +50%." },
  { id:"mint2",  name:"Gilded Standard",       cost:4000000,    vis:s=>s.lifetime.memories>=250000,ds:"Obol value +50% again. Charon approves of the shine." },
  { id:"berth1", name:"Widen the Styx",        cost:3000,       vis:s=>s.lifetime.lost>=10,       ds:"Queue berths ×2. Fewer souls slip away." },
  { id:"berth2", name:"Dredge the Riverbed",   cost:350000,     vis:s=>s.lifetime.lost>=250,      ds:"Queue berths ×2 again." },
  { id:"favor1", name:"Charon Likes You",      cost:12000,      vis:s=>s.stats.ferries>=3,        ds:"Souls arrive 30% faster. He almost smiled. Almost." },
  { id:"favor2", name:"A Second Ferry",        cost:2500000,    vis:s=>s.stats.ferries>=12,       ds:"Souls arrive 30% faster again. This one is newer. It leaks less." },
  { id:"bless1", name:"River Blessing",        cost:150000,     vis:s=>s.lifetime.memories>=100000,ds:"ALL engines transcribe 50% faster." },
  { id:"bless2", name:"The Judges' Endorsement",cost:30000000,  vis:s=>s.lifetime.memories>=2000000,ds:"ALL engines transcribe 50% faster again. Minos signed it himself." },
  { id:"orph2",  name:"Do Not Look Back",      cost:7000000,    vis:s=>s.gens.orpheus>=10,        ds:"Orpheus Engines transcribe ×2. It looked back. Output doubled anyway." },
  { id:"ereb2",  name:"Primordial Drivers",    cost:8500000000, vis:s=>s.gens.erebus>=10,         ds:"Erebus Deep Cores transcribe ×2." },
  { id:"term25", name:"A Wall of Terminals",   cost:260000,     vis:s=>s.gens.terminal>=25,       ds:"Cursed Terminals transcribe ×2 again." },
  { id:"relay25", name:"The Relay Choir",      cost:2400000,    vis:s=>s.gens.relay>=25,          ds:"Ghost Relays transcribe ×2 again." },
  { id:"cerb25", name:"Kennel of the Damned",  cost:27000000,   vis:s=>s.gens.cerberus>=25,       ds:"Cerberus Arrays transcribe ×2 again. Feeding time is an event." },
  { id:"turb25", name:"Total Sorrow Conversion",cost:320000000, vis:s=>s.gens.turbine>=25,        ds:"Acheron Turbines transcribe ×2 again. Efficiency weeps too." },
  { id:"tithe",  name:"The Lethe Tithe",       cost:80000,      vis:s=>s.lifetime.lost>=50,       ds:"Even forgetting pays: souls lost to the river now yield 15% of a memory's obol value as they slip away." },
];

/* ---------- DATA: Wards (prestige draft picks, stackable) ---------- */
const WARDS = [
  { id:"focus",   icon:"✒️", name:"Warden's Focus",    ds:"Hand transcription ×3 per rank." },
  { id:"wide",    icon:"🌊", name:"The Wide Styx",     ds:"Queue berths ×3 per rank." },
  { id:"favor",   icon:"⚓", name:"Charon's Favor",    ds:"Ferries dock 40% more often; unloading pays ×2 per rank." },
  { id:"deep",    icon:"🌙", name:"Deep Backlog",      ds:"While you're away, engines work at full strength instead of half." },
  { id:"gilded",  icon:"🪙", name:"Gilded Mint",       ds:"Obol value +50% per rank." },
  { id:"tireless",icon:"⚙️", name:"The Tireless Dead", ds:"All engine output +25% per rank." },
  { id:"siphon",  icon:"🍷", name:"Lethe Siphon",      ds:"+15% shards on every future crossing, per rank." },
  { id:"dawn",    icon:"🌅", name:"Second Dawn",       ds:"Begin each run with a Ghost Relay and 250 obols, per rank." },
];

/* ---------- DATA: achievements ---------- */
const ACHS = [
  { id:"a1",  name:"First Entry",        ds:"Transcribe 100 memories.",            test:s=>s.lifetime.memories>=100 },
  { id:"a2",  name:"Getting Behind",     ds:"Hold 25 engines at once.",            test:s=>totalGens(s)>=25 },
  { id:"a3",  name:"The River Provides", ds:"Unload 5 ferries.",                   test:s=>s.stats.ferries>=5 },
  { id:"a4",  name:"Archivist",          ds:"Transcribe 100,000 memories.",        test:s=>s.lifetime.memories>=100000 },
  { id:"a5",  name:"Lethe Bait",         ds:"Lose 100 souls to forgetting.",       test:s=>s.lifetime.lost>=100 },
  { id:"a6",  name:"First Crossing",     ds:"Drink from the Lethe.",               test:s=>s.prestiges>=1 },
  { id:"a7",  name:"Industrial Grief",   ds:"Hold 100 engines at once.",           test:s=>totalGens(s)>=100 },
  { id:"a8",  name:"Million Memories",   ds:"Transcribe 1,000,000 memories.",      test:s=>s.lifetime.memories>=1000000 },
  { id:"a9",  name:"Regular at the River",ds:"Cross 5 times.",                      test:s=>s.prestiges>=5 },
  { id:"a10", name:"What Queue?",        ds:"Transcribe 25,000,000 memories.",     test:s=>s.lifetime.memories>=25000000 },
  { id:"a11", name:"Ferryman's Friend",  ds:"Unload 25 ferries.",                  test:s=>s.stats.ferries>=25 },
  { id:"a12", name:"Lord of the Ledger", ds:"Earn 1 billion lifetime obols.",      test:s=>s.lifetime.obols>=1000000000 },
  { id:"a13", name:"Throne Claimed",     ds:"Claim the Obsidian Throne.",          test:s=>s.crownsTotal>=1 },
  { id:"a14", name:"Contract Keeper",    ds:"Fulfill 10 Judgments.",               test:s=>s.stats.judgments>=10 },
  { id:"a15", name:"Procession Witness", ds:"Stand in 5 Processions of Heroes.",   test:s=>s.stats.surges>=5 },
  { id:"a16", name:"Heavy Fleet",        ds:"Hold 250 engines at once.",           test:s=>totalGens(s)>=250 },
  { id:"a17", name:"Crowned in Bone",    ds:"Hold 10 crowns across all ascensions.", test:s=>s.crownsTotal>=10 },
  { id:"a18", name:"Nothing Is Wasted",  ds:"Collect 10,000 obols from the Lethe Tithe.", test:s=>s.stats.tithe>=10000 },
];

/* ---------- DATA: Crown edicts (ascension shop, permanent, one-time) ---------- */
const CROWN_PERKS = [
  { id:"oath",     icon:"🛶", name:"The Ferryman's Oath", cost:2, ds:"Ferries unload themselves 20 seconds after docking. Charon trusts the ledger now." },
  { id:"fire",     icon:"🔥", name:"River of Fire",       cost:2, ds:"Processions of Heroes burn brighter: ×3 output instead of ×2, and twice as long." },
  { id:"berth",    icon:"🏝️", name:"The Eleventh Berth",  cost:1, ds:"Queue berths ×5. The riverbank itself is widened." },
  { id:"twin",     icon:"📖", name:"Twin Ledgers",        cost:2, ds:"Obol value ×2. Every memory, entered twice, paid twice." },
  { id:"deeptime", icon:"⏳", name:"Deep Time",           cost:1, ds:"Offline gains reach back 24 hours instead of 8, at +25% efficiency." },
  { id:"firstsoul",icon:"🐕", name:"The First Hound",     cost:3, ds:"Begin every run — first, crossed, or crowned — with 2 Cerberus Arrays already watching the gate." },
];

/* ---------- PIXEL SPRITES (hand-drawn 10x10, rendered as crisp inline SVG) ---------- */
const SPRITES = {
  terminal: { pal:{ "#":"#8b93a7", "S":"#9a86ff", "G":"#57c7a3", "B":"#0f1117" }, rows:[
    ".########.",
    "#SSSSSSSS#",
    "#SGGSSSSS#",
    "#SSSSSSSS#",
    "#SSSSSSSS#",
    "#SSSSBSSS#",
    ".########.",
    "...####...",
    "..######..",
    ".########."] },
  relay: { pal:{ "T":"#57c7a3", "B":"#e8e3d5", "R":"#e5484d" }, rows:[
    ".T......T.",
    "..T....T..",
    "...T..T...",
    "....TT....",
    "....RR....",
    "...BBBB...",
    "..BBBBBB..",
    ".BBBBBBBB.",
    "....BB....",
    "...BBBB..."] },
  cerberus: { pal:{ "H":"#7a6a8f", "R":"#e5484d", "W":"#e8e3d5" }, rows:[
    ".H......H.",
    ".HH....HH.",
    ".HHHHHHHH.",
    ".HHHHHHHH.",
    ".HRHHHHRH.",
    ".HHHHHHHH.",
    "..HWWWWH..",
    "..HHHHHH..",
    "...H..H...",
    "...H..H..."] },
  turbine: { pal:{ "T":"#57c7a3", "D":"#2a7e85" }, rows:[
    "....TT....",
    ".....TT...",
    ".TT..TT...",
    "..TTTTTT..",
    "...TTTT...",
    "..TTTTTT..",
    ".TT..TT...",
    "...TT.....",
    "....TT....",
    ".........."] },
  rack: { pal:{ "F":"#3a4157", "R":"#e5484d", "G":"#57c7a3" }, rows:[
    ".FFFFFFFF.",
    ".FRFFFFGF.",
    ".FFFFFFFF.",
    ".FFFFFFFF.",
    ".FGFFFFRF.",
    ".FFFFFFFF.",
    ".FFFFFFFF.",
    ".FRFFFFGF.",
    ".FFFFFFFF.",
    ".........."] },
  orpheus: { pal:{ "G":"#f0b429" }, rows:[
    ".G......G.",
    ".GG....GG.",
    ".G.G..G.G.",
    ".G..GG..G.",
    ".G......G.",
    ".G......G.",
    "..G....G..",
    "...GGGG...",
    "..........",
    ".........."] },
  loom: { pal:{ "V":"#9a86ff", "W":"#e8e3d5" }, rows:[
    "....VV....",
    "...VVVV...",
    "....VV....",
    "..VWWWWV..",
    "..VWWWWV..",
    "..VWWWWV..",
    "....VV....",
    "...VVVV...",
    "....VV....",
    ".........."] },
  mainframe: { pal:{ "G":"#f0b429", "W":"#e8e3d5" }, rows:[
    "....GG....",
    "...GGGG...",
    "..GGGGGG..",
    ".GGGGGGGG.",
    ".WWWWWWWW.",
    ".W.W..W.W.",
    ".W.W..W.W.",
    ".W.W..W.W.",
    ".WWWWWWWW.",
    ".........."] },
  singularity: { pal:{ "O":"#ff9d5c", "V":"#9a86ff" }, rows:[
    "..........",
    "...OOOO...",
    "..O....O..",
    ".O......O.",
    ".O..VV..O.",
    ".O......O.",
    "..O....O..",
    "...OOOO...",
    "..........",
    ".........."] },
  erebus: { pal:{ "M":"#e8e3d5", "S":"#f0b429", "D":"#b6ae97" }, rows:[
    "...MMMM...",
    "..MMMMMM..",
    ".MMMMM....",
    ".MMMM.....",
    ".MMM......",
    ".MMMM.....",
    ".MMMMM....",
    "..MMMMMM..",
    "...MMMM...",
    ".....S...."] },
};
function spriteSVG(id){
  const sp = SPRITES[id];
  if(!sp) return "";
  let rects = "";
  sp.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = sp.pal[ch];
      if(c) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    });
  });
  return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" style="width:100%;height:100%;display:block">${rects}</svg>`;
}

/* ---------- STATE ---------- */
const SAVE_KEY = "styxworks-save-v1";
function freshState(){
  return {
    obols: 0, shards: 0, prestiges: 0, crowns: 0, crownsTotal: 0,
    crownPerks: {}, era: { shardsEarned: 0 },    // era = since last ascension
    queue: 250,                                  // the ancient backlog of the dead
    gens: Object.fromEntries(GENS.map(g=>[g.id,0])), upgrades: {}, wards: {}, achs: {},
    run: { memories: 0 },                        // memories this run (prestige basis)
    lifetime: { memories: 0, obols: 0, lost: 0 },
    stats: { clicks: 0, ferries: 0, playtime: 0, surges: 0, tithe: 0, judgments: 0 },
    ferry: { nextAt: Date.now() + 90000, docked: 0, payload: 0, dockedAt: 0 },
    judgment: { offer: null, active: null, nextAt: Date.now() + 45000 },
    surge: { until: 0, nextAt: Date.now() + 420000 },
    lastSeen: Date.now(),
  };
}
let S = freshState();
GENS.forEach(g => S.gens[g.id] = 0);

function save(){ S.lastSeen = Date.now(); try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const d = JSON.parse(raw);
    S = Object.assign(freshState(), d);
    S.gens = Object.assign({}, freshState().gens, d.gens||{});
    S.lifetime = Object.assign(freshState().lifetime, d.lifetime||{});
    S.stats = Object.assign(freshState().stats, d.stats||{});
    S.run = Object.assign({memories:0}, d.run||{});
    S.ferry = Object.assign(freshState().ferry, d.ferry||{});
    S.era = Object.assign({shardsEarned:0}, d.era||{});
    S.judgment = Object.assign(freshState().judgment, d.judgment||{});
    S.surge = Object.assign(freshState().surge, d.surge||{});
    S.crownPerks = d.crownPerks || {};
    return true;
  }catch(e){ return false; }
}

/* ---------- NUMBER FORMATTING ---------- */
const SUFFIX = ["","K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc"];
function fmt(n){
  if(!isFinite(n)) return "∞";
  if(n < 1000) return Math.floor(n).toString();
  let tier = Math.floor(Math.log10(n)/3);
  if(tier >= SUFFIX.length) tier = SUFFIX.length-1;
  const scaled = n / Math.pow(10, tier*3);
  return (scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)) + SUFFIX[tier];
}
function fmtRate(n){ return n >= 100 ? fmt(n) : (Math.round(n*10)/10).toString(); }

/* ---------- ECONOMY (all multipliers derive here) ---------- */
function totalGens(s){ return GENS.reduce((a,g)=>a+(s.gens[g.id]||0),0); }
function wardRank(id){ return S.wards[id]||0; }
function genCost(g){ return Math.ceil(g.base * Math.pow(GROWTH, S.gens[g.id]||0)); }

let M = {};   // derived multipliers, refreshed by recompute()
function recompute(){
  const up = id => !!S.upgrades[id];
  M.genMult = {};
  GENS.forEach(g => M.genMult[g.id] = 1);
  if(up("term2"))  M.genMult.terminal *= 2;
  if(up("relay2")) M.genMult.relay *= 2;
  if(up("cerb2"))  M.genMult.cerberus *= 2;
  if(up("turb2"))  M.genMult.turbine *= 2;
  if(up("rack2"))  M.genMult.rack *= 2;
  if(up("loom2"))  M.genMult.loom *= 2;
  if(up("orph2"))  M.genMult.orpheus *= 2;
  if(up("ereb2"))  M.genMult.erebus *= 2;
  if(up("term25")) M.genMult.terminal *= 2;
  if(up("relay25")) M.genMult.relay *= 2;
  if(up("cerb25")) M.genMult.cerberus *= 2;
  if(up("turb25")) M.genMult.turbine *= 2;

  M.surgeMult = Date.now() < (S.surge.until||0) ? (S.crownPerks.fire ? 3 : 2) : 1;

  M.globalMult = 1
    * (up("bless1") ? 1.5 : 1)
    * (up("bless2") ? 1.5 : 1)
    * (1 + 0.25 * wardRank("tireless"))
    * (1 + 0.02 * S.shards)                       // each shard: +2%
    * (1 + 0.05 * S.crownsTotal)                  // each crown ever held: +5%
    * (1 + 0.01 * Object.keys(S.achs).length);    // each achievement: +1%

  M.obolValue = 1
    * (up("mint1") ? 1.5 : 1)
    * (up("mint2") ? 1.5 : 1)
    * (1 + 0.5 * wardRank("gilded"))
    * (S.crownPerks.twin ? 2 : 1);

  M.clickPower = 1
    * (up("fingers1") ? 2 : 1)
    * (up("fingers2") ? 2 : 1)
    * (up("fingers3") ? 3 : 1)
    * Math.pow(3, wardRank("focus"));

  M.queueCap = 1000
    * (up("berth1") ? 2 : 1)
    * (up("berth2") ? 2 : 1)
    * Math.pow(3, wardRank("wide"))
    * (S.crownPerks.berth ? 5 : 1);

  M.arrivalRate = (0.8 + totalGens(S) * 0.06 + S.prestiges * 0.35)
    * (up("favor1") ? 1.3 : 1)
    * (up("favor2") ? 1.3 : 1);

  M.capacity = GENS.reduce((a,g)=> a + (S.gens[g.id]||0) * g.rate * M.genMult[g.id], 0) * M.globalMult * M.surgeMult;
}
function crownsGain(){ return Math.floor(Math.sqrt(S.era.shardsEarned || 0)); }
function prestigeGain(){
  const base = Math.floor(Math.sqrt(S.run.memories / 40000));
  return Math.floor(base * (1 + 0.15 * wardRank("siphon")));
}

/* ---------- CORE TICK ---------- */
let lastTick = Date.now();
function tick(){
  const now = Date.now();
  let dt = (now - lastTick) / 1000;
  lastTick = now;
  if(dt > 3600) dt = 3600;                        // sanity clamp; offline gains handled separately
  if(dt <= 0) return;
  S.stats.playtime += dt;
  recompute();

  // arrivals; overflow forgets itself
  const arriving = M.arrivalRate * dt;
  S.queue += arriving;
  if(S.queue > M.queueCap){
    const lost = S.queue - M.queueCap;
    S.queue = M.queueCap;
    S.lifetime.lost += lost;
    if(S.upgrades.tithe){                          // the Lethe Tithe: even forgetting pays
      const t = lost * 0.15 * M.obolValue;
      S.obols += t; S.lifetime.obols += t; S.stats.tithe += t;
    }
    maybeLogLoss(lost);
  }
  // transcription: engines drain the queue
  const processed = Math.min(S.queue, M.capacity * dt);
  if(processed > 0){
    S.queue -= processed;
    const gain = processed * M.obolValue;
    S.obols += gain;
    S.run.memories += processed;
    S.lifetime.memories += processed;
    S.lifetime.obols += gain;
  }
  // ferry docking
  if(!S.ferry.docked && now >= S.ferry.nextAt){
    S.ferry.docked = 1;
    S.ferry.dockedAt = now;
    S.ferry.payload = Math.max(30, Math.round(M.arrivalRate * 45));
    logLine(`The ferry knocks against the dock — <b>${fmt(S.ferry.payload)} souls</b> aboard, waiting to be unloaded.`, "good");
    renderFerry();
  }
  // the Ferryman's Oath: docked ferries unload themselves
  if(S.ferry.docked && S.crownPerks.oath && now - (S.ferry.dockedAt||now) > 20000) unloadFerry();
  // Procession of Heroes: a surge of glorious dead, engines sing
  if(!S.surge.until && now >= S.surge.nextAt){
    S.surge.until = now + (S.crownPerks.fire ? 120000 : 60000);
    S.stats.surges++;
    logLine(`<b>THE PROCESSION OF HEROES.</b> The glorious dead march past the ledger, and every engine sings at ×${S.crownPerks.fire?3:2} for ${S.crownPerks.fire?120:60} seconds.`, "gold");
  }
  if(S.surge.until && now > S.surge.until){
    S.surge.until = 0;
    S.surge.nextAt = now + (480 + Math.random()*300) * 1000;
    logLine("The Procession passes. The river is quiet again.");
  }
  tickJudgment(now);
  checkAchs();
  render();
}
let lossLogAt = 0;
function maybeLogLoss(lost){
  const now = Date.now();
  if(lost >= 1 && now - lossLogAt > 30000){
    lossLogAt = now;
    logLine(`The queue overflowed. <b>${fmt(lost)} souls</b> forgot their own names and slipped into the Lethe.`, "bad");
  }
}

/* ---------- ACTIONS ---------- */
function doTranscribe(){
  recompute();
  S.stats.clicks++;
  let n = M.clickPower, crit = false;
  if(Math.random() < 0.02){ n *= 7; crit = true; }          // Perfect Recall
  const gain = n * M.obolValue;
  S.obols += gain;
  S.run.memories += n;
  S.lifetime.memories += n;
  S.lifetime.obols += gain;
  if(crit) logLine(`<b>Perfect Recall.</b> A whole life, transcribed flawlessly in one pass — <b class="gold">+${fmt(gain)} obols</b>.`, "gold");
  checkAchs();
  render();
}
let buyMode = 1;   // 1 | 10 | 100 | "max"
function genCostAt(g, owned){ return Math.ceil(g.base * Math.pow(GROWTH, owned)); }
function bulkCost(g, n){
  const owned = S.gens[g.id]||0;
  return Math.ceil(g.base * Math.pow(GROWTH, owned) * (Math.pow(GROWTH, n) - 1) / (GROWTH - 1));
}
function maxAffordable(g){
  let n = 0, spent = 0;
  const owned = S.gens[g.id]||0;
  while(n < 500){ const c = genCostAt(g, owned + n); if(spent + c > S.obols) break; spent += c; n++; }
  return Math.max(1, n);
}
function buyCount(g){ return buyMode === "max" ? maxAffordable(g) : buyMode; }
function buyGen(id){
  const g = GENS.find(x=>x.id===id);
  const n = buyCount(g);
  const cost = bulkCost(g, n);
  if(S.obols < cost || n < 1) return;
  const before = S.gens[id]||0;
  S.obols -= cost;
  S.gens[id] = before + n;
  if(before === 0) logLine(`First <b>${g.name}</b> installed. ${g.flavor}`);
  if(before < 10 && S.gens[id] >= 10) logLine(`Ten <b>${g.name}</b> units hum in chorus. An upgrade surfaces in the list.`);
  if(before < 25 && S.gens[id] >= 25) logLine(`Twenty-five <b>${g.name}</b> units. The riverbank vibrates. Another upgrade surfaces.`);
  renderAll();
}
function buyUpgrade(id){
  const u = UPGRADES.find(x=>x.id===id);
  if(!u || S.upgrades[id] || S.obols < u.cost) return;
  S.obols -= u.cost;
  S.upgrades[id] = 1;
  logLine(`Upgrade etched into the ledger: <b>${u.name}</b>.`, "gold");
  renderAll();
}
function unloadFerry(){
  if(!S.ferry.docked) return;
  const bonus = Math.round(S.ferry.payload * 2 * M.obolValue * Math.pow(2, wardRank("favor")));
  S.queue = Math.min(M.queueCap, S.queue + S.ferry.payload);
  S.obols += bonus;
  S.lifetime.obols += bonus;
  S.stats.ferries++;
  logLine(`You unload the ferry yourself: <b>${fmt(S.ferry.payload)} souls</b> to the queue, and Charon tips you <b class="gold">${fmt(bonus)} obols</b> for the effort.`, "good");
  S.ferry.docked = 0; S.ferry.payload = 0; S.ferry.dockedAt = 0;
  const interval = (200 + Math.random()*140) / (1 + 0.4 * wardRank("favor"));
  S.ferry.nextAt = Date.now() + interval * 1000;
  checkAchs();
  renderAll();
}

/* ---------- JUDGMENTS: timed contracts from the three judges ---------- */
function judgmentProgress(a){
  if(!a) return 0;
  if(a.kind === "transcribe") return S.lifetime.memories - a.snap.mem;
  if(a.kind === "ferry")      return S.stats.ferries - a.snap.ferries;
  if(a.kind === "build")      return totalGens(S) - a.snap.gens;
  if(a.kind === "hands")      return S.stats.clicks - a.snap.clicks;
  return 0;
}
function makeJudgment(){
  recompute();
  const income = Math.max(1, M.capacity * M.obolValue);
  const reward = Math.max(400, Math.round(income * 150));
  const kinds = ["transcribe","ferry","build","hands"];
  const kind = kinds[Math.floor(Math.random()*kinds.length)];
  if(kind === "transcribe") return { kind, target: Math.max(150, Math.round(M.capacity * 150)), mins: 6, reward,
    text: `The judges demand proof of industry: transcribe <b>${fmt(Math.max(150, Math.round(M.capacity * 150)))} memories</b>.` };
  if(kind === "ferry") return { kind, target: 2, mins: 9, reward,
    text: `Minos is inspecting the docks: <b>unload 2 ferries</b> under his gaze.` };
  if(kind === "build") return { kind, target: 10, mins: 5, reward,
    text: `Rhadamanthus wants growth: <b>install 10 engines</b> of any kind.` };
  return { kind, target: 45, mins: 4, reward,
    text: `Aeacus tests the keeper's own hand: <b>transcribe 45 memories by hand</b>.` };
}
function beginJudgment(){
  if(!S.judgment.offer) return;
  const o = S.judgment.offer;
  S.judgment.active = { ...o, deadline: Date.now() + o.mins * 60000,
    snap: { mem: S.lifetime.memories, ferries: S.stats.ferries, gens: totalGens(S), clicks: S.stats.clicks } };
  S.judgment.offer = null;
  logLine(`A Judgment begins: ${o.text} <span class="gold">Reward: ${fmt(o.reward)} obols.</span>`);
  renderJudgment();
}
function tickJudgment(now){
  const J = S.judgment;
  if(!J.offer && !J.active && now >= J.nextAt){
    J.offer = makeJudgment();
    logLine("The three judges stir. <b>A Judgment awaits</b> in the queue panel — begin it when ready.");
    renderJudgment();
  }
  if(J.active){
    if(judgmentProgress(J.active) >= J.active.target){
      S.obols += J.active.reward; S.lifetime.obols += J.active.reward;
      S.stats.judgments++;
      logLine(`<b>Judgment fulfilled.</b> The court pays <b class="gold">${fmt(J.active.reward)} obols</b> and pretends it doubted you all along.`, "gold");
      toast("⚖ Judgment fulfilled: +" + fmt(J.active.reward) + " obols");
      J.active = null; J.nextAt = now + 75000;
      renderJudgment();
    } else if(now > J.active.deadline){
      logLine("The Judgment lapses, unfulfilled. The judges say nothing, which is worse.");
      J.active = null; J.nextAt = now + 60000;
      renderJudgment();
    }
  }
}
function renderJudgment(){
  const box = $("judgeBox");
  if(!box) return;
  const J = S.judgment;
  if(J.active){
    const p = Math.min(1, judgmentProgress(J.active) / J.active.target);
    const left = Math.max(0, Math.ceil((J.active.deadline - Date.now())/1000));
    box.innerHTML = `<div class="card" style="border-color:var(--gold-deep)">
      <div class="nm">⚖ A JUDGMENT RUNS</div><div class="ds">${J.active.text}</div>
      <div class="ds" style="margin-top:4px">progress: <b>${fmt(Math.floor(judgmentProgress(J.active)))} / ${fmt(J.active.target)}</b> · ${Math.floor(left/60)}:${String(left%60).padStart(2,"0")} left · reward <b class="gold" style="color:var(--gold)">${fmt(J.active.reward)} obols</b></div>
      <div class="judge-prog"><div class="judge-fill" style="width:${p*100}%"></div></div></div>`;
  } else if(J.offer){
    box.innerHTML = `<div class="card" style="border-color:var(--gold-deep)">
      <div class="nm">⚖ A JUDGMENT AWAITS</div><div class="ds">${J.offer.text}</div>
      <div class="ds" style="margin-top:4px">${J.offer.mins} minutes once begun · reward <b style="color:var(--gold)">${fmt(J.offer.reward)} obols</b></div>
      <div class="row"><span></span><button class="mini goldb" id="btnJudge">BEGIN</button></div></div>`;
    $("btnJudge").onclick = beginJudgment;
  } else {
    box.innerHTML = `<div class="card" style="opacity:.6"><div class="nm">⚖ The Court Is Silent</div><div class="ds">The three judges are deliberating. Their next audience comes soon.</div></div>`;
  }
}

/* ---------- PRESTIGE: THE CROSSING ---------- */
let pendingDraft = [];
function doPrestige(){
  const gain = prestigeGain();
  if(gain < 1){ toast("The river refuses you — transcribe 40,000 memories in one run first."); return; }
  openModal(`
    <h3>DRINK FROM THE LETHE</h3>
    <p>Forget the obols, the engines, the upgrades. Keep the shards, the Wards, the achievements — and the hunger.</p>
    <div class="amt">+${fmt(gain)} LETHE SHARDS</div>
    <p>Then the river will offer three Wards. Choose one to carry into the next life.</p>
    <button class="big-act" id="mConfirm" style="border-color:var(--violet-deep);background:linear-gradient(180deg,#1d1836,#120e24);color:var(--violet)">DRINK DEEPLY</button>
    <button class="mini" id="mCancel" style="margin-top:10px">not yet</button>`);
  document.getElementById("mCancel").onclick = closeModal;
  document.getElementById("mConfirm").onclick = () => {
    S.shards += gain;
    S.era.shardsEarned = (S.era.shardsEarned||0) + gain;
    S.prestiges++;
    const keptWards = S.wards, keptAchs = S.achs, keptShards = S.shards, keptPrestiges = S.prestiges;
    const keptLifetime = S.lifetime, keptStats = S.stats;
    const keptCrowns = S.crowns, keptCrownsTotal = S.crownsTotal, keptPerks = S.crownPerks, keptEra = S.era;
    S = freshState();
    S.wards = keptWards; S.achs = keptAchs; S.shards = keptShards; S.prestiges = keptPrestiges;
    S.lifetime = keptLifetime; S.stats = keptStats;
    S.crowns = keptCrowns; S.crownsTotal = keptCrownsTotal; S.crownPerks = keptPerks; S.era = keptEra;
    GENS.forEach(g => S.gens[g.id] = 0);
    const dawn = wardRank("dawn");
    if(dawn > 0){ S.gens.relay = dawn; S.obols = 250 * dawn; S.queue = 400; }
    if(S.crownPerks.firstsoul){ S.gens.cerberus = Math.max(S.gens.cerberus||0, 2); logLine("The First Hound takes its post at the gate, as the edict commands."); }
    logLine(`You drink. The ledger closes with a sound like a held breath released. <b>Crossing #${S.prestiges}</b> — +${fmt(gain)} shards.`, "gold");
    checkAchs();
    save();
    offerWardDraft();
    renderAll();
  };
}
function offerWardDraft(){
  const pool = [...WARDS].sort(()=>Math.random()-0.5).slice(0,3);
  pendingDraft = pool.map(w=>w.id);
  openModal(`
    <h3>THE RIVER OFFERS</h3>
    <p>Three Wards surface in the black water. Take one. (Ranks stack across crossings.)</p>
    <div class="wardpick">
      ${pool.map(w=>`<button class="card" data-ward="${w.id}" style="text-align:left;cursor:pointer">
        <div class="nm">${w.icon} ${w.name} <span style="color:var(--violet);font-family:var(--mono);font-size:12px">rank ${wardRank(w.id)+1}</span></div>
        <div class="ds">${w.ds}</div></button>`).join("")}
    </div>`);
  document.querySelectorAll("[data-ward]").forEach(b => b.onclick = () => {
    const id = b.getAttribute("data-ward");
    S.wards[id] = (S.wards[id]||0) + 1;
    const w = WARDS.find(x=>x.id===id);
    logLine(`Ward taken: <b>${w.icon} ${w.name}</b> (rank ${S.wards[id]}).`, "gold");
    closeModal(); save(); renderAll();
  });
}

/* ---------- ASCENSION: THE OBSIDIAN THRONE (prestige layer 2) ---------- */
function doAscend(){
  const gain = crownsGain();
  if(gain < 1){ toast("The throne ignores you — earn at least 1 shard in this era first (crowns = √shards earned since last ascension)."); return; }
  openModal(`
    <h3>CLAIM THE OBSIDIAN THRONE</h3>
    <p>The deeper forgetting. Your <b>shards and Wards dissolve</b>, the ledger burns to the first page — and the underworld crowns its keeper. Crowns are forever, and buy edicts in the THRONE tab.</p>
    <div class="amt">+${fmt(gain)} STYGIAN CROWNS</div>
    <p>Crowns = √(shards earned this era). You have earned ${fmt(S.era.shardsEarned)} this era. Every crown ever held also adds +5% production, spent or not.</p>
    <button class="big-act" id="mAscend" style="border-color:var(--gold-deep);background:linear-gradient(180deg,#241b08,#140f04);color:var(--gold)">SIT THE THRONE</button>
    <button class="mini" id="mCancelA" style="margin-top:10px">not yet</button>`);
  document.getElementById("mCancelA").onclick = closeModal;
  document.getElementById("mAscend").onclick = () => {
    S.crowns += gain;
    S.crownsTotal += gain;
    const keptAchs = S.achs, keptLifetime = S.lifetime, keptStats = S.stats;
    const keptCrowns = S.crowns, keptCrownsTotal = S.crownsTotal, keptPerks = S.crownPerks, keptPrestiges = S.prestiges;
    S = freshState();
    S.achs = keptAchs; S.lifetime = keptLifetime; S.stats = keptStats;
    S.crowns = keptCrowns; S.crownsTotal = keptCrownsTotal; S.crownPerks = keptPerks; S.prestiges = keptPrestiges;
    GENS.forEach(g => S.gens[g.id] = 0);
    if(S.crownPerks.firstsoul){ S.gens.cerberus = 2; }
    logLine(`<b>THE THRONE IS CLAIMED.</b> The river bows. +${fmt(gain)} Stygian crowns, and the ledger begins again under a crowned hand.`, "gold");
    closeModal();
    checkAchs();
    save();
    renderAll();
  };
}
function buyCrownPerk(id){
  const p = CROWN_PERKS.find(x=>x.id===id);
  if(!p || S.crownPerks[id] || S.crowns < p.cost) return;
  S.crowns -= p.cost;
  S.crownPerks[id] = 1;
  logLine(`Crown edict enacted: <b>${p.icon} ${p.name}</b>. It cannot be unwritten.`, "gold");
  save();
  renderAll();
}
function renderThrone(){
  $("tab-throne").innerHTML =
    `<p style="color:var(--bone-2);font-size:13px;line-height:1.55;margin-top:0">Crowns held: <b style="color:var(--gold)">${fmt(S.crowns)}</b> · crowns ever held: <b>${fmt(S.crownsTotal)}</b> (+${fmt(S.crownsTotal*5)}% production). Edicts are permanent and survive every crossing and ascension.</p>` +
    CROWN_PERKS.map(p => { const owned = !!S.crownPerks[p.id]; return `
    <div class="card" style="${owned ? "border-color:var(--gold-deep)" : ""}">
      <div class="nm">${p.icon} ${p.name} ${owned ? '<span style="color:var(--gold);font-family:var(--mono);font-size:12px">ENACTED</span>' : ""}</div>
      <div class="ds">${p.ds}</div>
      ${owned ? "" : `<div class="row"><span class="cost shards" style="color:var(--gold)">${p.cost} crowns</span>
      <button class="mini goldb" data-crown="${p.id}" ${S.crowns >= p.cost ? "" : "disabled"}>ENACT</button></div>`}
    </div>`; }).join("");
  document.querySelectorAll("[data-crown]").forEach(b => b.onclick = () => buyCrownPerk(b.getAttribute("data-crown")));
}

/* ---------- OFFLINE GAINS ---------- */
function applyOffline(){
  const away = (Date.now() - (S.lastSeen||Date.now())) / 1000;
  if(away < 120 || M.capacity <= 0) return;
  const eff = Math.min(1, (wardRank("deep") > 0 ? 1 : 0.5) + (S.crownPerks.deeptime ? 0.25 : 0));
  const hours = Math.min(away, (S.crownPerks.deeptime ? 24 : 8) * 3600);
  const processed = M.capacity * hours * eff;
  const gain = processed * M.obolValue;
  S.obols += gain;
  S.run.memories += processed;
  S.lifetime.memories += processed;
  S.lifetime.obols += gain;
  openModal(`
    <h3>WHILE YOU WERE GONE</h3>
    <p>The engines did not sleep. In ${Math.round(away/60)} minutes away they transcribed the backlog at ${eff===1?"full":"half"} strength.</p>
    <div class="amt">+${fmt(gain)} OBOLS</div>
    <p>${fmt(processed)} memories entered into the ledger.</p>
    <button class="big-act" id="mOk">BACK TO THE LEDGER</button>`);
  document.getElementById("mOk").onclick = closeModal;
  logLine(`Offline watch: the engines transcribed <b>${fmt(processed)} memories</b> (+${fmt(gain)} obols).`, "good");
}

/* ---------- UI: helpers ---------- */
const $ = id => document.getElementById(id);
const logEl = () => $("log");
function stamp(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
const logLines = [];
function logLine(html, cls){
  logLines.push(`<div><span class="t">[${stamp()}]</span> <span class="${cls||""}">${html}</span></div>`);
  if(logLines.length > 60) logLines.shift();
  const el = logEl();
  if(el){ el.innerHTML = logLines.join(""); el.scrollTop = el.scrollHeight; }
}
function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove("show"), 3400);
}
function openModal(html){ $("modal").innerHTML = html; $("scrim").hidden = false; }
function closeModal(){ $("scrim").hidden = true; }
function checkAchs(){
  ACHS.forEach(a => {
    if(!S.achs[a.id] && a.test(S)){
      S.achs[a.id] = 1;
      logLine(`Achievement entered in the margin: <b>✦ ${a.name}</b> — ${a.ds} <span class="gold">(+1% production, permanent)</span>`, "gold");
      toast("✦ Achievement: " + a.name);
    }
  });
}

function screenIn(){
  const m = document.querySelector("main");
  if(!m) return;
  m.classList.remove("enter");
  void m.offsetWidth;
  m.classList.add("enter");
}

/* ---------- UI: render ---------- */
function render(){
  recompute();
  const effective = Math.min(M.capacity, S.queue > 0 ? M.capacity : 0);
  $("rObols").textContent = fmt(S.obols);
  $("mbObols").textContent = fmt(S.obols);
  // bottom-nav notification dots (mature idle games nag politely)
  $("dotRiver").style.display = S.ferry.docked ? "block" : "none";
  $("dotEngines").style.display = GENS.some(g => S.obols >= bulkCost(g, buyCount(g))) ? "block" : "none";
  $("dotUpgrades").style.display = UPGRADES.some(u => !S.upgrades[u.id] && u.vis(S) && S.obols >= u.cost) ? "block" : "none";
  $("dotCrossing").style.display = (prestigeGain() >= 1 || crownsGain() >= 1) ? "block" : "none";
  $("rObolsRate").textContent = fmtRate(effective * M.obolValue) + " / sec";
  $("rMem").textContent = fmt(S.lifetime.memories);
  $("rMemRate").textContent = "capacity " + fmtRate(M.capacity) + " / sec";
  $("rShards").textContent = fmt(S.shards);
  $("rShardFx").textContent = "+" + fmt(S.shards * 2) + "% production · " + Object.keys(S.achs).length + " achievements (+" + Object.keys(S.achs).length + "%)";
  $("rLost").textContent = fmt(Math.floor(S.lifetime.lost));
  // queue
  const pct = Math.min(100, S.queue / M.queueCap * 100);
  const fill = $("qFill");
  fill.style.width = pct + "%";
  fill.classList.toggle("hot", pct > 92);
  $("qNow").textContent = fmt(S.queue);
  $("qCap").textContent = fmt(M.queueCap);
  $("qArr").textContent = fmtRate(M.arrivalRate) + "/s";
  const st = $("qState");
  if(S.queue <= 0.5 && M.capacity > 0){ st.textContent = "⚠ the engines starve — buy arrivals or wait for the ferry"; st.className = "r starving"; }
  else if(pct > 92){ st.textContent = "⚠ the river rises — souls are forgetting themselves"; st.className = "r starving"; }
  else { st.textContent = "the backlog endures"; st.className = "r"; }
  $("clickInfo").textContent = "+" + fmt(M.clickPower * M.obolValue) + " obols per memory, by hand · 2% perfect recall ×7";
  $("prestigeGain").textContent = fmt(prestigeGain());
  $("prestigeCount").textContent = S.prestiges;
  $("crownNow").textContent = fmt(S.crowns);
  $("crownGain").textContent = fmt(crownsGain());
  if(Date.now() < (S.surge.until||0)){ st.textContent = "✦ PROCESSION OF HEROES — engines ×" + M.surgeMult; st.className = "r"; st.style.color = "var(--gold)"; }
  else st.style.color = "";
  renderGenAfford();
}
function renderGenAfford(){
  GENS.forEach(g => {
    const btn = document.querySelector(`[data-buy="${g.id}"]`);
    if(!btn) return;
    const n = buyCount(g);
    const cost = bulkCost(g, n);
    btn.disabled = S.obols < cost;
    if(btn.firstChild) btn.firstChild.textContent = "BUY ×" + n + " ";
    btn.querySelector(".c").textContent = fmt(cost) + " obols";
    btn.closest(".gen").classList.toggle("afford", S.obols >= cost);
    btn.closest(".gen").querySelector(".own").textContent = "×" + (S.gens[g.id]||0);
    btn.closest(".gen").querySelector(".pr").innerHTML =
      `each <b>${fmtRate(g.rate * M.genMult[g.id] * M.globalMult)}/s</b> · fleet <b>${fmtRate((S.gens[g.id]||0) * g.rate * M.genMult[g.id] * M.globalMult)}/s</b>`;
  });
}
function renderGens(){
  $("genList").innerHTML = GENS.map((g, i) => {
    const seen = i === 0 || (S.gens[GENS[i-1].id] || 0) > 0 || S.lifetime.memories > g.base * 2;
    return `<div class="gen ${seen?"":"locked"} t${i}">
      <div class="ic">${seen ? spriteSVG(g.id) : '<span class="qmark">?</span>'}</div>
      <div class="mid">
        <div class="nm">${seen ? g.name : "Something below, unbuilt"}<span class="own">×${S.gens[g.id]||0}</span></div>
        <div class="fl">${seen ? g.flavor : "Buy more of what came before, and the river will show you."}</div>
        <div class="pr"></div>
      </div>
      <button class="buy" data-buy="${g.id}">BUY<small class="c">${fmt(genCost(g))} obols</small></button>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => buyGen(b.getAttribute("data-buy")));
  renderGenAfford();
}
function renderUpgrades(){
  const list = UPGRADES.filter(u => !S.upgrades[u.id] && u.vis(S));
  $("tab-upgrades").innerHTML = list.length ? list.map(u => `
    <div class="card ${S.obols >= u.cost ? "afford" : ""}">
      <div class="nm">${u.name}</div><div class="ds">${u.ds}</div>
      <div class="row"><span class="cost">${fmt(u.cost)} obols</span>
      <button class="mini goldb" data-up="${u.id}" ${S.obols >= u.cost ? "" : "disabled"}>ETCH IT</button></div>
    </div>`).join("")
    : `<p style="color:var(--dim);font-size:13px;line-height:1.6">Nothing new surfaces. Push an engine to 10, lose a few souls, unload a few ferries — the river notices effort, and offers tools.</p>`;
  document.querySelectorAll("[data-up]").forEach(b => b.onclick = () => buyUpgrade(b.getAttribute("data-up")));
}
function renderWards(){
  $("tab-wards").innerHTML =
    `<p style="color:var(--bone-2);font-size:13px;line-height:1.55;margin-top:0">Wards are chosen at each crossing — one of three, offered by the river. They never reset. Current holdings:</p>` +
    (WARDS.map(w => { const r = wardRank(w.id); return `
    <div class="card" style="${r?"border-color:var(--violet-deep)":"opacity:.55"}">
      <div class="nm">${w.icon} ${w.name} ${r?`<span style="color:var(--violet);font-family:var(--mono);font-size:12px">rank ${r}</span>`:""}</div>
      <div class="ds">${w.ds}</div>
    </div>`; }).join(""));
}
function renderLedger(){
  const mins = Math.floor(S.stats.playtime/60), secs = Math.floor(S.stats.playtime%60);
  $("tab-ledger").innerHTML = `
    <div class="stat"><span>lifetime obols earned</span><b>${fmt(S.lifetime.obols)}</b></div>
    <div class="stat"><span>memories this run</span><b>${fmt(S.run.memories)}</b></div>
    <div class="stat"><span>engines held</span><b>${totalGens(S)}</b></div>
    <div class="stat"><span>hand transcriptions</span><b>${fmt(S.stats.clicks)}</b></div>
    <div class="stat"><span>ferries unloaded</span><b>${S.stats.ferries}</b></div>
    <div class="stat"><span>time at the ledger</span><b>${mins}m ${secs}s</b></div>
    <h2 style="margin:16px 0 6px">Achievements <span class="r">each: +1% production</span></h2>
    ${ACHS.map(a => `<div class="ach ${S.achs[a.id]?"done":"todo"}"><span class="st">${S.achs[a.id]?"✦":"·"}</span><span>${a.name}<span class="ds">${a.ds}</span></span></div>`).join("")}`;
}
function renderFerry(){
  const b = $("btnFerry");
  if(S.ferry.docked){
    b.hidden = false;
    b.classList.add("ready");
    $("ferryInfo").textContent = fmt(S.ferry.payload) + " souls aboard — unload for queue + a tip of " + fmt(Math.round(S.ferry.payload * 2 * M.obolValue * Math.pow(2, wardRank("favor")))) + " obols";
  } else {
    b.hidden = true;
    b.classList.remove("ready");
  }
}
function renderAll(){ renderGens(); renderUpgrades(); renderWards(); renderLedger(); renderThrone(); renderFerry(); renderJudgment(); render(); }

/* ---------- SAVE MANAGEMENT ---------- */
function doExport(){
  openModal(`<h3>EXPORT SAVE</h3><p>Your ledger, encoded. Keep it somewhere safe — another device, a note, a tomb.</p>
    <textarea rows="5" readonly onclick="this.select()">${btoa(unescape(encodeURIComponent(JSON.stringify(S))))}</textarea>
    <button class="mini" id="mOk2" style="margin-top:10px">CLOSE</button>`);
  $("mOk2").onclick = closeModal;
}
function doImport(){
  openModal(`<h3>IMPORT SAVE</h3><p>Paste an exported ledger. This <b>replaces</b> the current one.</p>
    <textarea rows="5" id="impTxt" placeholder="paste here"></textarea>
    <button class="big-act" id="mImp">RESTORE THE LEDGER</button>
    <button class="mini" id="mCan" style="margin-top:10px">cancel</button>`);
  $("mCan").onclick = closeModal;
  $("mImp").onclick = () => {
    try{
      const d = JSON.parse(decodeURIComponent(escape(atob($("impTxt").value.trim()))));
      if(typeof d.obols !== "number") throw new Error("bad save");
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      location.reload();
    }catch(e){ toast("That is not a ledger I recognize."); }
  };
}
function doWipe(){
  openModal(`<h3>ABANDON THE LEDGER?</h3><p>Everything burns: obols, engines, shards, Wards, achievements. The river forgets you entirely. There is no undo.</p>
    <button class="big-act" id="mWipe" style="border-color:#5a2c22;background:linear-gradient(180deg,#2b130d,#180a07);color:var(--blood)">BURN IT ALL</button>
    <button class="mini" id="mKeep" style="margin-top:10px">keep the ledger</button>`);
  $("mKeep").onclick = closeModal;
  $("mWipe").onclick = () => { localStorage.removeItem(SAVE_KEY); location.reload(); };
}

/* ---------- BOOT ---------- */
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === t));
  ["upgrades","wards","ledger","throne"].forEach(k => $("tab-" + k).hidden = k !== t.getAttribute("data-tab"));
  renderUpgrades(); renderWards(); renderLedger(); renderThrone();
  screenIn();
});
$("btnTranscribe").onclick = doTranscribe;
$("btnTranscribe2").onclick = doTranscribe;
$("btnFerry").onclick = unloadFerry;
$("btnPrestige").onclick = doPrestige;
$("btnAscend").onclick = doAscend;
document.querySelectorAll(".buymode").forEach(b => b.onclick = () => {
  const m = b.getAttribute("data-mode");
  buyMode = m === "max" ? "max" : parseInt(m, 10);
  document.querySelectorAll(".buymode").forEach(x => x.classList.toggle("on", x === b));
  renderGenAfford();
});
document.querySelectorAll(".navbtn").forEach(b => b.onclick = () => {
  document.body.setAttribute("data-screen", b.getAttribute("data-nav"));
  document.querySelectorAll(".navbtn").forEach(x => x.classList.toggle("on", x === b));
  window.scrollTo(0, 0);
  renderAll();
  screenIn();
});
$("btnExport").onclick = doExport;
$("btnImport").onclick = doImport;
$("btnWipe").onclick = doWipe;

const had = load();
recompute();
renderAll();
if(had){
  logLine("The ledger reopens where you left it. The queue kept breathing without you.");
  applyOffline();
} else {
  logLine("A new keeper takes the ledger. <b>250 souls</b> already wait in the backlog — the dead are patient, but not forever.");
  logLine("Click <b>TRANSCRIBE A MEMORY</b> until you can afford a Cursed Terminal. Then let the engines work.");
}
setInterval(tick, 100);
setInterval(()=>{ renderUpgrades(); renderLedger(); renderJudgment(); renderThrone(); }, 2500);
setInterval(save, 5000);
window.addEventListener("beforeunload", save);
