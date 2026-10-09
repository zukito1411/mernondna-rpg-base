/** Shared presentation tuning, independent of actor sizes and camera/UI zoom. */
export const BUILDING_PRESENTATION_GROWTH=1.12;
export const PAVING_PATTERN_SIZE=320;
// 15x15 candidate cells, at most four marks each. Do not truncate by chunk
// scan order: a lower cap would paint shared edge clusters differently.
export const GROUND_COVER_LIMIT=900;
