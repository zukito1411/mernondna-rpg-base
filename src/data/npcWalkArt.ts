import type { SpriteSource } from './animationPacks';

// Source-pixel head centers and sole baselines for the six left poses, then
// the six right poses. Register the person independently of bags and weapons.
const sideWalkAnchors: Record<string, readonly (readonly [number, number])[]> = {
  npc_blacksmith: [[143,512],[394,513],[643,512],[906.5,513],[1160,514],[1413,513],
    [123,762],[377.5,761],[631,762],[890.5,762],[1146,762],[1397.5,761]],
  npc_adventurer: [[175.5,510],[402.5,510],[635.5,510],[865,510],[1095,510],[1324,511],
    [206,757],[434.5,757],[665,758],[895.5,757],[1125,757],[1355.5,757]],
  npc_attendant: [[139.5,499],[380,499],[630.5,499],[890.5,499],[1143,498],[1398,499],
    [131.5,751],[385,751],[631,752],[894.5,752],[1148.5,751],[1394,751]],
  npc_general: [[129,506],[381.5,506],[637,505],[892,506],[1148,506],[1402.5,506],
    [151.5,750],[407.5,750],[660.5,750],[914.5,750],[1173.5,750],[1422.5,751]],
  npc_huntress: [[148.5,492],[391,492],[641.5,494],[890.5,494],[1140.5,494],[1394.5,493],
    [147.5,741],[397,741],[649.5,742],[897,742],[1146.5,741],[1396.5,741]],
  npc_villager: [[193.5,497],[425,496],[654.5,497],[889,497],[1123.5,497],[1362.5,496],
    [193.5,749],[424,749],[655,749],[892,750],[1125.5,749],[1354,749]],
  npc_woman: [[66.5,168],[211,168],[352,168],[495.5,168],[640,168],[787,168],
    [76.5,168],[219.5,168],[363.5,168],[509.5,168],[654.5,168],[796,168]],
};

export function registerNpcWalkSources(texture: string, sources: SpriteSource[]): SpriteSource[] {
  const anchors = sideWalkAnchors[texture];
  if (!anchors) return sources;
  return sources.map((source, frame) => frame >= 6 && frame < 18
    ? { ...source, groundAnchor: anchors[frame - 6] }
    : source);
}
