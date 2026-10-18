# Armor equipment

Three independent slots: chest, boots, cape. The existing weapon slot and enhancement system remain separate. There are 18 collectible armor pieces across six sets. Each piece includes an illustration, origin, appearance, history, individual bonuses and acquisition source. Armor does not replace character animation sheets.

| Set | Source | Full-set bonus, in addition to piece bonuses |
| --- | --- | --- |
| Wayfarer | Smiths and general merchants; level 3; 140 / 90 / 110 G | +20 HP, +1.5% evasion |
| Crownsteel | Smiths outside Oakmere; level 12; 680 / 420 / 520 G | +25 HP, 3% armor damage reduction |
| Rededge | Captain Varr | +4% critical chance, +2.5% evasion |
| Moonlit Oath | Moonlit Warden | +5% evasion, +2% critical chance |
| Stonejaw Bulwark | Stonejaw | +60 HP, 4% armor damage reduction |
| Emberfang | Varkhul | +45 HP, +5% critical chance, 2% armor damage reduction |

Shop prices are chest / boots / cape. Boss armor rolls independently from weapons at 25% base chance, increasing to 45% at 40 Luck. One piece is selected per successful armor roll, prioritizing missing pieces of that boss's set. After collecting the set, duplicate armor becomes gold and uses the existing rare-loot popup queue. Summoned enemies do not award armor. Armor has no enhancement-material mechanic.

Bosses with armor sets also have an independent complete-set roll: 10% at base Luck, increasing by 0.2 percentage points per Luck to 18% at Luck 40. A successful roll awards that boss's chest, boots and cape together, superseding any single-piece armor reward for that defeat. Owned pieces become salvage gold; missing pieces enter the bag once. A single illustrated complete-set popup shows all three items, new-piece count and salvage gold. Weapon drops remain independent. The roll occurs only on eligible boss defeats, using the existing repeat-defeat guard, reward transaction and save handling.

Matching all three armor slots activates the set bonus; weapons are not required for a set. Mixed armor retains each piece's individual bonuses. Armor reduction stacks multiplicatively with vitality and talents. Total critical and evasion chances cap at 60%; armor reduction caps at 35%. Equipment previews include set changes. Equipping does not heal; removing maximum HP clamps current HP. Bonuses are cached when equipment changes or a save loads, with no new world update loop.

Save version 6 gains optional `armorInventory` and `equippedArmor` fields. Older saves receive an empty inventory and empty slots. Loading validates known unique items, ownership, slot types and armor-adjusted HP, then reconstructs cached bonuses. Autosaving observes inventory and loadout changes. Armor codex records unlock through ownership and contain narrative descriptions rather than combat statistics.

Merchant catalogs have available-category filters, search, selectable illustrated goods, item profiles, set previews, potion counts and purchase guards for ownership, level, money and inventory limits. Conversation close controls remain outside scrolling content.

## Art generation

Generated with the built-in imagegen tool, using the existing weapon atlas (`public/assets/items/equipment-v1.png`) as the style reference. Saved atlas: `public/assets/items/armor-v1.png` (1024 × 1536, transparent PNG). Existing weapon art and terrain tiles are unchanged. Explicit measured illustration rectangles in `ARMOR_ART_FRAMES` preserve proportions and isolate adjacent art; inventory icons use a 10% padding allowance and clip to their own illustration.

Design brief: eighteen detailed, hand-painted fantasy inventory illustrations with dark outlines matching the weapon atlas. Three columns: complete chest armor, paired boots, cape. Six coordinated rows: weathered brown leather and moss-green Wayfarer gear; silver, royal-blue and gold Crownsteel; jagged dark iron and crimson Rededge; silver-edged indigo, violet jewels and crescent Moonlit Oath; slate, brown leather and golden mineral-seam Stonejaw; black dragon scales, amber fittings and red-orange Emberfang. Isolated equipment without bodies, labels, decorative frames or scenery.

Refinement prompt: preserve the exact eighteen equipment designs. Transparent background with no halos, shadows or background. Strict three columns and six rows, with item centers at x = 1/6, 1/2, 5/6 and y = 1/12, 3/12, 5/12, 7/12, 9/12, 11/12. Keep whole items within 68% of cell height and 76% of cell width, with at least 16% vertical padding. Scale proportionally, keep each pair of boots together, and contain the final Emberfang row. No labels or grid lines. The returned art required measured rectangles rather than assuming uniform registration.

Validation for this change: application TypeScript check only. Gameplay balance, merchant purchasing, boss drops and equipment/save behavior remain for manual play testing.
