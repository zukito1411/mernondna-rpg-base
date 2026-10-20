import Phaser from 'phaser';

/** Phaser queues a display-list sort even when setDepth receives the old value. */
export function setDepthIfChanged<T extends {depth:number;setDepth(value:number):unknown}>(object:T,depth:number):T {
  if(object.depth!==depth)object.setDepth(depth);
  return object;
}

/** Keep all actor callers on the same exact, change-only depth path. */
export class DepthSortedSprite extends Phaser.Physics.Arcade.Sprite {
  override setDepth(value=0):this {
    if(this.depth!==value)super.setDepth(value);
    return this;
  }
}
