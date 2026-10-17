# Adventuring with Alice

Alice Fen retains her authored `mira-fen` NPC identity. Finish speaking to her
to see **Come adventuring with me** or **Take a rest in Oakmere**. These actions
also finish an eligible quest conversation through its existing completion
flow. Doors, shrines, other residents and nearby objects retain interaction
priority; the following companion can be spoken to within 180 world units.

Recruitment uses the saved `companion:alice-fen:following` story flag. The
content streamer keeps her single actor resident while recruited. Saves retain
her Oakmere home record, allowing a following save to restore her safely near
the player instead of persisting interior or cinematic coordinates. Dismissal
cancels combat/arrows, fades her out, and restores the authored home record.
She stays home until recruited again; older saves default to staying home.

Following samples the actual player trail, targeting 108 units behind and 46
to one side. Narrow routes can use a smaller offset or the center of the trail.
Separate start/stop distances, continuous interpolated destinations and
direction-preserving idle poses avoid short walk/stop loops and front-facing
snaps. Local swept navigation routes around scenery and pedestrians. Travel
and room transitions choose a clear, reachable arrival point; ordinary following
uses physical movement. Alice follows into rooms with interior foot checks,
camera/label depths and a contact shadow. Authored story/cinematic control takes
priority and ordinary following resumes afterward.

Following eases acceleration, matches player pace, and limits catch-up to a
small speed allowance. Her walking cadence uses player walking speed rather
than the slow town stroll reference, with a 1.25-times animation cap. Combat
repositioning uses a measured walk as well.

Alice engages nearby threats, favors enemies the player has hit, holds bow
range, and retreats until she has regained room before firing again. Shots
release on the authored animation impact, check aim/range/line of sight, and
deal damage on physical arrow contact. Damage is the greater of `18 + 2.8 ×
player level` or 65% of the player's enhanced weapon attack with attribute and
level growth, before enemy defense. A shot has a 1.25-second cooldown. Companion
damage grants party defeat/quest/loot credit, without applying the player's
weapon status procs or stagger effects. Bosses retain their existing AI.
Her shots do not redirect enemy attention. Enemies prefer the player; Alice
only becomes a close defensive target when the player is outside their
engagement area and has not already engaged that enemy.
At low health Alice recovers for ten seconds while following rather than
vanishing or repeatedly interrupting the player. Recruitment remains active.

Shared NPC combat residency prevents a departing road party from evicting
Alice's bow art. Existing huntress art, whole poses, registration and terrain
assets are unchanged. Validation for this feature is TypeScript only; gameplay
and pacing are left for manual testing.
