import type {Buffer} from 'node:buffer';
export function readRgbaPng(png:Buffer):{width:number;height:number;pixels:Buffer};
export function writeRgbaPng(width:number,height:number,pixels:Buffer):Buffer;
export function recompressRgbaPng(png:Buffer):Buffer|null;
