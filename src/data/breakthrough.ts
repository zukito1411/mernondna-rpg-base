export const BREAKTHROUGH_ACCEPTED='breakthrough:accepted';
export const BREAKTHROUGH_TRIAL='breakthrough:varkhul-defeated';
export const BREAKTHROUGH_COMPLETE='breakthrough:complete';
export const breakthroughPhase=(flags:Record<string,boolean>)=>flags[BREAKTHROUGH_COMPLETE]?'complete':flags[BREAKTHROUGH_TRIAL]?'report':flags[BREAKTHROUGH_ACCEPTED]?'trial':'available';
