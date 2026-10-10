import Phaser from 'phaser';
import type { NpcDefinition, Vec2 } from '../types';
import { ART_BY_KEY, actorScaleForHeight, artScale, type ArtTextureKey } from '../../data/art';
import { NPC_IDLE_ART } from '../../data/npcIdleArt';
import { directionFrame } from '../../data/animationPacks';
import {actorTravelDirection,type ActorDirection} from '../../data/directionalEnemyArt';
import { npcApparentHeight } from '../../data/progression';
import { patrolDestination } from '../systems/npcPatrol';
import { seededRandom } from '../../utils/seededRandom';
import type { WorldScene } from '../scenes/WorldScene';
import { TOWN_BY_ID } from '../../data/towns';
import { npcStreetRoute, formationPosition } from '../systems/npcRoutes';
import { useGameStore } from '../../store/gameStore';
import { approachVelocity, strideRate } from '../systems/locomotion';
import { MARCH_SPEED } from '../../data/capitalResidents';
import {guardMarchTexture} from '../../data/guardMarchArt';
import {guardMarchScale} from '../systems/GuardMarchArt';

const NPC_WALK_SPEED = 44;
type WalkDirection = ActorDirection;

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly definition: NpcDefinition;
  readonly nameLabel: Phaser.GameObjects.Text;
  readonly home: Vec2;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly labelY: number;
  private readonly rng: () => number;
  private target: Vec2 | null = null;
  private returningHome = false;
  private nextPatrolAt = 0;
  private facing = new Phaser.Math.Vector2(0, 1);
  // Walking is directional, but every idle pose faces downward.
  private walkDirection: WalkDirection = 'down';
  private readonly walkTexture:ArtTextureKey;
  private readonly walkArtTexture:ArtTextureKey;
  private readonly walkScale:number;
  private readonly idleArt:typeof NPC_IDLE_ART[number]|undefined;
  private readonly schedule:NpcDefinition['schedule'];
  private routeCheckMs=120;
  private route:Vec2[]=[];
  private routineKey='';
  private routineAnchor:Vec2;
  private stalledMs=0;
  private previousPosition:Vec2;
  private escortGoal:Vec2|null=null;

  constructor(scene: WorldScene, definition: NpcDefinition, x: number, y: number, home: Vec2) {
    const sourceFamily=definition.spriteTexture??'npcs';
    const family=sourceFamily==='npc_royal_guard'?'npc_guard':sourceFamily;
    const texture = guardMarchTexture(family)??family;
    const apparentHeight = npcApparentHeight(family);
    const idleArt=NPC_IDLE_ART.find(entry=>entry.walk===family);
    if(family==='npc_guard'&&!idleArt)throw new Error(`Missing Trandum guard idle art for ${definition.id}`);
    super(scene, x, y, texture, definition.spriteFrame);
    this.definition = definition;
    this.walkTexture = family;
    this.walkArtTexture=texture;
    this.walkScale=family==='npc_guard'?guardMarchScale(scene,texture,idleArt!):
      actorScaleForHeight(texture,definition.spriteFrame,apparentHeight);
    this.idleArt=idleArt;
    this.schedule=[...definition.schedule].sort((a,b)=>a.startHour-b.startHour);
    this.home = { ...home };
    this.routineAnchor={...home};this.previousPosition={x,y};
    this.rng = seededRandom(`npc-patrol:${definition.id}`);
    this.nextPatrolAt = scene.time.now + 1200 + this.rng() * 1800;
    this.labelY = -(apparentHeight + 12);
    scene.add.existing(this);
    const sheet = ART_BY_KEY[texture], modelScale = this.walkScale;
    this.setScale(modelScale).setOrigin(.5,1 - 2 / sheet.frameHeight);
    scene.physics.add.existing(this);
    const scaleX = this.scaleX, scaleY = this.scaleY, density = ART_BY_KEY[texture].density;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(36 / scaleX, 24 / scaleY)
      .setOffset(sheet.frameWidth * density / 2 - 18 / scaleX, this.originY * sheet.frameHeight * density - 24 / scaleY)
      .setCollideWorldBounds(true).setImmovable(true);
    body.pushable = false;
    body.updateFromGameObject();
    this.setDepth(y);
    this.setInteractive({ useHandCursor: true });
    this.setName(definition.name);
    this.nameLabel = scene.add.text(x, y + this.labelY, definition.name, {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#f6edd7', stroke: '#17130e', strokeThickness: 3,
      backgroundColor: '#201c16bb', padding: { x: 4, y: 2 },
    }).setResolution(2).setOrigin(.5,1).setDepth(y + 80).setName(`npc-name:${definition.id}`);
    this.titleLabel = scene.add.text(x, y + this.labelY + 2, definition.title, {
      fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#d2c3a5', stroke: '#17130e', strokeThickness: 2,
    }).setResolution(2).setOrigin(.5,0).setDepth(y + 80).setName(`npc-title:${definition.id}`);
    this.once('destroy', () => { this.nameLabel.destroy(); this.titleLabel.destroy(); });
  }

  beginEscort(goal:Vec2) {this.escortGoal={...goal};this.route=[];this.target=null;}
  get escorting(){return this.escortGoal!==null;}
  storyRest(){(this.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);this.playDirection(this.facing.x,this.facing.y,false);}
  advanceCinematic(delta:number) {
    const body=this.body as Phaser.Physics.Arcade.Body,step=Math.min(delta,80)/1000;
    const point={x:this.x+body.velocity.x*step,y:this.y+body.velocity.y*step};
    if((this.scene as WorldScene).canNpcVisit(this,point)){
      this.setPosition(point.x,point.y);body.updateFromGameObject();
    }else body.setVelocity(0,0);
  }
  updatePatrol(time: number, delta: number) {
    const scene = this.scene as WorldScene;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if(!this.mayPatrol&&!this.escortGoal){
      body.setVelocity(0,0);this.target=null;this.route=[];this.previousPosition={x:this.x,y:this.y};
      this.playDirection(0,0,false);this.setDepth(this.y);return;
    }
    const town=TOWN_BY_ID[this.definition.townId];
    this.routeCheckMs+=Math.min(delta,100);
    const toLocal=(p:Vec2)=>({x:p.x-town.world.x,y:p.y-town.world.y});
    const toWorld=(p:Vec2)=>({x:p.x+town.world.x,y:p.y+town.world.y});
    if(this.definition.formation && scene.getWorldHour()>=6 && scene.getWorldHour()<20) {
      const goal=toWorld(formationPosition(scene.activePlayMs+180,this.definition.formation.rank));
      // Common deterministic phase keeps the file together across streaming.
      // Never snap through a wall if a future layout edit invalidates its route.
      if(scene.canNpcVisit(this,goal) && Math.hypot(this.x-goal.x,this.y-goal.y)<160) {
        const dx=goal.x-this.x,dy=goal.y-this.y;
        if(Math.hypot(dx,dy)>.2)this.facing.set(dx,dy).normalize();
        const speed=Math.min(MARCH_SPEED*1.35,Math.hypot(dx,dy)*5);
        body.setVelocity(approachVelocity(body.velocity.x,this.facing.x*speed,delta,80),approachVelocity(body.velocity.y,this.facing.y*speed,delta,80));
        this.playDirection(this.facing.x,this.facing.y,body.velocity.length()>3);this.setDepth(this.y);return;
      }
    }
    if(this.escortGoal) {
      if(Math.hypot(this.x-scene.player.x,this.y-scene.player.y)>210){body.setVelocity(0,0);this.playDirection(this.facing.x,this.facing.y,false);return;}
      if(Math.hypot(this.x-this.escortGoal.x,this.y-this.escortGoal.y)<28){
        this.escortGoal=null;this.route=[];this.target=null;this.routineAnchor={x:this.x,y:this.y};
        useGameStore.getState().progressQuest('escort',this.definition.id);scene.notify(`${this.definition.name} reaches the kitchen safely.`);
      }else if(!this.target&&!this.route.length)this.route=npcStreetRoute(this.definition.townId,toLocal(this),toLocal(this.escortGoal),(a,b)=>scene.canNpcVisit(toWorld(a),toWorld(b))).map(toWorld);
    } else {
      const hour=scene.getWorldHour();
      let routine=this.schedule.at(-1);
      for(let i=this.schedule.length-1;i>=0;i--)if(this.schedule[i].startHour<=hour){routine=this.schedule[i];break;}
      const story=useGameStore.getState();
      const returned=this.definition.id==='tovin-reed'&&(story.quests['shadows-highmere']?.objectiveProgress.escort??0)>=1;
      const council=story.storyFlags['relief-joint-council']&&['maela-quill','nella-harrow'].includes(this.definition.id);
      const period=(routine?.startHour??0)+':'+returned+':'+Boolean(council);
      if(period!==this.routineKey) {
        this.routineKey=period;const location=returned?{x:-1280,y:1609}:council?{x:this.definition.id==='maela-quill'?160:-180,y:140}:routine?.location??this.definition.worldOffset;
        this.routineAnchor=toWorld(location);this.target=null;this.returningHome=false;
        this.route=npcStreetRoute(this.definition.townId,toLocal(this),location,(a,b)=>scene.canNpcVisit(toWorld(a),toWorld(b))).map(toWorld);
      }
    }
    if(!this.target&&this.route.length)this.target=this.route.shift()!;
    if(this.target) {
      const moved=Math.hypot(this.x-this.previousPosition.x,this.y-this.previousPosition.y);
      this.stalledMs=moved<.1?this.stalledMs+Math.min(delta,250):0;
      const length=Math.hypot(this.target.x-this.x,this.target.y-this.y),step=Math.min(1,24/Math.max(1,length));
      const ahead={x:this.x+(this.target.x-this.x)*step,y:this.y+(this.target.y-this.y)*step};
      const checkRoute=this.routeCheckMs>=120;if(checkRoute)this.routeCheckMs=0;
      if(this.stalledMs>2000 || checkRoute&&!scene.canNpcVisit(this,ahead)){this.target=null;this.route=[];this.nextPatrolAt=time+1500;this.stalledMs=0;}
    }
    this.previousPosition.x=this.x;this.previousPosition.y=this.y;
    if (!this.target && time >= this.nextPatrolAt) {
      if(this.escortGoal)return;
      if (this.returningHome) {
        if (Phaser.Math.Distance.Between(this.x, this.y, this.routineAnchor.x, this.routineAnchor.y) <= 14) {
          this.returningHome = false;
          this.nextPatrolAt = time + 1400 + this.rng() * 2400;
        } else if (scene.canNpcVisit({ x: this.x, y: this.y }, this.routineAnchor)) {
          this.target = this.routineAnchor;
        } else {
          this.returningHome = false;
          this.nextPatrolAt = time + 1400;
        }
      } else {
        const destination = patrolDestination(this.routineAnchor, { x: this.x, y: this.y }, this.definition.patrolRadius ?? 110, this.rng,
          (from, to) => scene.canNpcVisit(from, to));
        if (destination) this.target = destination;
        else this.nextPatrolAt = time + 1600;
      }
    }

    if (!this.target) {
      body.setVelocity(0, 0);
      this.playDirection(this.facing.x, this.facing.y, false);
      this.setDepth(this.y);
      return;
    }

    // Advance nearby route corners in this update, rather than holding the
    // previous velocity and facing for a frame at each waypoint.
    while (this.route.length && Math.hypot(this.target.x-this.x,this.target.y-this.y) <= 6) {
      this.target = this.route.shift()!;
    }
    const dx = this.target.x - this.x, dy = this.target.y - this.y;
    if (Math.hypot(dx, dy) <= 3) {
      body.setVelocity(0, 0);
      this.target = null;
      if (!this.returningHome && !this.route.length) this.returningHome = true;
      this.nextPatrolAt = this.route.length ? time : time + 1000 + this.rng() * 1800;
      this.playDirection(this.facing.x, this.facing.y, false);
      return;
    }
    this.facing.set(dx, dy).normalize();
    const speed=Math.min(NPC_WALK_SPEED,Math.hypot(dx,dy)*4);
    body.setVelocity(approachVelocity(body.velocity.x,this.facing.x*speed,delta,90),approachVelocity(body.velocity.y,this.facing.y*speed,delta,90));
    this.playDirection(this.facing.x, this.facing.y, true);
    this.setDepth(this.y);
  }

  private get mayPatrol(){
    return this.definition.spriteTexture==='npc_royal_guard'
      ||this.walkTexture==='npc_guard'&&TOWN_BY_ID[this.definition.townId].regionId==='trandum';
  }

  updatePresentation(playerX: number, playerY: number, questTarget: boolean, paused = false) {
    const distance = Phaser.Math.Distance.Between(playerX,playerY,this.x,this.y);
    if (distance > 1 && distance <= 72 && !this.escorting && !this.definition.formation) {
      this.target = null;
      this.returningHome = true;
      this.nextPatrolAt = Math.max(this.nextPatrolAt, this.scene.time.now + 1500);
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.playDirection(this.facing.x, this.facing.y, false);
    }
    if (paused) this.anims.pause(); else if (this.anims.isPaused) this.anims.resume();
    this.nameLabel.setPosition(this.x, this.y + this.labelY).setDepth(this.y + 80).setColor(questTarget ? '#ffe193' : '#f6edd7');
    this.titleLabel.setPosition(this.x, this.y + this.labelY + 2).setDepth(this.y + 80)
      .setVisible(distance < 260);
  }

  private playDirection(_x: number, _y: number, walking: boolean) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = body.velocity.length();
    walking = walking && speed >= 3 && (Boolean(this.definition.formation) || this.stalledMs < 200);
    body.setImmovable(!walking);
    body.pushable=walking;
    if(walking)this.walkDirection=actorTravelDirection(body.velocity.x,body.velocity.y,this.walkDirection);
    else this.walkDirection='down';
    const direction: WalkDirection = this.walkDirection;
    const idle = this.idleArt;
    if (!walking && idle) {
      this.presentTexture(idle.key,artScale(idle.key));
      this.anims.play(`${this.walkTexture}-idle`,true);
      this.anims.timeScale=1;
      return;
    }
    this.presentTexture(this.walkArtTexture,this.walkScale);
    const animation = `${this.walkTexture}-${direction}`;
    if (walking && this.scene.anims.exists(animation)) {
      const previousKey = this.anims.currentAnim?.key;
      const preserveStride = this.anims.isPlaying && previousKey !== animation &&
        previousKey?.startsWith(`${this.walkTexture}-`) && !previousKey.includes('-idle');
      const progress = preserveStride ? this.anims.getProgress() : 0;
      this.anims.play(animation,true);
      if (preserveStride) this.anims.setProgress(progress);
      this.anims.timeScale=strideRate(speed,NPC_WALK_SPEED);
    }
    else {
      this.anims.stop();
      const frame = ART_BY_KEY[this.walkArtTexture].columns === 24
        ? directionFrame(direction==='left'?-1:direction==='right'?1:0,direction==='up'?-1:direction==='down'?1:0) : this.definition.spriteFrame;
      this.setFrame(frame).setFlipX(false);
    }
  }

  private presentTexture(texture:ArtTextureKey,scale:number) {
    if (this.texture.key === texture) return;
    this.anims.stop();
    const sheet = ART_BY_KEY[texture];
    // Visible ground, physics feet and sort depth all share world y, including
    // taller pike/idle canvases. The body occupies y-22..y, not y-2..y+20.
    const originY = 1 - 2 / sheet.frameHeight;
    this.setTexture(texture,0).setScale(scale).setOrigin(.5,originY).setFlipX(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18 / scale,22 / scale).setOffset(sheet.frameWidth * sheet.density / 2 - 9 / scale,
      originY * sheet.frameHeight * sheet.density - 22 / scale);
    body.updateFromGameObject();
  }
}
