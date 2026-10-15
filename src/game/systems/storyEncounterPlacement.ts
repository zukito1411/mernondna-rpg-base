export interface PendingStoryEncounterMember {
  enemyId: string;
  slot: number;
}

/** Reserve every undefeated member of the current wave or none of it. */
export function pendingStoryWave(
  encounterId: string,
  wave: readonly string[],
  start: number,
  defeatedFlags: Record<string, boolean>,
  capacity: number,
): PendingStoryEncounterMember[] | null {
  const pending = wave
    .map((enemyId, index) => ({ enemyId, slot: start + index }))
    .filter(({ slot }) => !defeatedFlags[`encounter:${encounterId}:defeated:${slot}`]);

  return pending.length > 0 && pending.length <= capacity ? pending : null;
}
