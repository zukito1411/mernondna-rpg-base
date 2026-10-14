import {useState} from 'react';
import {ART_SHEETS} from '../data/art';
import {NPC_IDLE_ART} from '../data/npcIdleArt';
import {citizenModel,CITIZEN_SOURCES} from '../data/regionalCitizenArt';
import type {NpcDefinition} from '../game/types';

/** Same identity-to-model resolver as the world actor. Never use an aliased
 * Phaser atlas key as a URL; missing images degrade to initials, not a crash. */
export function SpritePortrait({frame,name,texture='npcs',npc}: {
  frame:number;name:string;texture?:NpcDefinition['spriteTexture'];npc?:NpcDefinition;
}) {
  const [failed,setFailed]=useState<string|null>(null);
  const model=npc?citizenModel(npc):undefined;
  const regional=model===undefined?undefined:CITIZEN_SOURCES[Math.floor(model/6)];
  const family=texture==='npc_royal_guard'?'npc_guard':texture;
  const idle=NPC_IDLE_ART.find(entry=>entry.walk===family||entry.key===family);
  const sheet=ART_SHEETS.find(entry=>entry.key===idle?.key)??ART_SHEETS.find(entry=>entry.key===family);
  // World actors enter their first complete idle pose, not their walk-frame
  // index. Packed source metadata also handles legacy sheet-only citizens.
  const index=idle?0:Math.max(0,Math.floor(Number.isFinite(frame)?frame:0));
  const source=sheet?.sources?.[index]??sheet?.sources?.[0];
  const regionalRegion=regional?.regions[model!%6];
  const region=regionalRegion?[regionalRegion[0]-3,regionalRegion[1]-3,regionalRegion[2]+6,regionalRegion[3]+6]
    :source?.cell??sheet?.regions?.[index]??sheet?.regions?.[0];
  const imageSize=regional?[1536,1024] as const:source?.imageSize??sheet?.sourceSize;
  const path=regional?.path??source?.path??sheet?.path;
  const [x,y,width,height]=region??[0,0,0,0];
  const valid=path&&imageSize&&width>0&&height>0&&x>=0&&y>=0
    &&x+width<=imageSize[0]&&y+height<=imageSize[1];
  const identity=`${npc?.id??name}:${path}:${x}:${y}`;
  const scale=valid?58/Math.max(width,height):1;
  return <span className="sprite-portrait" role="img" aria-label={`${name} portrait`}>
    {!valid||failed===identity?<strong className="portrait-fallback" aria-hidden="true">{name.trim().charAt(0)||'?'}</strong>
      :<span className="portrait-crop" style={{width:width*scale,height:height*scale,
        left:(64-width*scale)/2,top:(64-height*scale)/2}}>
        <img src={`${import.meta.env.BASE_URL}${path}`} alt="" draggable={false}
          onError={()=>setFailed(identity)} style={{width:imageSize![0]*scale,height:imageSize![1]*scale,
            left:-x*scale,top:-y*scale}} />
      </span>}
  </span>;
}
