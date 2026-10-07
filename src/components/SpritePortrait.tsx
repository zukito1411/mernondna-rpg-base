import { ART_SHEETS } from '../data/art';
import type { NpcDefinition } from '../game/types';

export function SpritePortrait({ frame,name,texture = 'npcs' }: { frame: number; name: string; texture?: NpcDefinition['spriteTexture'] }) {
  const sheet = ART_SHEETS.find(sheet => sheet.key === texture)!;
  const source = sheet.sources?.[frame];
  const [x,y,width,height] = source?.cell ?? sheet.regions![frame];
  const imageSize = source?.imageSize ?? sheet.sourceSize!;
  const scale = 58 / Math.max(width,height);
  return (
    <span className="sprite-portrait" role="img" aria-label={`${name} portrait`}>
      <img src={source?.path ?? sheet.path} alt="" draggable={false} style={{
        width: imageSize[0] * scale, height: imageSize[1] * scale,
        left: (64 - width * scale) / 2 - x * scale, top: (64 - height * scale) / 2 - y * scale,
      }} />
    </span>
  );
}
