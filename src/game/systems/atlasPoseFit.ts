import type {SpriteRegion} from '../../data/art';

/**
 * Keep a single uniform scale for ALL poses in an animation group while
 * ensuring no opaque part of any complete source pose clips its atlas cell.
 *
 * x = cellWidth/2 + (region.x-rootX)*fit
 * y = groundY + (region.y-rootY)*fit
 * If the reference standing pose fits but a sword swing or falling body is
 * wider, shrink the whole group slightly rather than crashing the game.
 */
export interface AtlasPose {
 region:SpriteRegion;
 rootX:number;
 rootY:number;
}
export function fitAtlasPoses(
 requested:number,cellWidth:number,cellHeight:number,groundY:number,
 poses:readonly AtlasPose[],padding=2
):number {
 if(!Number.isFinite(requested)||requested<=0||!Number.isFinite(cellWidth)||!Number.isFinite(cellHeight)||
    !Number.isFinite(groundY)||cellWidth<=padding*2||cellHeight<=padding*2||!poses.length)
  throw new Error('Invalid generated character atlas geometry');
 let limit=requested;
 const center=cellWidth/2;
 let upper=Infinity,lower=-Infinity;
 for(const {region,rootX,rootY} of poses){
  const [x,y,w,h]=region;
  if(![x,y,w,h,rootX,rootY].every(Number.isFinite)||w<=0||h<=0)
   throw new Error('Invalid character pose bounds');
  const left=x-rootX,right=x+w-rootX,top=y-rootY,bottom=y+h-rootY;
  if(left<0)limit=Math.min(limit,(center-padding)/-left);
  if(right>0)limit=Math.min(limit,(cellWidth-padding-center)/right);
  upper=Math.min(upper,top);
  lower=Math.max(lower,bottom);
 }
 // The ground anchor may sit inside a falling body. Reserve room for the
 // ENTIRE group's vertical span, then clamp the actual ground origin below.
 if(lower>upper)limit=Math.min(limit,(cellHeight-2*padding)/(lower-upper));
 if(!Number.isFinite(limit)||limit<=0)throw new Error('Cannot fit character art in atlas');
 // One subpixel guard prevents browser-specific float rounding at cell edges.
 return limit<requested?Math.max(limit*.999,0.000001):requested;
}

/** Find a shared vertical origin so full bodies below an authored foot/root
 * stay inside the frame. Ground remains unchanged whenever it already fits. */
export function atlasGroundY(requested:number,cellHeight:number,poses:readonly AtlasPose[],fit:number,padding=2){
 if(!poses.length||!Number.isFinite(fit)||fit<=0)throw new Error('Invalid atlas ground fitting');
 let top=Infinity,bottom=-Infinity;
 for(const pose of poses){
  top=Math.min(top,pose.region[1]-pose.rootY);
  bottom=Math.max(bottom,pose.region[1]+pose.region[3]-pose.rootY);
 }
 const earliest=padding-top*fit,latest=cellHeight-padding-bottom*fit;
 return Math.max(earliest,Math.min(latest,requested));
}
