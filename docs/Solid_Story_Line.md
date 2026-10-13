# TALES OF LEIGHNERON — COMPLETE STORY, QUEST, CINEMATIC & ADVENTURE OVERHAUL

## PRIMARY OBJECTIVE

Transform Tales of Leighneron into a complete, immersive, story-driven medieval fantasy RPG with a meaningful beginning, connected regional adventures, memorable characters, compelling conflict, emotional development, proper quest progression, satisfying boss encounters, and a fulfilling conclusion.

**IMPLEMENT THIS AS ONE COHESIVE DEVELOPMENT TASK. DO NOT STOP AFTER CREATING ONLY A STORY PLAN, QUEST DATA, OR FOUNDATION SYSTEMS.**

The existing game has exploration, combat, regions, NPCs, settlements, bosses, and quests, but I want the journey to feel like a real fantasy adventure rather than repeatedly traveling to an area, fighting a boss, and moving to the next location.

The player must understand:

- Who Leigneron is and what motivates him.
- Why he begins his journey.
- Why he needs to travel between different regions.
- What is happening to the kingdom and its people.
- Why each region matters to the larger conflict.
- What each major character wants, fears, and believes.
- Why monsters, bandits, pirates, hostile clans, and bosses are involved.
- What is at stake if Leigneron fails.
- How the player's actions change the world.
- How the journey builds toward a meaningful final confrontation and resolution.

The adventure should have the depth and pacing of a proper medieval fantasy RPG, with the feeling of traveling through a living, connected world.

---

# PHASE 1 — INSPECT THE CURRENT GAME BEFORE MAKING CHANGES

Read `AGENTS.md` and inspect the latest actual repository implementation.

Review:

- Existing world history, lore, regions, settlements, and geographic relationships.
- Main quests, side quests, objectives, progression, rewards, and journal.
- NPC identities, personalities, dialogues, schedules, and relationships.
- Existing bosses, monsters, hostile factions, and regional encounters.
- Current story and cinematic systems.
- Player progression, combat, equipment, and abilities.
- Quest markers, navigation arrows, minimap, regional map, and waypoint handling.
- Buildings, interactable objects, world collision, and entry/exit functionality.
- Existing save format, story flags, quest IDs, and migration behavior.
- Existing artwork, audio, visual effects, and environmental presentation.
- Recent implementations including wildlife, Rindass orcs, pirates, and the Portquill flagship, wherever they actually exist.

**The current repository is the source of truth.**

Do not assume old descriptions represent the latest implementation.

Preserve and improve existing quests and lore rather than replacing everything blindly.

Do not overwrite existing work, approved artwork, world geometry, gameplay systems, or uncommitted changes.

Identify systems that can be reused and extend them rather than creating redundant ones.

---

# PHASE 2 — ESTABLISH A REAL CENTRAL STORY

Build a coherent narrative spanning the entire playable world.

The central story should involve Leigneron's personal journey becoming entangled with a growing crisis affecting the kingdom and surrounding regions.

Use existing lore as the foundation.

The world should feel interconnected through political tensions, trade disruptions, missing travelers, monsters migrating from their habitats, corrupted lands, hostile warbands, ancient powers, and ordinary people struggling to survive.

Do not invent unrelated world-ending disasters simply to make the story dramatic.

Establish a credible underlying cause of the regional conflicts and reveal it gradually through exploration, evidence, conversations, discoveries, and important encounters.

## Narrative structure

Create a complete main campaign with:

### ACT I — THE BEGINNING

- Introduce Leigneron and his ordinary life or circumstances using established lore.
- Give him a personal reason to begin adventuring.
- Introduce important companions, allies, mentors, and local NPCs.
- Begin with smaller conflicts that establish the gameplay and world.
- Include exploration, investigation, character conversations, and modest combat.
- Introduce the first clues that something larger is happening.
- End with a convincing reason to travel toward Highmere or the next established narrative destination.

### ACT II — THE KINGDOM'S TROUBLES

- Develop the political, social, and military challenges facing the kingdom.
- Make Highmere an important narrative location.
- Include meetings with authorities, commoners, merchants, soldiers, and witnesses.
- Investigate conflicting accounts rather than accepting every authority's explanation.
- Reveal how problems in neighboring regions affect one another.
- Give the player reasons to travel beyond the capital.
- Introduce major allies and adversaries with understandable motivations.

### ACT III — THE JOURNEY THROUGH THE REGIONS

Each major region should contribute a unique chapter to the overall story.

The chapter should be shaped by that region's geography, culture, economy, inhabitants, existing factions, and boss lore.

Examples of narrative themes:

- **Trandum:** Early journey, road safety, villages, mysterious disturbances, and learning what it means to protect others.
- **Narenthil:** Elven woodland, corrupted groves, ancient traditions, strained relations, and uncovering deeper mysteries.
- **Nardorous:** Dangerous mountain roads, isolated settlements, lost expeditions, and survival against powerful creatures.
- **Rindass:** Orc clan conflicts, political mistrust, hostile warbands, disputes over territory, and the threat posed by Krag.
- **Druganwoods:** Dwarven settlements, mines, trade, environmental damage, missing workers, and secrets beneath the earth.
- **Portquill:** Pirates, disrupted sea trade, stolen supplies, coastal settlements, maritime investigation, and the Salt King's influence.
- **Frostlands:** Harsh conditions, endangered settlements, hidden history, and an escalating threat from the Frost Wyrm.
- **Darkav:** Volcanic dangers, ancient powers, forbidden knowledge, and the deeper truth behind the growing crisis.

Use the actual regional names, existing playable geography, and established story details. Do not force these suggested themes over contradictory canonical lore.

Make travel between regions narratively justified.

### ACT IV — REVELATIONS AND CONSEQUENCES

As Leigneron progresses:

- Earlier clues begin connecting.
- Important NPCs reveal hidden motivations.
- Regional conflicts become part of a larger picture.
- Former decisions affect later conversations or assistance.
- Some allies may disagree with Leigneron's methods.
- The player discovers the larger forces driving the conflict.
- Important revelations should be earned through quests and exploration.

Do not reveal every mystery in one exposition-heavy conversation.

### ACT V — CLIMAX AND RESOLUTION

Create a meaningful buildup toward the established final major threat.

Before the final encounter, require preparation, discoveries, conversations, exploration, and resolution of important conflicts.

The conclusion should include:

- A proper final confrontation.
- Story-driven consequences.
- Cinematic resolution.
- Reactions from major characters.
- Recognition of the player's accomplishments.
- An epilogue reflecting important completed chapters and decisions.
- A satisfying feeling that Leigneron's journey mattered.

Do not abruptly display "Quest Complete" immediately after killing the final enemy.

Preserve the ability to continue exploring afterward where compatible with the current game design.

---

# PHASE 3 — REBUILD QUEST PROGRESSION INTO REAL ADVENTURES

The game must no longer rely predominantly on:

1. Talk to NPC.
2. Travel to boss.
3. Kill boss.
4. Quest complete.

Every major questline should have a properly motivated sequence of varied objectives.

## Required quest types

Implement and integrate these types wherever appropriate:

### Investigation

- Search abandoned camps.
- Examine suspicious objects.
- Investigate ruins.
- Discover evidence of attacks or corruption.
- Compare witness accounts.
- Read found notes, letters, and records.
- Follow tracks or signs toward another location.
- Uncover hidden connections between events.

### Exploration and travel

- Journey to distant settlements.
- Discover forgotten locations.
- Locate mountain passages.
- Find hidden forest groves.
- Explore coastal outposts.
- Search wilderness camps.
- Reach important landmarks.
- Cross dangerous regions with story context.

### NPC interaction

- Speak with witnesses.
- Question suspicious individuals.
- Meet local leaders.
- Negotiate with opposing factions.
- Deliver messages.
- Return discovered evidence.
- Seek information from scholars, soldiers, or travelers.
- Gain the trust of important characters.

### Monster hunting

Create meaningful objectives such as:

- Slay 10 hostile raiders threatening a trade route.
- Defeat 20 creatures infesting a dangerous wilderness area.
- Eliminate 30 hostile enemies across a larger military campaign.
- Destroy or defeat a specific number of hostile patrols.
- Defend a vulnerable settlement from attackers.
- Hunt particular enemy species in identified habitats.

**These numbers are examples, not compulsory padding.**

Use 10/20/30 where the scale of the story and existing enemy spawning makes sense.

A small village quest may require 3–6 enemies. A sustained campaign against a hostile faction can reasonably require 10–30.

Do not turn every quest into a long grinding exercise.

The player should understand why eliminating those enemies matters.

Ensure the required enemies exist in sufficient numbers and valid locations, with accessible respawns or encounter waves when necessary.

### Settlement clearing and defense

- Clear a hostile camp.
- Liberate an occupied outpost.
- Rescue trapped villagers.
- Protect traveling merchants.
- Defend a settlement against a structured attack.
- Eliminate raider leaders.
- Secure an important road or bridge.

A cleared settlement should visibly and mechanically reflect its changed status where practical.

### Escort and rescue

- Escort survivors to safety.
- Protect a wounded traveler.
- Lead civilians through dangerous territory.
- Rescue prisoners.
- Accompany a scout to investigate suspicious movement.

Escorts must follow real traversable routes and cannot teleport through terrain or become permanently stuck.

### Preparation and recovery

- Gather supplies for an expedition.
- Recover stolen provisions.
- Repair an important structure.
- Help a healer obtain medicine.
- Retrieve records or equipment.
- Prepare a settlement for an upcoming attack.

Reuse existing interactions and inventory systems where appropriate.

Do not create unimplemented item systems simply to satisfy a quest description.

### Puzzles and meaningful decisions

- Interpret historical clues.
- Investigate contradictory evidence.
- Choose whom to trust.
- Solve environmental puzzles.
- Make decisions affecting local relationships.
- Negotiate peace or escalate conflict where justified.

Choices should have comprehensible consequences without arbitrarily locking players out of the campaign.

---

# PHASE 4 — GIVE EVERY BOSS A PROPER STORY BUILDUP

Every major boss must be the culmination of a meaningful regional questline.

**Do not allow the main story to introduce a boss and immediately send the player to kill it.**

A typical boss chapter should follow this structure:

1. Arrive in a region and establish its atmosphere.
2. Discover a problem affecting its inhabitants.
3. Meet important local characters.
4. Investigate the cause of the problem.
5. Complete relevant smaller quests.
6. Explore important areas.
7. Fight normal enemies associated with the conflict.
8. Complete a regional objective such as securing a route or clearing an outpost.
9. Gather the evidence, allies, or resources necessary to confront the threat.
10. Reveal the true importance of the boss.
11. Unlock and approach the boss encounter.
12. Trigger a meaningful pre-battle cinematic.
13. Fight the boss with its existing combat mechanics.
14. Trigger a post-battle scene.
15. Return to affected characters or settlements.
16. Resolve the chapter and establish the next narrative destination.

This is a narrative framework, not a rigid sequence to repeat word-for-word for all bosses. Vary the quests so every region feels distinct.

## Boss-specific requirements

Review and preserve the existing identities and encounters for:

- Captain Varr
- Moonlit Warden
- Stonejaw
- Krag the Iron-Tusk
- Rootfather
- Salt King
- Frost Wyrm
- Ashen Seer
- Varkhul

Give each an appropriate story arc based on its existing lore.

For example, Krag's chapter should involve the Rindass clan conflict, investigating raids, hostile orc camps, warband encounters, speaking with local authorities, and understanding why his faction is fighting.

The player should not simply arrive at Rindass and immediately defeat Krag.

The Salt King's chapter should involve piracy, disrupted trade, investigation, and appropriate coastal or shipboard objectives before the major confrontation.

Keep existing boss identities, defeated-state handling, and related progression compatible with saved games.

Where appropriate, gate the narrative boss confrontation behind completed story objectives, but don't break free exploration or existing combat systems.

---

# PHASE 5 — MAKE NPCS REAL CHARACTERS

NPCs should not exist solely to provide one-line instructions.

Improve the writing and interactions of important existing characters.

Every major character should have:

- A clear identity and occupation.
- Motivations and concerns.
- Relationships with other characters.
- Knowledge relevant to the story.
- Dialogue that reflects their role and personality.
- Reactions to important events.
- Changes in dialogue after quests are completed.
- Meaningful involvement in the regional story.

## Medieval fantasy dialogue

The dialogue must feel like it belongs in a believable medieval fantasy world.

Use natural, atmospheric writing with appropriate social differences.

Examples:

- Knights and commanders speak with military discipline.
- Nobles use measured, formal language.
- Villagers speak plainly and with personal concerns.
- Merchants discuss risks, supplies, trade, and debts.
- Scholars reference evidence, history, and ancient knowledge.
- Elven characters may speak with greater patience or formality where appropriate.
- Orcs and dwarves should have distinct personalities and cultural perspectives, not simplistic stereotypes.

Avoid modern slang, memes, generic corporate language, and overly artificial archaic English.

Do not make everyone speak in the same theatrical voice.

Make conversations interactive where reasonable, with short exchanges, relevant choices, and responses that develop the story.

Avoid excessive text dumps.

Preserve established NPC names and personalities.

---

# PHASE 6 — MEANINGFUL CUTSCENES AND NARRATION

Implement appropriate cinematic sequences throughout the campaign.

Cutscenes should make important moments feel memorable without interrupting the game excessively.

## Required cinematic situations

- Beginning of the adventure.
- First significant discovery.
- Arrival at major story locations.
- Introduction of important characters.
- Discovery of serious threats.
- Major investigation revelations.
- Settlement attacks or liberation.
- Important character disagreements.
- Before major boss encounters.
- Immediately after major boss encounters.
- Major regional chapter conclusions.
- Important story transitions.
- Final confrontation and epilogue.

## Cinematic presentation

Reuse and extend the existing cinematic system.

Where appropriate, include:

- Camera panning toward important locations.
- Characters walking into position.
- NPCs approaching or addressing Leigneron.
- Dialogue synchronized with camera movement.
- Environmental sound and music transitions.
- Fade-in/fade-out transitions.
- Dramatic pauses.
- Framing of major structures, enemies, or landmarks.
- Narrated discoveries.
- Carefully timed visual effects.
- Properly placed character artwork or illustrations when assets are available.

A cinematic should have understandable actions and narrative purpose.

Do not present an empty black screen with several paragraphs of text and call it a full cinematic.

## Story artwork

If illustrations genuinely improve a sequence, create or integrate appropriate medieval fantasy artwork using available tools and assets.

Maintain the existing Tales of Leighneron art direction.

Do not use unrelated stock artwork, temporary debug drawings, or low-quality placeholders as final cutscene illustrations.

If image-generation tools are unavailable, use existing sprites, camera direction, environmental staging, character portraits, fades, and narration to make effective cutscenes.

Never falsely claim that missing artwork was generated.

## Cinematic reliability

- Prevent repeated cutscenes after loading a save.
- Preserve completed cinematic flags.
- Support skip where appropriate.
- Restore player control afterward.
- Handle interrupted scenes gracefully.
- Avoid trapping the player in a black screen.
- Ensure NPC positions and world state remain consistent.
- Do not create a save-load crash loop.

---

# PHASE 7 — COMPLETE QUEST NAVIGATION AND GUIDANCE

This is a major requirement.

**The quest arrow and map guidance must intelligently point to the actual objective, not merely the quest giver or the boss.**

Review the existing quest-navigation implementation and extend it as necessary.

## Navigation rules by objective

| Objective | Required guidance |
|---|---|
| Talk to NPC | Point toward the NPC's current reachable position |
| NPC inside a building | Point to the correct building entrance first |
| NPC inside a house, player outside | Guide to the door; after entering, guide to the NPC |
| NPC on another floor/interior | Guide toward reachable stairs/doorway transitions before the NPC |
| Travel to settlement | Guide to the settlement's accessible approach |
| Kill specific monsters | Guide toward a valid encounter or habitat containing that species |
| Slay 10/20/30 enemies | Guide toward an appropriate hunting area, camp, or remaining enemy group |
| Clear settlement | Guide to the hostile settlement or outpost |
| Investigate object | Point to the actual interactable clue |
| Collect materials | Guide to a valid location where required resources exist |
| Return to NPC | Guide to that NPC or accessible entrance |
| Enter dungeon or building | Point to the correct entrance |
| Fight boss | Guide to the boss only when that objective is unlocked |
| Escort character | Guide toward the next legitimate escort destination or checkpoint |

## Smart hierarchical navigation

Example:

**Quest: Speak to the scholar inside the Old Library**

1. Player is outside the town: arrow points toward the town.
2. Player enters town: arrow points toward the library entrance.
3. Player enters the library: arrow points toward the scholar.
4. Dialogue completes: arrow updates immediately to the next objective.

Do not point the arrow directly through walls or inaccessible rooms.

If the current game does not yet support fully explorable interiors, implement an appropriate reusable building-entry and exit system only for locations required by the story, using existing architecture and assets.

Do not pretend the NPC is inside an enterable building if no usable interior exists.

## Monster-hunting navigation

Example:

**Quest: Defeat 20 hostile orcs in Rindass**

- The journal displays progress: `7 / 20`.
- The arrow points toward an actual eligible warband area or encounter.
- When the group is defeated, the guidance selects another available eligible location.
- If the target area is depleted, guide toward a valid remaining location rather than an empty point.
- Kill credit must be restricted to the intended species, group, area, or faction as defined by the objective.
- After `20 / 20`, the arrow changes to the next objective, such as reporting to the commander.

Avoid requiring the player to wander aimlessly searching for enemies.

## Navigation and pathfinding

- Use actual accessible terrain.
- Respect buildings, rivers, cliffs, fortifications, impassable terrain, and world boundaries.
- Reuse existing road navigation and waypoint systems.
- Prefer safe and reasonable route guidance.
- Distinguish objective location from the suggested travel route.
- Never direct the player through locked or inaccessible buildings without showing how to unlock entry.
- Update guidance when NPCs move or enemies are defeated.
- Support streamed and currently unloaded destinations through logical objective locations.
- Keep marker computation efficient on Android.

The arrow, quest journal, minimap, and expanded map must agree on the same current objective.

---

# PHASE 8 — IMPROVE THE QUEST JOURNAL

The journal must tell the player what is happening and why.

Each main quest should present:

- Quest title.
- Story summary.
- Current objective.
- Objective progress.
- Relevant destination.
- Important characters involved.
- Completed stages.
- Clear instructions without excessive spoilers.
- Appropriate rewards or outcomes.
- Context explaining why the quest matters.

Organize the main campaign into identifiable chapters or quest chains.

Make side quests distinguishable from main story objectives.

When a quest is completed, preserve its narrative summary or a suitable journal record so the player can remember what happened.

Avoid unlocking unrelated late-game objectives before their narrative prerequisites.

---

# PHASE 9 — BUILD A BELIEVABLE, REACTIVE WORLD

The game world should respond to major story events.

Examples:

- Villagers thank Leigneron after their settlement is saved.
- Guards discuss the disappearance of hostile patrols.
- Merchants resume travel after a route is secured.
- A previously threatened settlement becomes safer.
- Regional leaders acknowledge completed objectives.
- Important discoveries change available conversations.
- New clues or destinations become accessible as the story advances.
- Later chapters reference earlier achievements and decisions.

Use the existing world-state and story-flag systems.

Keep changes persistent and compatible with saved progress.

Do not implement expensive background simulations where a lightweight event-driven change would produce the same meaningful result.

Side quests should also contribute to atmosphere, character development, exploration, or local worldbuilding rather than existing solely for experience rewards.

---

# PHASE 10 — PROGRESSION, PACING AND DIFFICULTY

The player should naturally grow stronger over the adventure.

Ensure the main storyline has sensible progression through:

- Starting regions.
- Early wilderness challenges.
- Initial regional conflicts.
- More dangerous enemy territories.
- Mid-game bosses.
- Advanced regions.
- Endgame revelations and final encounters.

Do not require excessive grinding or impossible monster counts.

If a quest asks for 20 or 30 kills, verify there are enough legitimate enemies and that the objective progresses correctly over multiple encounters.

Avoid making the player complete unrelated repetitive tasks merely to unlock the next story chapter.

Vary quest pacing:

- Quiet conversations and discoveries.
- Exploration and travel.
- Smaller combat encounters.
- Investigative tasks.
- Difficult choices.
- Settlement-related objectives.
- Major confrontations.
- Rest and story development afterward.

**The most important rule: combat supports the story; the story must not exist merely to justify combat.**

---

# PHASE 11 — PRESERVE SAVE COMPATIBILITY

Existing players must not lose their saved progress.

Inspect how current quest states, story flags, NPC relationships, cinematic flags, encounter records, and world positions are serialized.

When expanding or reorganizing story progression:

- Preserve stable identifiers wherever possible.
- Migrate older quest states safely when necessary.
- Do not reset completed quests.
- Do not duplicate completed rewards.
- Avoid repeating irreversible story decisions.
- Do not corrupt existing boss-defeat records.
- Preserve existing player location, inventory, levels, and equipment.
- Ensure resumed players receive the appropriate available next objective.
- Prevent impossible progression after a chapter change.
- Do not remove unrelated saved encounters.
- Prevent automatic cinematic loops on loading.

A saved game should continue from the appropriate point in the updated narrative without being forced to restart.

Do not use destructive save clearing as a migration technique.

---

# PHASE 12 — QUALITY AND COMPLETENESS REQUIREMENTS

The implementation must be fully integrated into the actual playable game.

Do not stop at adding dozens of quest definitions that reference nonexistent enemies, NPCs, buildings, clues, or destinations.

Every enabled objective must be achievable.

Every major storyline must have a coherent beginning, progression, and conclusion.

Every required NPC interaction must be accessible.

Every required enemy must exist or be spawnable in suitable locations.

Every necessary investigation clue must have a usable interaction.

Every new building interior must support legitimate entrance and exit transitions.

Every cinematic must have valid triggers and termination conditions.

Every objective must correctly update the journal and navigation systems.

Every boss must be integrated into its story progression.

Avoid filler dialogue, meaningless rewards, repetitive generic objectives, and copy-pasted chapters.

Do not sacrifice the game's current visual quality or performance.

Maintain stable frame times by reusing existing systems, indexing objective locations, minimizing repeated searches, and loading content only where appropriate.

This remains a Phaser + React + TypeScript game running on Android through Capacitor.

---

# PHASE 13 — IMPLEMENTATION ORDER FOR THIS ONE TASK

Execute continuously in the following order:

1. Inspect all relevant current source and establish the actual narrative continuity.
2. Define a coherent central storyline and regional chapter dependencies.
3. Implement the main campaign structure and objective sequencing.
4. Extend the quest system for required mission types.
5. Create or improve the actual world encounters, clues, interactables, and interior spaces needed by the story.
6. Implement and connect NPC dialogue and narrative choices.
7. Implement regional quest chains with proper boss preparation and aftermath.
8. Integrate meaningful cinematic sequences and narration.
9. Upgrade navigation arrows, maps, and journal tracking for every objective type.
10. Add persistent consequences and reactive dialogue.
11. Handle save compatibility and progression migration.
12. Review all new content for unreachable objectives, missing targets, invalid references, and narrative contradictions.
13. Produce a complete implementation report.

**This is one continuous assignment covering the entire available campaign—not a request to deliver only Phase 1 or a proposal.**

Work chapter by chapter, finishing real playable functionality before expanding to the next chapter.

Reuse existing infrastructure wherever possible.

If the work exceeds the available context or usage window, leave a precise checkpoint documenting implemented chapters, changed files, unresolved issues, unimplemented assets, and the exact continuation point. Never claim the entire campaign is complete when only some chapters are implemented.

Do not repeatedly restart the audit after a context reset; use the recorded checkpoint and inspect only intervening changes as needed.

---

# PHASE 14 — PROJECT WORKFLOW RESTRICTIONS

Follow `AGENTS.md`.

Unless separately authorized:

- Do not run unit tests.
- Do not run type checks.
- Do not run browser automation.
- Do not run production builds.
- Do not build an Android APK.
- Do not commit or push.
- Do not publish releases.

Do not modify unrelated systems unnecessarily.

Do not remove approved NPC, enemy, player, wildlife, or environment graphics.

Do not change existing boss designs unless an implementation dependency absolutely requires it.

Do not revert ongoing user work.

Do not introduce dummy quests, inaccessible objectives, fake interior transitions, or unfinished placeholders into playable progression.

Do not report completion without implemented gameplay.

---

# FINAL EXPECTED EXPERIENCE

When I start Tales of Leighneron, I should feel that I am entering a genuine medieval fantasy adventure.

I should understand Leigneron's motivation, meet characters with believable lives, explore interesting places, discover mysteries, travel for meaningful reasons, help settlements, face moral and political conflicts, and gradually uncover the larger danger threatening the world.

I should not immediately be told to hunt a boss in every region.

I want to investigate, explore, speak to people, uncover clues, protect communities, defeat hostile groups, develop relationships, experience cinematic events, and earn the right to confront each region's major enemy.

The quest arrow must consistently guide me toward the actual current objective, including accessible building entrances, investigation clues, monster habitats, enemy camps, and NPC locations.

The world should feel alive, reactive, connected, and worth exploring.

**Deliver a full, meaningful adventure that is satisfying not merely because the player wins battles, but because the journey, characters, discoveries, and outcomes matter.**

Begin by inspecting the latest repository, then proceed with implementation through the complete campaign in one continuous task.