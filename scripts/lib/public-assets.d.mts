export const AUTHORING_ONLY_ASSETS:ReadonlySet<string>;
export function authoringOnlyAsset(path:string):boolean;
export function imageAlternatives(publicDir:string):Record<string,string>;
export function publicAssetFiles(publicDir:string):string[];
