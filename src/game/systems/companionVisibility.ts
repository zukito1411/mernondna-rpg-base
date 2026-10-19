/**
 * The awakened-outfit renderer masks the ORIGINAL player sprite from the
 * main camera so its cosmetic replacement is visible instead. That mask is
 * not a visibility rule for companions: copying it hid Alice, her labels
 * and speech while her independently rendered shadow kept following.
 *
 * Keep exclusions for any other cameras, but never inherit the temporary
 * exclusion of the camera in which Alice and the replacement hero are shown.
 */
export function companionCameraFilter(playerFilter:number,mainCameraId:number){
  return playerFilter & ~mainCameraId;
}
