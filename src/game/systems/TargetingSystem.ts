import type {Enemy} from '../entities/Enemy';
import type {WorldScene} from '../scenes/WorldScene';
import {BOSS_BY_ID} from '../../data/enemies';
import {useGameStore} from '../../store/gameStore';

/** Shared eligibility for indicators, automatic casts and deliberate selection. */
export class TargetingSystem {
  selected:Enemy|null=null;
  private manual:Enemy|null=null;
  private engaged:Enemy|null=null;
  // Reuse selection candidates, avoiding per-frame allocation churn.
  private readonly nearestCandidates:Array<{enemy:Enemy;distance2:number}>=[];

  constructor(private readonly scene:WorldScene){}
  eligible(enemy:Enemy,range=680) {
    const player=this.scene.player;
    const dx=enemy.x-player.x,dy=enemy.y-player.y;
    return enemy.active&&enemy.visible&&enemy.hp>0&&enemy.canBeTargeted
      && dx*dx+dy*dy<=range*range
      && this.scene.canSeeEnemy(enemy)&&this.scene.hasClearPath(player.x,player.y,enemy.x,enemy.y);
  }
  nearest(range:number) {
    const player=this.scene.player,range2=range*range;
    const candidates=this.nearestCandidates;
    let count=0;
    for(const enemy of this.scene.getCombatEnemies()){
      if(!enemy.active||!enemy.visible||enemy.hp<=0||!enemy.canBeTargeted)continue;
      const dx=enemy.x-player.x,dy=enemy.y-player.y,distance2=dx*dx+dy*dy;
      if(distance2>range2)continue;
      if(count<candidates.length){candidates[count].enemy=enemy;candidates[count].distance2=distance2;}
      else candidates.push({enemy,distance2});
      count++;
    }
    candidates.length=count;
    // Range/visibility are cheap. Test expensive line-of-sight only for the
    // closest candidates until one qualifies; this preserves nearest-target
    // semantics without checking every distant enemy's obstruction each tick.
    candidates.sort((a,b)=>a.distance2-b.distance2);
    for(const {enemy} of candidates)
      if(this.scene.canSeeEnemy(enemy)&&this.scene.hasClearPath(player.x,player.y,enemy.x,enemy.y))return enemy;
    return null;
  }
  select(enemy:Enemy){if(this.eligible(enemy)){this.manual=enemy;this.selected=enemy;this.publishBoss();}}
  /** Nearest-enemy assistance is not a request to open a boss health bar.
   * A deliberate selection or an actual player hit confirms combat intent. */
  engage(enemy:Enemy){if(this.selected===enemy){this.engaged=enemy;this.publishBoss();}}
  update(){
    if(this.manual&&!this.eligible(this.manual))this.manual=null;
    if(this.engaged&&!this.eligible(this.engaged))this.engaged=null;
    this.selected=this.manual??this.nearest(680);this.publishBoss();
  }
  clear(){this.manual=null;this.engaged=null;this.selected=null;this.publishBoss();}
  private publishBoss(){
    const enemy=this.selected;
    const boss=enemy?.definition.boss&&(enemy===this.manual||enemy===this.engaged)&&this.eligible(enemy)?enemy:null;
    const next=boss?{id:boss.instanceId,name:BOSS_BY_ID[boss.instanceId.replace(/^boss:/,'')]?.name??boss.definition.name,
      hp:Math.max(0,boss.hp),maxHp:boss.definition.hp,attackName:boss.bossAttackName,
      windup:boss.bossWindupFraction==null?null:Math.floor(boss.bossWindupFraction*20)/20}:null;
    const store=useGameStore.getState(),previous=store.bossEncounter;
    if(previous?.id!==next?.id||previous?.hp!==next?.hp||previous?.maxHp!==next?.maxHp||previous?.name!==next?.name
      ||previous?.attackName!==next?.attackName||previous?.windup!==next?.windup)
      store.setBossEncounter(next);
  }
}
