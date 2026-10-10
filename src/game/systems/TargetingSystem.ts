import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';

/** Shared eligibility for indicators, automatic casts and deliberate selection. */
export class TargetingSystem {
  selected:Enemy|null=null;
  private manual:Enemy|null=null;
  constructor(private readonly scene:WorldScene){}
  eligible(enemy:Enemy,range=680) {
    const player=this.scene.player;
    return enemy.active&&enemy.visible&&enemy.hp>0&&enemy.canBeTargeted
      && Math.hypot(enemy.x-player.x,enemy.y-player.y)<=range
      && this.scene.canSeeEnemy(enemy)&&this.scene.hasClearPath(player.x,player.y,enemy.x,enemy.y);
  }
  nearest(range:number) {
    const player=this.scene.player;
    let nearest:Enemy|null=null,nearestDistance=Infinity;
    for(const enemy of this.scene.getCombatEnemies()){
      if(!this.eligible(enemy,range))continue;
      const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y);
      if(distance<nearestDistance){nearest=enemy;nearestDistance=distance;}
    }
    return nearest;
  }
  select(enemy:Enemy){if(this.eligible(enemy)){this.manual=enemy;this.selected=enemy;}}
  update(){if(this.manual&&!this.eligible(this.manual))this.manual=null;this.selected=this.manual??this.nearest(680);}
  clear(){this.manual=null;this.selected=null;}
}
