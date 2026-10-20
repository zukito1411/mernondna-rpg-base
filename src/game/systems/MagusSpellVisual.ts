import type Phaser from 'phaser';
import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import type {BossMove} from '../../data/bossCombatProfiles';
import type {AttackArea} from './attackWarning';
import {GRAND_MAGUS_SPELL_TEXTURE} from '../../data/m14Art';

const FRAMES={fire:0,ice:1,thunder:2,shadow:3} as const;
const COLORS={fire:0xffa448,ice:0x99eaff,thunder:0xffe69a,shadow:0xb675ff} as const;
const FADE_MS={fire:1000,ice:900,thunder:800,shadow:1150} as const;
const smooth=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
interface Afterglow {
  sprite:Phaser.GameObjects.Sprite;size:number;alpha:number;age:number;duration:number;
  grow:number;rise:number;y:number;intro:number;
}
export const magusSpellColor=(move:BossMove,fallback:number)=>move.spell?
  COLORS[move.spell]:fallback;

/** Visuals only. The combat clock owns flight, impact and expiry together;
 * no damage timers, particles, lights, per-frame decoding or tween callbacks.
 * A bounded afterglow outlives combat recovery without delaying the next move.
 * All sprites use one small atlas owned by the lazy boss pack. */
export class MagusSpellVisual {
  private projectile:Phaser.GameObjects.Sprite|null=null;
  private readonly afterglows:Afterglow[]=[];
  private source={x:0,y:0};
  private destination={x:0,y:0};
  private angle=0;
  private launched=false;
  constructor(private readonly scene:WorldScene){}
  private add(move:BossMove,x:number,y:number,size:number){
    const sprite=this.scene.add.sprite(x,y,GRAND_MAGUS_SPELL_TEXTURE,FRAMES[move.spell!])
      .setOrigin(.5).setDepth(this.scene.playerRenderDepth(y)+2).setName('magus-spell:'+move.spell);
    this.resize(sprite,size);return sprite;
  }
  private resize(sprite:Phaser.GameObjects.Sprite,size:number){
    // Authored effects occupy 104px in a centred 128px cell. Uniform scaling
    // keeps ice points and lightning branches intact in every orientation.
    sprite.setScale(size/104);
  }
  begin(enemy:Enemy,move:BossMove,area:AttackArea){
    this.retireProjectile();this.launched=false;this.registerSource(enemy);
    this.destination=area.kind==='line'?{x:area.x+Math.cos(area.angle)*(area.range??0),y:area.y+Math.sin(area.angle)*(area.range??0)}
      :{x:area.x,y:area.y};
    this.angle=Math.atan2(this.destination.y-this.source.y,this.destination.x-this.source.x);
    this.projectile=this.add(move,this.source.x,this.source.y,42).setAlpha(0);
  }
  private registerSource(enemy:Enemy){
    const data=enemy.frame.customData as {castOrigin:{x:number;y:number}};
    this.source.x=enemy.x+(data.castOrigin.x-enemy.width*enemy.originX)*enemy.scaleX;
    this.source.y=enemy.y+(data.castOrigin.y-enemy.height*enemy.originY)*enemy.scaleY;
  }
  windup(enemy:Enemy,move:BossMove,progress:number){
    const sprite=this.projectile;if(!sprite)return;
    if(progress>=.7&&!this.launched){
      this.launched=true;this.registerSource(enemy);
      this.angle=Math.atan2(this.destination.y-this.source.y,this.destination.x-this.source.x);
    }
    const travel=Math.max(0,Math.min(1,(progress-.7)/.3));
    if(move.spell==='thunder'){
      sprite.setPosition(this.destination.x,this.destination.y-160).setAlpha(smooth(progress/.15)*(.25+.5*progress));
      this.resize(sprite,70+55*progress);
    }else{
      sprite.setPosition(this.source.x+(this.destination.x-this.source.x)*travel,
        this.source.y+(this.destination.y-this.source.y)*travel-Math.sin(travel*Math.PI)*60)
        .setRotation(move.spell==='shadow'?progress*2:this.angle).setAlpha(smooth(progress/.15)*(.5+.5*progress));
      this.resize(sprite,42+48*progress);
    }
    sprite.setDepth(this.scene.playerRenderDepth(Math.max(this.source.y,this.destination.y))+2);
  }
  impact(move:BossMove,area:AttackArea){
    // Keep the arriving projectile while the impact blooms over it. Its
    // 180ms tail reaches transparent instead of being replaced in one frame.
    this.retireProjectile();
    if(area.kind==='ring'){
      const inner=area.innerRadius??0,r=(area.radius+inner)/2;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;
        this.bloom(move,area.x+Math.cos(a)*r,area.y+Math.sin(a)*r,area.radius-inner,0);}
    }else if(area.kind==='line'){
      const range=area.range??0;
      for(let i=0;i<8;i++){const distance=range*(i+.5)/8;
        this.bloom(move,area.x+Math.cos(area.angle)*distance,area.y+Math.sin(area.angle)*distance,Math.max(area.radius*2,range/8),.08)
          .setRotation(area.angle);}
    }else if(move.spell==='thunder'){
      // Branches descend onto the warned ground; no screen-wide white flash.
      this.bloom(move,area.x,area.y-140,340,.05);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;
        this.bloom(move,area.x+Math.cos(a)*area.radius*.65,area.y+Math.sin(a)*area.radius*.65-45,120,.08);}
    }else this.bloom(move,area.x,area.y,area.radius*2,.16);
  }
  private bloom(move:BossMove,x:number,y:number,size:number,grow:number){
    const sprite=this.add(move,x,y,size).setAlpha(0);
    this.retain({sprite,size,alpha:1,age:0,duration:FADE_MS[move.spell!],grow,
      rise:move.spell==='fire'?-20:move.spell==='shadow'?-12:0,y,intro:80});
    return sprite;
  }
  private retireProjectile(){
    const sprite=this.projectile;if(!sprite)return;this.projectile=null;
    this.retain({sprite,size:sprite.scaleX*104,alpha:sprite.alpha,age:0,duration:180,grow:.12,rise:0,y:sprite.y,intro:0});
  }
  private retain(glow:Afterglow){
    // Current patterns peak at nine sprites. Bound even future faster combos
    // to two overlapping eight-part impacts plus their projectile tails.
    if(this.afterglows.length>=18){
      const oldest=this.afterglows.shift()!;oldest.sprite.setAlpha(0).destroy();
    }
    this.afterglows.push(glow);
  }
  update(delta:number){
    for(let i=this.afterglows.length-1;i>=0;i--){
      const glow=this.afterglows[i];glow.age+=Math.max(0,Math.min(100,delta));
      const progress=Math.min(1,glow.age/glow.duration);
      const fade=smooth((progress-.12)/.88),intro=glow.intro?smooth(glow.age/glow.intro):1;
      glow.sprite.setAlpha(glow.alpha*intro*(1-fade));
      this.resize(glow.sprite,glow.size*(1+glow.grow*smooth(progress)));
      glow.sprite.setY(glow.y+glow.rise*smooth(progress));
      if(progress>=1){glow.sprite.destroy();this.afterglows.splice(i,1);}
    }
  }
  clear(){this.projectile?.destroy();this.projectile=null;
    for(const glow of this.afterglows)glow.sprite.destroy();this.afterglows.length=0;}
}
