import Phaser from 'phaser';
import {isTreeArt,treeLayerKey} from '../../data/treeArt';

type TreeActor=Phaser.GameObjects.Image|Phaser.GameObjects.Sprite;
interface Canopy {tree:TreeActor;leaves:Phaser.GameObjects.Image;phase:number}
/** Bounded by the existing chunk ledger; no independent permanent forest.
 * Only leaf pixels move. Roots, collision foundations and trunk depth stay put. */
export class TreeSwaySystem {
  private readonly canopies=new Set<Canopy>();
  private elapsed=0;private drawMs=0;
  private readonly reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  constructor(private readonly scene:Phaser.Scene){}
  register(tree:TreeActor,texture:string,frame:number){
    if(!isTreeArt(texture,frame)||(texture==='climate_props'&&frame===1)||!this.scene.textures.exists(treeLayerKey(texture,'wood')))return;
    // The atlas cell dimensions are identical, so static bodies keep offsets.
    tree.setTexture(treeLayerKey(texture,'wood'),frame);
    const leaves=this.scene.add.image(tree.x,tree.y,treeLayerKey(texture,'leaves'),frame)
      .setOrigin(tree.originX,tree.originY).setScale(tree.scaleX,tree.scaleY).setDepth(tree.depth+.01).setName('foliage:'+tree.name);
    const entry={tree,leaves,phase:((tree.x*.013+tree.y*.021)%(Math.PI*2))};this.canopies.add(entry);
    tree.once('destroy',()=>{this.canopies.delete(entry);leaves.destroy();});
  }
  update(delta:number,wind:number){
    this.elapsed+=Math.min(delta,100);this.drawMs+=delta;if(this.drawMs<50)return;this.drawMs=0;
    const view=this.scene.cameras.main.worldView;
    for(const entry of this.canopies){
      const {tree,leaves,phase}=entry;
      const visible=tree.visible&&tree.x>view.x-400&&tree.x<view.right+400&&tree.y>view.y-80&&tree.y<view.bottom+500;
      leaves.setVisible(visible);if(!visible)continue;
      const amplitude=this.reducedMotion.matches?0:Math.min(3.2,.7+wind*2.1);
      const sway=Math.sin(this.elapsed*.0013+phase)*amplitude+Math.sin(this.elapsed*.0027+phase)*amplitude*.22;
      leaves.setPosition(tree.x+sway,tree.y+Math.sin(this.elapsed*.0018+phase)*amplitude*.2)
        .setDepth(tree.depth+.01).setAlpha(tree.alpha);
      leaves.setTint(tree.tintTopLeft,tree.tintTopRight,tree.tintBottomLeft,tree.tintBottomRight);
    }
  }
  destroy(){for(const entry of this.canopies)entry.leaves.destroy();this.canopies.clear();}
}
