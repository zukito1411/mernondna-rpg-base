import Phaser from 'phaser';
import type { BossDefinition, EnemyDefinition, EncounterBehavior } from '../types';
import { BOSS_BY_ID, enemyAppearanceMultiplier,isWolfFamily } from '../../data/enemies';
import { enemyLevelAt,scaledEnemy,globalMonsterBonus } from '../../data/enemyTiers';
import {luckDamage} from '../../data/progression';
import type { WorldScene } from '../scenes/WorldScene';
import { seededRandom } from '../../utils/seededRandom';
import { artScale, ART_BY_KEY, actorArtLayout, artFrameSize,type ArtTextureKey } from '../../data/art';
import { enemyAnimation, animationDuration, type EnemyAnimationState } from '../../data/animationPacks';
import { useGameStore } from '../../store/gameStore';
import { approachVelocity, strideRate } from '../systems/locomotion';
import {groundMarkerPosition} from '../systems/groundMarkers';
import {DragonCombat} from '../systems/DragonCombat';
import {actorTravelDirection,enemyLocomotionKey,type ActorDirection} from '../../data/directionalEnemyArt';
import {pirateAttackPhase,piratePhaseDuration} from '../../data/pirateMotion';
import {isPirateEnemy} from '../../data/pirateArt';
import {ATTACK_WARNING_TEXTURE,enemyAttackWarningLayout,type EnemyAttackWarningStyle} from '../systems/attackWarning';

const ALLY_STEERING_OFFSETS=[0,.45,-.45,.9,-.9,1.35,-1.35] as const;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  definition: EnemyDefinition;
  private readonly authoredDefinition: EnemyDefinition;
  private readonly regionalLevel:number;
  hp: number;
  readonly eventSpawn: boolean;
  readonly wolfPackId: string | null;
  readonly wolfAlpha: boolean;
  readonly encounterKey: string | null;
  readonly encounterBehavior: EncounterBehavior | undefined;
  level:number;
  readonly instanceId: string;
  private nextAttackAt = 0;
  private lockedUntil = 0;
  private nextSpecialAt = 0;
  private nextWanderAt = 0;
  private wander = new Phaser.Math.Vector2();
  private readonly facing = new Phaser.Math.Vector2(0, 1);
  private readonly rng: () => number;
  private lastSafe: { x: number; y: number };
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly nameLabel: Phaser.GameObjects.Text;
  private visualUntil = 0;
  private pirateWalkProgress = 0;
  private approachSlot = -1;
  private slotCheckAt = 0;
  private pirateMoving = false;
  private pirateStoppedAt: number | null = null;
  private nextGrowlAt=0;
  private leapVisual: Phaser.GameObjects.Sprite | null = null;
  private leapShadow: Phaser.GameObjects.Ellipse | null = null;
  private leapTween: Phaser.Tweens.Tween | null = null;
  private attackTelegraph: Phaser.GameObjects.Image | null = null;
  private attackTelegraphStyle:EnemyAttackWarningStyle='melee';
  private attackTelegraphRadius=0;
  private attackTelegraphAngle=0;
  private attackTelegraphStartedAt=0;
  private attackTelegraphWindup=0;
  private readonly boss: BossDefinition | undefined;
  private readonly bossHome: {x:number;y:number}|null;
  private attackEpoch=0;
  private hitStunUntil=0;
  private staggerImmuneUntil=0;
  private flurrySuppressed=false;
  private lastDamagedAt=0;
  private lastEngagedAt=0;
  private readonly targetIndicator:Phaser.GameObjects.Graphics;
  private readonly dragonCombat:DragonCombat|undefined;
  private visualDirection:ActorDirection='right';
  // Each pack member claims a stable hunting lane until it is unloaded.
  private wolfFlankSlot: number | null = null;
  private wolfHuntBearing = 0;
  get canBeTargeted(){return !this.dragonCombat?.airborne;}
  get isStaggered(){return this.flurrySuppressed||this.scene.time.now<this.hitStunUntil;}
  get facingLeft(){return this.visualDirection==='left';}
  get isRangedAttacker(){return this.definition.combatStyle==='spear-thrower'||this.definition.combatStyle==='stone-thrower';}
  private get directionalCombat(){return this.isRangedAttacker||this.definition.combatStyle==='boatswain'||['hedge-goblin','blighted-thornling','grove-spider','redmesa-chieftain','rootfather','frost-wyrm','ashen-seer'].includes(this.definition.id);}
  playMonsterVocal(cue:'attack'|'growl'|'hurt'|'death'){
    // No borrowed mammal/ghost voice for a chitin creature. Its attack still
    // uses the existing restrained swish/impact effects.
    if(this.definition.id==='grove-spider')return;
    (this.scene as WorldScene).playEnemyVocal(this.definition,this.instanceId,cue,this.x,this.y);
  }
  playMonsterAttackFoley(phase:'windup'|'impact'){
    (this.scene as WorldScene).playEnemyAttackFoley(this.definition,this.x,this.y,phase);
  }

  constructor(scene: WorldScene, definition: EnemyDefinition, x: number, y: number, instanceId: string,
    eventSpawn = false, wolfPackId: string | null = null, wolfAlpha = false,
    encounterId: string | null = null, encounterBehavior?: EncounterBehavior) {
    const idle=scene.anims.get(enemyLocomotionKey(definition.spriteFrame,'idle','right'));
    const initial=idle.frames[0];
    super(scene, x, y, initial.textureKey, initial.textureFrame);
    this.boss = instanceId.startsWith('boss:') ? BOSS_BY_ID[instanceId.slice(5)] : undefined;
    this.bossHome=this.boss&&this.boss.id!=='salt-king'&&this.boss.id!=='varkhul'?{x,y}:null;
    this.wolfAlpha=isWolfFamily(definition.id) && wolfAlpha;
    // A pack's members share its danger tier even when roaming across borders
    // or being restored on opposite sides of a settlement's tier boundary.
    const levelHome=encounterBehavior?.home??{x,y};
    const zone=(scene as WorldScene).getRegionAtPosition(levelHome.x,levelHome.y);
    this.authoredDefinition=definition;
    this.regionalLevel=enemyLevelAt(definition,levelHome.x,levelHome.y,zone,this.wolfAlpha);
    this.level=this.regionalLevel+globalMonsterBonus(useGameStore.getState().level);
    const base=scaledEnemy(definition,this.level);
    this.wolfPackId=isWolfFamily(definition.id) ? wolfPackId : null;
    this.encounterKey=definition.boss ? null : this.wolfPackId ? `wolf:${this.wolfPackId}`
      : encounterId ? `encounter:${encounterId}` : null;
    this.encounterBehavior = this.encounterKey ? encounterBehavior : undefined;
    this.definition=this.wolfAlpha ? {...base,name:definition.id==='frost-wolf'?'Frost Alpha Wolf':'Alpha Wolf',
      hp:Math.round(base.hp*1.35),damage:Math.round(base.damage*1.12),
      xp:Math.round(base.xp*1.5),goldMax:Math.ceil(base.goldMax*1.25)} : base;
    this.hp=this.definition.hp;
    this.eventSpawn = eventSpawn;
    this.instanceId = instanceId;
    // Separate seed: animation variation must not consume combat/wander RNG.
    this.pirateWalkProgress=seededRandom(instanceId+':stride')();
    this.lastDamagedAt = scene.time.now;
    this.lastEngagedAt = scene.time.now;
    this.rng = seededRandom(instanceId);
    this.lastSafe = { x, y };
    scene.add.existing(this);
    const texture=initial.textureKey as ArtTextureKey,sheet=ART_BY_KEY[texture];
    this.setScale(artScale(texture) * enemyAppearanceMultiplier(definition) * (this.wolfAlpha?1.36:1)).setOrigin(.5, actorArtLayout(texture).originY);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const radius = (definition.bodyRadius??(definition.boss ? 24 : 11)) * (this.wolfAlpha ? 1.18 : 1);
    const density = sheet.density;
    body.setCircle(radius / this.scaleX, sheet.frameWidth * density / 2 - radius / this.scaleX,
      this.originY * sheet.frameHeight * density - 2 * radius / this.scaleY);
    body.updateFromGameObject();
    body.setCollideWorldBounds(true);
    this.setDepth(y);
    this.anims.play(idle.key);
    if(definition.spriteTint!==undefined)this.setTint(definition.spriteTint);
    this.healthBar = scene.add.graphics().setName(`enemy-health:${instanceId}`);
    this.nameLabel = scene.add.text(x, y - 40, `Lv.${this.level} ${this.boss?.name ?? this.definition.name}`, {
      fontFamily: 'Georgia, serif', fontSize: definition.boss ? '12px' : '9px',
      color: definition.boss ? '#f3c69c' : '#edddcb', stroke: '#17120e', strokeThickness: 3,
    }).setResolution(2).setOrigin(.5,1).setName(`enemy-name:${instanceId}`);
    this.targetIndicator=scene.add.graphics().setName('enemy-target:'+instanceId);
    if(definition.combatStyle==='dragon')this.dragonCombat=new DragonCombat(this,scene);
    this.setInteractive({useHandCursor:true}).on('pointerdown',()=>{
      const state=useGameStore.getState();if(!state.panel&&!state.dialogue&&!state.cinematic)scene.targeting.select(this);
    });
    this.once('destroy', () => {
      this.interruptAttack();this.targetIndicator.destroy();this.healthBar.destroy(); this.nameLabel.destroy(); this.clearWolfLeap(); this.attackTelegraph?.destroy();
      (this.scene as WorldScene).forgetEnemySound(this.instanceId);
      this.dragonCombat?.destroy();
    });
  }

  updateEnemy(time: number,delta=16) {
    const scene = this.scene as WorldScene;
    const player = scene.player;
    if (!player?.active) return;
    const nextLevel=this.regionalLevel+globalMonsterBonus(useGameStore.getState().level);
    if(this.hp>0&&nextLevel!==this.level){
      const fraction=this.hp/this.definition.hp;
      const base=scaledEnemy(this.authoredDefinition,nextLevel);
      this.definition=this.wolfAlpha?{...base,name:this.definition.name,hp:Math.round(base.hp*1.35),
        damage:Math.round(base.damage*1.12),xp:Math.round(base.xp*1.5),goldMax:Math.ceil(base.goldMax*1.25)}:base;
      this.hp=Math.max(1,Math.round(fraction*this.definition.hp));
      this.level=nextLevel;
      this.nameLabel.setText(`Lv.${this.level} ${this.boss?.name??this.definition.name}`);
    }
    // Recover only after leaving combat, never during a chase or attack.
    // Paused scenes do not tick updateEnemy, so this is active-play time only.
    const playerDistance = Phaser.Math.Distance.Between(this.x,this.y,player.x,player.y);
    const territory=scene.isEnemyTerritory(player.x,player.y);
    const spotted=playerDistance<=this.definition.aggroRange&&territory;
    const encounterMode=this.encounterBehavior&&this.hp>0 ? scene.encounterDecision(this,time,spotted,territory) : null;
    const pursuing = encounterMode ? encounterMode==='pursue' : spotted;
    if (pursuing) this.lastEngagedAt = time;
    if (this.hp>0 && this.hp<this.definition.hp && !pursuing
      && playerDistance>this.definition.aggroRange*1.2
      && time-Math.max(this.lastDamagedAt,this.lastEngagedAt)>=12000
      && !this.attackTelegraph && !this.dragonCombat?.airborne) {
      const healingRate=this.boss ? .008 : .02; // Bosses recover more slowly.
      this.hp=Math.min(this.definition.hp,
        this.hp+this.definition.hp*healingRate*Math.max(0,Math.min(delta,100))/1000);
    }
    if(this.dragonCombat){this.dragonCombat.update(delta);return;}

    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.hp <= 0) {
      body.setVelocity(0, 0);
      this.updateVisual(time);
      return;
    }

    if (!scene.canEnemyOccupy(this.x,this.y,this)) {
      body.reset(this.lastSafe.x,this.lastSafe.y);
      body.setVelocity(0,0); this.nextWanderAt = 0;
      this.updateVisual(time);
      return;
    }

    if (encounterMode && encounterMode !== 'pursue' && (this.attackTelegraph || this.leapVisual)) {
      this.interruptAttack();
      if (!this.isStaggered) { this.lockedUntil=time;this.visualUntil=0; }
    }
    if (encounterMode==='return') {
      if (this.attackTelegraph || this.leapVisual || time < this.lockedUntil) {
        this.interruptAttack();
        if (!this.isStaggered) { this.lockedUntil=time; this.visualUntil=0; }
      }
      if(this.isStaggered)body.setVelocity(0,0);
      else this.returnToEncounter(scene,body,delta);
      this.setDepth(this.y);this.lastSafe={x:this.x,y:this.y};this.updateVisual(time);return;
    }
    if(this.isStaggered){body.setVelocity(0,0);this.setDepth(this.y);this.updateVisual(time);return;}
    if (time < this.lockedUntil) {
      body.setVelocity(0, 0);
      if(this.attackTelegraph)this.updateAttackTelegraph(time);
      this.setDepth(this.y);
      this.updateVisual(time);
      return;
    }

    if(pursuing&&territory) {
      if(time>=this.nextGrowlAt&&distance>Math.max(100,this.definition.attackRange)){
        scene.playEnemyVocal(this.definition,this.instanceId,'growl',this.x,this.y);
        this.nextGrowlAt=time+3600+this.rng()*2800;
      }
      this.facing.set(player.x - this.x, player.y - this.y).normalize();
      if(this.wolfPackId) {
        // Pack wolves spread around the player instead of all charging at one point.
        this.chaseAsPack(scene,player,time,delta,distance,body);
      } else {
        this.chaseWithAllies(scene,player,time,delta,body);
      }
      if(Math.abs(this.facing.x)>.2)this.setFlipX(this.facing.x<0);
      this.updateBossSkill(scene, time);
      if (distance <= Math.max(this.definition.attackRange, this.definition.attackRadius ?? 0) && time >= this.nextAttackAt
        && scene.hasClearPath(this.x, this.y, player.x, player.y)) {
        this.beginAttack(scene, player, time);
      }
    } else {
      // Field encounter groups stay together while roaming, like wolf siblings.
      // Authored ship posts/reinforcements keep their separate deck routines.
      const patrolLeader=this.encounterKey&&!this.wolfPackId?scene.enemyPatrolLeader(this):null;
      const alpha=this.wolfPackId&&!this.wolfAlpha?scene.wolfPackLeader(this.wolfPackId)
        :patrolLeader!==this?patrolLeader:null;
      const alphaDistance=alpha?Math.hypot(alpha.x-this.x,alpha.y-this.y):0;
      const homeDistance=this.bossHome?Math.hypot(this.x-this.bossHome.x,this.y-this.bossHome.y):0;
      if(this.bossHome&&homeDistance>180){
        // Keep idle bosses close to their clearings; pursuit remains unchanged.
        this.wander.set((this.bossHome.x-this.x)/homeDistance*this.definition.moveSpeed*.6,
          (this.bossHome.y-this.y)/homeDistance*this.definition.moveSpeed*.6);
        this.nextWanderAt=time+650;
      }else if(alpha&&alphaDistance>108&&alphaDistance<(this.wolfPackId?540:900)){
        this.wander.set((alpha.x-this.x)/alphaDistance*this.definition.moveSpeed*.68,
          (alpha.y-this.y)/alphaDistance*this.definition.moveSpeed*.68);
        this.nextWanderAt=time+850;
      }else if (time >= this.nextWanderAt) {
        this.nextWanderAt = time + 1600 + this.rng() * 2400;
        const angle = this.rng() * Math.PI * 2;
        // Rest between some roaming legs so idle art is an actual behavior,
        // not a walk cycle played while the creature stands still.
        const speed = this.rng() < .25 ? 0 : this.definition.moveSpeed * (0.25 + this.rng() * 0.3);
        this.wander.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
      const speed=this.wander.length(),ahead={x:this.x+this.wander.x/Math.max(1,speed)*24,y:this.y+this.wander.y/Math.max(1,speed)*24};
      if(scene.canEnemyOccupy(ahead.x,ahead.y,this)&&scene.hasClearPath(this.x,this.y,ahead.x,ahead.y))
        body.setVelocity(approachVelocity(body.velocity.x,this.wander.x,delta,120),approachVelocity(body.velocity.y,this.wander.y,delta,120));
      else {body.setVelocity(0,0);this.nextWanderAt=time+1000;this.wander.set(0,0);}
    }
    if(!this.directionalCombat&&Math.abs(body.velocity.x)>Math.max(2,Math.abs(body.velocity.y)*.3)) this.setFlipX(body.velocity.x<0);
    this.setDepth(this.y);
    this.lastSafe = { x:this.x,y:this.y };
    this.updateVisual(time);
  }

  /** Reserve distinct attack approaches, then steer around nearby allied bodies.
   * Physical collisions remain the final safeguard; locked attackers never move. */
  private chaseWithAllies(scene:WorldScene,player:WorldScene['player'],time:number,
    delta:number,body:Phaser.Physics.Arcade.Body) {
    const actors=scene.enemySteeringActors();
    const radius=this.definition.bodyRadius??(this.definition.boss?24:11);
    // Melee attackers reserve different approaches; throwers use a separate
    // outer ring so they retain standoff/retreat rather than joining the pile.
    const ranged=this.isRangedAttacker;
    const ring=ranged?280:Math.max(30,this.definition.attackRange-8);
    if(time>=this.slotCheckAt){
      this.slotCheckAt=time+600;
      let best=-1,bestScore=Infinity;
      for(let slot=0;slot<8;slot++){
        const angle=slot*Math.PI/4,x=player.x+Math.cos(angle)*ring,y=player.y+Math.sin(angle)*ring;
        if(!scene.canEnemyOccupy(x,y,this)||!scene.hasClearPath(x,y,player.x,player.y))continue;
        let score=(x-this.x)**2+(y-this.y)**2;
        // Prefer an existing seat unless blocked or claimed by a nearby ally.
        if(slot===this.approachSlot)score-=1600;
        for(const other of actors){
          if(other===this||!other.active||other.hp<=0
            ||!other.canBeTargeted
            ||other.isRangedAttacker!==ranged
            ||Math.hypot(other.x-player.x,other.y-player.y)>ring+300)continue;
          if(other.approachSlot===slot)score+=1000000;
        }
        if(score<bestScore){bestScore=score;best=slot;}
      }
      this.approachSlot=best;
    }
    const angle=this.approachSlot*Math.PI/4;
    const target=this.approachSlot<0?player:
      {x:player.x+Math.cos(angle)*ring,y:player.y+Math.sin(angle)*ring};
    const waypoint=scene.enemyNavigationPoint(this,target);
    let dx=waypoint.x-this.x,dy=waypoint.y-this.y;
    const distance=Math.hypot(dx,dy);
    if(distance<1){
      // At a claimed station we must still be able to escape an overlap.
      dx=this.x-player.x;dy=this.y-player.y;
      const length=Math.max(1,Math.hypot(dx,dy));dx/=length;dy/=length;
      if(dx===0&&dy===0){dx=Math.cos(angle);dy=Math.sin(angle);}
    }else{dx/=distance;dy/=distance;}
    const tangentX=-dy,tangentY=dx;
    let lateral=0,crowded=false;
    for(const other of actors){
      if(other===this||!other.active||other.hp<=0
        ||!other.canBeTargeted)continue;
      const otherBody=other.body as Phaser.Physics.Arcade.Body;
      const rx=body.center.x-otherBody.center.x,ry=body.center.y-otherBody.center.y;
      const gap=radius+(other.definition.bodyRadius??(other.definition.boss?24:11))+18;
      const separation=Math.hypot(rx,ry);
      if(separation>=gap)continue;
      crowded=true;
      const side=rx*tangentX+ry*tangentY;
      const sign=Math.abs(side)>.5?Math.sign(side):this.instanceId<other.instanceId?1:-1;
      // Sideways avoidance doesn't cancel forward motion behind an attacker.
      lateral+=sign*(gap-separation)/gap*1.8;
    }
    const heading=Math.atan2(dy+tangentY*lateral,dx+tangentX*lateral);
    let steerX=0,steerY=0;
    if(distance<6&&!crowded){body.setVelocity(0,0);return;}
    for(const offset of ALLY_STEERING_OFFSETS){
      const sx=Math.cos(heading+offset),sy=Math.sin(heading+offset);
      const nextX=this.x+sx*24,nextY=this.y+sy*24;
      if(!scene.canEnemyOccupy(nextX,nextY,this)||!scene.hasClearPath(this.x,this.y,nextX,nextY))continue;
      let clear=true;
      for(const other of actors){
        if(other===this||!other.active||other.hp<=0
          ||!other.canBeTargeted)continue;
        const otherBody=other.body as Phaser.Physics.Arcade.Body;
        const current=Math.hypot(body.center.x-otherBody.center.x,body.center.y-otherBody.center.y);
        const next=Math.hypot(body.center.x+sx*24-otherBody.center.x,body.center.y+sy*24-otherBody.center.y);
        const gap=radius+(other.definition.bodyRadius??(other.definition.boss?24:11))+3;
        // Permit escape from an existing overlap, never deepen it.
        if(next<gap&&next<=current+1){clear=false;break;}
      }
      if(clear){steerX=sx;steerY=sy;break;}
    }
    const speed=Math.min(this.definition.moveSpeed,Math.max(distance,crowded?12:0)*6);
    body.setVelocity(approachVelocity(body.velocity.x,steerX*speed,delta,90),
      approachVelocity(body.velocity.y,steerY*speed,delta,90));
  }

  private returnToEncounter(scene:WorldScene,body:Phaser.Physics.Arcade.Body,delta:number) {
    const station=this.encounterBehavior!.station,home=this.encounterBehavior!.home;
    const target=scene.canEnemyOccupy(station.x,station.y)?station:home;
    if (Math.hypot(target.x-this.x,target.y-this.y)<=40) {
      body.setVelocity(0,0);scene.encounterArrived(this);return;
    }
    const waypoint=scene.enemyNavigationPoint(this,target);
    const angle=Math.atan2(waypoint.y-this.y,waypoint.x-this.x);
    let vx=0,vy=0;
    // Bounded local steering, never teleport or cross a blocked foundation.
    for(const offset of [0,-.6,.6,-1.2,1.2]) {
      const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset),x=this.x+dx*24,y=this.y+dy*24;
      if(scene.canEnemyOccupy(x,y,this)&&scene.hasClearPath(this.x,this.y,x,y)) {
        vx=dx*this.definition.moveSpeed*.75;vy=dy*this.definition.moveSpeed*.75;break;
      }
    }
    body.setVelocity(approachVelocity(body.velocity.x,vx,delta,90),approachVelocity(body.velocity.y,vy,delta,90));
  }

  /** Flank using persistent angular slots and short-range ally repulsion.
   * Wolves approach from different sides and lunge in overlapping, staggered
   * windows. Path checks still prevent movement through scenery/buildings. */
  private chaseAsPack(scene:WorldScene,player:WorldScene['player'],time:number,
    delta:number,distance:number,body:Phaser.Physics.Arcade.Body) {
    const members=scene.wolfPackMembers(this.wolfPackId!);
    if(this.wolfFlankSlot===null){
      // Alpha presses from the front; siblings occupy alternating flanks/rear.
      const ordinal=members.findIndex(member=>member.instanceId===this.instanceId);
      this.wolfFlankSlot=this.encounterBehavior?.slot ?? (this.wolfAlpha?0:Math.max(1,ordinal));
      const leader=members.find(member=>member.wolfAlpha)??this;
      this.wolfHuntBearing=Math.atan2(leader.y-player.y,leader.x-player.x);
    }
    const slot=this.wolfFlankSlot;
    const offsets=[0,-1.05,1.05,-2.1,2.1,Math.PI];
    const desiredBearing=this.wolfHuntBearing+offsets[slot%offsets.length];
    // Close in to strike only during each wolf's offset attack window;
    // withdrawing briefly creates space for packmates to circle and attack.
    const lunge=(time+slot*470)%2750<1460;
    const preferredRadius=lunge?(this.wolfAlpha?40:46):(this.wolfAlpha?64:74);
    let goalX=player.x+Math.cos(desiredBearing)*preferredRadius;
    let goalY=player.y+Math.sin(desiredBearing)*preferredRadius;
    let vx=goalX-this.x,vy=goalY-this.y;
    if(distance<185&&distance>1){
      const angle=Math.atan2(this.y-player.y,this.x-player.x);
      const diff=Math.atan2(Math.sin(desiredBearing-angle),Math.cos(desiredBearing-angle));
      // Travel around the outside of the player, not straight across center.
      const radial=Phaser.Math.Clamp((preferredRadius-distance)*1.15,-75,75);
      const tangent=Phaser.Math.Clamp(diff*distance*.82,-105,105);
      vx=Math.cos(angle)*radial-Math.sin(angle)*tangent;
      vy=Math.sin(angle)*radial+Math.cos(angle)*tangent;
    }
    // Lightweight pairwise separation. No physics collision solver or per-frame
    // tween allocations: even six wolves stay within the existing enemy cap.
    for(const other of scene.enemySteeringActors()){
      if(other===this||!other.active||other.hp<=0||!other.canBeTargeted)continue;
      let dx=this.x-other.x,dy=this.y-other.y;
      let dist=Math.hypot(dx,dy);
      const minGap=other.wolfPackId?(this.wolfAlpha||other.wolfAlpha)?75:62
        :(this.definition.bodyRadius??11)+(other.definition.bodyRadius??(other.definition.boss?24:11))+18;
      if(dist>=minGap)continue;
      if(dist<.1){const a=(slot+1)*2.4;dx=Math.cos(a);dy=Math.sin(a);dist=1;}
      const repel=(minGap-dist)/minGap*145;
      vx+=dx/dist*repel;
      vy+=dy/dist*repel;
    }
    const speed=Math.hypot(vx,vy);
    const velocity=speed<5?0:this.definition.moveSpeed*(this.wolfAlpha?.97:1);
    const headingX=speed>0?vx/speed:0,headingY=speed>0?vy/speed:0;
    const canStep=(sx:number,sy:number)=>scene.canEnemyOccupy(this.x+sx*30,this.y+sy*30)
      &&scene.hasClearPath(this.x,this.y,this.x+sx*30,this.y+sy*30);
    let steerX=headingX,steerY=headingY;
    if(velocity>0&&!canStep(steerX,steerY)){
      // Attempt the two short tangents before giving up; never phase through walls.
      if(canStep(-headingY,headingX)){steerX=-headingY;steerY=headingX;}
      else if(canStep(headingY,-headingX)){steerX=headingY;steerY=-headingX;}
      else{steerX=0;steerY=0;}
    }
    const targetX=steerX*velocity,targetY=steerY*velocity;
    body.setVelocity(approachVelocity(body.velocity.x,targetX,delta,85),
      approachVelocity(body.velocity.y,targetY,delta,85));
  }

  private beginAttack(scene: WorldScene, player: WorldScene['player'], time: number) {
    const windup = this.definition.attackWindupMs ?? 220;
    const recovery = this.definition.attackRecoveryMs ?? 320;
    const radius = this.definition.attackRadius ?? this.definition.attackRange;
    const ranged=this.isRangedAttacker;
    const attackAim={x:player.x,y:player.y};
    if(this.directionalCombat)this.visualDirection=actorTravelDirection(player.x-this.x,player.y-this.y,this.visualDirection);
    const attackStyle = ranged?'melee':this.definition.combatStyle==='troll'?'slam':this.boss?.attackStyle ?? (isWolfFamily(this.definition.id) ? 'pounce' : 'melee');
    this.lockedUntil = time + windup + recovery;
    this.nextAttackAt = this.lockedUntil + this.definition.attackCooldownMs;
    this.attackTelegraph?.destroy();
    this.attackTelegraphStyle=attackStyle;
    this.attackTelegraphRadius=radius;
    this.attackTelegraphAngle=this.facing.angle();
    this.attackTelegraphStartedAt=time;
    this.attackTelegraphWindup=windup;
    const layout=enemyAttackWarningLayout(attackStyle,radius,this.attackTelegraphAngle);
    this.attackTelegraph=null;
    if(!ranged)this.attackTelegraph=scene.add.image(this.x,this.y,ATTACK_WARNING_TEXTURE,layout.frame)
      .setOrigin(layout.originX,.5).setDisplaySize(layout.width,layout.height).setRotation(layout.rotation).setAlpha(.24)
      .setDepth(Math.min(this.y,player.y)-2)
      .setName(`attack-telegraph:${this.instanceId}`);
    const attackAnimation = enemyAnimation(this.definition.spriteFrame, 'attack',this.directionalCombat?this.visualDirection:undefined);
    const epoch=++this.attackEpoch;
    this.playMonsterVocal('attack');
    this.playMonsterAttackFoley('windup');
    this.nextGrowlAt=time+2800;
    this.playAction('attack');
    const windupClip=pirateAttackPhase(this.definition.spriteFrame,'windup');
    const recoveryClip=pirateAttackPhase(this.definition.spriteFrame,'recovery');
    if(windupClip){
      this.anims.play(windupClip.key);
      this.anims.timeScale=piratePhaseDuration(windupClip)/Math.max(1,windup);
    }else this.anims.timeScale=animationDuration(attackAnimation)/(windup+recovery);
    if(this.definition.combatStyle==='troll')this.anims.timeScale=(attackAnimation.frames.length-1)*1000/(attackAnimation.frameRate*windup);
    this.visualUntil=time+windup+recovery;
    if (attackStyle === 'pounce' && this.definition.spriteFrame === 0) this.playWolfLeap(attackAnimation);
    scene.time.delayedCall(windup, () => {
      if(epoch!==this.attackEpoch)return;
      this.attackTelegraph?.destroy();
      this.attackTelegraph = null;
      if (epoch!==this.attackEpoch || !this.active || !player.active || useGameStore.getState().panel || useGameStore.getState().dialogue || useGameStore.getState().cinematic) return;
      if (this.encounterBehavior && scene.encounterDecision(this,scene.time.now,false,scene.isEnemyTerritory(player.x,player.y))!=='pursue') {
        this.interruptAttack();return;
      }
      if(recoveryClip){
        this.anims.play(recoveryClip.key);
        this.anims.timeScale=piratePhaseDuration(recoveryClip)/Math.max(1,recovery);
      }
      if(ranged){
        scene.fireOrcSpear(this,attackAim);
        scene.playAudio('sfx-sword-whoosh',.2,1.35);
        return;
      }
      if(this.definition.combatStyle==='troll'){
        const impact=scene.add.sprite(this.x,this.y,'effect_troll_impact',0).setOrigin(.5,actorArtLayout('effect_troll_impact').originY)
          .setScale(artScale('effect_troll_impact')*radius/40).setDepth(this.y+1).play('effect-troll-impact');
        impact.once(Phaser.Animations.Events.ANIMATION_COMPLETE,()=>impact.destroy());scene.playAudio('sfx-heavy-slam',.3);
      }
      const strikeDistance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
      const facingThreshold = attackStyle === 'slam' ? -1 : attackStyle === 'pounce' ? .35 : .6;
      if (strikeDistance > radius || this.facing.dot(toPlayer) < facingThreshold
        || !scene.hasClearPath(this.x, this.y, player.x, player.y)) return;
      this.playMonsterAttackFoley('impact');
      scene.playEffect('hit', player.x, player.y, toPlayer);
      scene.damagePlayer(this.definition.damage);
    });
  }

  private updateAttackTelegraph(time:number){
    const image=this.attackTelegraph;
    if(!image)return;
    const progress=Phaser.Math.Clamp((time-this.attackTelegraphStartedAt)/Math.max(1,this.attackTelegraphWindup),0,1);
    const layout=enemyAttackWarningLayout(this.attackTelegraphStyle,this.attackTelegraphRadius,this.attackTelegraphAngle);
    image.setPosition(this.x,this.y+2).setDisplaySize(layout.width,layout.height).setRotation(layout.rotation)
      .setAlpha(.2+progress*.08+(progress>.78?Math.sin(time*.02)*.025:0))
      .setDepth(Math.min(this.y,(this.scene as WorldScene).player.y)-2);
  }

  private updateBossSkill(scene: WorldScene, time: number) {
    if (!this.definition.summonComposition?.length || time < this.nextSpecialAt) return;
    // Bounded retries only. The saved logical wave owns the initial delay,
    // survivor gate and post-final-defeat cooldown, not this disposable actor.
    this.nextSpecialAt=time+750;
    scene.tryBossSummonWave(this);
  }

  private updateVisual(time:number) {
    if (time < this.visualUntil) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed=body.velocity.length();
    let moving=speed>3;
    if(isPirateEnemy(this.definition.id)||this.definition.boss){
      if(speed>=8){this.pirateMoving=true;this.pirateStoppedAt=null;}
      else if(speed<2){
        this.pirateStoppedAt??=time;
        if(time-this.pirateStoppedAt>=90)this.pirateMoving=false;
      }else this.pirateStoppedAt=null;
      moving=this.pirateMoving;
    }
    this.playLocomotion(moving?'walk':'idle');
    this.anims.timeScale=moving?strideRate(speed,this.definition.moveSpeed):1;
  }

  playLocomotion(state:'idle'|'walk'){
    const body=this.body as Phaser.Physics.Arcade.Body;
    if(state==='walk')this.visualDirection=actorTravelDirection(body.velocity.x,body.velocity.y,this.visualDirection);
    const key=enemyLocomotionKey(this.definition.spriteFrame,state,this.visualDirection);
    const progress=this.anims.currentAnim?.key.includes(':walk:')?this.anims.getProgress():0;
    const crew=this.definition.id==='cutlass-pirate';
    if(crew&&this.anims.currentAnim?.key.includes(':walk:'))this.pirateWalkProgress=progress;
    const changed=this.anims.currentAnim?.key!==key;
    this.useVisualTexture(this.scene.anims.get(key).frames[0].textureKey as ArtTextureKey);
    const mirroredSide=this.definition.id==='salt-king'||this.definition.id==='cutlass-pirate';
    this.setFlipX(!this.directionalCombat&&this.visualDirection==='left'&&(mirroredSide||this.texture.key===(this.definition.spriteTexture??'enemies'))).anims.play(key,true);
    if(changed&&state==='walk'&&progress>0)this.anims.setProgress(progress);
    else if(changed&&state==='walk'&&crew&&(this.visualDirection==='left'||this.visualDirection==='right'))
      this.anims.setProgress(this.pirateWalkProgress);
  }

  /** Different canvas padding must not move the collision feet or hit circle. */
  useVisualTexture(texture:ArtTextureKey){
    if(this.texture.key===texture)return;
    this.anims.stop();const sheet=ART_BY_KEY[texture];
    this.setTexture(texture,0).setOrigin(.5,actorArtLayout(texture).originY);
    const body=this.body as Phaser.Physics.Arcade.Body;
    const radius=this.definition.bodyRadius??(this.definition.boss?24:11);
    body.setCircle(radius/this.scaleX,sheet.frameWidth*sheet.density/2-radius/this.scaleX,
      this.originY*sheet.frameHeight*sheet.density-2*radius/this.scaleY);
    body.updateFromGameObject();
  }

  private playAction(state:EnemyAnimationState) {
    const directional=this.directionalCombat;
    const animation = enemyAnimation(this.definition.spriteFrame,state,directional?this.visualDirection:undefined);
    this.useVisualTexture(animation.texture as ArtTextureKey);
    this.setFlipX(directional?false:state==='attack'?this.facing.x<0:this.facingLeft);
    this.visualUntil = this.scene.time.now + animationDuration(animation);
    this.anims.play(animation.key);
    this.anims.timeScale=1;
  }

  private playWolfLeap(animation: ReturnType<typeof enemyAnimation>) {
    this.clearWolfLeap();
    const scene = this.scene;
    const arc = { height: 0 };
    this.leapShadow = scene.add.ellipse(this.x, this.y - 3, 34, 13, 0x090b0b, 0.34)
      .setDepth(this.y - 1).setName(`wolf-leap-shadow:${this.instanceId}`);
    this.leapVisual = scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name)
      .setOrigin(this.originX, this.originY).setScale(this.scaleX, this.scaleY)
      .setFlipX(this.flipX).setDepth(this.y + 1).setName(`wolf-leap:${this.instanceId}`);
    if(this.definition.spriteTint!==undefined)this.leapVisual.setTint(this.definition.spriteTint);
    this.setAlpha(0);
    this.leapVisual.play(animation.key);
    this.leapVisual.anims.timeScale=this.anims.timeScale;
    this.leapTween = scene.tweens.add({
      targets: arc, height: 26, duration: 190, ease: 'Sine.easeOut', yoyo: true,
      onUpdate: () => {
        if (!this.leapVisual?.active) return;
        this.leapVisual.setPosition(this.x, this.y - arc.height).setDepth(this.y + arc.height);
        this.leapShadow?.setPosition(this.x, this.y - 3).setScale(1 + arc.height / 50, 1 - arc.height / 70);
      },
      onComplete: () => this.clearWolfLeap(),
    });
  }

  private clearWolfLeap() {
    this.leapTween?.stop();
    this.leapTween = null;
    this.leapVisual?.destroy();
    this.leapVisual = null;
    this.leapShadow?.destroy();
    this.leapShadow = null;
    if (this.active) this.setAlpha(1);
  }

  createDeathVisual() {
    const directional=this.directionalCombat;
    const animation = enemyAnimation(this.definition.spriteFrame,'death',directional?this.visualDirection:undefined);
    const effect = this.scene.add.sprite(this.x,this.y,animation.texture,animation.frames[0]).setScale(this.scaleX,this.scaleY)
      .setOrigin(.5,actorArtLayout(animation.texture as ArtTextureKey).originY).setFlipX(!directional&&(this.visualDirection==='left'||this.flipX)).setDepth(this.depth).setName(`enemy-death:${this.instanceId}`);
    if(this.definition.spriteTint!==undefined)effect.setTint(this.definition.spriteTint);
    effect.play(animation.key);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE,() => effect.destroy());
    this.scene.time.delayedCall(animationDuration(animation) + 200,() => { if (effect.active) effect.destroy(); });
  }

  /** Flurry holds only reachable targets, releasing them when the cast ends,
   * is cancelled, or they leave its area. Damage pulses still play hurt poses. */
  setFlurrySuppressed(suppressed:boolean){
    if(!this.active||this.hp<=0||this.flurrySuppressed===suppressed)return;
    if(suppressed&&!this.canBeTargeted)return;
    this.flurrySuppressed=suppressed;
    if(suppressed)this.stagger(true);
  }

  private interruptAttack(){
    this.attackEpoch++;
    this.attackTelegraph?.destroy();this.attackTelegraph=null;
    this.clearWolfLeap();
  }
  private stagger(forced:boolean){
    const now=this.scene.time.now;
    if(!forced&&now<this.staggerImmuneUntil)return false;
    const directional=this.directionalCombat;
    const duration=animationDuration(enemyAnimation(this.definition.spriteFrame,'hurt',directional?this.visualDirection:undefined));
    this.hitStunUntil=now+duration;
    // A full hurt pose is followed by a real opportunity to retaliate.
    this.staggerImmuneUntil=this.hitStunUntil+(this.definition.combatStyle==='boatswain'?1800:this.boss?1500:1000);
    this.lockedUntil=this.hitStunUntil;
    this.nextAttackAt=Math.max(this.nextAttackAt,this.hitStunUntil+150);
    this.interruptAttack();
    this.dragonCombat?.interruptForStagger(duration);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
    this.playAction('hurt');
    return true;
  }

  takeDamage(amount: number, knockback: Phaser.Math.Vector2, options:{forceStagger?:boolean}={}) {
    if (!Number.isFinite(amount)||amount<=0||!this.active || this.hp <= 0 || !this.canBeTargeted) return;
    const state=useGameStore.getState();
    this.hp -= Math.max(1,Math.round(luckDamage(amount,state.attributes,state.learnedSkills)*(1-(this.definition.defense??0))));
    const scene=this.scene as WorldScene;
    scene.playEnemyVocal(this.definition,this.instanceId,this.hp<=0?'death':'hurt',this.x,this.y);
    this.lastDamagedAt=this.scene.time.now;
    const fatal=this.hp<=0;
    const staggered=!fatal&&this.stagger(Boolean(options.forceStagger));
    if(fatal)this.interruptAttack();
    scene.playEffect('hit', this.x, this.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Flurry keeps its targets inside the sweep instead of knocking them out
    // of range while Leigneron is committed to the stationary animation.
    if (staggered||fatal) {
      const force=fatal?70:options.forceStagger?0:this.boss?55:100;
      body.setVelocity(this.dragonCombat?0:knockback.x*force,
        this.dragonCombat?0:knockback.y*force);
    }
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) {this.clearTint();if(this.definition.spriteTint!==undefined)this.setTint(this.definition.spriteTint);} });
    if (this.hp <= 0) (this.scene as WorldScene).handleEnemyDefeated(this);
  }
  createRetreatVisual(){this.dragonCombat?.createRetreatVisual();}

  updatePresentation(playerX: number, playerY: number, paused = false) {
    if(!this.active)return;
    this.dragonCombat?.pause(paused);
    if(paused)this.leapTween?.pause();else if(this.leapTween?.isPaused())this.leapTween.resume();
    if (paused) this.anims.pause(); else if (this.anims.isPaused) this.anims.resume();
    const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    const visible = this.hp > 0 && distance < 700 && (Boolean(this.definition.boss) || this.hp < this.definition.hp || distance < this.definition.aggroRange);
    const width = this.definition.boss ? 48 : this.definition.id === 'road-bandit' ? 35 : 30;
    const scene=this.scene as WorldScene;
    const eligible=!paused&&scene.targeting.eligible(this)&&scene.cameras.main.worldView.contains(this.x,this.y);
    const selected=eligible&&scene.targeting.selected===this;
    const model=this.dragonCombat?.visual??(this.leapVisual?.active?this.leapVisual:this);
    const bounds=(model.frame.customData as {visibleBounds?:{top:number;height:number}}).visibleBounds;
    const texture=this.texture.key as ArtTextureKey,sheet=ART_BY_KEY[texture];
    const visualHeight=artFrameSize(texture,Number(this.frame.name)).height*this.scaleY*sheet.density;
    const modelSheet=ART_BY_KEY[model.texture.key as keyof typeof ART_BY_KEY];
    const top=bounds?model.y+(bounds.top-model.originY*modelSheet.frameHeight)*model.scaleY*modelSheet.density-16
      :this.y-visualHeight-16;
    this.targetIndicator.clear().setDepth(this.y+90).setVisible(eligible);
    if(eligible){const size=selected?7:this.definition.boss?5:3,color=selected?0xffdf75:0xc18770;
      this.targetIndicator.lineStyle(selected?2:1,0x26180e,.9).fillStyle(color,selected?1:.7);
      this.targetIndicator.fillTriangle(this.x-size,top-36,this.x+size,top-36,this.x,top-26);
      if(selected){const ground=groundMarkerPosition(this);
        this.targetIndicator.lineStyle(2,color,.9).strokeEllipse(ground.x,ground.y,
          Math.max(this.definition.boss?56:34,(this.definition.bodyRadius??0)*2.2),Math.max(10,(this.definition.bodyRadius??0)*.45));}
    }
    this.healthBar.clear().setDepth(this.y + 85).setVisible(visible&&eligible);
    this.nameLabel.setPosition(this.x, top - 4).setDepth(this.y + 85).setVisible(visible&&eligible);
    if (visible&&eligible) {
      this.healthBar.fillStyle(0x16110c,.85).fillRoundedRect(this.x - width / 2 - 2, top - 1, width + 4, 6, 2);
      this.healthBar.fillStyle(this.definition.boss ? 0xd89557 : 0xbb6550,1)
        .fillRect(this.x - width / 2, top + 1, width * Math.max(0,this.hp / this.definition.hp), 3);
    }
  }
}

// LEIGHNERON_WOLF_PACKS_ROAD_BANDITS_V1

// LEIGHNERON_WOLF_FLANKING_AI_V1
