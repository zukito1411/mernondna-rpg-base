import type {AttackArea} from '../game/systems/attackWarning';

export interface BossMove {
  id:string;name:string;kind:AttackArea['kind'];radius:number;range:number;windup:number;recovery:number;
  damage:number;target?:boolean;innerRadius?:number;halfAngle?:number;chargeMs?:number;
}
export interface BossCombatProfile {
  identity:string;preferredRange:number;strafe:number;color:number;cooldown:number;
  patterns:readonly (readonly BossMove[])[];enraged:readonly (readonly BossMove[])[];
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
  const choices=hpFraction<=.5?profile.enraged:profile.patterns;
  return choices[Math.max(0,Math.floor(sequence))%choices.length];
}

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
