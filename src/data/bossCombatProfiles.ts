import type {AttackArea} from '../game/systems/attackWarning';

export interface BossMove {
  id:string;name:string;kind:AttackArea['kind'];radius:number;range:number;windup:number;recovery:number;
  damage:number;target?:boolean;innerRadius?:number;halfAngle?:number;chargeMs?:number;presentation?:'cast'|'staff';
  spell?:'fire'|'ice'|'thunder'|'shadow';
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
const shadowRay:BossMove={id:'magus-ray',name:'Glacial staff lance',kind:'line',radius:48,range:820,windup:1400,recovery:700,damage:1.25,presentation:'cast',spell:'ice'};
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
 {identity:'Varr: cross-cuts, a pursuing lunge, and a counter-ring with a safe centre.',preferredRange:140,strafe:.55,color:0xffce76,cooldown:850,
  patterns:[[cone('might-varr-cross','Rededge cross-cut',170,850,1.15,1.5),charge('might-varr-pursuit','Pursuing Rededge',390,1050,38)],
   [ring('might-varr-counter','Duelist’s reprisal',265,125,1150)]],
  enraged:[[burst('might-varr-mark','Marked for the blade',100,1100,650),charge('might-varr-last','Last road charge',420,1050,42)],
   [cone('might-varr-left','First cross-cut',175,900,1.1,1.6),cone('might-varr-right','Returning cross-cut',195,1000,1.25,1.6)]]},
 {identity:'Warden: seals force a lane change before the hunting rush.',preferredRange:240,strafe:.5,color:0xc6b4ff,cooldown:1100,
  patterns:[[burst('might-moon-seal','Hunter’s moon',125,1200,700),charge('might-moon-hunt','Pale pursuit',440,1100,45)],
   [ring('might-moon-halo','Hollow moon',320,155,1350)]],
  enraged:[[burst('might-moon-a','Twin moon I',115,1100,700),burst('might-moon-b','Twin moon II',130,1150,700),charge('might-moon-c','Moonbreaker',470,1200,50)]]},
 {identity:'Stonejaw: alternating inner and outer safe zones.',preferredRange:160,strafe:0,color:0xe0c89b,cooldown:1400,
  patterns:[[slam('might-stone-heart','Mountain’s heart',205,1350,1.3),ring('might-stone-echo','Mountain’s echo',360,200,1450)],
   [charge('might-stone-break','Pass-shattering advance',350,1400,65)]],
  enraged:[[burst('might-stone-fall','Falling summit',155,1350,700),ring('might-stone-after','Deep aftershock',380,170,1500)]]},
 {identity:'Krag: a flanking sweep follows every warpath.',preferredRange:230,strafe:.2,color:0xffb878,cooldown:1000,
  patterns:[[charge('might-tusk-road','Iron warpath',480,1250,60),cone('might-tusk-flank','Warpath backhand',215,1000,1.25,1.7)],
   [burst('might-tusk-banner','Broken banner',135,1150,650)]],
  enraged:[[charge('might-tusk-first','First warpath',420,1200,55),charge('might-tusk-second','Second warpath',420,1250,55),slam('might-tusk-end','Clanbreaker',220,1300,1.4)]]},
 {identity:'Rootfather: roots chase two positions before an expanding hollow.',preferredRange:280,strafe:0,color:0xb6e295,cooldown:1200,
  patterns:[[burst('might-root-a','Seeking root I',130,1250,750),burst('might-root-b','Seeking root II',145,1300,750)],
   [ring('might-root-crown','Crown of roots',370,180,1500)]],
  enraged:[[burst('might-root-grasp','Grasp of ages',160,1300,750),ring('might-root-hollow','Heartwood hollow',390,170,1550),slam('might-root-heart','Heartwood crush',200,1250,1.3)]]},
 {identity:'Salt King: marks a broadside then drives a boarding lane.',preferredRange:185,strafe:.7,color:0xffd58a,cooldown:900,
  patterns:[[burst('might-salt-shot','Phantom broadside',130,1200,720),charge('might-salt-board','King’s boarding line',440,1100,42)],
   [cone('might-salt-turn','Captain’s turning cut',200,1000,1.25,1.75)]],
  enraged:[[burst('might-salt-first','Port broadside',120,1100,720),burst('might-salt-second','Starboard broadside',140,1200,720),charge('might-salt-final','No quarter',490,1250,50)]]},
 {identity:'Wyrm: frost circles close behind a glacial charge.',preferredRange:260,strafe:.15,color:0x9de4ff,cooldown:1250,
  patterns:[[charge('might-ice-road','Winter’s road',520,1350,65),ring('might-ice-crown','Shattered ice crown',360,170,1450)],
   [burst('might-ice-fang','Upturned fang',155,1250,740)]],
  enraged:[[burst('might-ice-a','Deep freeze I',140,1250,740),burst('might-ice-b','Deep freeze II',155,1300,740),charge('might-ice-end','Winter unbound',540,1400,70)]]},
 {identity:'Seer: three ash seals followed by a hollow corona.',preferredRange:340,strafe:.45,color:0xeab0ff,cooldown:1150,
  patterns:[[burst('might-ash-a','First omen',125,1150,800),burst('might-ash-b','Second omen',145,1250,800)],
   [ring('might-ash-veil','Empty veil',400,195,1550)]],
  enraged:[[burst('might-ash-c','Third omen',150,1250,800),burst('might-ash-d','Last omen',170,1400,800),ring('might-ash-end','Crown without a king',420,175,1550)]]},
 {identity:'Varkhul: grounded ember storms, wing sweeps and a rending advance.',preferredRange:300,strafe:.1,color:0xff9555,cooldown:1300,
  patterns:[[burst('might-ember-fall','Falling ember',175,1400,850),charge('might-ember-road','Ember rending',540,1500,78)],
   [cone('might-ember-wing','Wing of ruin',300,1350,1.4,1.65),ring('might-ember-crown','Crown of the Returning Ember',440,210,1650)]],
  enraged:[[burst('might-ember-a','First burning sky',150,1300,850),burst('might-ember-b','Second burning sky',175,1450,850),
   charge('might-ember-last','The last ascent',570,1600,85),ring('might-ember-end','Heart of the tower',460,195,1700)]]},
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
