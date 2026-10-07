import Phaser from 'phaser';
import { BOSSES, ENEMIES, ENEMY_BY_ID } from '../../data/enemies';
import { LEIGNERON } from '../../data/player';
import { NPCS, NPC_BY_ID } from '../../data/npcs';
import { TOWN_BY_ID } from '../../data/towns';
import { WORLD_CONTENT, initialContentState } from '../../data/content';
import { WEAPON_BY_ID } from '../../data/weapons';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../data/world';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';
import { setSaveSnapshotProvider } from '../../utils/save';
import { mobileInput } from '../input';
import { Enemy } from '../entities/Enemy';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import type { ContentDefinition, ContentState, InteractableContentDefinition, NavigationMarker, QuestTarget, RegionId, WeaponDefinition } from '../types';
import { ChunkManager } from '../systems/ChunkManager';
import { DayNightSystem } from '../systems/DayNightSystem';
import { EventDirector, type EventDirectorHost } from '../systems/EventDirector';
import { WorldGenerator } from '../systems/WorldGenerator';
import { ContentChunkManager } from '../systems/ContentChunkManager';
import { resolveQuestTarget, questBearing } from '../systems/questNavigation';
import { artScale, artFrameSize, worldPropFootprint } from '../../data/art';
import { repairCreaturePlacements } from '../systems/creaturePlacement';
import { progressionStats } from '../../data/progression';

type ContentActor = Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;

export class WorldScene extends Phaser.Scene implements EventDirectorHost {
  player!: Player;
  private readonly worldGenerator = new WorldGenerator();
  private chunkManager!: ChunkManager;
  private dayNight!: DayNightSystem;
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
  private readonly panelActions = new Set<'map' | 'inventory' | 'character' | 'pause' | 'dialogue'>();
  private readonly heldPanelKeys = new Set<string>();
  private questGuide!: Phaser.GameObjects.Graphics;
  private questTarget: QuestTarget | null = null;

  constructor() {
    super('world');
  }

  canNpcVisit(from: { x: number; y: number }, to: { x: number; y: number }) {
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const steps = Math.max(1, Math.ceil(distance / 24));
    for (let i = 0; i <= steps; i++) {
      const x = Phaser.Math.Linear(from.x, to.x, i / steps);
      const y = Phaser.Math.Linear(from.y, to.y, i / steps);
      if (!this.worldGenerator.isWalkable(x, y) || this.isBlockedByBuilding(x, y)) return false;
    }
    return this.hasClearPath(from.x, from.y, to.x, to.y);
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.dayNight = new DayNightSystem(this);
    this.eventDirector = new EventDirector(this);
    this.buildings = this.physics.add.staticGroup();
    this.treeBodies = this.physics.add.staticGroup();
    this.npcBodies = this.physics.add.group();
    this.creatureBodies = this.physics.add.group();
    this.chunkManager = new ChunkManager(this, this.worldGenerator, this.treeBodies);
    this.enemies.clear(); this.npcs.length = 0; this.interactables.clear();
    this.spawnAttempts = 0; this.spawnAccumulator = 0; this.hudAccumulator = 0;
    this.focused = true; this.wasBlocked = false;

    const state = useGameStore.getState();
    const spawnX = this.worldGenerator.isWalkable(state.worldX, state.worldY) ? state.worldX : LEIGNERON.spawn.x;
    const spawnY = this.worldGenerator.isWalkable(state.worldX, state.worldY) ? state.worldY : LEIGNERON.spawn.y;
    this.player = new Player(this, spawnX, spawnY);
    this.lastSafe = { x: spawnX, y: spawnY };

    this.physics.add.collider(this.player, this.buildings);
    this.physics.add.collider(this.player, this.treeBodies);
    this.physics.add.collider(this.player, this.npcBodies);
    this.physics.add.collider(this.creatureBodies, this.buildings);
    this.physics.add.collider(this.creatureBodies, this.treeBodies);
    this.physics.add.collider(this.npcBodies, this.buildings);
    this.physics.add.collider(this.npcBodies, this.treeBodies);
    let logical = { ...state.worldContent, states: { ...state.worldContent.states } };
    for (const bossId of state.defeatedBosses) {
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
    this.questGuide = this.add.graphics().setDepth(9100).setName('quest-direction-guide');
    this.updateNavigation();

    if (!this.input.keyboard) throw new Error('Keyboard input is unavailable.');
    for (const [action, key] of [['map', 'M'], ['inventory', 'I'], ['character', 'C'], ['pause', 'ESC']] as const) {
      this.input.keyboard.addKey(key).setEmitOnRepeat(false).on('down', () => {
        this.panelActions.add(action);
      });
    }
    for (const key of ['E', 'SPACE']) this.input.keyboard.addKey(key).on('down', () => {
      if (useGameStore.getState().dialogue) this.panelActions.add('dialogue');
    });

    this.notify('Oakmere is fully walkable. Follow the eastern road, speak to Aldren, and explore beyond the farms.');
  }

  update(time: number, delta: number) {
    this.handlePanelHotkeys();
    const uiBlocked = !this.focused || Boolean(useGameStore.getState().panel || useGameStore.getState().dialogue);
    if (uiBlocked && !this.wasBlocked) this.player.resetInput();
    this.wasBlocked = uiBlocked;
    if (uiBlocked) this.physics.world.pause();
    else this.physics.world.resume();

    if (!uiBlocked) {
      this.player.updatePlayer(time, delta);
      for (const npc of this.npcs) if (npc.active) npc.updatePatrol(time,delta);
      for (const enemy of this.enemies) {
        if (enemy.active) enemy.updateEnemy(time);
      }
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
    this.drawQuestGuide(uiBlocked);
    for (const enemy of this.enemies) enemy.updatePresentation(this.player.x, this.player.y,uiBlocked);

    const regionId = this.worldGenerator.getRegionAt(this.player.x, this.player.y);
    if (!uiBlocked) this.eventDirector.update(delta, regionId, this.dayNight.getHour(), this.player.x, this.player.y);

    if (!uiBlocked) this.spawnAccumulator += delta;
    if (this.spawnAccumulator > 6500 && !uiBlocked) {
      this.spawnAccumulator = 0;
      this.trySpawnAmbientEnemy(regionId);
    }

    this.hudAccumulator += delta;
    if (this.hudAccumulator > 180) {
      this.hudAccumulator = 0;
      const town = this.worldGenerator.getTownAt(this.player.x, this.player.y);
      useGameStore.getState().setWorldStatus(this.player.x, this.player.y, regionId, town?.id ?? null);
      useGameStore.getState().setVitals(this.player.hp, this.player.stamina);
      this.updateNavigation();
    }
  }

  getEquippedWeapon(): WeaponDefinition {
    return WEAPON_BY_ID[useGameStore.getState().weaponId] ?? WEAPON_BY_ID['roadwarden-sword'];
  }

  performPlayerAttack(player: Player, direction: Phaser.Math.Vector2, weapon: WeaponDefinition) {
    const facing = direction.clone().normalize();
    const progression = progressionStats(useGameStore.getState().attributes, useGameStore.getState().learnedSkills);

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const toEnemy = new Phaser.Math.Vector2(enemy.x - player.x, enemy.y - player.y);
      const distance = toEnemy.length();
      if (distance > weapon.reach + (enemy.definition.boss ? 18 : 8)) continue;
      toEnemy.normalize();
      if (facing.dot(toEnemy) < 0.25) continue;
      if (!this.hasClearPath(player.x, player.y, enemy.x, enemy.y)) continue;
      enemy.takeDamage(Math.round(weapon.damage * progression.damageMultiplier), facing);
    }
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
      const distance = Phaser.Math.Distance.Between(x, y, entry.actor.x, entry.actor.y);
      if (distance < nearestDistance && this.hasClearPath(x, y, entry.actor.x, entry.actor.y)) {
        nearestDistance = distance; target = entry;
      }
    }
    if (target) { this.useInteractable(target.definition, target.actor); return; }
    this.notify('Nothing nearby needs your attention.');
  }

  spawnEnemy(enemyId: string, x: number, y: number, eventSpawn = false) {
    const definition = ENEMY_BY_ID[enemyId];
    if (!definition || definition.boss || this.enemies.size >= 12 || this.contentManager.getSpawnCount() >= 512
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
    effect.play(animation);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => effect.destroy());
  }

  handleEnemyDefeated(enemy: Enemy) {
    const definition = enemy.definition;
    const rng = seededRandom(`${enemy.instanceId}:loot`);
    const gold = definition.goldMin + Math.floor(rng() * (definition.goldMax - definition.goldMin + 1));
    const bossId = enemy.instanceId.startsWith('boss:') ? enemy.instanceId.slice(5) : undefined;
    enemy.createDeathVisual();
    this.contentManager.patchState(enemy.instanceId, { hp: 0, defeated: true });
    useGameStore.getState().recordEnemyDefeat(definition.id, definition.xp, gold, bossId, this.contentManager.snapshot());

    if (enemy.instanceId.startsWith('boss:')) {
      this.notify(`${definition.name} defeated. The world state remembers this.`);
    }

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

  countEnemies() {
    return this.enemies.size;
  }

  isWalkable(x: number, y: number) { return this.worldGenerator.isWalkable(x, y); }
  isEnemyTerritory(x: number, y: number) { return this.worldGenerator.canCreatureOccupy(x,y); }
  canEnemyOccupy(x: number, y: number) { return this.isEnemyTerritory(x,y) && !this.isBlockedByBuilding(x,y); }

  private isBlockedByBuilding(x: number, y: number) {
    return [...this.buildings.getChildren(), ...this.treeBodies.getChildren()].some(object => {
      const body = (object as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return x >= body.left - 20 && x <= body.right + 20 && y >= body.top - 20 && y <= body.bottom + 20;
    });
  }

  hasClearPath(ax: number, ay: number, bx: number, by: number) {
    const line = new Phaser.Geom.Line(ax, ay, bx, by);
    return ![...this.buildings.getChildren(), ...this.treeBodies.getChildren()].some(object => {
      const body = (object as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
      return Phaser.Geom.Intersects.LineToRectangle(line, new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height));
    });
  }

  syncState() {
    if (!this.player?.active) return;
    const town = this.worldGenerator.getTownAt(this.player.x, this.player.y);
    const store = useGameStore.getState();
    store.setWorldStatus(this.player.x, this.player.y, this.worldGenerator.getRegionAt(this.player.x, this.player.y), town?.id ?? null);
    store.setVitals(this.player.hp, this.player.stamina);
    this.dayNight.syncState();
    if (this.contentManager) store.setContentWorld(this.contentManager.snapshot());
  }

  private updateNavigation() {
    const store = useGameStore.getState();
    this.questTarget = resolveQuestTarget(store.quests, store.worldContent, this.player,
      id => this.contentManager.getActor(id));
    const markers: NavigationMarker[] = [];
    for (const id of this.contentManager.getActiveIds()) {
      const d = this.contentManager.getDefinition(id)!;
      const actor = this.contentManager.getActor(id)!;
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
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,actor.x,actor.y);
      if (d < distance && this.hasClearPath(this.player.x,this.player.y,actor.x,actor.y)) { distance = d; interaction = definition.name; }
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
    this.questGuide.lineStyle(2,0xffd976,.8).strokeEllipse(live.x,live.y + 23,28,10);
    this.questGuide.fillStyle(0xffdf91,.95).fillPoints([
      { x: live.x, y: live.y - 116 }, { x: live.x + 5, y: live.y - 110 },
      { x: live.x, y: live.y - 104 }, { x: live.x - 5, y: live.y - 110 },
    ],true);
  }

  private onBlur() { this.focused = false; this.panelActions.clear(); this.player?.resetInput(); }
  private onFocus() { this.focused = true; this.player?.resetInput(); }

  private createContentActor(definition: ContentDefinition, state: ContentState): ContentActor {
    const { x, y } = state;
    if (definition.kind === 'npc') {
      const npc = new Npc(this, NPC_BY_ID[definition.npcId], x, y, definition.world);
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
      const solid = definition.solid || texture === 'world_assets' && (definition.frame === 0 || definition.frame === 1);
      const treeBase = texture === 'world_assets' && (definition.frame === 0 || definition.frame === 1)
        ? { width: 24 * definition.scale, height: 26 * definition.scale } : definition.footprint;
      const actor = solid ? this.buildings.create(x, y, texture, definition.frame) as Phaser.Physics.Arcade.Sprite
        : this.add.sprite(x, y, texture, definition.frame);
      actor.setName(definition.id);
      this.presentWorldSprite(actor, texture, definition.frame, definition.scale, solid,treeBase);
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
    const actor = this.add.sprite(x, y, texture, definition.frame).setName(definition.id).setInteractive({ useHandCursor: true });
    this.presentWorldSprite(actor, texture, definition.frame, definition.scale ?? .6);
    if (state.used) actor.setTint(0x99907b);
    actor.on('pointerdown', () => {
      if (!useGameStore.getState().panel && !useGameStore.getState().dialogue
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, actor.x, actor.y) < 72
        && this.hasClearPath(this.player.x, this.player.y, actor.x, actor.y)) this.useInteractable(definition, actor);
    });
    this.interactables.set(definition.id, { definition, actor });
    return actor;
  }

  private presentWorldSprite(actor: Phaser.GameObjects.Sprite, texture: 'world_objects' | 'world_assets' | 'world_buildings', frame: number, scale: number, solid = false, foundation?:{ width:number; height:number }) {
    actor.setOrigin(.5, 1).setScale(artScale(texture) * scale).setDepth(actor.y);
    const size = artFrameSize(texture, frame), width = size.width * scale, height = size.height * scale;
    const shadow = this.add.ellipse(actor.x, actor.y - 5, width * .7, Math.min(18, height * .12), 0x182015, .18)
      .setDepth(actor.y - height - 1).setName(`shadow:${actor.name}`);
    actor.once('destroy', () => shadow.destroy());
    if (solid && actor instanceof Phaser.Physics.Arcade.Sprite) {
      actor.refreshBody();
      // Collide with the grounded foundation, not the roof/canopy or empty atlas padding.
      const body = actor.body as Phaser.Physics.Arcade.StaticBody;
      const footprint = foundation ?? (texture === 'world_objects' ? worldPropFootprint(frame, scale)
        : { width: width * .72, height: Math.min(56, height * .25) });
      const footprintWidth = footprint.width, footprintHeight = footprint.height;
      body.setSize(footprintWidth, footprintHeight, false)
        .setOffset((actor.displayWidth - footprintWidth) / 2, actor.displayHeight - footprintHeight - 2);
    }
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
    const state = this.contentManager.getState(definition.id)!;
    if (state.used) { this.notify(definition.repeatText); return; }
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

  private trySpawnAmbientEnemy(regionId: RegionId) {
    if (regionId === 'dead-sea' || this.enemies.size >= 8 || !this.isEnemyTerritory(this.player.x,this.player.y)) return;
    const choices = ENEMIES.filter(e => !e.boss).flatMap(e => Array.from({ length: e.regionWeights[regionId] ?? 0 }, () => e.id));
    if (!choices.length) return;
    const rng = seededRandom(`ambient:${this.spawnAttempts++}:${Math.floor(this.player.x / 256)}:${Math.floor(this.player.y / 256)}`);
    if (rng() > 0.62) return;

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
    if (this.worldGenerator.isWalkable(this.player.x, this.player.y)) {
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
    if (store.dialogue) {
      this.player.discardActions();
      if (actions.has('pause')) store.endDialogue();
      else if (actions.has('dialogue')) {
        const npc = NPCS.find(n => n.id === store.dialogue?.npcId);
        if (npc && store.dialogue.lineIndex < npc.dialogue.length - 1) store.advanceDialogue();
        else store.endDialogue();
      }
      return;
    }
    if (actions.has('pause')) store.panel ? store.closePanel() : store.openPanel('pause');
    if (actions.has('map')) store.panel === 'map' ? store.closePanel() : store.openPanel('map');
    if (actions.has('inventory')) store.panel === 'inventory' ? store.closePanel() : store.openPanel('inventory');
    if (actions.has('character')) store.panel === 'character' ? store.closePanel() : store.openPanel('character');
  }

  private updateCameraZoom() {
    const width = this.scale.width;
    this.cameras.main.setZoom(width < 700 ? 1.12 : width < 1100 ? 1.2 : 1.3);
  }

  shutdown() {
    setSaveSnapshotProvider();
    mobileInput.reset();
    this.panelActions.clear();
    this.scale.off('resize', this.updateCameraZoom, this);
    this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.game.events.off(Phaser.Core.Events.FOCUS, this.onFocus, this);
    this.dayNight?.destroy();
    this.contentManager?.destroy();
    this.questGuide?.destroy();
    this.chunkManager?.destroy();
  }
}
