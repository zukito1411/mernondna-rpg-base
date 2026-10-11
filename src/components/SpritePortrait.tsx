import { ART_SHEETS } from '../data/art';
import { NPC_IDLE_ART } from '../data/npcIdleArt';
import type { NpcDefinition } from '../game/types';

/**
 * Dialogue must use source art rather than Phaser's generated/aliased textures.
 * In particular npc_royal_guard and npc_guard both use npc_guard_idle artwork.
 * Bad or missing art metadata must never bring down the game UI.
 */
export function SpritePortrait({ frame, name, texture = 'npcs' }: {
  frame: number; name: string; texture?: NpcDefinition['spriteTexture'];
}) {
  const family = texture === 'npc_royal_guard' ? 'npc_guard' : texture;
  const idle = NPC_IDLE_ART.find(entry => entry.walk === family || entry.key === family);
  const sheet = ART_SHEETS.find(entry => entry.key === idle?.key)
    ?? ART_SHEETS.find(entry => entry.key === family)
    ?? ART_SHEETS.find(entry => entry.key === texture);

  // If future NPC definitions change their frame count, prefer a valid first
  // idle frame rather than attempting to index an undefined sprite region.
  const source = sheet?.sources?.[frame] ?? sheet?.sources?.[0];
  const region = source?.cell ?? sheet?.regions?.[frame] ?? sheet?.regions?.[0];
  const imageSize = source?.imageSize ?? sheet?.sourceSize;
  const [x, y, width, height] = region ?? [0, 0, 0, 0];

  if (!sheet || !imageSize || !region || width <= 0 || height <= 0
    || imageSize[0] <= 0 || imageSize[1] <= 0) {
    return (
      <span className="sprite-portrait" role="img" aria-label={`${name} portrait`}
        style={{display: 'grid', placeItems: 'center'}}>
        <strong aria-hidden="true">{name.trim().charAt(0) || '?'}</strong>
      </span>
    );
  }

  const scale = 58 / Math.max(width, height);
  return (
    <span className="sprite-portrait" role="img" aria-label={`${name} portrait`}>
      <img src={source?.path ?? sheet.path} alt="" draggable={false} style={{
        width: imageSize[0] * scale, height: imageSize[1] * scale,
        left: (64 - width * scale) / 2 - x * scale,
        top: (64 - height * scale) / 2 - y * scale,
      }} />
    </span>
  );
}
