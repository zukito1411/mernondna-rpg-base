import { NPC_BY_ID } from '../data/npcs';
import { useGameStore } from '../store/gameStore';
import { SpritePortrait } from './SpritePortrait';

export function DialoguePanel() {
  const dialogue = useGameStore((s) => s.dialogue);
  const advance = useGameStore((s) => s.advanceDialogue);
  const end = useGameStore((s) => s.endDialogue);
  const logicalStates = useGameStore(s => s.worldContent.states);
  if (!dialogue) return null;
  const npc = NPC_BY_ID[dialogue.npcId];
  if (!npc) return null;

  const line = npc.dialogue[Math.min(dialogue.lineIndex, npc.dialogue.length - 1)];
  const finalLine = dialogue.lineIndex >= npc.dialogue.length - 1;

  return (
    <div className="dialogue-wrap">
      <section className="dialogue-panel">
        <div className="dialogue-speaker">
          <SpritePortrait frame={npc.spriteFrame} texture={npc.spriteTexture} name={npc.name} />
          <div className="dialogue-identity"><strong>{npc.name}</strong><span>{npc.title}</span>
            <small>Trust {logicalStates[`npc:${npc.id}`]?.trust ?? npc.relationshipToLeigneron.trust} / 100</small>
          </div>
        </div>
        <p>{line}</p>
        <div className="relationship-note">{npc.relationshipToLeigneron.kind}: {npc.relationshipToLeigneron.summary}</div>
        <button type="button" onClick={finalLine ? end : advance}>{finalLine ? 'Close' : 'Continue'}</button>
      </section>
    </div>
  );
}
