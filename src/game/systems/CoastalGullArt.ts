import type Phaser from 'phaser';
import {prepareBirdAtlas} from './WoodlandBirdArt';

export const GULL_TEXTURE='wildlife-coastal-gull';
export const GULL_SOURCE='wildlife-coastal-gull-source';
export const GULL_PATH='assets/wildlife/coastal-gull/poses.png';
export const GULL_HEIGHT=26;

// Actual torso centers of this board, not the robin's roots or wing bounds.
const ROOT_X=[148,340,620,847,1131,1410,110,318,571,826,1123,1411,98,344,570,828,1137,1413] as const;
export function prepareCoastalGullArt(scene:Phaser.Scene){
  prepareBirdAtlas(scene,{texture:GULL_TEXTURE,source:GULL_SOURCE,path:GULL_PATH,
    registry:'coastalGullVisibleHeight',roots:ROOT_X});
}
