# Boss reinforcement waves

Bosses use `summonComposition` for their exact mixed wave. Varkhul remains
unchanged and has no summons. The former `summonEnemyId` fields are retained
only as legacy-save family hints, not as the active spawning configuration.

An engaged boss waits 3.5 seconds initially. Its content state then records a
stable wave encounter ID and every spawned content ID. The complete wave is
admitted atomically through ContentChunkManager, without ambient pack expansion.
The scene checks loaded art, shared 16-hostile capacity, walking surfaces,
collision footprints, clear paths and distance from the player. Failed admission
retries at most once per 750 ms without spending the full summon cooldown.

Only explicit persisted defeat flags finish a wave. Unloaded, inactive or
missing actors do not count as dead. Defeated members remain recorded until the
entire wave clears. The last defeat starts the boss's existing cooldown, stored
as a UTC deadline. Saves retain membership and deadlines; chunk reload restores
survivors without replenishing casualties. Existing survivors also block a
respawned boss from summoning replacements. Minions return home if their owner
is dead, unloaded or disengaged; enemy attacks and projectiles are unchanged.

Legacy saves did not record summon provenance. Migration conservatively adopts
matching event-spawn groups close to one wounded/defeated boss, retaining their
IDs and wounds. Ambient/authored creatures are excluded. Ambiguous or distant
old event spawns cannot be reliably attributed and are left unchanged rather
than rewriting unrelated encounters. Pirate/goblin crew upgrades skip owned
waves, so loading never expands their configured composition.

Source inspection only: no tests, type checks, builds or game launches were run.
