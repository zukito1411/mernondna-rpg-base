import type {InteriorArtKey} from './interiorArt';
import housingArt from './housingArt.json' with {type:'json'};
import {TOWN_BY_ID} from './towns';

export const HOME_ID='town:oakmere:building:4';
export const HOME_NAME='Woodland Home';
export const HOME_PRICE=7500;
export const HOME_GRID=32;
export const HOME_EDITOR_HEIGHT=960;
export const HOME_LIMIT=60;
export const HOME_ITEM_LIMIT=100;
export const HOME_FLOORS=[{x:0,y:320,width:768,height:512},{x:0,y:0,width:352,height:256},
 {x:416,y:0,width:352,height:256},{x:128,y:224,width:512,height:128},{x:320,y:800,width:128,height:160}];
export const HOME_ENTRANCE={x:384,y:896};
export const HOME_KITS=['trandum_rustic','highmere_noble','narenthil_elven','nardorous_alpine','rindass_orcan',
 'druganwoods_dwarven','portquill_maritime','frostlands_longhouse','darkav_obsidian'] as const;
export const HOME_KIT_NAMES=['Oakmere timber','Highmere noble','Narenthil elven','Alpine stone','Orcan bronze',
 'Dwarven craft','Maritime','Winter longhouse','Obsidian'];
export type HomeFurnitureArt=InteriorArtKey|'weaponRack';
export interface FurnitureKind {art:HomeFurnitureArt;name:string;price:number;w:number;h:number;width:number;category:'Comfort'|'Storage'|'Decor'|'Craft';walkable?:boolean}
export const HOME_FURNITURE:FurnitureKind[]=[
 {art:'bed',name:'Bed',price:200,w:3,h:4,width:96,category:'Comfort'},
 {art:'wardrobe',name:'Wardrobe',price:150,w:3,h:2,width:96,category:'Storage'},
 {art:'bookcase',name:'Bookcase',price:150,w:3,h:1,width:96,category:'Storage'},
 {art:'chest',name:'Chest',price:100,w:2,h:2,width:64,category:'Storage'},
 {art:'table',name:'Dining table',price:150,w:4,h:2,width:128,category:'Comfort'},
 {art:'bench',name:'Bench',price:75,w:3,h:1,width:96,category:'Comfort'},
 {art:'chair',name:'Chair',price:50,w:2,h:1,width:64,category:'Comfort'},
 {art:'counter',name:'Counter',price:125,w:4,h:2,width:128,category:'Craft'},
 {art:'hearth',name:'Hearth',price:200,w:4,h:2,width:128,category:'Comfort'},
 {art:'rug',name:'Rug',price:75,w:4,h:3,width:128,category:'Decor',walkable:true},
 {art:'planter',name:'Planter',price:50,w:2,h:1,width:64,category:'Decor'},
 {art:'barrel',name:'Barrel',price:50,w:2,h:2,width:64,category:'Storage'},
 {art:'pantry',name:'Pantry',price:125,w:3,h:1,width:96,category:'Storage'},
 {art:'weaponRack',name:'Weapon display rack',price:175,w:3,h:1,width:96,category:'Storage'},
 {art:'lantern',name:'Lantern',price:50,w:1,h:1,width:32,category:'Decor',walkable:true},
 {art:'stairs',name:'Decorative steps',price:150,w:3,h:3,width:96,category:'Decor'},
 {art:'arch',name:'Room arch',price:150,w:4,h:1,width:128,category:'Decor',walkable:true},
 {art:'workstation',name:'Workstation',price:175,w:4,h:2,width:128,category:'Craft'},
 {art:'signature',name:'Regional centerpiece',price:200,w:3,h:2,width:96,category:'Decor'},
 {art:'window',name:'Standing window screen',price:100,w:3,h:1,width:96,category:'Decor'},
];
export const FURNITURE_BY_ART=Object.fromEntries(HOME_FURNITURE.map(f=>[f.art,f])) as Partial<Record<HomeFurnitureArt,FurnitureKind>>;
export interface HomeItem {id:number;art:HomeFurnitureArt;kit:string;x:number;y:number;rotation:0|90|180|270;stored:boolean;weaponId?:string}
export interface HomeRecord {owned:boolean;items:HomeItem[];nextId:number}
// Keep the original Oakmere fields so existing saves retain their home intact.
export interface PlayerHousing extends HomeRecord {homes?:Record<string,HomeRecord>}
export const emptyHousing=():PlayerHousing=>({owned:false,items:[],nextId:1});
const vacantHome:HomeRecord={owned:false,items:[],nextId:1};
export const housingFor=(housing:PlayerHousing,id:string|null|undefined):HomeRecord=>id===HOME_ID?housing:id?housing.homes?.[id]??vacantHome:vacantHome;
export const withHome=(housing:PlayerHousing,id:string,home:HomeRecord):PlayerHousing=>id===HOME_ID?{...housing,...home}:{...housing,homes:{...housing.homes,[id]:home}};
export const allHomeItems=(housing:PlayerHousing)=>[...housing.items,...Object.values(housing.homes??{}).flatMap(h=>h.items)];
export function furnitureFootprint(item:HomeItem){
 const f=FURNITURE_BY_ART[item.art]!;const sideways=item.rotation===90||item.rotation===270;
 return {x:item.x,y:item.y,width:(sideways?f.h:f.w)*HOME_GRID,height:(sideways?f.w:f.h)*HOME_GRID};
}
const cellKey=(x:number,y:number)=>x+':'+y;
export function homeWeaponMount(item:HomeItem){
 const f=FURNITURE_BY_ART[item.art]!,r=furnitureFootprint(item),a=item.rotation*Math.PI/180,y=f.h*16-35;
 return {x:r.x+r.width/2-Math.sin(a)*y,y:r.y+r.height/2+Math.cos(a)*y};
}
export function homeFloorCell(x:number,y:number){return HOME_FLOORS.some(r=>x>=r.x&&x+HOME_GRID<=r.x+r.width
 &&y>=r.y&&y+HOME_GRID<=r.y+r.height);}
export function furnitureVisualBounds(item:HomeItem){
 const f=FURNITURE_BY_ART[item.art]!,r=furnitureFootprint(item);
 const frame=housingArt.frames[(item.kit+':'+item.art) as keyof typeof housingArt.frames];
 const h=f.width*frame.visibleHeight/frame.visibleWidth,a=item.rotation*Math.PI/180;
 const points=[-f.width/2,f.width/2].flatMap(x=>[f.h*16-h,f.h*16].map(y=>({x:r.x+r.width/2+x*Math.cos(a)-y*Math.sin(a),y:r.y+r.height/2+x*Math.sin(a)+y*Math.cos(a)})));
 return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
}
type HomeRect={x:number;y:number;width:number;height:number};
const overlaps=(a:HomeRect,b:HomeRect)=>a.x<b.x+b.width-.001&&a.x+a.width>b.x+.001&&a.y<b.y+b.height-.001&&a.y+a.height>b.y+.001;
function rectangleFitsFloor(b:{left:number;right:number;top:number;bottom:number}){
 // Partition at room/wall edges so the entire image rectangle is covered,
 // including concave corners, rather than accepting four corners over a void.
 const xs=[...new Set([b.left,b.right,...HOME_FLOORS.flatMap(r=>[r.x,r.x+r.width]).filter(x=>x>b.left&&x<b.right)])].sort((a,c)=>a-c);
 const ys=[...new Set([b.top,b.bottom,...HOME_FLOORS.flatMap(r=>[r.y,r.y+r.height]).filter(y=>y>b.top&&y<b.bottom)])].sort((a,c)=>a-c);
 for(let x=1;x<xs.length;x++)for(let y=1;y<ys.length;y++)
  if(!HOME_FLOORS.some(r=>(xs[x-1]+xs[x])/2>=r.x-.001&&(xs[x-1]+xs[x])/2<=r.x+r.width+.001
   &&(ys[y-1]+ys[y])/2>=r.y-.001&&(ys[y-1]+ys[y])/2<=r.y+r.height+.001))return false;
 return true;
}
function furnitureArtFits(item:HomeItem){return rectangleFitsFloor(furnitureVisualBounds(item));}
/** Normal floor placement uses the grid; wall contact uses precise coordinates
 * so a tall/asymmetric image need not leave a grid-sized gap or enter black. */
export function snapFurnitureToWalls(item:HomeItem):HomeItem{
 const room=HOME_FLOORS.find(r=>item.x>=r.x&&item.x<r.x+r.width&&item.y>=r.y&&item.y<r.y+r.height);
 if(!room)return item;
 const f=furnitureFootprint(item),v=furnitureVisualBounds(item);
 const axis=(low:number,high:number,start:number,end:number)=>{
  if(high-low>end-start+.001)return 0;
  if(low<start)return start-low;
  if(high>end)return end-high;
  const before=low-start,after=end-high;
  return Math.min(before,after)<=HOME_GRID?(before<=after?-before:after):0;
 };
 const dx=axis(Math.min(f.x,v.left),Math.max(f.x+f.width,v.right),room.x,room.x+room.width);
 const dy=axis(Math.min(f.y,v.top),Math.max(f.y+f.height,v.bottom),room.y,room.y+room.height);
 return {...item,x:Math.round((item.x+dx)*1000)/1000,y:Math.round((item.y+dy)*1000)/1000};
}
/** Bounded 24x30 floor graph, evaluated on edits only, never per gameplay frame. */
export function housingLayoutProblem(items:readonly HomeItem[]):string|null{
 if(items.length>HOME_ITEM_LIMIT||items.filter(i=>!i.stored).length>HOME_LIMIT)return 'This home has reached its furniture limit.';
 const occupied=new Set<string>(),solids:HomeRect[]=[];
 for(const item of items){
  const f=FURNITURE_BY_ART[item.art];if(!f)return 'Unknown furniture.';
  if(item.stored)continue;
  if(!furnitureArtFits(item))return 'Keep the whole furniture inside the room. Tap near a wall to snap against it.';
  const r=furnitureFootprint(item);
  if(!rectangleFitsFloor({left:r.x,right:r.x+r.width,top:r.y,bottom:r.y+r.height}))return 'Keep the furniture base inside the room.';
  if(overlaps(r,{x:288,y:800,width:192,height:160})||overlaps(r,{x:128,y:224,width:512,height:128}))return 'Keep the entrance and connecting hallway clear.';
  if(!f.walkable){
   if(solids.some(other=>overlaps(r,other)))return 'Furniture footprints cannot overlap.';
   solids.push(r);
   for(let y=Math.floor(r.y/32)*32;y<r.y+r.height;y+=32)for(let x=Math.floor(r.x/32)*32;x<r.x+r.width;x+=32)
    if(overlaps(r,{x:x+4,y:y+4,width:24,height:24}))occupied.add(cellKey(x,y));
  }
 }
 const queue=[{x:384,y:864}],seen=new Set([cellKey(384,864)]);
 for(let head=0;head<queue.length;head++)for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){
  const p={x:queue[head].x+dx,y:queue[head].y+dy},key=cellKey(p.x,p.y);
  // Union membership avoids seams between overlapping corridor rectangles.
  const floor=[4,28].every(dx=>[4,28].every(dy=>HOME_FLOORS.some(r=>p.x+dx>=r.x+16&&p.x+dx<=r.x+r.width-16
   &&p.y+dy>=r.y&&p.y+dy<=r.y+r.height)));
  if(floor&&!seen.has(key)&&!occupied.has(key)){seen.add(key);queue.push(p);}
 }
 for(const room of HOME_FLOORS.slice(0,3))if(!queue.some(p=>p.x>=room.x+32&&p.x+32<=room.x+room.width-32&&p.y>=room.y+32&&p.y+32<=room.y+room.height-32))return 'Leave a walking route into every room.';
 for(const item of items.filter(i=>!i.stored&&(i.art==='bed'||i.art==='weaponRack'))){
  const r=furnitureFootprint(item);
  const accessible=queue.some(p=>Math.hypot(Math.max(r.x-p.x-16,0,p.x+16-r.x-r.width),Math.max(r.y-p.y-16,0,p.y+16-r.y-r.height))<=32);
  if(!accessible)return 'Leave a reachable side beside every bed and weapon rack.';
 }
 return null;
}
export function parseHousing(value:unknown,repair?:{returnWeapon:(id:string)=>void}):PlayerHousing|null{
 if(value===undefined)return emptyHousing();
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(typeof v.owned!=='boolean'||!Array.isArray(v.items)||v.items.length>HOME_ITEM_LIMIT||!Number.isSafeInteger(v.nextId)||Number(v.nextId)<1)return null;
 const ids=new Set<number>();
 for(const raw of v.items){
  if(!raw||typeof raw!=='object')return null;const i=raw as HomeItem;
  if(!Number.isSafeInteger(i.id)||i.id<1||i.id>=Number(v.nextId)||ids.has(i.id)||!FURNITURE_BY_ART[i.art]
   ||!(HOME_KITS as readonly string[]).includes(i.kit)||![0,90,180,270].includes(i.rotation)||typeof i.stored!=='boolean'
   ||![i.x,i.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=960)
   ||i.weaponId!==undefined&&(typeof i.weaponId!=='string'||i.art!=='weaponRack'||i.stored))return null;
  ids.add(i.id);
 }
 let items=(v.items as HomeItem[]).map(i=>({...i}));
 if(!v.owned&&items.length)return null;
 if(repair&&housingLayoutProblem(items)){
  // Preserve old homes from the former wall-overlap rule. Fit pieces inside;
  // if a tight old layout cannot fit, retain the paid piece in storage instead
  // of rejecting the player's entire save or deleting furniture/weapon copies.
  items=items.map(i=>i.stored||furnitureArtFits(i)?i:snapFurnitureToWalls(i));
  for(let index=items.length-1;index>=0&&housingLayoutProblem(items);index--){
   const item=items[index];if(item.stored)continue;
   if(item.weaponId)repair.returnWeapon(item.weaponId);
   items[index]={...item,stored:true,weaponId:undefined};
  }
 }
 if(housingLayoutProblem(items))return null;
 const homes:Record<string,HomeRecord>={};
 const rawHomes=(v as Partial<PlayerHousing>).homes;
 if(rawHomes!==undefined){
  if(!rawHomes||typeof rawHomes!=='object'||Array.isArray(rawHomes)||Object.keys(rawHomes).length>Object.keys(TOWN_BY_ID).length-1)return null;
  const towns=new Set<string>();
  for(const [id,raw] of Object.entries(rawHomes)){
   const match=/^town:([^:]+):building:\d+$/.exec(id),town=match?.[1];
   if(!town||!Object.hasOwn(TOWN_BY_ID,town)||town==='oakmere'||towns.has(town)||!raw||typeof raw!=='object'||Array.isArray(raw)||'homes' in raw)return null;
   const parsed=parseHousing(raw,repair);if(!parsed)return null;
   towns.add(town);homes[id]={owned:parsed.owned,items:parsed.items,nextId:parsed.nextId};
  }
 }
 return {owned:v.owned,items:items.map(i=>({...i})),nextId:Number(v.nextId),...(Object.keys(homes).length?{homes}:{})};
}
