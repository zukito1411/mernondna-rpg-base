/** Chances apply to eligible opportunities, never bypass habitat, safe routes
 * or the shared four-ground/two-bird cap. Timings use active-play milliseconds. */
export const WILDLIFE_TUNING={
  rabbitChance:.8,
  squirrelChance:.9,
  birdChance:.9,
  squirrelGroupChance:.8,
  birdGroupChance:.8,
  squirrelCompanionDelay:650,
  birdCompanionDelay:300,
  flockStartleDelay:180,
  socialDuration:2800,
  socialWaitLimit:4000,
  birdSocialGap:10000,
  groundGapMin:2000,
  groundGapRange:2000,
  birdGapMin:4000,
  birdGapRange:3000,
  coverRestMin:12000,
  coverRestRange:8000,
  retryMs:3000,
  birdRestMin:45000,
  birdRestRange:30000,
} as const;
