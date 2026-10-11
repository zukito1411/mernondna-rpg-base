/** 100ms RMS samples of ambience/volcanic.mp3 (12 seconds), normalized to 255.
 * SHA-256: 04304f3ea6139f6411c27a98bc779f0a7570d64c93ef4d2d695a4c0251cd1e1c
 * Sampling offline avoids decoding or analysing audio on every game frame. */
const levels=[
 5,16,38,47,76,95,137,169,189,206,147,233,208,157,170,241,149,135,200,190,
 255,163,194,195,129,145,172,151,134,124,130,153,146,112,110,92,132,108,85,105,
 89,109,143,103,98,97,99,108,82,73,104,80,97,83,105,120,92,100,85,98,
 123,78,88,94,97,98,93,91,83,78,102,115,82,86,102,91,87,107,101,93,
 87,94,92,78,93,95,69,67,78,86,80,82,74,70,86,81,64,62,48,51,
 43,31,30,26,24,20,15,12,10,7,6,4,3,4,3,2,1,1,1,1,0,
] as const;

export function volcanicRumbleIntensity(seconds:number){
 if(!Number.isFinite(seconds)||seconds<0||seconds>=12)return 0;
 const sample=seconds*10,index=Math.floor(sample),fraction=sample-index;
 const amplitude=(levels[index]*(1-fraction)+levels[index+1]*fraction)/255;
 return amplitude<.01?0:.0018*Math.pow(amplitude,.7);
}
