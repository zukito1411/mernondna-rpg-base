import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {worldSpriteProfile,polygonGroundBands,STONE_BRIDGE,type GroundPoint} from '../../data/worldSpriteGeometry';
import {segmentTouchesRect} from '../../data/settlementGeometry';
import {isTreeArt} from '../../data/treeArt';
import type {Vec2} from '../types';
import type {GroundShadowSystem} from './GroundShadowSystem';

type WorldActor=Phaser.GameObjects.Image|Phaser.GameObjects.Sprite;
interface VisibleArt {left:number;top:number;width:number;height:number}
interface PreparedArt {visibleBounds?:VisibleArt;sourceRegion?:readonly number[];sourceFit?:number}
export const WORLD_SPRITE_OWNER='worldSpriteOwner';

/** One source-derived ground geometry path for authored and streamed scenery.
 * Render bounds, physical contour and draw order are deliberately separate. */
export class WorldSpriteSystem {
  private readonly owned=new Map<WorldActor,Phaser.GameObjects.Rectangle[]>();
  constructor(private readonly scene:Phaser.Scene,private readonly bodies:Phaser.Physics.Arcade.StaticGroup,private readonly shadows?:GroundShadowSystem){}
  register(actor:WorldActor,texture:ArtTextureKey,frame:number,scale:number,solid:boolean,fallback?:{width:number;height:number},center=false){
    const sheet=ART_BY_KEY[texture],metadata=(actor.frame.customData??{}) as PreparedArt;
    const visible=metadata.visibleBounds??{left:0,top:0,width:sheet.frameWidth,height:sheet.frameHeight};
    const point=(x:number,y:number)=>({
      x:actor.x+(visible.left+x*visible.width-sheet.frameWidth*actor.originX)*scale*Math.cos(actor.rotation)
        -(visible.top+y*visible.height-sheet.frameHeight*actor.originY)*scale*Math.sin(actor.rotation),
      y:actor.y+(visible.left+x*visible.width-sheet.frameWidth*actor.originX)*scale*Math.sin(actor.rotation)
        +(visible.top+y*visible.height-sheet.frameHeight*actor.originY)*scale*Math.cos(actor.rotation),
    });
    const sourcePoint=([x,y]:GroundPoint)=>{
      const source=metadata.sourceRegion??sheet.regions?.[frame];
      return source?point((x-source[0])/source[2],(y-source[1])/source[3]):point(x,y);
    };
    const profile=worldSpriteProfile(texture,frame),owned:Phaser.GameObjects.Rectangle[]=[];
    if(!profile?.floor||texture==='bridges'){
      const building=texture==='world_buildings'||texture==='capital_buildings'||texture==='elven_villas'
        ||texture==='world_objects'&&frame<4;
      this.shadows?.register(actor,true,texture==='bridges'||texture==='port_dock'
        ?{projection:.3,contactScale:.7}
        :building||isTreeArt(texture,frame)
          ?{contactScale:building?1.45:1.2,contactHeight:.8,contactOffset:-.150,groundOffsetY:building?-28:-58}:{});
    }
    const add=(left:number,top:number,right:number,bottom:number)=>{
      if(right-left<.5||bottom-top<.5)return;
      const body=this.scene.add.rectangle((left+right)/2,(top+bottom)/2,right-left,bottom-top,0xffffff,0)
        .setVisible(false).setName('ground:'+actor.name).setData(WORLD_SPRITE_OWNER,actor);
      this.scene.physics.add.existing(body,true);this.bodies.add(body);owned.push(body);
    };
    if(texture==='bridges'&&frame===2){
      actor.setDepth(-900); // Deck/support artwork is ground, not foreground.
      for(const [part,y] of [['back',STONE_BRIDGE.backSortY],['front',STONE_BRIDGE.frontSortY]] as const){
        const layer=this.scene.add.image(actor.x,actor.y,`bridge-${part}-rail`).setOrigin(actor.originX,actor.originY)
          .setScale(actor.scaleX,actor.scaleY).setDepth(sourcePoint([284,y]).y).setName('bridge-'+part+':'+actor.name);
        layer.setTint(actor.tintTopLeft,actor.tintTopRight,actor.tintBottomLeft,actor.tintBottomRight);
        this.shadows?.register(layer,true,{projection:.3,contactScale:.2});
        actor.once('destroy',()=>layer.destroy());
      }
      // Bridge rail art is decorative; terrain bounds already constrain the crossing.
    }else{
      actor.setDepth(profile?.floor?-950:profile?point(.5,profile.sortY).y:actor.y);
      if(solid||profile?.forceSolid){
        if(profile?.solids.length){for(const polygon of profile.solids){
          const worldPolygon=polygon.map(([x,y]):GroundPoint=>{const p=point(x,y);return [p.x,p.y];});
          for(const rect of polygonGroundBands(worldPolygon))add(rect.left,rect.top,rect.right,rect.bottom);
        }}else if(solid&&!profile?.floor){
          const width=fallback?.width??visible.width*scale*.72,height=fallback?.height??Math.min(56,visible.height*scale*.25);
          const cos=Math.abs(Math.cos(actor.rotation)),sin=Math.abs(Math.sin(actor.rotation));
          const boundsWidth=width*cos+height*sin,boundsHeight=width*sin+height*cos;
          const bottom=center?actor.y+boundsHeight/2:point(.5,1).y;
          add(actor.x-boundsWidth/2,bottom-boundsHeight,actor.x+boundsWidth/2,bottom);
        }
      }
    }
    this.owned.set(actor,owned);
    actor.once('destroy',()=>this.release(actor));
  }
  private release(actor:WorldActor){
    const shapes=this.owned.get(actor);if(!shapes)return;this.owned.delete(actor);
    for(const shape of shapes)this.bodies.remove(shape,true,true);
  }
  blocksPath(from:Vec2,to:Vec2,width=18,height=22){
    if(Math.hypot(to.x-from.x,to.y-from.y)<.01)return false;
    // Broad-phase lookup uses Phaser's existing static spatial index. Swept
    // feet stop a fast dash skipping a thin contour between physics frames.
    const left=Math.min(from.x,to.x)-width/2,top=Math.min(from.y,to.y)-height;
    const nearby=this.scene.physics.overlapRect(left,top,
      Math.max(from.x,to.x)+width/2-left,Math.max(from.y,to.y)-top,false,true) as Phaser.Physics.Arcade.StaticBody[];
    return nearby.some(body=>body.enable&&body.gameObject?.getData(WORLD_SPRITE_OWNER)&&
      segmentTouchesRect(from,to,{left:body.left-width/2+.15,right:body.right+width/2-.15,
        top:body.top+.15,bottom:body.bottom+height-.15}));
  }
  destroy(){for(const actor of this.owned.keys())this.release(actor);}
}
