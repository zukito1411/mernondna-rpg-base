/** Source-space registration. Angles rotate an upright weapon; x/y identify
 * the grip, not the end of its blade. Originals remain available on disk. */
import runRegistration from './heroRunRegistration.json' with {type:'json'};
export interface HeroGrip {x:number;y:number;angle:number;behind?:boolean}
const root='assets/characters/leigneron/';
const variants:Record<string,string>={
  'attack.png':'attack-body-v1.png','idle.png':'idle-front-body-v1.png','walking.png':'walk-side-body-v1.png',
  'idle_sides.png':'idle-side-body-v1.png','running.png':'run-side-body-v3.png','walk_down.png':'walk-down-body-v1.png',
  'skills/azure_cleave.png':'azure-cleave-body-v1.png','skills/skyfall_slam.png':'skyfall-slam-body-v1.png',
  'skills/crown_rally.png':'crown-rally-body-v1.png','skills/crescent_flurry.png':'crescent-flurry-body-v1.png',
};
export function heroBodySource(path:string){const file=path.startsWith(root)?variants[path.slice(root.length)]:undefined;return file?root+'modular/'+file:path;}
const grip=(x:number,y:number,angle:number,behind=false):HeroGrip=>({x,y,angle,behind});
const attack:HeroGrip[]=[
  grip(80,224,225),grip(311,140,45),grip(641,211,120),grip(957,190,90),grip(1230,165,45),grip(1355,224,225),
  grip(102,459,225),grip(468,379,315),grip(590,438,225),grip(844,418,270),grip(1108,394,315),grip(1373,459,225),
  grip(119,701,135),grip(311,597,45),grip(668,675,120),grip(965,658,75),grip(1235,615,45),grip(1390,702,135),
  grip(196,922,135,true),grip(476,824,45,true),grip(715,834,45,true),grip(977,840,45,true),grip(1241,840,45,true),grip(1470,921,135,true),
];
const skills:Record<string,HeroGrip[]>={
  'azure_cleave.png':[grip(85,433,200),grip(389,299,45),grip(877,389,120),grip(1267,375,90),grip(1723,370,110),grip(1945,433,200)],
  'skyfall_slam.png':[grip(95,520,200),grip(463,535,225),grip(874,211,315),grip(1220,475,145),grip(1623,556,180),grip(1935,520,200)],
  'crown_rally.png':[grip(95,482,200),grip(494,454,180),grip(758,482,200),grip(1188,293,0),grip(1601,482,200),grip(1941,482,200)],
  'crescent_flurry.png':[grip(107,456,200),grip(416,332,45),grip(895,416,120),grip(1330,388,65),grip(1698,398,90),grip(107,456,200)],
};
export function heroGrip(path:string,index:number,width=2172,height=724):HeroGrip|undefined{
  if(!path.startsWith(root))return;
  const file=path.slice(root.length),i=index%6;
  if(file==='modular/iron-rush-up-body-v1.png')return [
    grip(278,477,0,true),grip(675,329,0),grip(1050,281,0),
    grip(1368,217,0),grip(1734,212,0),grip(2128,475,0,true),
  ][i];
  if(file==='modular/iron-rush-down-body-v1.png')return [
    grip(133,418,180),grip(465,373,180),grip(904,424,180),
    grip(1269,436,180),grip(1623,437,180),grip(1962,419,180),
  ][i];
  if(file==='modular/iron-rush-body-v1.png')return [
    grip(108,478,155),grip(446,385,90),grip(999,425,90),grip(1423,400,90),grip(1830,400,90),grip(1973,478,155),
  ][i];
  if(file==='attack.png')return attack[index];
  if(file.startsWith('skills/'))return skills[file.slice(7)]?.[i];
  if(file==='idle.png')return grip(i*362+95,435,200);
  if(file==='idle_sides.png')return grip(i*362+[145,146,149,147,147,148][i],430,155);
  if(file==='walking.png')return grip(i*362+[239,239,177,238,244,210][i],[432,432,432,433,440,432][i],155);
  if(file==='running.png')return grip(runRegistration.grips[i][0],runRegistration.grips[i][1],runRegistration.angle);
  if(file==='walk_down.png')return grip((i+[.27,.20,.23,.22,.25,.26][i])*width/6,height*[.59,.57,.56,.56,.58,.58][i],200);
  if(file==='walk_up.png')return grip(i*128+86,95,135,true);
}
