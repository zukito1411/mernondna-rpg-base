export function dragonEffectPlayback(cue:'roar'|'breath'|'flight',durationMs:number,bufferDuration:number){
  return {duration:cue==='roar'?bufferDuration:Math.min(durationMs/1000,bufferDuration),loop:cue==='flight'};
}
