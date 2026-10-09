import Phaser from 'phaser';
import {ART_BY_KEY,type ArtTextureKey} from '../../data/art';
import {worldSpriteProfile,polygonGroundBands,STONE_BRIDGE,type GroundPoint} from '../../data/worldSpriteGeometry';

type WorldActor=Phaser.GameObjects.Image|Phaser.GameObjects.Sprite;
interface VisibleArt {left:number;top:number;width:number;height:number}
interface PreparedArt {visibleBounds?:VisibleArt;sourceRegion?:readonly number[];sourceFit?:number}
export const WORLD_SPRITE_OWNER='worldSpriteOwner';

/** One source-derived ground geometry path for authored and streamed scenery.
 * Render bounds, physical contour and draw order are deliberately separate. */
export class WorldSpriteSystem {
  private readonly owned=new Map<WorldActor,Phaser.GameObjects.Rectangle[]>();
  constructor(private readonly scene:Phaser.Scene,private readonly bodies:Phaser.Physics.Arcade.StaticGroup){}
  register(actor:WorldActor,texture:ArtTextureKey,frame:number,scale:number,solid:boolean,fallback?:{width:number;height:number},center=false){
    const sheet=ART_BY_KEY[texture],metadata=actor.frame.customData as PreparedArt;
    const visible=metadata.visibleBounds??{left:0,top:0,width:sheet.frameWidth,height:sheet.frameHeight};
    const point=(x:number,y:number)=>({
      x:actor.x+(visible.left+x*visible.width-sheet.frameWidth*actor.originX)*scale,
      y:actor.y+(visible.top+y*visible.height-sheet.frameHeight*actor.originY)*scale,
    });
    const sourcePoint=([x,y]:GroundPoint)=>{
      const source=metadata.sourceRegion??sheet.regions?.[frame];
      return source?point((x-source[0])/source[2],(y-source[1])/source[3]):point(x,y);
    };
    const profile=worldSpriteProfile(texture,frame),owned:Phaser.GameObjects.Rectangle[]=[];
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
        actor.once('destroy',()=>layer.destroy());
      }
      for(const polygon of [...STONE_BRIDGE.backSolids,...STONE_BRIDGE.frontSolids])
        for(const rect of polygonGroundBands(polygon,4,true)){
          const a=sourcePoint([rect.left,rect.top]),b=sourcePoint([rect.right,rect.bottom]);add(a.x,a.y,b.x,b.y);
        }
    }else{
      actor.setDepth(profile?.floor?-950:profile?point(.5,profile.sortY).y:actor.y);
      if(solid||profile?.forceSolid){
        if(profile?.solids.length){for(const polygon of profile.solids)for(const rect of polygonGroundBands(polygon)){
          const a=point(rect.left,rect.top),b=point(rect.right,rect.bottom);add(a.x,a.y,b.x,b.y);
        }}else if(solid&&!profile?.floor){
          const width=fallback?.width??visible.width*scale*.72,height=fallback?.height??Math.min(56,visible.height*scale*.25);
          const bottom=center?actor.y+height/2:point(.5,1).y;
          add(actor.x-width/2,bottom-height,actor.x+width/2,bottom);
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
  destroy(){for(const actor of this.owned.keys())this.release(actor);}
}
