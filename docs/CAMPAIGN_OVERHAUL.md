# Roadborn campaign implementation

Continued from the paused October 13 work on October 14, 2026. This records
implemented source changes, not a claim of completed runtime verification.

## Playable campaign

The existing quest IDs, bosses, artwork, continuous world, ports, interior
entrances, save key and repeat-battle timers remain in use.

| Chapter | Actual objectives before the confrontation |
| --- | --- |
| Oakmere | Personal opening narration; mentor, inn, scout and smith conversations; three authored bandits at a seed-cart ambush; Lena's rescue; seed evidence; growers' report; motivation choice; guard arrangement; tower dispatch; Varr; recovered survey and seal; compass inquiry |
| Highmere | Existing waybill/tally investigation, witness negotiation, Tovin's physical escort and stolen-grain inquiry; the household relief agreement is now required before the regional mandate |
| Narenthil | Bowyer and lorekeeper accounts; Greenward inscription; three thornlings; field scribe; Moonfall herbalist and pilgrim marks; three spiders; grove-keeping agreement; Warden |
| Nardorous | Quartermaster and templar; beacon marks; recovered porter kit; supply delivery; safe-signal interpretation; Stonejaw |
| Rindass | Beastmaster and forgewright; well inscription; two separate three-warrior Iron-Tusk camps; negotiated water custody; Krag |
| Druganwoods | Runesmith and boatwright; spring seal; three spirits trapping Bruni; rescued surveyor; river-guild account of the parents' final crossing; Cibar's existing pump-repair adventure; guild repair undertaking; Rootfather |
| Portquill | Harbor and sailmaker accounts; bay signal; five authored flagship crew including boatswains; shipboard freight manifest; cargo-account decision; Salt King |
| Frostlands | Hunter and household trader; beacon; five authored frost wolves blocking the supplies; recovered lantern; return delivery; Wyrm preparation and confrontation |
| Darkav | Forge and warder; ash vent and burnt chainworks; charge book; public/shared archive decision; Ashen Seer |
| Revelation | Regional accounts returned to the archive; grain official confronted with evidence; personal return to the mentor |
| Final chapter | Keeper's compass explanation; covenant decision; signed agreements delivered to the forge; evacuation and chainwork preparations; lair survey; Varkhul retreat; ward repair; royal acknowledgment; inn homecoming and epilogue |

Varkhul is the final story boss. The final stage requires a defeat **during its
active confrontation objective**; an early exploratory defeat cannot skip the
final battle. Previously completed dragon quests retain their completion during
migration. Varkhul still survives and returns after the existing twenty-minute
timer; no timer or approved dragon animation was changed.

## Integration

- `campaign.ts` replaces the opening and regional sequences while retaining
  their legacy quest/objective/boss IDs. `the-last-ward` closes the campaign.
- `campaignWorld.ts` creates persistent ambush/defense groups, supplies, a
  shipboard manifest and readable evidence using existing approved artwork.
  Counts are tied to specific content-ID prefixes and eligible enemy species.
  Clearing unrelated ambient enemies does not satisfy these camps.
- The chunk manager's optional preparation hook lets new story groups recover
  from loaded scenery blocking their original feet positions. It preserves
  surviving actors' IDs, damage and deaths; retries are bounded and throttled.
  Existing non-story encounter admission is unchanged.
- Lena and Bruni use approved NPC models and the existing idle presentation.
  Both have identities, occupations, family ties, relationships and consequences.
  Their logical actors return to their home settlement offscreen after the
  relevant rescue/report, keeping trust and save identity rather than creating
  duplicate residents.
- Dialogue advances talk/delivery stages after the final line is closed, not
  merely when its window opens. Choice responses remain readable; wrong puzzle
  answers remain retryable. The presentation layer no longer replaces authored
  character dialogue with generic profession text.
- Existing localization is respected by quest writing and interior bindings.
  Current NPC IDs/models remain the authority for dialogue/cinematic portraits.
- Cinematics include an opening, discoveries, boss preparations/aftermath,
  family revelation, restoration and choice-aware epilogue. Indoor scenes use
  loaded room actors or local player framing, never outdoor coordinates in the
  black void. Existing skip/control-restoration flags remain in use.
- Region reports persist local outcomes, attune the existing shrines and grant
  milestone XP. Decisions change later local dialogue and epilogue variants.
  Cinderwatch has a persistent restored tint after the final interaction.

## Guidance and journal

- Objective candidate lists are indexed once. Mixed enemy hunts include the
  intended melee/ranged/heavy members and exclude defeated actors.
- Repeatable clues remain eligible after being read earlier. Boss recovery
  guidance shows the existing return deadline instead of pointing nowhere.
- All overseas objectives can guide to an actual embarkation quay, including
  clues and monsters, not just NPCs. The destination pin remains distinct from
  the next approach waypoint.
- Mainland guidance uses the existing surveyed road/bridge graph; settlement
  guidance reuses the visibility-checked street graph. Interiors use a bounded,
  lazily created swept-feet grid that excludes furniture and black void.
  This is guidance, not automatic player movement or a new world pathfinder.
- Flagship approach/exit guidance uses the measured eastern gangplank, rather
  than pointing through the ship's rails. Darkav's final confrontation/forge
  approach uses the existing ash landing and western lair trails.
- The journal records chapter progression, main/side distinction, current
  contacts and destinations, decisions, count progress, recovered evidence,
  rewards and completed narrative outcomes. Dependency quests guide to their
  actual active objective or reachable giver. Tovin's escort guidance changes
  between the survivor and the safe kitchen approach; stay near him.
- Indoor compass/minimap positions use the live room player while saving still
  uses the safe exterior position. The minimap draws the actual connected floor
  rectangles against black void; the expanded regional map pins the building's
  true world location rather than synthetic room coordinates.

## Saves

- The existing version-5 format/key is retained, with a campaign-revision flag.
- Legacy completed quests keep completion and are not paid again. Required
  original completed-stage values are checked before additions are grandfathered.
- New stages behind an active legacy save's frontier are grandfathered; future
  stages remain playable. Migration does not invent irreversible choice records.
- Completed scenes remain completed. Grandfathered scenes do not replay.
  Existing player level, equipment, position, boss history, deadlines and other
  encounter records are preserved.
- The new concluding chapter becomes available after previously completed
  regional progress. New-game narration is not imposed on progressed saves.

## Verification boundary

Source inspection only. No unit tests, type checks, production/APK builds,
browser automation, game launches, commits or publishing were performed.

Still requiring authorized runtime/manual review: a fresh opening and all
chapter transitions; scenery-dependent camp admission and NPC return courts;
indoor hallway guidance on mobile; Tovin's escort; interrupted/skip cinematics;
legacy save resume; final dragon replay timing; and combat/XP pacing. Geometry
fallbacks are bounded but runtime assets/terrain must be judged in the game.
No new sprite sheet or illustration was generated for this campaign work.

## Household conversations

The main road now includes the caravan master's West Cottages conversation
before the seed-cart rescue, and the Moonfall grove host's conversation before
reading the pilgrims' ribbons. Both reuse existing residents and door bindings.
Grove House uses the connected four-room villa layout and its regional kit.
The conversations concern family memories, Varr's former trade and the missing
pilgrims, rather than unrelated errands. Crown Hall's relief audience and final
recognition already form part of the mandatory main story.

Existing saves grandfather only these two added conversations when already past
them; completed quests, rewards and decisions are not reset. No tests/builds ran.
