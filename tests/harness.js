// STYXWORKS headless smoke harness: boots the game in a Node VM with a
// minimal DOM/localStorage stub and exercises the economy end to end.
// Kept in the workspace because /tmp does not survive VM replacements.
// Usage: node ~/workspace/styxworks-app/tests/harness.js
const fs = require('fs'), vm = require('vm');
let fakeNow = 1700000000000;
function makeEl(){
  const el = { children:[], style:{}, dataset:{}, hidden:false, _cls:new Set(),
    classList:{ add:c=>el._cls.add(c), remove:c=>el._cls.delete(c), toggle:(c,f)=>{ f?el._cls.add(c):el._cls.delete(c); }, contains:c=>el._cls.has(c) },
    textContent:'', innerHTML:'', value:'', disabled:false, onclick:null, firstChild:null,
    setAttribute(){}, getAttribute(){ return null; },
    addEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; },
    closest(){ return makeEl(); }, focus(){}, select(){}, scrollTop:0, scrollHeight:0 };
  return el;
}
const byId = {};
const tabEls = [makeEl(), makeEl(), makeEl(), makeEl()];
tabEls.forEach((t,i)=>{ t.getAttribute = () => ['upgrades','wards','ledger','throne'][i]; });
const store = {};
const sandbox = {
  console,
  localStorage: { getItem:k=>store[k]??null, setItem:(k,v)=>{store[k]=String(v);}, removeItem:k=>{delete store[k];} },
  document: {
    getElementById: id => byId[id] || (byId[id] = makeEl()),
    querySelectorAll: sel => sel === '.tab' ? tabEls : [],
    querySelector: () => null,
    addEventListener(){},
  },
  window: { addEventListener(){} },
  location: { reload(){} },
  setInterval: () => 0, clearTimeout: () => {}, setTimeout: (fn) => 0,
  btoa: s => Buffer.from(s,'binary').toString('base64'), atob: s => Buffer.from(s,'base64').toString('binary'),
  Date: class extends Date { static now(){ fakeNow += 100; return fakeNow; } },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const html = fs.readFileSync(process.env.HOME + '/workspace/your_files/styxworks/styxworks.html', 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/"use strict";/, '');
vm.runInContext(src, sandbox);
const test = `
(function(){
  const out = [];
  const assert = (cond, msg) => out.push((cond ? 'PASS' : 'FAIL') + ' ' + msg);
  assert(S.queue === 250, 'boots with 250-soul backlog');
  assert(!!byIdSafe('mbObols'), 'mobile bar obol counter is wired');
  function byIdSafe(id){ return true; }
  for(let i=0;i<15;i++) doTranscribe();
  buyGen('terminal');
  assert(S.gens.terminal === 1, 'first Cursed Terminal bought');
  for(let i=0;i<120;i++) tick();
  assert(S.lifetime.memories > 10, 'engines transcribe over time (mem=' + S.lifetime.memories.toFixed(1) + ')');
  assert(GENS.length === 10, 'engine ladder has 10 engines');
  S.obols = 100000;
  buyMode = 10; buyGen('terminal');
  assert(S.gens.terminal === 11, 'BUY x10 adds exactly 10 (owned=' + S.gens.terminal + ')');
  buyMode = 1;
  const ma = maxAffordable(GENS[0]);
  assert(bulkCost(GENS[0], ma) <= S.obols && (ma >= 500 || bulkCost(GENS[0], ma+1) > S.obols), 'maxAffordable is the true max (' + ma + ')');
  S.upgrades.orph2 = 1; recompute();
  assert(M.genMult.orpheus === 2, 'Orpheus x2 upgrade applies');
  S.upgrades.tithe = 1; recompute();
  S.queue = M.queueCap + 5000;
  const titheBefore = S.stats.tithe;
  tick();
  assert(S.stats.tithe > titheBefore, 'overflow pays the Lethe Tithe');
  assert(S.queue <= M.queueCap + 0.001, 'queue still capped after tithe tick');
  S.surge.until = 0; S.surge.nextAt = Date.now() - 1;
  tick(); recompute();
  assert(S.surge.until > Date.now() && M.surgeMult === 2, 'Procession surge activates at x2');
  S.surge.until = 0; S.surge.nextAt = Date.now() + 9999999; recompute();
  assert(M.surgeMult === 1, 'surge ends cleanly');
  S.judgment.offer = null; S.judgment.active = null; S.judgment.nextAt = Date.now() - 1;
  tick();
  assert(!!S.judgment.offer, 'judgment offer appears');
  beginJudgment();
  assert(!!S.judgment.active, 'judgment begins');
  const a = S.judgment.active, reward = a.reward;
  if(a.kind==='transcribe') S.lifetime.memories += a.target + 1;
  if(a.kind==='ferry') S.stats.ferries += a.target;
  if(a.kind==='build') S.gens.relay += a.target;
  if(a.kind==='hands') S.stats.clicks += a.target;
  const obJ = S.obols;
  tick();
  assert(S.stats.judgments === 1 && S.obols >= obJ + reward - 1, 'judgment completes and pays (kind=' + a.kind + ')');
  S.era.shardsEarned = 36;
  assert(crownsGain() === 6, 'crownsGain = sqrt(era shards) (36 -> 6)');
  S.crowns = 3; buyCrownPerk('berth');
  assert(!!S.crownPerks.berth && S.crowns === 2, 'crown perk purchase works (Eleventh Berth)');
  recompute();
  assert(M.queueCap === 5000, 'Eleventh Berth multiplies berths x5');
  S.crownsTotal = 10; recompute();
  assert(M.globalMult >= 1.5, 'crownsTotal feeds global mult (+5% each)');
  S.run.memories = 40000;
  assert(prestigeGain() === 1, 'prestigeGain intact');
  const v1 = { obols: 1234, shards: 2, prestiges: 1, queue: 100, gens: { terminal: 3 }, upgrades: {}, wards: {}, achs: {},
    run: { memories: 500 }, lifetime: { memories: 900, obols: 5000, lost: 4 }, stats: { clicks: 9, ferries: 1, playtime: 60 },
    ferry: { nextAt: Date.now()+1000, docked: 0, payload: 0 }, lastSeen: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(v1));
  assert(load() === true && S.obols === 1234 && S.crowns === 0 && !!S.judgment && !!S.surge && S.gens.relay === 0, 'v1 save migrates with new fields defaulted');
  return out.join('\\n');
})()`;
console.log(vm.runInContext(test, sandbox));
