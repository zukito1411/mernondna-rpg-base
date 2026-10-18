import {memo,useState} from 'react';
import type {EnemyDefinition} from '../game/types';
import {ART_SHEETS} from '../data/art';
import {DIRECTIONAL_ENEMY_ART} from '../data/directionalEnemyArt';
import {M14_ART} from '../data/m14Art';
import {GOBLIN_ART} from '../data/goblinArt';
import {BOATSWAIN_ART} from '../data/boatswainArt';
import {PIRATE_PATH} from '../data/pirateArt';

function portraitSource(enemy:EnemyDefinition){
  const modern=M14_ART.find(a=>a.species===enemy.spriteFrame);
  if(modern)return {path:`assets/enemies/${modern.folder}/${modern.boss?'walk-v2':'walk'}.png`,columns:modern.boss?4:5,rows:3};
  if(enemy.spriteFrame===11)return {...GOBLIN_ART.walk};
  if(enemy.spriteFrame===10)return {...BOATSWAIN_ART.walk};
  if(enemy.spriteFrame===7)return {path:PIRATE_PATH,columns:6,rows:7};
  const directional=DIRECTIONAL_ENEMY_ART.find(a=>a.species===enemy.spriteFrame);
  if(directional)return {path:directional.sourcePath,columns:directional.sourceColumns,rows:4};
  const sheet=ART_SHEETS.find(a=>a.key===(enemy.spriteTexture??'enemies'));
  const source=sheet?.sources?.[enemy.spriteTexture?0:enemy.spriteFrame];
  return source?{path:source.path,columns:1,rows:1,cell:source.cell,imageSize:source.imageSize}:null;
}
const sources=new Map<string,ReturnType<typeof portraitSource>>();
/** Static, clipped source poses. No sprite animations or runtime pixel scans. */
export const CreaturePortrait=memo(function CreaturePortrait({enemy,size=84}:{enemy:EnemyDefinition;size?:number}){
  if(!sources.has(enemy.id))sources.set(enemy.id,portraitSource(enemy));
  const source=sources.get(enemy.id);
  const [image,setImage]=useState<{path:string;width:number;height:number}|null>(null);
  const [failed,setFailed]=useState(false);
  const loaded=source&&image?.path===source.path;
  const dimensions=source&&'imageSize' in source?source.imageSize:loaded?[image.width,image.height]:null;
  const cell=source&&'cell' in source?source.cell:source&&dimensions?[0,0,dimensions[0]/source.columns,dimensions[1]/source.rows]:null;
  const fit=cell?(size-8)/Math.max(cell[2],cell[3]):1;
  return <span className={`creature-portrait${enemy.id==='frost-wolf'?' is-frost':''}`} role="img" aria-label={enemy.name} style={{width:size,height:size}}>
    {!source||failed?<span aria-hidden="true">◇</span>:<span className="creature-crop" style={{
      width:cell?cell[2]*fit:1,height:cell?cell[3]*fit:1,left:cell?(size-cell[2]*fit)/2:0,top:cell?(size-cell[3]*fit)/2:0,
    }}><img src={`${import.meta.env.BASE_URL}${source.path}`} alt="" loading="lazy" decoding="async" draggable={false}
      onError={()=>setFailed(true)} onLoad={event=>{const img=event.currentTarget;setImage({path:source.path,width:img.naturalWidth,height:img.naturalHeight});}}
      style={{visibility:dimensions?'visible':'hidden',width:dimensions?dimensions[0]*fit:1,height:dimensions?dimensions[1]*fit:1,
        left:cell?-cell[0]*fit:0,top:cell?-cell[1]*fit:0}}/></span>}
  </span>;
});
