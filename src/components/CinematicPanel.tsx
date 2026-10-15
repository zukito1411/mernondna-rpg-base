import { useGameStore } from '../store/gameStore';
import {NPC_BY_ID} from '../data/npcs';
import {SpritePortrait} from './SpritePortrait';
export function CinematicPanel() {
  const cinematic=useGameStore(s=>s.cinematic),skip=useGameStore(s=>s.requestCinematicSkip);
  if(!cinematic)return null;
  const npc=cinematic.focusNpcId?NPC_BY_ID[cinematic.focusNpcId]:undefined;
  return <section className="cinematic-presentation" aria-label="Story scene">
    <div className="cinematic-top"><span>{cinematic.title}</span><button onClick={skip}>Skip scene · Esc</button></div>
    <div className="cinematic-caption" role="status">
      {cinematic.ready ? <>
        {npc&&<div className="cinematic-identity"><SpritePortrait npc={npc} frame={npc.spriteFrame} texture={npc.spriteTexture} name={npc.name}/><span>{npc.name}<small>{npc.title}</small></span></div>}
        <p>{cinematic.line}</p>
      </> : <p>Preparing scene…</p>}
    </div>
  </section>;
}
