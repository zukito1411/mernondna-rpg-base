export const BREAKTHROUGH_ACCEPTED='breakthrough:accepted';
export const BREAKTHROUGH_TRIAL='breakthrough:varkhul-defeated';
export const BREAKTHROUGH_COMPLETE='breakthrough:complete';
/** Permanent, optional level-75 world challenge. Never cleared by retraining. */
export const WORLD_ASCENSION='breakthrough:world-ascension';
export const ASCENDED_MONSTER_LEVEL=120;
export const ASCENSION_CONFIRM_DELAY_MS=1200;
export const breakthroughPhase=(flags:Record<string,boolean>)=>flags[BREAKTHROUGH_COMPLETE]?'complete':flags[BREAKTHROUGH_TRIAL]?'report':flags[BREAKTHROUGH_ACCEPTED]?'trial':'available';
