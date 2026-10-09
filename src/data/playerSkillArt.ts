import type { SpriteSource, SpriteAnimation } from './animationPacks';
import { ACTIVE_SKILL_BY_ID, type ActiveSkillId, type PlayerSkillTexture } from './activeSkills';

type Region = readonly [number,number,number,number];
interface SkillArt {
  id:ActiveSkillId; texture:PlayerSkillTexture; path:string; bodyHeight:number; groundY:number;
  roots:readonly number[]; regions:readonly Region[];
}
// Preserve one human-body scale per strip. Anchors follow the actor's feet,
// rather than centering each blue arc or grounding a jumping pose's aura.
export const PLAYER_SKILL_ART:readonly SkillArt[] = [
  { id:'azure-cleave',texture:'skill_azure_cleave',path:'assets/characters/leigneron/skills/azure_cleave.png',bodyHeight:295,groundY:523,
    roots:[154,494,872,1180,1627,2014],regions:[
      [33,228,250,295],[348,194,307,327],[684,235,342,290],[1034,211,443,312],[1471,235,408,290],[1900,231,238,292]] },
  { id:'skyfall-slam',texture:'skill_skyfall_slam',path:'assets/characters/leigneron/skills/skyfall_slam.png',bodyHeight:282,groundY:629,
    roots:[160,550,875,1220,1636,2010],regions:[
      [44,347,244,282],[333,355,375,274],[714,110,313,519],[1070,105,355,530],[1410,255,465,400],[1890,345,260,290]] },
  { id:'crown-rally',texture:'skill_crown_rally',path:'assets/characters/leigneron/skills/crown_rally.png',bodyHeight:324,groundY:593,
    roots:[165,500,853,1254,1669,2019],regions:[
      [34,269,261,324],[331,275,338,320],[670,245,390,357],[1020,95,460,551],[1485,240,373,375],[1891,269,259,324]] },
  { id:'crescent-flurry',texture:'skill_crescent_flurry',path:'assets/characters/leigneron/skills/crescent_flurry.png',bodyHeight:289,groundY:551,
    // The final standing figure overlaps the preceding blast in the source.
    // Reuse the clean opening standing pose for recovery, without editing art.
    roots:[180,511,872,1232,1607,180],regions:[
      [52,262,256,289],[374,204,322,354],[680,257,398,307],[1090,250,359,313],[1450,200,435,365],[52,262,256,289]] },
];
export function skillArtSources(art:SkillArt):SpriteSource[] {
  const scale = 76 / art.bodyHeight;
  return art.regions.map((cell,i):SpriteSource => ({ path:art.path,cell,imageSize:[2172,724],renderScale:scale,
    anchor:[art.roots[i],art.groundY],name:`${art.id}:${i}` }));
}
export const PLAYER_SKILL_ANIMATIONS:SpriteAnimation[] = PLAYER_SKILL_ART.map(art => ({
  key:`player-skill:${art.id}`,texture:art.texture,frames:[0,1,2,3,4,5],
  frameRate:art.id === 'crescent-flurry' ? 9 : 6000 / ACTIVE_SKILL_BY_ID[art.id].durationMs,
  repeat:art.id === 'crescent-flurry' ? -1 : 0,
}));
