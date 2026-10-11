import {WORLD_CONTENT} from '../../data/content';
import {spriteBounds} from '../../data/settlementGeometry';
import {StaticBoundsIndex} from './StaticBoundsIndex';
export const authoredRoofs=new StaticBoundsIndex(WORLD_CONTENT.flatMap(d=>d.kind==='settlement-prop'?
 [{y:d.world.y,bounds:spriteBounds(d.texture??'world_objects',d.frame,d.scale,d.world.x,d.world.y)}]:[]));
