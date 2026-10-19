import type {WeaponProc} from './weaponProfiles';
/** Awakening is a permanent state of an existing weapon, never a replacement
 * item ID. Duplicate enhancement ranks and all old equipment saves survive. */
export const AWAKENING_HEART_COST=3;
/** Fixed per eligible boss victory, regardless of level, luck or breakthrough. */
export const AWAKENING_HEART_DROP_CHANCE=.5;
export const MAX_BOSS_HEARTS=99;
export interface AwakeningProfile {bossId:string;weaponId:string;slug:string;name:string;form:string;heart:string;color:number;description:string;baseAttack:number}
/** Awakened base ATK is balanced against STR, Might talents, 1.35x level growth,
 * and duplicate ranks. Never place a fully scaled target ATK in this field.
 * An awakened weapon keeps its original ID, duplicate ranks, and combat traits. */
export const AWAKENING_PROFILES:readonly AwakeningProfile[]=[
 {bossId:'captain-varr',baseAttack:45,weaponId:'varr-rededge',slug:'varr',name:'Nightfall Rededge',form:'Crimson Shadow',heart:'Heart of Guile',color:0xe24c66,description:"a sleek medieval fantasy NINJA: layered charcoal cloth armor, crimson scarf and sash, fitted black bracers, dark hood pushed back to retain the original brown hair, cloth face mask covering nose and mouth but blue eyes visible, light stealth boots, compact split dark cloak; subtle silver edges. No modern items"},
 {bossId:'moonlit-warden',baseAttack:52,weaponId:'moonlit-oathblade',slug:'warden',name:'Moonreaper Oathblade',form:'Moonreaper',heart:'Heart of Moon',color:0xb99cff,description:"a spectral violet REAPER knight: charcoal hooded armor and layered dark cloak, an ivory SKULL FACE MASK with clear skull teeth and eye sockets lit violet; fully clothed solid chibi body, silver-purple chest and gauntlet details, dark boots; NOT a skeleton body"},
 {bossId:'stonejaw-troll',baseAttack:58,weaponId:'stonejaw-edge',slug:'stonejaw',name:'Worldbreaker Edge',form:'Mountain Sentinel',heart:'Heart of Mountain',color:0xd9caaa,description:"a noble STONE SENTINEL: compact slate-gray layered plate armor with restrained gold seams and pale runic accents, basalt-like pauldrons, fitted charcoal underlayers, stone-gray cape with gold trim, normal recognizable brown hair and blue-eyed human face; not a troll and not a giant"},
 {bossId:'iron-tusk',baseAttack:64,weaponId:'iron-tusk-fang',slug:'iron-tusk',name:'Dunebreaker Fang',form:'Dune War Sovereign',heart:'Heart of War',color:0xe4a45c,description:"a desert WAR KNIGHT: ornate bronze and obsidian scale armor, amber gems, burnt-orange sash and short sand-colored cape with bronze edging, compact tusk-shaped shoulder ornaments and a small bronze circlet; keep original brown hair, human face and blue eyes, no racial/body change"},
 {bossId:'rootfather',baseAttack:70,weaponId:'rootfather-thornblade',slug:'rootfather',name:'Ironwood Thornblade',form:'Verdant Ironwood',heart:'Heart of Root',color:0x86d77b,description:"a powerful IRONWOOD ARMORED KNIGHT: dark iron plates intertwined with finely carved emerald root motifs, thick but compact layered pauldrons, green gemstones, deep forest-green cloak with pale gold trim, plated boots and gauntlets; original brown hair and recognizable human face, no branches increasing height"},
 {bossId:'salt-king',baseAttack:76,weaponId:'salt-kings-cutlass',slug:'salt-king',name:'Dreadwake Cutlass',form:'Dread Captain',heart:'Heart of Tide',color:0xf0c363,description:"an elegant PIRATE CAPTAIN: black and deep navy long captain coat with ornate gold edging, burgundy sash, leather-and-metal gauntlets, gold-buckled high boots, compact black tricorn with gold piping sitting around existing brown hair, short burgundy-lined coat tails; recognizable young human face and blue eyes, no giant hat or beard"},
 {bossId:'frost-wyrm',baseAttack:82,weaponId:'wyrm-frostedge',slug:'frost-wyrm',name:'Wintercrown Frostedge',form:'Glacial Sovereign',heart:'Heart of Frost',color:0x8ce6ff,description:"a spectacular FROST KNIGHT: layered silver and midnight-blue plate armor with crisp pale icy-blue edges, compact crystalline pauldrons, silver bracers and armored boots, rich white-blue cape with silver trim, small frost circlet framing brown hair; recognizable blue-eyed human face, no gigantic ice spikes"},
 {bossId:'ashen-seer',baseAttack:89,weaponId:'seer-obsidian-edge',slug:'ashen-seer',name:'Crimson Requiem',form:'Crimson Reaper',heart:'Heart of Ash',color:0xff4454,description:"an imposing DARK CRIMSON REAPER: black and deep blood-red hooded plated robe, rich red-lined cloak, a dark ivory SKULL FACE MASK with clear teeth and scarlet-lit eye sockets, fitted black gauntlets and armored boots, ember-red ornate trim; fully clothed solid chibi proportions, no skeletal body"},
 {bossId:'varkhul',baseAttack:95,weaponId:'varkhul-emberfang',slug:'varkhul',name:'Sovereign Emberfang',form:'Ember Sovereign',heart:'Heart of Ember',color:0xff7935,description:"the ultimate VARKHUL DRAGON SOVEREIGN: intricate black dragon-scale plate, molten gold and ember-red edging, compact dragon-shaped pauldrons, finely layered black gauntlets and boots, luxurious black cape with ember-red lining and gold edging, small black dragon-horn crown around original brown hair; recognizable young human face and blue eyes, most prestigious detail of all forms"},
];
export const AWAKENING_BY_WEAPON=Object.fromEntries(AWAKENING_PROFILES.map(p=>[p.weaponId,p])) as Record<string,AwakeningProfile>;
export const AWAKENING_BY_BOSS=Object.fromEntries(AWAKENING_PROFILES.map(p=>[p.bossId,p])) as Record<string,AwakeningProfile>;
export const awakenedProfile=(id:string,awakened:readonly string[])=>awakened.includes(id)?AWAKENING_BY_WEAPON[id]:undefined;
export const awakeningHeartId=(bossId:string)=>'boss-heart:'+bossId;
export const heartProfile=(id:string)=>id.startsWith('boss-heart:')?AWAKENING_BY_BOSS[id.slice(11)]:undefined;
export const awakeningArtPath=(p:AwakeningProfile,file:string)=>`assets/characters/leigneron/awakened/${p.slug}/${file}`;
/** Final techniques reuse the bounded status controller and its existing boss
 * resistance/immunity rules. No new per-frame scans, timers or proc recursion. */
export const AWAKENED_TECHNIQUES:Record<string,Partial<WeaponProc>>={
 'varr-rededge':{name:'Nightfall Wound',durationMs:4000,damagePerSecond:.16},
 'moonlit-oathblade':{name:'Moonreaper’s Toll',durationMs:3500},
 'stonejaw-edge':{name:'Worldbreaker Fault',durationMs:5500},
 'iron-tusk-fang':{name:'Dunebreaker Rend',durationMs:5500,damagePerSecond:.14},
 'rootfather-thornblade':{name:'Ironwood Venom',durationMs:6000,damagePerSecond:.15},
 'salt-kings-cutlass':{name:'Dreadwake’s Due',durationMs:3500,damagePerSecond:.20},
 'wyrm-frostedge':{name:'Wintercrown Rime',durationMs:4500},
 'seer-obsidian-edge':{name:'Crimson Pyre',durationMs:4500,damagePerSecond:.16},
 'varkhul-emberfang':{name:'Sovereign Dragonfire',durationMs:5000,damagePerSecond:.20},
};
export function awakenedProc(id:string,proc:WeaponProc,awakened:readonly string[]):WeaponProc{
 const final=awakenedProfile(id,awakened);return final?{...proc,...AWAKENED_TECHNIQUES[id],color:final.color}:proc;
}
