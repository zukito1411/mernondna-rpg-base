import paths from 'virtual:mernondna-lossless-images';

// Offline-verified alternatives only. Texture keys, frame data and canonical
// authoring paths stay stable; no capability probing or decoding during play.
const alternatives:Readonly<Record<string,string>>=paths;
export function losslessImagePath(path:string){return alternatives[path]??path;}
