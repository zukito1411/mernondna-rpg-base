export const INN_REST_COST=60;
export const INN_MORNING_MINUTE=6*60;
export const INN_EVENING_MINUTE=18*60;
export const innRestAvailable=(minute:number)=>minute<INN_MORNING_MINUTE||minute>=INN_EVENING_MINUTE;
