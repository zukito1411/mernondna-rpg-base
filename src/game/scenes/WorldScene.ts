import Phaser from 'phaser';
import { BOSSES,BOSS_BY_ID, ENEMIES, ENEMY_BY_ID } from '../../data/enemies';
import { LEIGNERON } from '../../data/player';
import { NPCS, NPC_BY_ID } from '../../data/npcs';
import { TOWN_BY_ID } from '../../data/towns';
import { TOWN_SHRINE_BY_ID } from '../../data/townShrines';
import { PORT_BY_ID } from '../../data/ports';
import { WORLD_CONTENT, initialContentState } from '../../data/content';
import { WEAPON_BY_ID } from '../../data/weapons';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../data/world';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';
import { saveGame, setSaveSnapshotProvider } from '../../utils/save';
import { mobileInput } from '../input';
import { Enemy } from '../entities/Enemy';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import type { ContentDefinition, ContentState, EnemyDefinition, InteractableContentDefinition, NavigationMarker, QuestTarget, RegionId, WeaponDefinition, WorldPropTexture } from '../types';
import { ChunkManager } from '../systems/ChunkManager';
import { DayNightSystem } from '../systems/DayNightSystem';
import { EventDirector, type EventDirectorHost } from '../systems/EventDirector';
import { WorldGenerator } from '../systems/WorldGenerator';
import { ContentChunkManager } from '../systems/ContentChunkManager';
import { resolveQuestTarget, questBearing } from '../systems/questNavigation';
import { artScale, artFrameSize, worldPropOrigin } from '../../data/art';
import { repairCreaturePlacements } from '../systems/creaturePlacement';
import { progressionStats } from '../../data/progression';
import { localSettlementTravelEnabled } from '../../utils/localSettlementTravel';
import type { ActiveSkillDefinition } from '../../data/activeSkills';
import { propFoundation, spriteBounds, overlaps } from '../../data/settlementGeometry';
import { objectiveIsCurrent } from '../systems/storyProgress';
import { fortificationBlocksPath, fortificationBlocksPoint } from '../../data/fortifications';
import { CinematicDirector } from '../systems/CinematicDirector';
import { formationPosition } from '../systems/npcRoutes';
import { QUEST_BY_ID } from '../../data/quests';
import { TargetingSystem } from '../systems/TargetingSystem';
import {WeatherSystem} from '../systems/WeatherSystem';
import {TreeSwaySystem} from '../systems/TreeSwaySystem';
import {WaterSurfaceSystem} from '../systems/WaterSurfaceSystem';
import {GroundShadowSystem} from '../systems/GroundShadowSystem';
import {WorldTrafficSystem} from '../systems/WorldTrafficSystem';
import {ShipPassageSystem} from '../systems/ShipPassageSystem';
import {EnemySoundSystem,type EnemySoundCue} from '../systems/EnemySoundSystem';
import {WorldSpriteSystem,WORLD_SPRITE_OWNER} from '../systems/WorldSpriteSystem';
import {VolcanicTremor} from '../systems/VolcanicTremor';
import {renderDensity} from '../systems/renderSizing';
import {groundMarkerPosition} from '../systems/groundMarkers';
import {inDragonArena,DRAGON_BOSS_ID} from '../../data/dragonLair';
import {isTreeArt,treeFootprint} from '../../data/treeArt';
import {WILDERNESS_SITES} from '../../data/wildernessSites';
import type { Vec2 } from '../types';

type ContentActor = Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;
const foregroundBuildings=WORLD_CONTENT.filter(d=>d.kind==='settlement-prop');

export class WorldScene extends Phaser.Scene implements EventDirectorHost {
  player!: Player;
  targeting!:TargetingSystem;
  private readonly worldGenerator = new WorldGenerator();
  private chunkManager!: ChunkManager;
  private dayNight!: DayNightSystem;
  private weather!:WeatherSystem;
  private treeSway!:TreeSwaySystem;
  private waterSurface!:WaterSurfaceSystem;
  private groundShadows!:GroundShadowSystem;
  private traffic!:WorldTrafficSystem;
  private passage!:ShipPassageSystem;
  private enemySounds!:EnemySoundSystem;
  private worldSprites!:WorldSpriteSystem;
  private readonly volcanicTremor=new VolcanicTremor();
  private eventDirector!: EventDirector;
  private readonly enemies = new Set<Enemy>();
  private readonly npcs: Npc[] = [];
  private buildings!: Phaser.Physics.Arcade.StaticGroup;
  private treeBodies!: Phaser.Physics.Arcade.StaticGroup;
  private npcBodies!: Phaser.Physics.Arcade.Group;
  private creatureBodies!: Phaser.Physics.Arcade.Group;
  private contentManager!: ContentChunkManager<ContentActor>;
  private readonly interactables = new Map<string, { definition: InteractableContentDefinition; actor: ContentActor }>();
  private lastSafe = { x: LEIGNERON.spawn.x, y: LEIGNERON.spawn.y };
  private hudAccumulator = 0;
  private spawnAccumulator = 0;
  private spawnAttempts = 0;
  private focused = true;
  private wasBlocked = false;
  private readonly panelActions = new Set<'map' | 'inventory' | 'character' | 'pause' | 'dialogue' | 'journal'>();
  private readonly heldPanelKeys = new Set<string>();
  private questGuide!: Phaser.GameObjects.Graphics;
  private questTarget: QuestTarget | null = null;
  activePlayMs=0;
  private cinematicDirector!:CinematicDirector;
  private reliefWatchMs=0;
  private nextImpactSoundAt=0;
  getWorldHour(){return this.dayNight.getHour();}
  getCombatEnemies(){return [...this.enemies];}
  playEnemyVocal(definition:EnemyDefinition,instanceId:string,cue:EnemySoundCue,x:number,y:number){
    if(!useGameStore.getState().weatherAudio||this.sound.locked)return;
    this.enemySounds.play(definition,instanceId,cue,x,y);
  }
  forgetEnemySound(instanceId:string){this.enemySounds.forget(instanceId);}
  playDragonSound(instanceId:string,cue:'roar'|'breath'|'flight',x:number,y:number,duration:number){this.enemySounds.playEffect(instanceId,cue,x,y,duration);}
  stopDragonSound(instanceId:string){this.enemySounds.stopEffect(instanceId);}
  canSeeEnemy(enemy:Enemy){return this.dayNight.isIlluminated(enemy.x,enemy.y)||Math.hypot(enemy.x-this.player.x,enemy.y-this.player.y)<180;}
  safeSkillPosition(point:Vec2){return this.worldGenerator.isWalkable(point.x,point.y)&&!this.isBlockedByBuilding(point.x,point.y);}
  skillLanding(target:Vec2,range:number):Vec2 {
    const from={x:this.player.x,y:this.player.y};
    const candidates=[32,48,64].flatMap(radius=>Array.from({length:16},(_,i)=>({x:target.x+Math.cos(i*Math.PI/8)*radius,y:target.y+Math.sin(i*Math.PI/8)*radius})));
    candidates.sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));
    return candidates.find(p=>Math.hypot(p.x-from.x,p.y-from.y)<=range&&this.safeSkillPosition(p)&&this.canNpcVisit(from,p))??from;
  }
  applySkillDamage(enemy:Enemy,skill:ActiveSkillDefinition,multiplier:number,direction:Phaser.Math.Vector2) {
    if(!enemy.active||enemy.hp<=0)return;
    const progression=progressionStats(useGameStore.getState().attributes,useGameStore.getState().learnedSkills);
    enemy.takeDamage(Math.max(1,Math.round(this.getEquippedWeapon().damage*progression.damageMultiplier*multiplier)),direction);
  }
  streamCinematicView(x:number,y:number){this.chunkManager.update(x,y,Boolean(this.passage?.active));this.contentManager.update(x,y);this.dayNight.update(0,x,y);}
  storyActorPosition(id:string){const actor=this.contentManager.getActor('npc:'+id)??this.contentManager.getState('npc:'+id);return actor?{x:actor.x,y:actor.y-35}:undefined;}
  prepareStoryActors(){for(const npc of this.npcs)if(!npc.definition.formation)npc.storyRest();}
  recordTraining(targetId:string) {
    const target=this.contentManager.getActor('training:highmere-target');
    if(target&&Math.hypot(this.player.x-target.x,this.player.y-target.y)<240
      && this.hasClearPath(this.player.x,this.player.y,target.x,target.y,target)) useGameStore.getState().progressQuest('train',targetId);
  }

  constructor() {
    super('world');
  }

  canNpcVisit(from: { x: number; y: number }, to: { x: number; y: number }) {
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(1, Math.ceil(distance / 24));
    for (let i = 0; i <= steps; i++) {
      const x = Phaser.Math.Linear(from.x, to.x, i / steps);
      const y = Phaser.Math.Linear(from.y, to.y, i / steps);
      if (!this.worldGenerator.isWalkable(x, y) || this.isBlockedByBuilding(x, y) || this.isNpcObscured(x,y)) return false;
    }
    return this.hasClearPath(from.x, from.y, to.x, to.y);
  }

  create() {
    useGameStore.getState().setBossEncounter(null);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.dayNight = new DayNightSystem(this);
    this.weather=new WeatherSystem(this,this.worldGenerator);
    this.treeSway=new TreeSwaySystem(this);
    this.waterSurface=new WaterSurfaceSystem(this,this.worldGenerator);
    this.groundShadows=new GroundShadowSystem(this);
    this.cinematicDirector=new CinematicDirector(this);
    this.activePlayMs=0;
    this.eventDirector = new EventDirector(this);
    this.buildings = this.physics.add.staticGroup();
    this.treeBodies = this.physics.add.staticGroup();
    this.worldSprites=new WorldSpriteSystem(this,this.treeBodies,this.groundShadows);
    this.traffic=new WorldTrafficSystem(this,this.worldGenerator,this.groundShadows);
    this.passage=new ShipPassageSystem(this,this.worldGenerator,this.traffic);
    this.enemySounds=new EnemySoundSystem(this);
    this.npcBodies = this.physics.add.group();
    this.creatureBodies = this.physics.add.group();
    this.chunkManager = new ChunkManager(this,this.worldGenerator,this.treeSway,this.dayNight,this.worldSprites);
    this.enemies.clear(); this.npcs.length = 0; this.interactables.clear();
    this.spawnAttempts = 0; this.spawnAccumulator = 0; this.hudAccumulator = 0;
    this.focused = true; this.wasBlocked = false;

    const state = useGameStore.getState();
    const nearSaved=[{x:state.worldX,y:state.worldY},...[128,256,512,1024,2048,4096,8192].flatMap(radius=>Array.from({length:24},(_,i)=>({x:state.worldX+Math.cos(i*Math.PI/12)*radius,y:state.worldY+Math.sin(i*Math.PI/12)*radius})))];
    const safeSaved=nearSaved.find(p=>this.worldGenerator.isWalkable(p.x,p.y))??LEIGNERON.spawn;
    const spawnX=safeSaved.x,spawnY=safeSaved.y;
    this.player = new Player(this, spawnX, spawnY);
    this.groundShadows.register(this.player);
    this.targeting=new TargetingSystem(this);
    this.lastSafe = { x: spawnX, y: spawnY };

    this.physics.add.collider(this.player, this.buildings);
    this.physics.add.collider(this.player, this.treeBodies);
    // People aren't immovable street barriers. Their patrols still avoid props.
    this.physics.add.collider(this.creatureBodies, this.buildings);
    this.physics.add.collider(this.creatureBodies, this.treeBodies);
    this.physics.add.collider(this.npcBodies, this.buildings);
    this.physics.add.collider(this.npcBodies, this.treeBodies);
    this.physics.add.collider(this.npcBodies, this.npcBodies);
    let logical = { ...state.worldContent, states: { ...state.worldContent.states } };
    for (const bossId of state.defeatedBosses) {
      if(BOSS_BY_ID[bossId]?.respawns)continue; // Victory history is not permanent dragon removal.
      const definition = WORLD_CONTENT.find(d => d.id === `boss:${bossId}`);
      if (definition) logical.states[definition.id] = { ...initialContentState(definition), hp: 0, defeated: true };
    }
    logical = repairCreaturePlacements(WORLD_CONTENT,logical,this.worldGenerator);
    this.contentManager = new ContentChunkManager(WORLD_CONTENT, logical, {
      initialState: initialContentState,
      canActivate: (definition, runtime) => definition.kind !== 'creature' || this.isEnemyTerritory(runtime.x,runtime.y)
        && (Boolean(definition.bossId) || this.enemies.size < 11),
      create: (definition, runtime) => this.createContentActor(definition, runtime),
      position: actor => actor,
      capture: (definition, actor) => ({ x: actor.x, y: actor.y,
        ...(definition.kind === 'creature' ? { hp: (actor as Enemy).hp } : {}),
      }),
      destroy: actor => this.destroyContentActor(actor),
    });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(false);
    this.updateCameraZoom();
    this.scale.on('resize', this.updateCameraZoom, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.game.events.on(Phaser.Core.Events.FOCUS, this.onFocus, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);
    setSaveSnapshotProvider(() => this.syncState());

    this.chunkManager.update(this.player.x, this.player.y);
    this.contentManager.update(this.player.x, this.player.y);
    // Layout updates can put a saved player inside a new foundation.
    // Repair position only, never health, stamina or story progress.
    if(this.isBlockedByBuilding(this.player.x,this.player.y)) {
      const candidates=[48,80,128,192,256,384,512].flatMap(radius=>Array.from({length:16},(_,i)=>({
        x:spawnX+Math.cos(i*Math.PI/8)*radius,y:spawnY+Math.sin(i*Math.PI/8)*radius,
      })));
      const safe=candidates.find(p=>this.worldGenerator.isWalkable(p.x,p.y)&&!this.isBlockedByBuilding(p.x,p.y))??LEIGNERON.spawn;
      (this.player.body as Phaser.Physics.Arcade.Body).reset(safe.x,safe.y);this.lastSafe={...safe};
      this.chunkManager.update(safe.x,safe.y);this.contentManager.update(safe.x,safe.y);
    }
    this.questGuide = this.add.graphics().setDepth(9100).setName('quest-direction-guide');
    this.updateNavigation();

    if (!this.input.keyboard) throw new Error('Keyboard input is unavailable.');
    for (const [action, key] of [['map', 'M'], ['inventory', 'I'], ['character', 'C'], ['pause', 'ESC'],['journal','J']] as const) {
      this.input.keyboard.addKey(key).setEmitOnRepeat(false).on('down', () => {
        this.panelActions.add(action);
      });
    }
    for (const key of ['E', 'SPACE']) this.input.keyboard.addKey(key).on('down', () => {
      if (useGameStore.getState().dialogue) this.panelActions.add('dialogue');
    });

    this.notify('Oakmere is open to explore. Follow the eastern road and speak with Edmund beyond the farms.');
    this.game.events.once(Phaser.Core.Events.POST_RENDER,()=>{
      if(this.sys.isActive())this.registry.set('worldReady',true);
    });
  }

  update(time: number, delta: number) {
    this.handlePanelHotkeys();
    const travelStore=useGameStore.getState();
    this.enemySounds.pause(!this.focused||Boolean(travelStore.panel||travelStore.dialogue||travelStore.cinematic||this.passage.active));
    if(travelStore.passageRequest){const from=travelStore.harborPortId,to=travelStore.passageRequest;travelStore.hydrate({passageRequest:null});if(from)this.passage.begin(from,to);}
    if(this.passage.active){
      const paused=!this.focused||Boolean(travelStore.panel);this.physics.world.pause();this.player.discardActions();
      this.dayNight.setFirefliesEnabled(false);
      this.passage.update(paused?0:delta);this.weather.update(paused?0:delta,this.cameras.main.midPoint.x,this.cameras.main.midPoint.y,paused);
      this.dayNight.update(paused?0:delta,this.cameras.main.midPoint.x,this.cameras.main.midPoint.y);
      this.waterSurface.update(paused?0:delta);this.traffic.update(paused?0:delta);this.groundShadows.update(paused?0:delta,this.dayNight.getHour(),this.weather.cloudCover,this.weather.windStrength);return;
    }
    if(this.cinematicDirector.active) {
      const paused=!this.focused;
      this.weather.update(paused?0:delta,this.player.x,this.player.y,paused);
      this.treeSway.update(this.focused?delta:0,this.weather.windStrength);
      this.waterSurface.update(this.focused?delta:0);
      this.traffic.update(0);
      this.groundShadows.update(paused?0:delta,this.dayNight.getHour(),this.weather.cloudCover,this.weather.windStrength);
      this.physics.world.pause();this.player.discardActions();
      if(this.focused){
        this.activePlayMs+=Math.min(delta,250);
        for(const npc of this.npcs)if(npc.definition.formation){npc.updatePatrol(time,delta);npc.advanceCinematic(delta);npc.updatePresentation(this.player.x,this.player.y,false);}
        this.cinematicDirector.update(delta);
      }
      const camera=this.cameras.main;
      this.dayNight.update(paused?0:delta,camera.midPoint.x,camera.midPoint.y);
      return;
    }
    const story=useGameStore.getState();
    if(this.focused&&!story.panel&&!story.dialogue) {
      const pending=story.pendingCinematic;
      if(pending){if(!this.cinematicDirector.start(pending))story.hydrate({pendingCinematic:story.cinematicQueue[0]??null,cinematicQueue:story.cinematicQueue.slice(1)});else return;}
      if(this.worldGenerator.getTownAt(this.player.x,this.player.y)?.id==='highmere'
        && !story.storyFlags['scene:highmere-arrival'] && this.cinematicDirector.start('highmere-arrival'))return;
    }
    this.handleShrineTravel();
    const uiBlocked = !this.focused || Boolean(useGameStore.getState().panel || useGameStore.getState().dialogue);
    this.volcanicTremor.update(delta,this.worldGenerator.getRegionAt(this.player.x,this.player.y)==='darkav',uiBlocked,
      ()=>this.cameras.main.shake(420,.0018));
    if (uiBlocked && !this.wasBlocked) this.player.resetInput();
    this.wasBlocked = uiBlocked;
    if (uiBlocked) this.physics.world.pause();
    else this.physics.world.resume();

    if (!uiBlocked) {
      this.activePlayMs+=Math.min(delta,250);
      this.targeting.update();
      this.player.updatePlayer(time, delta);
      const store=useGameStore.getState();
      if(objectiveIsCurrent(store.quests,'escort','tovin-reed')) {
        const witness=this.npcs.find(n=>n.definition.id==='tovin-reed');
        const kitchen=NPC_BY_ID['mairin-reed'],town=TOWN_BY_ID.highmere;
        if(witness&&!witness.escorting)witness.beginEscort({x:town.world.x+kitchen.worldOffset.x,y:town.world.y+kitchen.worldOffset.y});
      }
      for (const npc of this.npcs) if (npc.active) npc.updatePatrol(time,delta);
      for (const enemy of this.enemies) {
        if (enemy.active) enemy.updateEnemy(time,delta);
      }
      const body=this.player.body as Phaser.Physics.Arcade.Body;
      this.player.hp=this.player.recovery.update(delta,{
        hp:this.player.hp,maxHp:this.player.maxHp,inSettlement:Boolean(this.worldGenerator.getTownAt(this.player.x,this.player.y)),
        moving:body.velocity.lengthSq()>1,busy:this.player.skills.isCasting,
        threatened:[...this.enemies].some(e=>e.active&&e.hp>0&&Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<400),
      });
      const standard=this.contentManager.getActor('watch:relief-yard');
      if(objectiveIsCurrent(store.quests,'train','relief-watch')&&standard
        && Math.hypot(this.player.x-standard.x,this.player.y-standard.y)<100&&!this.player.skills.isCasting) {
        this.reliefWatchMs+=Math.min(delta,250);
        if(this.reliefWatchMs>=12000){store.progressQuest('train','relief-watch');this.notify('The storehouse is safe. Return to Captain Isabel.');}
      }else this.reliefWatchMs=0;
    } else {
      this.player.discardActions();
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      for (const enemy of this.enemies) {
        if (enemy.active) (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
      for (const npc of this.npcs) if (npc.active) (npc.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
    }

    this.enforceLandCollision();
    this.chunkManager.update(this.player.x, this.player.y);
    if (this.contentManager.update(this.player.x, this.player.y)) {
      useGameStore.getState().setContentWorld(this.contentManager.snapshot());
    }
    if (!uiBlocked) this.dayNight.update(delta, this.player.x, this.player.y);
    this.weather.update(uiBlocked?0:delta,this.player.x,this.player.y,uiBlocked);
    this.treeSway.update(uiBlocked?0:delta,this.weather.windStrength);
    this.waterSurface.update(uiBlocked?0:delta);
    this.traffic.update(uiBlocked?0:delta);
    this.groundShadows.update(uiBlocked?0:delta,this.dayNight.getHour(),this.weather.cloudCover,this.weather.windStrength);
    this.drawQuestGuide(uiBlocked);
    for (const enemy of this.enemies) enemy.updatePresentation(this.player.x, this.player.y,uiBlocked);

    const regionId = this.worldGenerator.getRegionAt(this.player.x, this.player.y);
    if (!uiBlocked) this.eventDirector.update(delta, regionId, this.dayNight.getHour(), this.player.x, this.player.y);

    if (!uiBlocked) this.spawnAccumulator += delta;
    if (this.spawnAccumulator > 11000 && !uiBlocked) {
      this.spawnAccumulator = 0;
      this.trySpawnAmbientEnemy(regionId);
    }

    this.hudAccumulator += delta;
    if (this.hudAccumulator > 180) {
      this.hudAccumulator = 0;
      this.dayNight.setFirefliesEnabled(['forest','meadow','wetland'].includes(this.worldGenerator.getBiomeAt(this.player.x,this.player.y)));
      const town = this.worldGenerator.getTownAt(this.player.x, this.player.y);
      if(town&&objectiveIsCurrent(useGameStore.getState().quests,'visit',town.id))useGameStore.getState().progressQuest('visit',town.id);
      useGameStore.getState().setWorldStatus(this.player.x, this.player.y, regionId, town?.id ?? null);
      useGameStore.getState().setVitals(this.player.hp, this.player.stamina);
      useGameStore.getState().setActiveSkillStatus(this.player.skills.snapshot());
      const boss = [...this.enemies]
        .filter(enemy => enemy.active && enemy.hp > 0 && enemy.definition.boss)
        .map(enemy => ({ enemy, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) }))
        .filter(entry => entry.distance < 760)
        .sort((a, b) => a.distance - b.distance)[0]?.enemy;
      useGameStore.getState().setBossEncounter(boss ? {
        id: boss.instanceId,
        name: boss.definition.boss ? BOSSES.find(entry => `boss:${entry.id}` === boss.instanceId)?.name ?? boss.definition.name : boss.definition.name,
        hp: Math.max(0, boss.hp),
        maxHp: boss.definition.hp,
      } : null);
      this.updateNavigation();
    }
  }

  getEquippedWeapon(): WeaponDefinition {
    return WEAPON_BY_ID[useGameStore.getState().weaponId] ?? WEAPON_BY_ID['roadwarden-sword'];
  }

  performPlayerAttack(player: Player, direction: Phaser.Math.Vector2, weapon: WeaponDefinition) {
    player.recovery.interrupt();
    const practice=this.contentManager.getActor('training:highmere-target');
    if(practice) {
      const offset=new Phaser.Math.Vector2(practice.x-player.x,practice.y-player.y);
      if(offset.length()<=weapon.reach+8&&direction.clone().normalize().dot(offset.normalize())>=.25
        && this.hasClearPath(player.x,player.y,practice.x,practice.y,practice)) {
        this.recordTraining('drill-sword');this.playEffect('hit',practice.x,practice.y);
      }
    }
    const facing = direction.clone().normalize();
    const progression = progressionStats(useGameStore.getState().attributes, useGameStore.getState().learnedSkills);

    for (const enemy of this.enemies) {
      if (!enemy.active||!enemy.canBeTargeted) continue;
      const toEnemy = new Phaser.Math.Vector2(enemy.x - player.x, enemy.y - player.y);
      const distance = toEnemy.length();
      if (distance > weapon.reach + (enemy.definition.boss ? 18 : 8)) continue;
      toEnemy.normalize();
      if (facing.dot(toEnemy) < 0.25) continue;
      if (!this.hasClearPath(player.x,player.y,enemy.x,enemy.y)) continue;
      enemy.takeDamage(Math.round(weapon.damage * progression.damageMultiplier), facing);
    }
  }

  performSkillHit(player:Player,direction:Phaser.Math.Vector2,skill:ActiveSkillDefinition,multiplier:number) {
    player.recovery.interrupt();
    this.recordTraining(skill.id);
    const progression = progressionStats(useGameStore.getState().attributes,useGameStore.getState().learnedSkills);
    const damage = Math.max(1,Math.round(this.getEquippedWeapon().damage * progression.damageMultiplier * multiplier));
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.hp <= 0 || !enemy.canBeTargeted) continue;
      const offset = new Phaser.Math.Vector2(enemy.x - player.x,enemy.y - player.y);
      if (offset.length() > skill.radius + (enemy.definition.boss ? 18 : 8)) continue;
      const outward = offset.lengthSq() > 0 ? offset.normalize() : direction.clone();
      // A -1 cone is a full circle: skip the facing check entirely so rear
      // targets are included even if normalization introduces rounding error.
      if (skill.coneDot > -1 && direction.dot(outward) < skill.coneDot) continue;
      if (!this.hasClearPath(player.x,player.y,enemy.x,enemy.y)) continue;
      enemy.takeDamage(damage,outward);
    }
  }

  playAudio(key:string,volume=.3,rate=1) {
    if(!useGameStore.getState().weatherAudio||this.sound.locked||!this.cache.audio.exists(key))return;
    this.sound.play(key,{volume,rate});
  }

  playEnemyAudio(key:string,volume:number,rate:number,pan:number){
    if(!useGameStore.getState().weatherAudio||this.sound.locked||!this.cache.audio.exists(key))return;
    this.sound.play(key,{volume,rate,pan});
  }

  playEnemySoundAt(key:string,x:number,y:number,volume:number,rate=1){
    const distance=Math.hypot(this.player.x-x,this.player.y-y),audibleRadius=1500;
    if(distance>=audibleRadius)return;
    const camera=this.cameras.main,halfWidth=camera.width/(camera.zoom*2);
    const attenuation=Math.pow(1-distance/audibleRadius,1.35);
    const pan=Phaser.Math.Clamp((x-camera.midPoint.x)/Math.max(1,halfWidth),-1,1);
    this.playEnemyAudio(key,volume*attenuation,rate,pan);
  }

  playEnemyAttackFoley(definition:EnemyDefinition,x:number,y:number,phase:'windup'|'impact'){
    if(phase==='windup'&&(definition.id==='road-bandit'||definition.id==='bandit-captain'||definition.id==='salt-king'))
      this.playAudio('sfx-sword-whoosh',.2,Phaser.Math.FloatBetween(.9,1.08));
    if(phase==='impact'&&Math.hypot(this.player.x-x,this.player.y-y)<360)
      this.playAudio(definition.combatStyle==='troll'||definition.combatStyle==='dragon'
        ?'sfx-impact-heavy-1':'sfx-impact-2',.24,Phaser.Math.FloatBetween(.94,1.06));
  }

  playSwordSwing() {
    this.playAudio('sfx-sword-slash',.86,Phaser.Math.FloatBetween(.9,1.08));
  }

  playSkillSound(skillId:ActiveSkillDefinition['id'], phase:'cast'|'impact'|'swing') {
    if (skillId === 'azure-cleave') {
      const cast = phase === 'cast';
      this.playAudio(cast ? 'sfx-sword-slash' : 'sfx-energy-impact', cast ? .88 : .82, cast ? .78 : 1);
    } else if (skillId === 'skyfall-slam') {
      const cast = phase === 'cast';
      if(cast)this.playAudio('sfx-sword-slash',.9,.72);
      else this.playAudio('sfx-heavy-slam',1,.82);
    } else if (skillId === 'crown-rally' && phase === 'cast') {
      this.playAudio('sfx-heal-bell', .28, .9);
    } else if (skillId === 'crescent-flurry') {
      if(phase==='swing'){
        this.playAudio('sfx-sword-slash',.72,Phaser.Math.FloatBetween(1.04,1.24));
      }else if(phase==='cast'){
        this.playAudio('sfx-sword-slash',.76,1.08);
      }else this.playAudio('sfx-energy-impact',.7,Phaser.Math.FloatBetween(1.02,1.18));
    }
  }

  playFootstep(x:number,y:number,sprinting:boolean) {
    const surface=this.worldGenerator.getFootstepSurface(x,y);
    const variation=Phaser.Math.Between(1,3);
    this.playAudio(`sfx-footstep-${surface}-${variation}`,sprinting ? .56 : .42);
  }

  private playCombatImpact(volume:number) {
    if(this.time.now<this.nextImpactSoundAt)return;
    this.nextImpactSoundAt=this.time.now+110;
    this.playAudio('sfx-sword-flesh-impact',Math.min(1,volume*2.1),.96);
  }

  tryInteract(x: number, y: number) {
    if (useGameStore.getState().panel || useGameStore.getState().dialogue) return;
    let nearest: Npc | null = null;
    let nearestDistance = 72;
    for (const npc of this.npcs) {
      const distance = Phaser.Math.Distance.Between(x, y, npc.x, npc.y);
      if (distance < nearestDistance && this.hasClearPath(x, y, npc.x, npc.y)) {
        nearest = npc;
        nearestDistance = distance;
      }
    }
    if (nearest) {
      useGameStore.getState().startDialogue(nearest.definition.id);
      return;
    }
    let target: { definition: InteractableContentDefinition; actor: ContentActor } | undefined;
    for (const entry of this.interactables.values()) {
      const point=entry.definition.portId?PORT_BY_ID[entry.definition.portId].landing:entry.actor;
      const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (distance < nearestDistance && this.hasClearPath(x, y, point.x, point.y, entry.actor)) {
        nearestDistance = distance; target = entry;
      }
    }
    if (target) { this.useInteractable(target.definition, target.actor); return; }
    this.notify('Nothing nearby needs your attention.');
  }

  spawnEnemy(enemyId: string, x: number, y: number, eventSpawn = false) {
    const definition = ENEMY_BY_ID[enemyId];
    if (!definition || definition.boss || this.enemies.size >= 12 || this.contentManager.getSpawnCount() >= 512
      ||inDragonArena(x,y,240)
      || !this.canEnemyOccupy(x, y)) return false;
    this.contentManager.addSpawn(enemyId, { x, y }, eventSpawn);
    this.contentManager.update(this.player.x, this.player.y);
    useGameStore.getState().setContentWorld(this.contentManager.snapshot());
    return true;
  }

  damagePlayer(amount: number) {
    this.player.takeDamage(amount);
  }

  playEffect(kind: 'fortification' | 'hit' | 'heal' | 'slash' | 'teleport', x: number, y: number, direction?: Phaser.Math.Vector2) {
    const texture = ({
      fortification:'effect_fortification', hit:'effect_hit', heal:'effect_heal',
      slash:'effect_slash', teleport:'effect_teleport',
    } as const)[kind];
    const animation = `effect-${kind}`;
    const effect = this.add.sprite(x, y, texture, 0).setOrigin(.5)
      .setScale(artScale(texture) * (kind === 'slash' || kind === 'teleport' ? 1.35 : 1))
      .setDepth(y + 1).setName(`combat-effect:${kind}`);
    if (direction) effect.setRotation(Math.atan2(direction.y, direction.x) - Math.PI / 4);
    if(kind==='hit')this.playCombatImpact(.42);
    else if(kind==='heal')this.playAudio('sfx-heal-bell',.2);
    effect.play(animation);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => effect.destroy());
  }

  handleEnemyDefeated(enemy: Enemy) {
    const definition = enemy.definition;
    const rng = seededRandom(`${enemy.instanceId}:loot`);
    const gold = definition.goldMin + Math.floor(rng() * (definition.goldMax - definition.goldMin + 1));
    const bossId = enemy.instanceId.startsWith('boss:') ? enemy.instanceId.slice(5) : undefined;
    const boss=bossId?BOSS_BY_ID[bossId]:undefined;
    if(boss?.respawns)enemy.createRetreatVisual();else enemy.createDeathVisual();
    this.contentManager.patchState(enemy.instanceId, { hp: 0, defeated: true,
      ...(boss?.respawns&&boss.respawnDelayMs?{respawnAt:Date.now()+boss.respawnDelayMs}:{}),
    });
    useGameStore.getState().recordEnemyDefeat(definition.id, definition.xp, gold, bossId, this.contentManager.snapshot());

    if (enemy.instanceId.startsWith('boss:')) {
      useGameStore.getState().setBossEncounter(null);
      this.notify(boss?.respawns?`${definition.name} takes flight! He returns to his lair in 30 minutes.`
        :`${definition.name} defeated. The world state remembers this.`);
    }
    // Persist the retreat deadline and reward together; a streamed-away dragon
    // cannot return early, and quest completion remains separate from cooldown.
    if(boss?.respawns)saveGame();
  }

  respawnPlayer() {
    const home = TOWN_BY_ID[LEIGNERON.homeTownId].world;
    useGameStore.getState().showToast('Leigneron collapses and wakes in Oakmere.');
    this.player.restoreAt(home.x, home.y + 80);
    this.playEffect('teleport', this.player.x, this.player.y);
    this.lastSafe = { x: this.player.x, y: this.player.y };
  }

  notify(message: string) {
    useGameStore.getState().showToast(message);
  }
  landFromPassage(point:Vec2){
    this.chunkManager.update(point.x,point.y);this.contentManager.update(point.x,point.y);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(point.x,point.y);this.player.setVisible(true);this.player.resetInput();this.lastSafe={...point};
    this.cameras.main.centerOn(point.x,point.y).startFollow(this.player,true,.12,.12);this.physics.world.resume();this.syncState();this.updateNavigation();saveGame();
  }

  countEnemies() {
    return this.enemies.size;
  }

  isWalkable(x: number, y: number) { return this.worldGenerator.isWalkable(x, y); }
  isEnemyTerritory(x: number, y: number) { return this.worldGenerator.canCreatureOccupy(x,y)
    &&!(useGameStore.getState().storyFlags['oakmere-road-open']&&Math.hypot(x-TOWN_BY_ID.oakmere.world.x,y-TOWN_BY_ID.oakmere.world.y)<5000&&this.worldGenerator.isRoad(x,y,30))
    &&!WILDERNESS_SITES.some(s=>(s.style==='camp'||s.id==='royal-waystone'||s.id==='greenward-ruin')&&Math.hypot(s.world.x-x,s.world.y-y)<300); }
  canEnemyOccupy(x: number, y: number) { return this.isEnemyTerritory(x,y) && !this.isBlockedByBuilding(x,y); }

  private isBlockedByBuilding(x: number, y: number) {
    if(fortificationBlocksPoint(x,y,20))return true;
    const feet={left:x-11,right:x+11,top:y-24,bottom:y+2};
    return [...this.buildings.getChildren(), ...this.treeBodies.getChildren()].some(object => {
      const body = (object as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return body?.enable&&overlaps(feet,{left:body.left,right:body.right,top:body.top,bottom:body.bottom});
    });
  }

  private isNpcObscured(x:number,y:number) {
    const person={left:x-25,right:x+25,top:y-76,bottom:y+2};
    return foregroundBuildings.some(d=>d.kind==='settlement-prop' && d.world.y>y
      && overlaps(person,spriteBounds(d.texture??'world_objects',d.frame,d.scale,d.world.x,d.world.y)));
  }

  hasClearPath(ax: number, ay: number, bx: number, by: number, exclude?: Phaser.GameObjects.GameObject) {
    if(fortificationBlocksPath({x:ax,y:ay},{x:bx,y:by}))return false;
    const line = new Phaser.Geom.Line(ax, ay, bx, by);
    return ![...this.buildings.getChildren(), ...this.treeBodies.getChildren()].some(object => {
      if (object === exclude || (exclude&&object.getData(WORLD_SPRITE_OWNER)===exclude)) return false;
      const body = (object as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return body?.enable&&Phaser.Geom.Intersects.LineToRectangle(line,new Phaser.Geom.Rectangle(body.x,body.y,body.width,body.height));
    });
  }

  syncState() {
    if (!this.player?.active) return;
    this.reconcileStoryAffinity();
    const position=this.passage?.safePosition??this.player;
    const town = this.worldGenerator.getTownAt(position.x, position.y);
    const store = useGameStore.getState();
    store.setWorldStatus(position.x, position.y, this.worldGenerator.getRegionAt(position.x, position.y), town?.id ?? null);
    store.setVitals(this.player.hp, this.player.stamina);
    store.setActiveSkillStatus(this.player.skills.snapshot());
    this.dayNight.syncState();
    if (this.contentManager) store.setContentWorld(this.contentManager.snapshot());
  }

  private reconcileStoryAffinity() {
    if(!this.contentManager)return;
    const store=useGameStore.getState();
    for(const [key,choiceId] of Object.entries(store.storyChoices)) {
      if(store.storyFlags['affinity:'+key])continue;
      const [questId,objectiveId]=key.split(':');
      const objective=QUEST_BY_ID[questId]?.objectives.find(o=>o.id===objectiveId);
      if(!objective || !objective.choices?.some(c=>c.id===choiceId&&c.correct!==false)
        ||(store.quests[questId]?.objectiveProgress[objectiveId]??0)<objective.amount)continue;
      const id='npc:'+objective.targetId,state=this.contentManager.getState(id);
      if(!state || !NPC_BY_ID[objective.targetId])continue;
      this.contentManager.patchState(id,{trust:Math.min(100,(state.trust??NPC_BY_ID[objective.targetId].relationshipToLeigneron.trust)+5)});
      store.setStoryFlag('affinity:'+key);
    }
  }

  private updateNavigation() {
    const store = useGameStore.getState();
    this.questTarget = resolveQuestTarget(store.quests, store.worldContent, this.player,
      id => this.contentManager.getActor(id),store.trackedQuestId);
    const markers: NavigationMarker[] = [];
    for (const id of this.contentManager.getActiveIds()) {
      const d = this.contentManager.getDefinition(id)!;
      const actor = this.contentManager.getActor(id)!;
      if(actor instanceof Enemy&&!this.targeting.eligible(actor))continue;
      if (Phaser.Math.Distance.Between(this.player.x,this.player.y,actor.x,actor.y) > 1200) continue;
      if (d.kind === 'prop') continue;
      const kind = d.kind === 'npc' ? 'npc' : d.kind === 'creature' ? d.bossId ? 'boss' : 'enemy'
        : d.kind === 'settlement-prop' ? 'building' : d.kind === 'settlement' ? 'town' : 'landmark';
      const label = d.kind === 'npc' ? NPC_BY_ID[d.npcId].name : d.kind === 'creature' ? ENEMY_BY_ID[d.enemyId].name
        : d.kind === 'settlement' ? TOWN_BY_ID[d.townId].name : 'name' in d ? d.name : 'label' in d && d.label ? d.label : 'Building';
      markers.push({ id, kind, label, x: actor.x, y: actor.y });
    }
    let interaction: string | null = null, distance = 72;
    for (const npc of this.npcs) {
      npc.updatePresentation(this.player.x,this.player.y,this.questTarget?.contentId === `npc:${npc.definition.id}`,this.wasBlocked);
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,npc.x,npc.y);
      if (d < distance && this.hasClearPath(this.player.x,this.player.y,npc.x,npc.y)) { distance = d; interaction = `Talk to ${npc.definition.name}`; }
    }
    if (!interaction) for (const { definition,actor } of this.interactables.values()) {
      const point=definition.portId?PORT_BY_ID[definition.portId].landing:actor;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,point.x,point.y);
      if (d < distance && this.hasClearPath(this.player.x,this.player.y,point.x,point.y,actor)) { distance = d; interaction = definition.name; }
    }
    store.setNavigation({ heading: Math.atan2(this.player.lastDirection.x,-this.player.lastDirection.y), target: this.questTarget, markers, interaction });
  }

  private drawQuestGuide(blocked: boolean) {
    this.questGuide.clear().setVisible(!blocked);
    const target = this.questTarget;
    if (!target || blocked) return;
    const live = this.contentManager.getActor(target.contentId) ?? target;
    const angle = questBearing(this.player,live), dx = Math.sin(angle), dy = -Math.cos(angle);
    if (Phaser.Math.Distance.Between(this.player.x,this.player.y,live.x,live.y) > 90) {
      const x = this.player.x + dx * 48, y = this.player.y + dy * 48;
      this.questGuide.lineStyle(2,0x34210d,.85).fillStyle(0xffd976,.95);
      this.questGuide.beginPath(); this.questGuide.moveTo(x + dx * 8,y + dy * 8);
      this.questGuide.lineTo(x - dx * 5 - dy * 6,y - dy * 5 + dx * 6);
      this.questGuide.lineTo(x - dx * 5 + dy * 6,y - dy * 5 - dx * 6);
      this.questGuide.closePath(); this.questGuide.fillPath(); this.questGuide.strokePath();
    }
    const ground=groundMarkerPosition(live);
    this.questGuide.lineStyle(2,0xffd976,.8).strokeEllipse(ground.x,ground.y,28,10);
    this.questGuide.fillStyle(0xffdf91,.95).fillPoints([
      { x: live.x, y: live.y - 116 }, { x: live.x + 5, y: live.y - 110 },
      { x: live.x, y: live.y - 104 }, { x: live.x - 5, y: live.y - 110 },
    ],true);
  }

  private onBlur() { this.focused = false; this.panelActions.clear(); this.player?.resetInput(); }
  private onFocus() { this.focused = true; this.player?.resetInput(); }

  private createContentActor(definition: ContentDefinition, state: ContentState): ContentActor {
    const { x, y } = definition.kind==='interactable'&&definition.portId
      ?PORT_BY_ID[definition.portId].quay:state;
    if (definition.kind === 'npc') {
      const npcDefinition = NPC_BY_ID[definition.npcId];
      // Repair older keeper positions behind the shrine roof. Keep trust and
      // dialogue progress; only move the actor into its redesigned forecourt.
      const obscuredKeeper = ['orin-bell','maren-voss'].includes(definition.npcId)
        && Math.hypot(x - definition.world.x,y - definition.world.y) > (npcDefinition.patrolRadius ?? 110) + 18;
      const phase=npcDefinition.formation?formationPosition(this.activePlayMs,npcDefinition.formation.rank):null;
      const town=TOWN_BY_ID[npcDefinition.townId];
      const returned=definition.npcId==='tovin-reed'&&(useGameStore.getState().quests['shadows-highmere']?.objectiveProgress.escort??0)>=1;
      const position = returned?{x:town.world.x-1280,y:town.world.y+1609}
        :phase&&this.getWorldHour()>=6&&this.getWorldHour()<20?{x:town.world.x+phase.x,y:town.world.y+phase.y}
        : obscuredKeeper || this.isNpcObscured(x,y) || this.isBlockedByBuilding(x,y) ? definition.world : { x,y };
      const npc = new Npc(this, npcDefinition, position.x, position.y, definition.world);
      this.groundShadows.register(npc);
      this.npcBodies.add(npc);
      npc.on('pointerdown', () => {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < 72 && this.hasClearPath(this.player.x, this.player.y, npc.x, npc.y)) {
          useGameStore.getState().startDialogue(npc.definition.id);
        }
      });
      this.npcs.push(npc);
      return npc;
    }
    if (definition.kind === 'creature') {
      const enemy = new Enemy(this, ENEMY_BY_ID[definition.enemyId], x, y, definition.id, definition.eventSpawn);
      this.groundShadows.register(enemy);
      enemy.hp = state.hp ?? enemy.hp;
      this.creatureBodies.add(enemy); this.enemies.add(enemy);
      if (definition.bossId && Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 1200) {
        const boss = BOSSES.find(b => b.id === definition.bossId);
        if (boss) this.notify(`Boss territory: ${boss.name} — ${boss.lore}`);
      }
      return enemy;
    }
    if (definition.kind === 'settlement') {
      const town = TOWN_BY_ID[definition.townId];
      return this.add.text(x, y, town.name, {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: '#f4dfae', stroke: '#24170d', strokeThickness: 4,
      }).setResolution(2).setOrigin(.5).setDepth(y + 180).setAlpha(town.id === 'oakmere' ? 1 : .82);
    }
    if (definition.kind === 'prop' || definition.kind === 'settlement-prop') {
      const texture = definition.texture ?? 'world_objects';
      const solid = definition.solid || isTreeArt(texture,definition.frame);
      const treeBase = isTreeArt(texture,definition.frame)
        ? treeFootprint(texture,definition.frame,definition.scale) : definition.footprint;
      const actor = this.add.sprite(x,y,texture,definition.frame);
      actor.setName(definition.id);
      if (definition.tint !== undefined) actor.setTint(definition.tint);
      this.presentWorldSprite(actor, texture, definition.frame, definition.scale, solid,treeBase,
        definition.rotation,definition.anchor);
      if (definition.label) {
        const caption = this.add.text(x, y + 14, definition.label, {
          fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e7d7ad', stroke: '#211b12', strokeThickness: 3,
        }).setResolution(2).setOrigin(.5,0).setDepth(y + 80);
        actor.once('destroy', () => caption.destroy());
      }
      return actor;
    }
    if (!('description' in definition)) throw new Error(`Unknown content type: ${definition.id}`);
    const texture = definition.texture ?? 'world_objects';
    const solid = definition.solid ?? (definition.kind !== 'harvestable' || definition.texture === 'world_assets');
    const actor=this.add.sprite(x,y,texture,definition.frame).setName(definition.id).setInteractive({useHandCursor:true});
    if(definition.tint!==undefined)actor.setTint(definition.tint);
    const footprint = propFoundation(texture,definition.frame,definition.scale??.6);
    this.presentWorldSprite(actor, texture, definition.frame, definition.scale ?? .6, solid, footprint,
      definition.rotation??0,definition.anchor??'bottom');
    if (definition.townShrineId||definition.portId) {
      const caption = this.add.text(x,y + 15,definition.name,{
        fontFamily:'Georgia, serif',fontSize:'10px',color:'#e7d7ad',stroke:'#211b12',strokeThickness:3,
      }).setResolution(2).setOrigin(.5,0).setDepth(y + 80);
      actor.once('destroy',() => caption.destroy());
    }
    if (state.used) actor.setTint(definition.id==='clue:cibar-pump'&&useGameStore.getState().storyFlags['cibar-irrigation-repaired']?0xc9f2ed:definition.townShrineId ? 0xc9e7eb : 0x99907b);
    actor.on('pointerdown', () => {
      const point=definition.portId?PORT_BY_ID[definition.portId].landing:actor;
      if (!useGameStore.getState().panel && !useGameStore.getState().dialogue
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y) < 72
        && this.hasClearPath(this.player.x, this.player.y, point.x, point.y, actor)) this.useInteractable(definition, actor);
    });
    this.interactables.set(definition.id, { definition, actor });
    return actor;
  }

  private presentWorldSprite(actor: Phaser.GameObjects.Sprite, texture: WorldPropTexture,
    frame: number, scale: number, solid = false, foundation?:{ width:number; height:number }, rotation = 0,
    anchor:'center'|'bottom' = 'bottom') {
    const origin=worldPropOrigin(texture,frame,anchor);
    actor.setOrigin(origin.x,origin.y).setScale(artScale(texture) * scale).setDepth(actor.y).setRotation(rotation);
    this.worldSprites.register(actor,texture,frame,scale,solid,foundation,anchor==='center');
    this.dayNight.register(actor,texture,frame,scale);
    this.treeSway.register(actor,texture,frame);
  }

  private destroyContentActor(actor: ContentActor) {
    if (actor instanceof Enemy) this.enemies.delete(actor);
    if (actor instanceof Npc) {
      const i = this.npcs.indexOf(actor); if (i >= 0) this.npcs.splice(i, 1);
    }
    this.interactables.delete(actor.name);
    actor.destroy();
  }

  private useInteractable(definition: InteractableContentDefinition, actor: ContentActor) {
    if(definition.portId){useGameStore.getState().hydrate({panel:'harbor',harborPortId:definition.portId});this.player.resetInput();return;}
    if(definition.id==='clue:varkhul-ward'){
      const returnAt=this.contentManager.getState('boss:'+DRAGON_BOSS_ID)?.respawnAt;
      if(returnAt&&returnAt>Date.now()&&!objectiveIsCurrent(useGameStore.getState().quests,'investigate','varkhul-ward')){
        this.notify(`Varkhul is recovering above the ridge. Returns in ${Math.ceil((returnAt-Date.now())/60000)} minutes.`);return;
      }
    }
    if(definition.discoveryId&&!useGameStore.getState().storyFlags['discovery:'+definition.discoveryId])
      useGameStore.getState().setStoryFlag('discovery:'+definition.discoveryId);
    if(definition.questTargetId&&definition.questEventType) {
      const store=useGameStore.getState();
      const used=this.contentManager.getState(definition.id)?.used;
      if(used&&!definition.repeatable){this.notify(definition.repeatText);return;}
      if(!objectiveIsCurrent(store.quests,definition.questEventType,definition.questTargetId)) {
        this.notify(definition.repeatText);return;
      }
      this.contentManager.patchState(definition.id,{used:true});
      const repairing=definition.id==='clue:cibar-pump'&&(store.quests['water-stops']?.objectiveProgress.decision??0)>=1;
      store.progressQuest(definition.questEventType,definition.questTargetId);
      if(repairing){store.setStoryFlag('cibar-irrigation-repaired');if(actor instanceof Phaser.GameObjects.Sprite)actor.setTint(0xc9f2ed);}
      store.setContentWorld(this.contentManager.snapshot());this.notify(repairing?'The new fittings set the pump running, and water flows to the fields again.':definition.description);return;
    }
    if (definition.townShrineId) {
      this.contentManager.patchState(definition.id,{ used:true });
      actor.setTint(0xc9e7eb);
      useGameStore.getState().setContentWorld(this.contentManager.snapshot());
      useGameStore.getState().openShrineTravel(definition.townShrineId);
      saveGame();
      return;
    }
    const state = this.contentManager.getState(definition.id)!;
    if (state.used && !definition.repeatable) { this.notify(definition.repeatText); return; }
    this.contentManager.patchState(definition.id, { used: true });
    actor.setTint(0x99907b);
    if (definition.restoreHp) {
      const previousHp = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + definition.restoreHp);
      if (this.player.hp > previousHp) this.playEffect('heal', this.player.x, this.player.y);
    }
    const store = useGameStore.getState();
    store.hydrate({ worldContent: this.contentManager.snapshot(), gold: store.gold + (definition.rewardGold ?? 0) });
    this.notify(definition.description);
  }

  private handleShrineTravel() {
    const store = useGameStore.getState();
    if (!store.travelRequest) return;
    const origin = store.travelOriginTownId ? TOWN_SHRINE_BY_ID[store.travelOriginTownId] : undefined;
    const destination = TOWN_SHRINE_BY_ID[store.travelRequest];
    const validOrigin = store.travelRequestSource === 'map'
      || store.travelRequestSource === 'shrine' && origin && store.unlockedTownShrines.includes(origin.townId)
        && Phaser.Math.Distance.Between(this.player.x,this.player.y,origin.world.x,origin.world.y) <= 120;
    store.clearShrineTravelRequest();
    if (!validOrigin || !destination || !localSettlementTravelEnabled() && !store.unlockedTownShrines.includes(destination.townId)) {
      this.notify('Attune this settlement’s shrine before teleporting there.');
      return;
    }
    const departure = { x:this.player.x,y:this.player.y };
    this.player.resetInput();
    this.chunkManager.update(destination.arrival.x,destination.arrival.y);
    this.contentManager.update(destination.arrival.x,destination.arrival.y);
    const landing = [destination.arrival,
      ...[0,48,-48,80,-80].flatMap(dx => [24,48,80].map(dy => ({ x:destination.arrival.x + dx,y:destination.arrival.y + dy })))
    ].find(point => this.worldGenerator.isWalkable(point.x,point.y) && !this.isBlockedByBuilding(point.x,point.y)
      && !this.npcs.some(npc => Phaser.Math.Distance.Between(point.x,point.y,npc.x,npc.y) < 36));
    if (!landing) {
      this.chunkManager.update(departure.x,departure.y);
      this.contentManager.update(departure.x,departure.y);
      this.notify('This shrine arrival is obstructed. Try again shortly.');
      return;
    }
    this.playEffect('teleport',departure.x,departure.y);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(landing.x,landing.y);
    this.player.lastDirection.set(0,1);
    this.lastSafe = { ...landing };
    this.cameras.main.centerOn(landing.x,landing.y);
    this.playEffect('teleport',landing.x,landing.y);
    this.dayNight.update(0,landing.x,landing.y);
    this.syncState();
    this.updateNavigation();
    saveGame();
    this.notify(`Arrived at ${TOWN_BY_ID[destination.townId].name}.`);
  }

  private trySpawnAmbientEnemy(regionId: RegionId) {
    if (regionId === 'dead-sea' || this.enemies.size >= 8 || !this.isEnemyTerritory(this.player.x,this.player.y)) return;
    const biome=this.worldGenerator.getBiomeAt(this.player.x,this.player.y);
    const choices = ENEMIES.filter(e => !e.boss&&(e.id!=='marsh-wraith'||biome==='wetland'||regionId==='darkav')).flatMap(e => Array.from({ length: e.regionWeights[regionId] ?? 0 }, () => e.id));
    if (!choices.length) return;
    const rng = seededRandom(`ambient:${this.spawnAttempts++}:${Math.floor(this.player.x / 256)}:${Math.floor(this.player.y / 256)}`);
    if (rng() > 0.42) return;

    for (let attempts = 0; attempts < 6; attempts += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = 380 + rng() * 380;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;
      if (!this.canEnemyOccupy(x, y)) continue;
      const enemyId = choices[Math.floor(rng() * choices.length)];
      if (this.spawnEnemy(enemyId, x, y)) return;
    }
  }

  private enforceLandCollision() {
    if (this.worldGenerator.isWalkable(this.player.x, this.player.y)
      && !fortificationBlocksPath(this.lastSafe,this.player,12)
      && !this.worldSprites.blocksPath(this.lastSafe,this.player)) {
      this.lastSafe = { x: this.player.x, y: this.player.y };
    } else {
      (this.player.body as Phaser.Physics.Arcade.Body).reset(this.lastSafe.x, this.lastSafe.y);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
  }

  private handlePanelHotkeys() {
    const store = useGameStore.getState();
    const actions = new Set(this.panelActions);
    this.panelActions.clear();
    if(store.cinematic){if(actions.has('pause'))store.requestCinematicSkip();return;}
    if (store.dialogue) {
      this.player.discardActions();
      if (actions.has('pause')) store.endDialogue();
      else if (actions.has('dialogue')) {
        const npc = NPCS.find(n => n.id === store.dialogue?.npcId);
        if (npc && store.dialogue.lineIndex < (store.dialogue.lines??npc.dialogue).length - 1) store.advanceDialogue();
        else if(!store.dialogue.choices?.length) store.endDialogue();
      }
      return;
    }
    if (actions.has('pause')) store.panel ? store.closePanel() : store.openPanel('pause');
    if (actions.has('map')) store.panel === 'map' ? store.closePanel() : store.openPanel('map');
    if (actions.has('inventory')) store.panel === 'inventory' ? store.closePanel() : store.openPanel('inventory');
    if (actions.has('character')) store.panel === 'character' ? store.closePanel() : store.openPanel('character');
    if (actions.has('journal')) store.panel === 'journal' ? store.closePanel() : store.openPanel('journal');
  }

  private updateCameraZoom() {
    if(this.cinematicDirector?.active){this.cinematicDirector.refreshZoom();return;}
    const density=renderDensity(this),width=this.scale.width/density;
    const shortSide = Math.min(width, this.scale.height/density);
    this.cameras.main.setZoom((shortSide < 500 ? .82 : width < 1100 ? 1.1 : 1.25)*density);
  }

  shutdown() {
    this.passage?.destroy();
    this.targeting?.clear();
    useGameStore.getState().setBossEncounter(null);
    setSaveSnapshotProvider();
    mobileInput.reset();
    this.panelActions.clear();
    this.scale.off('resize', this.updateCameraZoom, this);
    this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.game.events.off(Phaser.Core.Events.FOCUS, this.onFocus, this);
    this.dayNight?.destroy();
    this.enemySounds?.destroy();
    this.traffic?.destroy();
    this.groundShadows?.destroy();
    this.weather?.destroy();
    this.cinematicDirector?.destroy();
    this.contentManager?.destroy();
    this.questGuide?.destroy();
    this.chunkManager?.destroy();
    this.treeSway?.destroy();
    this.waterSurface?.destroy();
    this.worldSprites?.destroy();
  }
}
