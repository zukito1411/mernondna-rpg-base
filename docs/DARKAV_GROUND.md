# Darkav volcanic ground palette

## Blackspire settlement palette

Darkav's roads use a distinctly darker charcoal basalt pattern than surrounding
ground, including paths outside Blackspire. Inside its defended boundary,
charcoal courts and ash floors complement the darker, more legible streets.
Buildings, walls, lamps, furniture, trees, shrines and other
props/interactables inside Blackspire share the settlement's charcoal tint.
The north and south processional streets now reach their gates, and both gates
connect to the outer ash road leading to Varkhul's lair.
This is presentation-only: non-road terrain and actual molten lava retain
their regional appearance and collision.

## Asset-based red-rock revision

The neutral charcoal palette and generated fissure/raft strokes below have
been superseded. Darkav ground now uses ember-red basalt, red ash and scorched
red-brown trails. Paving retains its illustrated joints, with surface grain
sampled from the supplied lava boulder in `sprites/lava_snow.png` (frame 8).
Natural ash blends that same rock surface into existing ground grain. Molten
terrain uses an interior patch of the supplied lava pool (frame 11), including
its illustrated glow and cracks. Prepared atlas crop/fit metadata maps original
source coordinates without treating padding or whole standing rocks as floor.

Removed the generated ash polylines, outlined polygon rafts and old five-line
generic lava swatch. The dragon's lava rim uses the same asset-derived texture,
not synthetic orange outlines. Red ground-relief tones replace gray/plum hues.
Roads, safe terrain and actual lava collision boundaries remain unchanged.
Combat warning shapes remain separate gameplay telegraphs, not ground art.

Source inspection only; no tests, builds, type checks or game/browser launches.
The palette and texture blending have not been visually verified in-game.

## Original pass (superseded visuals)

Source-only change, 2026-10-09. The supplied screenshot showed pale, mossy
cobblestones underneath glowing volcanic rocks. Blackspire's authored streets,
courts and dragon deck returned ordinary `stone`, so the global stone swatch
was still used even where the surrounding natural terrain was ash.

`DarkavGroundArt.ts` now prepares four regional ground patterns from the
existing terrain illustrations:

- Neutral charcoal basalt paving: existing stone relief and joints remain,
  but green moss and pale limestone colors are removed. Streets stay cooled,
  legible and walkable, not covered with fake lava.
- Porous dark ash: the dirt grain replaces the former cobblestone-based ash,
  with subtle, sparse warm mineral fissures on natural ground.
- Scorched brown-black trails: dirt paths retain their surface distinction.
- Molten ground: brighter red-orange channels with yellow-hot edges around
  dark cooled crust islands, distinct from safe basalt and cosmetic fissures.

`TerrainBaker` chooses these patterns per sampled world cell only in Darkav,
including Blackspire's paving and Varkhul's lair. Masks use the existing
neighbor gutter; pattern phase remains world-aligned across streamed chunks.
Patterns are generated once per baker, not animated/uploaded every frame.
Existing ground-relief shadows use plum/charcoal instead of green in Darkav.

This changes presentation only. Original PNGs, terrain kinds, navigation,
collisions, roads, crops, water, actual lava boundaries, NPCs, quests and other
regions' textures remain unchanged. Warm hairline seams are decorative; actual
lava still uses the existing non-walkable terrain classification. No whole-scene
tint was added, so glowing props and characters retain their source colors.

No tests, type checks, builds, game/browser launches, simulations or device
checks ran. Actual visual contrast, region/shore blending and mobile baking
performance remain unverified. Installed APKs/deployed app shells need a future
authorized build and refresh before showing these source changes.
