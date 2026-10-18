# Town contracts and Alice's travel remarks

Town notice boards offer a short hunting job, a 30-target veteran hunt, a
50-target elite hunt and a regional boss bounty per settlement. Veteran hunts
pay 1,200 base gold and 1,000 XP; elite hunts pay 2,400 base gold and 2,200 XP.
Short hunts and boss bounties retain their existing IDs, progress and rewards.
The longer hunts have separate stable IDs and count the same native regional
enemy type without increasing population or simulation work. Existing civic
boards become interactive; towns lacking one gain
an existing notice-board sprite through the normal authored placement checks.
Tiles, art sources, enemy populations and spawn rates are unchanged.

Accept at most three outstanding contracts. New credited defeats in the named
region count after acceptance, including Alice's support kills. Boss bounties
require the actual authored boss ID. Temporary summons, unassisted ambient NPC
kills and story-only waves do not count. Defeats before acceptance are not
retroactive. Return to the issuing town's board to collect its one-time reward.
Claiming atomically marks the contract paid and grants the usual attribute-
adjusted gold and XP. Abandoning an unfinished job discards its progress.
The quest journal lists accepted jobs and their return locations.

The bounded contract ledger is optional in version 6 saves, defaults empty for
older saves, and validates known IDs, counts, claim state and outstanding limit.
It is included in normal snapshots, imports/exports, loading and progress saves.
Contract tracking runs inside the existing credited defeat event, not the
frame loop. NPC target selection and movement retain their optimized cadence.

Recruited Alice can remark on towns, regions, completed story milestones and
discovered landmarks. Remarks appear in a compact speech bubble above Alice;
her name, status and quest labels remain hidden. They do not pause movement or
open dialogue. One text texture and a static tail are reused. Text is laid out
once per remark, and a physics-follow callback only runs while the bubble is
visible. It expires after nine seconds; menus, dismissal, story scenes or
combat hide it and detach that callback. No React position updates or new
audio, character sprites or particles are involved.

Context checks run at most every 1.5 seconds on her existing AI decision tick.
Catalog selection only runs when location or quest/flag references change;
remarks are separated by at least 60 seconds in a session and suppressed near
live enemies. Each delivered line records one existing saved story flag to
avoid repeats after loading. Recruitment has a nine-second quiet period.

Validation: application TypeScript and whitespace checks only. Manual checks:
accept a hunt, defeat local targets with and without Alice, collect once, and
reload with partial/completed/claimed jobs; visit a new town with Alice and
verify her remark stays away during
combat, menus and scripted scenes. Board positions and mobile layout still
need in-game visual inspection.
