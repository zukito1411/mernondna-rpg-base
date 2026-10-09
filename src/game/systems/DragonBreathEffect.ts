import Phaser from 'phaser';
import {BREATH_ROOT,BREATH_LENGTH} from './DragonBreathArt';
import {breathPresentation} from './dragonBreath';
export class DragonBreathEffect {
  private readonly flame:Phaser.GameObjects.Sprite;
  private readonly glow:Phaser.GameObjects.Sprite;
  constructor(scene:Phaser.Scene,id:string){
    this.flame=scene.add.sprite(0,0,'dragon-breath',0).setOrigin(BREATH_ROOT/512,.5).setVisible(false).setName('dragon-fire:'+id);
    this.glow=scene.add.sprite(0,0,'dragon-breath',0).setOrigin(BREATH_ROOT/512,.5).setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD).setName('dragon-fire-glow:'+id);
  }
  show(mouth:{x:number;y:number},tip:{x:number;y:number},age:number,depth:number,charging=false){
    const p=breathPresentation(age),dx=tip.x-mouth.x,dy=tip.y-mouth.y;
    const scale=Math.hypot(dx,dy)/BREATH_LENGTH,angle=Math.atan2(dy,dx);
    const growth=charging?.13+.07*p.growth:.12+.88*p.growth,alpha=charging?.3*p.alpha:p.alpha;
    this.flame.setVisible(alpha>.001).setFrame(p.frame).setPosition(mouth.x,mouth.y).setRotation(angle)
      .setScale(scale*growth,scale*(charging?.16:.72+.28*p.growth)).setAlpha(alpha).setDepth(depth);
    this.glow.setVisible(alpha>.001).setFrame(p.frame).setPosition(mouth.x,mouth.y).setRotation(angle)
      .setScale(this.flame.scaleX,this.flame.scaleY).setAlpha(alpha*.12).setDepth(depth+.01);
  }
  hide(){this.flame.setVisible(false);this.glow.setVisible(false);}
  destroy(){this.flame.destroy();this.glow.destroy();}
}
