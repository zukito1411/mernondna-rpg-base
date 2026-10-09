import {TOWN_BY_ID} from './towns';
import type {TerrainKind,Vec2,QuestDefinition,ContentDefinition} from '../game/types';

const city=TOWN_BY_ID.blackspire.world;
export const DRAGON_BOSS_ID='varkhul';
export const DRAGON_RETURN_MS=30*60*1000;
export const DRAGON_LAIR={x:city.x+6100,y:city.y-4500};
export const DRAGON_LAIR_TRAIL:Vec2[]=[{x:city.x,y:city.y+2400},{x:city.x+5200,y:city.y+2400},
  {x:city.x+5200,y:city.y-4500},{...DRAGON_LAIR}];
export const BLACKSPIRE_LAIR_ROADS:Vec2[][]=[
  [{x:city.x,y:city.y+1610},DRAGON_LAIR_TRAIL[0]],
  [{x:city.x,y:city.y-1610},{x:city.x,y:city.y-2200},
    {x:city.x+5200,y:city.y-2200}],
];
export function inDragonArena(x:number,y:number,padding=0){
  return Math.hypot((x-DRAGON_LAIR.x)/(900+padding),(y-DRAGON_LAIR.y)/(700+padding))<1;
}
function onRoad(points:Vec2[],x:number,y:number,padding:number){
  return points.slice(1).some((b,i)=>{
    const a=points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<44+padding;
  });
}
export function onDragonTrail(x:number,y:number,padding=0){
  return onRoad(DRAGON_LAIR_TRAIL,x,y,padding)||BLACKSPIRE_LAIR_ROADS.some(road=>onRoad(road,x,y,padding));
}
/** Basalt fighting deck with a molten rim and a west-facing walking approach.
 * No gate, invisible arena fence, teleport or safe path across open lava. */
export function dragonLairTerrain(x:number,y:number):TerrainKind|undefined{
  const dx=x-DRAGON_LAIR.x,dy=y-DRAGON_LAIR.y,r=Math.hypot(dx/900,dy/700);
  if(r<1)return 'stone';
  if(onDragonTrail(x,y))return 'dirt';
  if(r<1.17&&!(dx<0&&Math.abs(dy)<105))return 'lava';
  return undefined;
}
export const DRAGON_LAIR_CONTENT:ContentDefinition[]=[{
  id:'clue:varkhul-ward',kind:'interactable',world:{x:DRAGON_LAIR.x-1150,y:DRAGON_LAIR.y+180},
  texture:'climate_props',frame:10,scale:.6,name:'Cinderwatch Ward',solid:false,
  description:'Vexa’s forge mark is burned into the broken ward. The claw scars point toward a basalt shelf encircled by molten rock. Varkhul returns here to recover between flights.',
  repeatText:'Varkhul rests inside the molten rim. Keep to the western ash path; the open lava is not a crossing.',
  repeatable:true,questTargetId:'varkhul-ward',questEventType:'investigate',
}];
for(const [i,[x,y,frame,scale]] of [[-580,-640,7,1.1],[520,-590,7,1.15],[890,180,8,.7],[-380,670,7,.9],
  [-1150,-270,6,.55],[-1160,370,6,.5]].entries())DRAGON_LAIR_CONTENT.push({
  id:`detail:varkhul:rim:${i}`,kind:'prop',texture:'climate_props',frame,scale,solid:false,
  world:{x:DRAGON_LAIR.x+x,y:DRAGON_LAIR.y+y},
});
export const DRAGON_QUEST:QuestDefinition={
  id:'returning-ember',name:'The Returning Ember',giverNpcId:'blackspire-forgemaster',
  summary:'Varkhul has broken Blackspire’s cinder wards. Vexa asks Leigneron to discover his lair and drive him away long enough to repair the ash-road defenses. The dragon survives and will return.',
  objectives:[
    {id:'vexa-warning',type:'talk',targetId:'blackspire-forgemaster',amount:1,text:'Hear Vexa Cinder’s warning in Blackspire.',
      dialogue:['I forged the ward chains that kept Varkhul from the ash road. He broke them, not the mountain.','Take the southern road out of Blackspire, then follow the outer ash trail east and north. The broken Cinderwatch Ward stands at his western approach.','Do not try to slay him. Force him into the air, and Dain will have time to bring our people to shelter.']},
    {id:'survey-ward',type:'investigate',targetId:'varkhul-ward',contentId:'clue:varkhul-ward',amount:1,text:'Inspect the Cinderwatch Ward beside the lava-ringed lair.'},
    {id:'repel-varkhul',type:'kill',targetId:'ash-dragon',bossId:DRAGON_BOSS_ID,amount:1,text:'Force Varkhul to retreat from his basalt lair.'},
    {id:'dain-report',type:'talk',targetId:'blackspire-warder',amount:1,text:'Tell Dain Emberfall that the ash road has a respite.',
      dialogue:['I saw the wings above the molten ridge. You bought us time, Leigneron, not a permanent victory.','The crews are moving under cover of the wards. Varkhul will return after thirty minutes; those who choose another battle should wait at the western marker, not in the lava.']},
    {id:'vexa-resolution',type:'talk',targetId:'blackspire-forgemaster',amount:1,text:'Return to Vexa as the ward chains are reforged.',
      dialogue:['Dain brought the last furnace crew home. Because of you, we can repair the chains without losing another household.','The dragon still lives. Your deed is remembered even when his wings return; the lair remains open to future challengers.']},
  ],rewardGold:300,rewardXp:650,
};
