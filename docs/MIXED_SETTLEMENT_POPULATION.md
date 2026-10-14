# Mixed settlement population

Source: `src/data/settlementResidents.ts`. Every settlement receives additional
local working households and minority visitors. Native identity is human in
Trandum/Nardorous/Portquill/Frostlands/Darkav, elf in Narenthil, orc in Rindass and
dwarf in Druganwoods. Approved existing citizens are not re-skinned or renamed.

- Small settlements: two additional locals and up to two visitors.
- Capitals, strongholds and harbors: four locals and up to four visitors.
- Visitors, including any already tagged visitors, are capped at one per three
  natives. Locals remain at least 75% of the authored population.
- Trade roles and identities are authored per settlement. Visitors exchange
  news, herbs, tools, hides and charts; no combat, new quests or fake shops are
  introduced. Local sponsors and household contacts connect them to established
  characters. Affinity, schedules and peaceful event consequences are retained.
- New actors are stationed in existing ward work/gathering courts, not random
  road tiles. Normal chunk streaming owns their lifetime. Unsafe positions wait
  for a clear slot instead of using an unchecked fallback; collisions stop the
  player overlapping their feet. Population grows by at most 80 logical NPCs,
  not 80 permanently active actors.
- Optional `visualRegion` separates appearance from host location; portraits
  share this mapping. Approved human/elven idle strips are reused. All additions
  start idle playback immediately, with staggered phases. Regional breathing is
  more visible (approximately 1.8px at an 80px body height), using the same four
  whole-pose frames, atlas dimensions and fixed boot baseline as before.

Source review only. No tests, type checks, builds or game/browser launches were
run for this change. In-game visibility, idle motion and placement still need
manual visual review.
