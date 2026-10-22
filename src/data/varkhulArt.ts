import registration from './varkhulAtlas.json';

/** Complete poses packed offline, with the original runtime texture/frame IDs. */
export const VARKHUL_ATLAS_PAGES=Object.values(registration.pages);
export const VARKHUL_DENSITY=registration.density;
export const VARKHUL_SIDE_WALK_FRAMES=registration.sideWalkFrames;
export function isVarkhulTexture(key:string){
 return VARKHUL_ATLAS_PAGES.some(page=>page.texture===key);
}
export function varkhulGroundPadding(key:string){
 return VARKHUL_ATLAS_PAGES.find(page=>page.texture===key)?.groundPadding;
}
