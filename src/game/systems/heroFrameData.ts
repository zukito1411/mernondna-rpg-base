import type Phaser from 'phaser';
import type {HeroGrip} from '../../data/modularHero';

/** Metadata authored by BootScene for prepared hero/skill atlas frames. */
export interface HeroFrameData {
  weaponGrip?:HeroGrip;
  heroDensity?:number;
  visibleBounds?:{left:number;top:number;width:number;height:number};
  sourceRegion?:readonly [number,number,number,number];
  sourceFit?:number;
}
export function heroFrameData(frame:Phaser.Textures.Frame):HeroFrameData {
  return frame.customData as HeroFrameData;
}
