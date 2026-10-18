# Cave expeditions

Four persistent, repeatable dungeons are linked to nearby settlement notice boards:

| Dungeon | Direction | Recommended level | Defenders | Chest base reward |
| --- | --- | --- | --- | --- |
| Hollow Road Hideout | Northeast of Oakmere | 6+ | Bandits, Hideout Captain | 1,400 G / 1,200 XP |
| Moonroot Den | Southwest of Moonfall | 12+ | Goblins and stone-slingers, Hoardkeeper | 2,100 G / 1,800 XP |
| Broken Pass Cavern | Northeast of Starhold | 18+ | Trolls and bandits, Passbreaker | 2,800 G / 2,400 XP |
| Redfang Underhold | Southwest of Redmesa | 22+ | Orc raiders and spearmen, Warleader | 3,600 G / 3,000 XP |

The entrance becomes discovered within 900 world units and receives a labeled cave minimap icon. Art is loaded only when approaching a site, with exterior images released beyond 1,800 units. Entrance placement checks the region, road clearance, walkability, physical props and surrounding scenery. The rock arch has a solid upper footprint while the entrance approach stays open. Terrain tiles elsewhere in the world are unchanged.

Entrance registration waits until the player is within 1,000 units so placement checks inspect nearby streamed scenery. A failed artwork request backs off before retrying rather than issuing requests on every navigation tick.

Enter and leave through the existing house-interior system. The exterior simulation and physics remain paused. Two waves of three hardened enemies are followed by a named captain; never more than three cave enemies are alive at once. Existing complete enemy art, attacks, telegraphs and status effects are reused. Hardened enemies have higher regional levels, health and damage; captains are stronger again. Alice can follow and help fight. There are no additional reinforcement summons.

The chest appears only when all seven authored enemy slots are defeated. Kill bits persist across exit, defeat and reload. Surviving enemies return with full health on re-entry, while defeated enemies stay defeated until the cave resets. Cave kills reveal creature records but do not award overworld boss drops or ordinary hunting-contract progress. The large gold/XP payout comes from the chest once per clear, with normal Luck reward scaling. Its claimed flag, rewards, reset deadline and matching accepted contract completion change atomically; the existing save validator and autosave path include the cave ledger. Board rewards add 40% of the chest's base gold and XP and remain one-time commissions.

Claiming a chest starts a 20-minute real-time cooldown, saved as `respawnAt`. Time spent offline counts; sleeping at an inn does not shorten it. Before the deadline, returning shows the claimed chest without enemies. At or after the deadline, an unoccupied cave resets its defenders and chest, retaining discovery. An occupied cave stays cleared until the player leaves. Existing outdoor navigation snapshots and entry checks handle expiry without a new timer or background enemy simulation. Partial clears and unopened chests do not expire. Previously claimed saves without a deadline become replayable on the next entry. Accepted/fulfilled board commissions retain their progress through cave resets.

## Performance

Only the active cave has enemies, collision tests and a chest. Outdoor entrance work is attached to the existing navigation snapshot. Wave admission runs on a bounded retry cadence; it does not scan a world-wide grid. Cave geometry uses the existing local collision/path cache, floor tile sprites and static art frames. Cave art needs no runtime pixel isolation, continuous particle emitter, new interval, or offscreen dungeon simulation. Saves store only a small discovery/kill-bit/chest ledger, not disposable room actors.

## Art

Built-in imagegen output: `public/assets/interiors/cave_stone/kit-v1.png`. The source contains a rocky entrance, two natural rock wall segments, stone floor, and closed/open reward chests. `src/data/caveArt.ts` explicitly registers each illustration to avoid adjacent-art bleed. The cave floor crop stays inside the painted texture, excluding its outside edge. Existing terrain and character animation sheets are preserved.

Generation prompt:

Use case: stylized-concept. Asset type: a single coherent modular cave kit atlas for the existing top-down 2D browser RPG Mernondna. Style references are the recently viewed world_assets.png and nardorous_alpine/kit.png: match their detailed hand-painted pixel-art, muted earthy gray-brown stone, crisp dark contours, restrained highlights, top-down three-quarter game perspective. Create a landscape 1536 by 1024 atlas arranged in exactly 3 columns and 2 rows of 512px cells, transparent alpha outside subjects, NO labels, text, scenery or drop shadows. Each isolated asset stays entirely within its own cell with at least 40px clear padding and no fragments crossing cells. TOP LEFT: rocky cave entrance, rough rounded stone arch over a completely dark open mouth, sparse moss only on the rocks, no grass patch, no ground platform or colored base, entrance feet have transparent gaps so the existing terrain shows through. TOP MIDDLE: a broad horizontal rough-hewn natural rock cave wall segment, front face visible, side ends match adjacent segments, no wood, no plants. TOP RIGHT: a narrow upright rock cave wall segment for east/west cave walls, same rock palette and light, no plants or platform. BOTTOM LEFT: one opaque 384px square seamless repeating top-down cave-floor texture centered in the cell, worn dark warm-gray rock with fine cracks and subtle dusty gravel, no border, no large rocks, no perspective, no objects, calm contrast. BOTTOM MIDDLE: a complete closed iron-banded wooden treasure chest with brass latch, front-three-quarter view, no ground patch. BOTTOM RIGHT: the same complete chest open with a modest warm glow inside and visible gold coins, glow contained within the silhouette, no floating particles. Consistent scale and lighting; entrances usable at about 220px wide in-game, cave floors and walls should blend together; chest usable at 64px wide. Preserve the game's pixel-art feel rather than glossy vector or realistic 3D art.

## Manual review

Validation completed: application TypeScript check; five focused cave reward/save/contract/placement checks; and a rendered, isolated instance of the actual interior system with floor, wall and entrance-corridor checks. An isolated cave-manager check exercised its 3/3/1 wave lifecycle and one-time chest, using stub defender actors rather than the full combat renderer. The full-world automated review stalled during startup/first-frame presentation and was stopped. Overworld entrance appearance with all streamed props, complete enemy combat, balance, mobile performance and FPS remain manual checks; the isolated checks do not establish those results.

Locate an entrance near the listed settlement, approach until its Cave minimap marker appears, and enter outside combat. Confirm both groups and the captain fight inside the room; exit/re-enter after a defeat and after a partial clear. Defeat the captain and open the new chest from nearby. Confirm another interaction or reload cannot grant the chest reward again before the cooldown, and the accepted board expedition becomes ready for turn-in. After 20 real minutes, leave and re-enter to fight new defenders and claim fresh chest rewards. Inspect entrance/ground blending, rock-wall containment, foot collisions and room navigation on mobile.
