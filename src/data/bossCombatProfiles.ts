import type {AttackArea} from '../game/systems/attackWarning';

/** Offsets use the committed aim, never the player's subsequent position. */
export interface BossZone {
  delay:number;forward?:number;side?:number;angleOffset?:number;
  kind?:AttackArea['kind'];radius?:number;innerRadius?:number;lingerMs?:number;travelMs?:number;
}
export interface BossMove {
  id:string;name:string;kind:AttackArea['kind'];radius:number;range:number;windup:number;recovery:number;
  damage:number;target?:boolean;innerRadius?:number;halfAngle?:number;chargeMs?:number;presentation?:'cast'|'staff';
  spell?:'fire'|'ice'|'thunder'|'shadow';
  dragonAction?:'stomp'|'breath'|'flight';
  zones?:readonly BossZone[];
  projectileMs?:number;
}
export interface BossCombatProfile {
  identity:string;preferredRange:number;strafe:number;color:number;cooldown:number;
  patterns:readonly (readonly BossMove[])[];enraged:readonly (readonly BossMove[])[];closeMove?:BossMove;closeRange?:number;
  enrageAt?:number;enrageCooldownMultiplier?:number;resistFlurry?:boolean;staggerRecoveryMs?:number;
}
const cone=(id:string,name:string,radius:number,windup:number,damage=1,halfAngle=.95):BossMove=>
  ({id,name,kind:'cone',radius,range:radius,windup,recovery:450,damage,halfAngle});
const slam=(id:string,name:string,radius:number,windup:number,damage=1):BossMove=>
  ({id,name,kind:'circle',radius,range:radius,windup,recovery:750,damage});
const burst=(id:string,name:string,radius:number,windup:number,range=390):BossMove=>
  ({...slam(id,name,radius,windup,.85),target:true,range,recovery:480});
const charge=(id:string,name:string,range:number,windup:number,radius=34):BossMove=>
  ({id,name,kind:'line',radius,range,windup,recovery:800,damage:1.1,chargeMs:440});
const ring=(id:string,name:string,radius:number,innerRadius:number,windup:number):BossMove=>
  ({...slam(id,name,radius,windup,.95),kind:'ring',innerRadius,range:radius});
const cut=cone('varr-cut','Roadwarden cut',105,500,.8);
const thrust=charge('varr-thrust','Committed thrust',190,750,27);
const moonLeap=charge('moon-leap','Moonlit rush',270,900,38);
const moonfall=burst('moonfall','Moonfall seal',88,1000);
const crush=slam('stone-crush','Boulder crush',145,1100,1.15);
const quake=ring('stone-quake','Echoing quake',230,110,1050);
const tuskRush=charge('tusk-rush','Iron-Tusk charge',310,1050,44);
const tuskSweep=cone('tusk-sweep','War-chief sweep',145,750,1.05,1.45);
const roots=burst('grasping-roots','Grasping roots',90,1150,420);
const rootRing=ring('root-ring','Rootwater eruption',250,115,1200);
const deckCut=cone('deck-cut','Captain’s broadside',120,600,.85,1.35);
const deckThrust=charge('deck-thrust','Boarding thrust',170,780,27);
const iceRush=charge('ice-rush','Glacial rush',335,1050,46);
const iceBurst=burst('ice-burst','Ice eruption',95,1050,420);
const cinder=burst('cinder-seal','Cinder seal',88,1100,470);
const ashRing=ring('ash-ring','Ashen corona',245,120,1200);
const shadowSeal:BossMove={...burst('magus-seal','Shadow realm seal',150,1350,900),presentation:'cast',spell:'shadow'};
const shadowCrown:BossMove={...ring('magus-crown','Sovereign eclipse',430,200,1550),presentation:'cast',spell:'shadow'};
const shadowRay:BossMove={id:'magus-ray',name:'Glacial staff lance',kind:'line',radius:48,range:820,windup:1400,recovery:700,damage:1.25,presentation:'cast',spell:'ice',projectileMs:700};
const magusFire:BossMove={...shadowSeal,id:'magus-fire',name:'Realmfire orb',spell:'fire'};
const magusThunder:BossMove={...shadowSeal,id:'magus-thunder',name:'Sovereign thunder',spell:'thunder',windup:1500};

/** Distinct, bounded sequences. Every follow-up receives its own full warning;
 * below half health bosses combine moves, without removing dodge windows. */
export const BOSS_COMBAT_PROFILES:Record<string,BossCombatProfile>={
  'captain-varr':{identity:'Mobile duelist: measured cuts followed by a committed thrust.',preferredRange:82,strafe:.38,color:0xf2bc66,cooldown:900,
    patterns:[[cut],[{...cut,id:'varr-cleave',name:'Watchtower cleave',windup:780,halfAngle:1.5,damage:1.15}],[thrust]],enraged:[[cut,thrust],[cut,cut]]},
  'moonlit-warden':{identity:'Grove hunter: rushes lanes and marks the ground beneath intruders.',preferredRange:180,strafe:.52,color:0xcda8ff,cooldown:1300,
    patterns:[[moonLeap],[moonfall],[cone('moon-claw','Crescent claw',130,750,1,1.3)]],enraged:[[moonfall,moonLeap],[moonfall,moonfall]]},
  'stonejaw-troll':{identity:'Slow siege brute: crushing blows followed by hollow shockwaves.',preferredRange:115,strafe:0,color:0xe3c89b,cooldown:1600,
    patterns:[[crush],[quake]],enraged:[[crush,quake],[{...crush,name:'Heavy boulder crush',radius:170,windup:1250}]]},
  'iron-tusk':{identity:'Charging war-chief: commits to a lane, then controls his flanks.',preferredRange:170,strafe:.1,color:0xffb079,cooldown:1200,
    patterns:[[tuskRush],[tuskSweep],[slam('tusk-stamp','Iron-Tusk stamp',130,900)]],enraged:[[tuskRush,tuskSweep],[tuskSweep,tuskSweep]]},
  rootfather:{identity:'Territorial guardian: distant root traps and rings with a safe inner pocket.',preferredRange:220,strafe:0,color:0xb1d47b,cooldown:1500,
    patterns:[[roots],[rootRing],[slam('root-bash','Ancient root crush',150,1050)]],enraged:[[roots,roots],[roots,rootRing]]},
  'salt-king':{identity:'Deck fencer: circles, cuts broadly, then lunges across the planks.',preferredRange:86,strafe:.68,color:0xffd67d,cooldown:1000,
    patterns:[[deckCut],[deckThrust],[{...deckCut,id:'deck-reverse',name:'Backhand cut',halfAngle:1.6,windup:800,damage:1.1}]],enraged:[[deckCut,deckThrust],[deckCut,deckCut]]},
  'frost-wyrm':{identity:'Lane predator: long glacial charges, tail sweeps and ground eruptions.',preferredRange:210,strafe:.12,color:0x9cddff,cooldown:1400,
    patterns:[[iceRush],[iceBurst],[slam('frost-tail','Frozen tail sweep',170,1000)]],enraged:[[iceBurst,iceRush],[iceRush,slam('frost-tail','Frozen tail sweep',170,1100)]]},
  'ashen-seer':{identity:'Ranged controller: marks fixed ash seals and punishes careless approaches.',preferredRange:280,strafe:.48,color:0xe2a6ee,cooldown:1300,
    patterns:[[cinder],[ashRing],[cinder,{...cinder,id:'cinder-echo',name:'Cinder echo',windup:950}]],enraged:[[cinder,cinder,cinder],[cinder,ashRing]]},
};
export function bossPattern(profile:BossCombatProfile,sequence:number,hpFraction:number):readonly BossMove[]{
  const choices=hpFraction<=(profile.enrageAt??.5)?profile.enraged:profile.patterns;
  return choices[Math.max(0,Math.floor(sequence))%choices.length];
}

/** Tower echoes have new arena patterns, not faster copies of world attacks.
 * Every impact still uses the shared swept collision and full warning window. */
const towerPatterns:readonly BossCombatProfile[]=[
 {identity:'Varr: a committed crossing sword combination; dodge behind the first cut, then change sides.',preferredRange:140,strafe:.65,color:0xffce76,cooldown:850,
  patterns:[[{...cone('might-varr-cross','Rededge crossing blades',210,900,1.05,.65),zones:[{delay:0,angleOffset:-.6},{delay:650,angleOffset:.6}]}],
   [charge('might-varr-pursuit','Pursuing Rededge',390,1050,38)]],
  enraged:[[{...cone('might-varr-three','Three roads to ruin',230,950,1.1,.65),zones:[{delay:0,angleOffset:-.7},{delay:600,angleOffset:.7},{delay:1350,angleOffset:Math.PI,radius:260}]}],
   [charge('might-varr-last','Last road charge',440,1150,42),cone('might-varr-return','Returning cross-cut',210,900,1.2,1.25)]]},
 {identity:'Warden: paired moon seals close from the flanks before a central moonfall.',preferredRange:270,strafe:.55,color:0xc6b4ff,cooldown:1100,
  patterns:[[{...burst('might-moon-pincer','Closing crescent moons',95,1250,750),zones:[{delay:0,side:-165},{delay:0,side:165},{delay:850,radius:125}]}],
   [charge('might-moon-hunt','Pale pursuit',460,1200,45)]],
  enraged:[[{...burst('might-moon-cross','Fourfold moonfall',100,1300,750),zones:[{delay:0,side:-175},{delay:0,side:175},{delay:700,forward:-175},{delay:700,forward:175},{delay:1500,radius:140}]}],
   [ring('might-moon-halo','Hollow moon',340,165,1400),charge('might-moon-break','Moonbreaker',480,1250,48)]]},
 {identity:'Stonejaw: the mountain cracks outward in three separately warned shockwave bands.',preferredRange:150,strafe:0,color:0xe0c89b,cooldown:1450,
  patterns:[[{...slam('might-stone-wave','Walking earthquake',140,1400,1.15),zones:[{delay:0},{delay:600,kind:'ring',innerRadius:150,radius:280},{delay:1250,kind:'ring',innerRadius:290,radius:430}]}],
   [{...burst('might-stone-fall','Falling summits',105,1450,750),zones:[{delay:0},{delay:700,forward:220},{delay:1400,forward:440}]}]],
  enraged:[[{...slam('might-stone-collapse','Mountain collapse',155,1450,1.2),zones:[{delay:0},{delay:550,kind:'ring',innerRadius:165,radius:300},{delay:1150,kind:'ring',innerRadius:310,radius:455},{delay:2050,radius:200}]}]]},
 {identity:'Krag: long committed charges end in a delayed two-sided axe execution.',preferredRange:260,strafe:.12,color:0xffb878,cooldown:1000,
  patterns:[[charge('might-tusk-road','Iron warpath',510,1300,58),{...cone('might-tusk-flanks','Warpath execution',235,1050,1.25,.85),zones:[{delay:0,angleOffset:Math.PI/2},{delay:700,angleOffset:-Math.PI/2}]}],
   [{...cone('might-tusk-cleave','Clanbreaker cleave',310,1450,1.5,.48),recovery:1100}]],
  enraged:[[charge('might-tusk-first','First warpath',450,1200,55),charge('might-tusk-second','Second warpath',450,1250,55),{...cone('might-tusk-end','Warchief execution',270,1100,1.3,1),zones:[{delay:0,angleOffset:Math.PI/2},{delay:650,angleOffset:-Math.PI/2},{delay:1500,kind:'circle',radius:220}]}]]},
 {identity:'Rootfather: persistent thorn patches surround a clear escape lane, then close the centre.',preferredRange:300,strafe:0,color:0xb6e295,cooldown:1200,
  patterns:[[{...burst('might-root-garden','Thorn prison',90,1350,780),zones:[{delay:0,side:-170,lingerMs:2400},{delay:0,side:170,lingerMs:2400},{delay:800,forward:170,lingerMs:2000},{delay:1550,lingerMs:1600}]}],
   [ring('might-root-crown','Crown of roots',390,190,1550)]],
  enraged:[[{...burst('might-root-maze','Heartwood labyrinth',100,1400,780),zones:[{delay:0,side:-180,lingerMs:2800},{delay:0,side:180,lingerMs:2800},{delay:700,forward:180,lingerMs:2400},{delay:1400,forward:-180,lingerMs:2200},{delay:2200,radius:125,lingerMs:1600}]}]]},
 {identity:'Salt King: parallel cannon lanes fire in a staggered broadside, followed by boarding.',preferredRange:300,strafe:.65,color:0xffd58a,cooldown:1100,
  patterns:[[{id:'might-salt-salvo',name:'Port battery broadside',kind:'line',radius:42,range:760,windup:1400,recovery:700,damage:1.05,zones:[{delay:0,side:-170,travelMs:650},{delay:600,travelMs:650},{delay:1200,side:170,travelMs:650}]}],
   [charge('might-salt-board','Boarding the breach',460,1150,40),cone('might-salt-turn','Captain turning cut',200,1000,1.2,1.6)]],
  enraged:[[{id:'might-salt-cross',name:'Crossing ghost batteries',kind:'line',radius:42,range:780,windup:1450,recovery:850,damage:1.15,zones:[{delay:0,side:-180,travelMs:600},{delay:500,side:180,travelMs:600},{delay:1150,angleOffset:-.5,travelMs:650},{delay:1750,angleOffset:.5,travelMs:650}]}]]},
 {identity:'Wyrm: ice fangs advance in forked lanes and remain dangerous on the ground.',preferredRange:300,strafe:.15,color:0x9de4ff,cooldown:1250,
  patterns:[[{...slam('might-ice-fork','Forked glacier',85,1400,1.05),range:780,zones:[{delay:0,forward:180,side:-100,lingerMs:1400},{delay:0,forward:180,side:100,lingerMs:1400},{delay:650,forward:370,side:-150,lingerMs:1400},{delay:650,forward:370,side:150,lingerMs:1400},{delay:1400,forward:560,radius:120,lingerMs:1200}]}],
   [charge('might-ice-road','Winter road',520,1400,60)]],
  enraged:[[{...ring('might-ice-thaw','Closing ice jaws',450,320,1500),zones:[{delay:0},{delay:750,radius:310,innerRadius:180},{delay:1550,kind:'circle',radius:165}]}],
   [charge('might-ice-end','Winter unbound',550,1450,65)]]},
 {identity:'Seer: predicts a trail through the arena, then echoes the original omen after a delay.',preferredRange:350,strafe:.45,color:0xeab0ff,cooldown:1150,
  patterns:[[{...burst('might-ash-fate','Footsteps of fate',105,1400,800),zones:[{delay:0},{delay:650,forward:200},{delay:1300,forward:400},{delay:2250,radius:140}]}],
   [{...ring('might-ash-return','Receding ash prophecy',430,290,1550),zones:[{delay:0},{delay:800,radius:280,innerRadius:150},{delay:1650,kind:'circle',radius:140}]}]],
  enraged:[[{...burst('might-ash-final','The omen remembers',110,1450,820),zones:[{delay:0,side:-160},{delay:600,side:160},{delay:1250,forward:200},{delay:2000,radius:160},{delay:3000,side:-160,radius:135}]}]]},
 {identity:'Varkhul: sustained dragonfire, circling flight and fully warned skyfall landings.',preferredRange:300,strafe:.1,color:0xff9555,cooldown:1300,
  patterns:[[{...cone('might-ember-breath','Returning Ember breath',540,1300,1,.5),dragonAction:'breath',recovery:1100}],
   [{...burst('might-ember-flight','Skyfall descent',240,4300,850),dragonAction:'flight',damage:1.25,recovery:1100}],
   [{...slam('might-ember-stomp','Ember stomp',240,1200,1.15),dragonAction:'stomp',recovery:1100}]],
  enraged:[[{...cone('might-ember-inferno','Sovereign dragonfire',540,1300,1.05,.5),dragonAction:'breath',recovery:1100}],
   [{...burst('might-ember-ascent','The last ascent',240,4300,850),dragonAction:'flight',damage:1.3,recovery:1100}],
   [{...cone('might-ember-afterburn','Returning flame',540,1400,1.05,.5),dragonAction:'breath',recovery:1100}],
   [{...slam('might-ember-heart','Heart of the tower',240,1300,1.25),dragonAction:'stomp',recovery:1100}]]},
 {identity:'Grand Magus: distant violet seals, staff rays and a hollow eclipse; strikes nearby intruders with his staff.',
  preferredRange:330,strafe:.42,color:0xb675ff,cooldown:1050,
  closeRange:230,closeMove:{...cone('magus-staff','Sovereign staff strike',245,750,1.15,1.2),presentation:'staff'},
  patterns:[[shadowSeal],[shadowRay],[magusFire],[magusThunder],[shadowCrown]],
  enraged:[[magusFire,{...magusThunder,id:'magus-second',radius:165},shadowRay],
   [shadowCrown,{...shadowSeal,id:'magus-last',name:'The realm answers',radius:185,windup:1450}]]},
];

/** More pressure, never shorter warning windows. Tower poise prevents permanent
 * flurry/forced-stagger locks while still allowing one interrupt per window. */
export const TOWER_BOSS_PROFILES:readonly BossCombatProfile[]=towerPatterns.map(profile=>({...profile,
 cooldown:Math.round(profile.cooldown*.7),enrageAt:.6,enrageCooldownMultiplier:.8,resistFlurry:true,staggerRecoveryMs:5000}));

/** World Ascension reuses the exact tower mechanics, without its fixed stats,
 * room coordinates, rewards or progression. Resolved only on spawn/flag change. */
const ASCENDED_WORLD_BOSSES:Readonly<Record<string,BossCombatProfile>>={
 'captain-varr':TOWER_BOSS_PROFILES[0],'moonlit-warden':TOWER_BOSS_PROFILES[1],
 'stonejaw-troll':TOWER_BOSS_PROFILES[2],'iron-tusk':TOWER_BOSS_PROFILES[3],
 rootfather:TOWER_BOSS_PROFILES[4],'salt-king':TOWER_BOSS_PROFILES[5],
 'frost-wyrm':TOWER_BOSS_PROFILES[6],'ashen-seer':TOWER_BOSS_PROFILES[7],
 varkhul:TOWER_BOSS_PROFILES[8],
};
export const worldBossCombatProfile=(bossId:string,ascended:boolean):BossCombatProfile|undefined=>
 (ascended?ASCENDED_WORLD_BOSSES[bossId]:undefined)??BOSS_COMBAT_PROFILES[bossId];

/** Cave captains share the existing bounded, collision-aware combat controller,
 * not world-boss identity, summons, loot or progression. Every combo is warned. */
export const CAVE_LEADER_PROFILES:Record<string,BossCombatProfile>={
 'hollow-road':{identity:'Hideout duelist: feints, sweeping cuts and short committed lunges.',preferredRange:85,strafe:.4,color:0xe6b474,cooldown:950,
  patterns:[[cone('hideout-cut','Paymaster cut',115,650,1)],
   [charge('hideout-lunge','Hideout lunge',230,900,30)]],
  enraged:[[cone('hideout-sweep','Stolen steel',135,800,1.1,1.4),charge('hideout-follow','Pursuing thrust',200,850,30)]]},
 'moonroot-den':{identity:'Hoard defender: keeps distance and marks stone impacts beneath intruders.',preferredRange:200,strafe:.5,color:0xc4d38a,cooldown:1100,
  patterns:[[burst('hoard-stone','Hoardstone fall',80,1000,340)],
   [cone('hoard-sweep','Hoardkeeper sweep',110,700,1.1)]],
  enraged:[[burst('hoard-first','Scattered stones',75,950,340),burst('hoard-second','Falling cache',95,1100,340)],
   [ring('hoard-ring','Root-hollow shock',210,100,1150)]]},
 'broken-pass':{identity:'Passbreaker: crushing blows and expanding quakes with a safe inner pocket.',preferredRange:115,strafe:0,color:0xcab99a,cooldown:1450,
  patterns:[[slam('pass-crush','Passbreaker crush',155,1200,1.3)],
   [ring('pass-quake','Cavern quake',245,110,1250)]],
  enraged:[[slam('pass-double','Shattering blow',150,1150,1.15),ring('pass-echo','Deep echo',235,105,1200)]]},
 'redfang-hold':{identity:'Warleader: drives a charging lane, then punishes the flank with a broad sweep.',preferredRange:145,strafe:.15,color:0xeaa57e,cooldown:1150,
  patterns:[[charge('redfang-charge','Redfang charge',290,1050,40)],
   [cone('redfang-sweep','Warleader sweep',150,800,1.2,1.4)]],
  enraged:[[charge('redfang-break','Breaking charge',270,1000,40),cone('redfang-turn','Warleader backhand',155,850,1.15,1.5)],
   [slam('redfang-stamp','Underhold stamp',165,1050,1.25)]]},
};
