import type { ContentDefinition, ContentState, ContentWorldState, CreatureContentDefinition, EncounterRole, Vec2 } from '../types';
import { chunkNeighborhood, contentChunkKey } from './chunkNeighborhood';
import {CHUNK_SIZE,STREAM_RADIUS,WORLD_WIDTH,WORLD_HEIGHT} from '../../data/world';
import {ENEMY_BY_ID} from '../../data/enemies';
import {MAX_LIVE_HOSTILES,MAX_PERSISTENT_SPAWNS} from './encounterAdmission';
import {NPC_BY_ID} from '../../data/npcs';
import {npcMayPatrol} from './npcPlacement';

function creatureGroupKey(definition: CreatureContentDefinition) {
  if (definition.bossId) return undefined; // Authored bosses keep independent admission.
  // Wolf AI retains its established identity, including mixed old/new records.
  // Namespace keys so a future non-wolf encounter cannot join a wolf pack.
  if (definition.wolfPackId) return `wolf:${definition.wolfPackId}`;
  return definition.encounterId ? `encounter:${definition.encounterId}` : undefined;
}

export interface CreatureActivation {
  definition: CreatureContentDefinition;
  state: ContentState;
}

export interface EncounterSpawnMember { enemyId: string; world: Vec2; role?: EncounterRole }

export interface ContentHost<Actor> {
  initialState(definition: ContentDefinition): ContentState;
  canActivate?(definition: ContentDefinition, state: ContentState): boolean;
  /** Check the complete pending group against shared capacity before creating
   * any of its actors. Existing active members already consume their slots. */
  canActivateGroup?(members: readonly CreatureActivation[]): boolean;
  create(definition: ContentDefinition, state: ContentState): Actor;
  position(actor: Actor): Vec2;
  capture(definition: ContentDefinition, actor: Actor): Partial<ContentState>;
  destroy(actor: Actor): void;
}

/** Logical records survive unloading; only the local render/physics actors are disposable. */
export class ContentChunkManager<Actor> {
  private readonly definitions = new Map<string, ContentDefinition>();
  private readonly states = new Map<string, ContentState>();
  private readonly spawns = new Map<string, CreatureContentDefinition>();
  private readonly buckets = new Map<string, Set<string>>();
  private readonly locations = new Map<string, string>();
  private readonly active = new Map<string, Actor>();
  private readonly returns=new Set<string>();
  private readonly oversized=new Map<string,number>();
  private readonly creatureGroups = new Map<string, Set<string>>();
  private wanted = new Set<string>();
  private centerKey = '';
  private nextSpawnSequence: number;

  constructor(definitions: ContentDefinition[], persisted: ContentWorldState, private readonly host: ContentHost<Actor>) {
    this.nextSpawnSequence = persisted.nextSpawnSequence;
    const known=new Map([...definitions,...Object.values(persisted.spawns)].map(d=>[d.id,d]));
    for (const [id, state] of Object.entries(persisted.states)) {
      const d=known.get(id);if(!d) continue;
      // Static placements are authored, not world relocations. Layout repairs
      // apply to old saves while preserving opened caches and attuned shrines.
      // Fixed residents in every town use the repaired court coordinates;
      // walking guards and the escorted witness retain their live journeys.
      const npc=d.kind==='npc'?NPC_BY_ID[d.npcId]:undefined;
      const fixedNpc=npc&&!npcMayPatrol(npc);
      const escortedNpc=d.kind==='npc'&&d.npcId==='tovin-reed';
      this.states.set(id,{...state,...(fixedNpc&&!escortedNpc||(d.kind!=='npc'&&d.kind!=='creature')?d.world:{})});
      if(state.defeated&&state.respawnAt!==undefined)this.returns.add(id);
    }
    for (const definition of definitions) this.register(definition);
    for (const definition of Object.values(persisted.spawns)) {
      this.register(definition); this.spawns.set(definition.id, definition);
    }
    this.normalizeEncounterBehavior();
  }

  update(x: number, y: number): boolean {
    const center = contentChunkKey(x, y);
    let changed = center !== this.centerKey;
    const now=Date.now();
    // Only scheduled returns are inspected, even while their chunks are far
    // away. The saved UTC deadline includes time spent offline/in menus.
    for(const id of this.returns){
      const state=this.states.get(id),definition=this.definitions.get(id);
      if(!state||!definition||state.respawnAt===undefined){this.returns.delete(id);continue;}
      if(state.respawnAt>now)continue;
      const restored={...state,...this.host.initialState(definition),defeated:false,respawnAt:undefined};
      this.states.set(id,restored);this.index(id,contentChunkKey(restored.x,restored.y));
      this.returns.delete(id);changed=true;
    }
    if (changed) { this.centerKey = center; this.wanted = chunkNeighborhood(x, y); }
    // Only near actors are inspected. Bucket migration lets moving creatures cross chunks.
    for (const [id, actor] of this.active) {
      const kind=this.definitions.get(id)!.kind;
      // Authored scenery does not migrate between chunks every physics frame.
      // Oversized landmarks still depend on distance inside the same chunk.
      if(!changed&&kind!=='npc'&&kind!=='creature'&&!this.oversized.has(id))continue;
      const position = this.host.position(actor);
      const key = contentChunkKey(position.x, position.y);
      this.index(id, key);
      if (!this.wanted.has(key)&&!this.nearOversized(id,position,x,y)) { this.deactivate(id); changed = true; }
    }
    const checkedGroups = new Set<string>();
    for (const key of this.wanted) {
      for (const id of this.buckets.get(key) ?? []) {
        if (this.active.has(id)) continue;
        const state = this.getState(id)!;
        if (state.defeated) continue;
        const definition = this.definitions.get(id)!;
        const groupKey = definition.kind === 'creature' ? creatureGroupKey(definition) : undefined;
        if (groupKey && this.host.canActivateGroup) {
          if (checkedGroups.has(groupKey)) continue;
          checkedGroups.add(groupKey);
          if (this.activateCreatureGroup(groupKey)) changed = true;
          continue;
        }
        if (this.host.canActivate && !this.host.canActivate(definition, state)) continue;
        this.active.set(id, this.host.create(definition, { ...state }));
        changed = true;
      }
    }
    // A mountain's visible extent can enter view before its base chunk does.
    // Keep just those authored actors alive; terrain streaming stays bounded.
    for(const [id] of this.oversized){
      if(this.active.has(id))continue;const state=this.getState(id)!;
      if(state.defeated||!this.nearOversized(id,state,x,y))continue;
      const definition=this.definitions.get(id)!;
      if(this.host.canActivate&&!this.host.canActivate(definition,state))continue;
      this.active.set(id,this.host.create(definition,{...state}));changed=true;
    }
    return changed;
  }

  addSpawn(enemyId: string, world: Vec2, eventSpawn: boolean,
    group?: Pick<CreatureContentDefinition, 'encounterId' | 'wolfPackId' | 'wolfAlpha'>) {
    // Old defeated encounter records need not fill the persistent 512-spawn cap.
    if(this.spawns.size >= 380)this.pruneDefeatedSpawns();
    const definition: CreatureContentDefinition = {
      id: `spawn:${this.nextSpawnSequence++}`, kind: 'creature', enemyId, world: { ...world }, eventSpawn,
      ...(group ?? {}),
    };
    this.spawns.set(definition.id, definition);
    this.register(definition);
    const key=creatureGroupKey(definition);
    if(key)this.normalizeEncounterBehavior(key);
    return definition.id;
  }

  /** The scene supplies its current shared-budget capacity and validates
   * habitat/geometry first. This commits a complete logical encounter without
   * creating actors or spending sequence IDs on a rejected batch. */
  addEncounter(members: readonly EncounterSpawnMember[], eventSpawn: boolean, availableSlots: number,
    options: { wolfPack?: boolean; leashRadius?: number } = {}): string[] | null {
    if (!members.length || members.length > MAX_LIVE_HOSTILES || !Number.isFinite(availableSlots)
      || members.length > availableSlots || !Number.isSafeInteger(this.nextSpawnSequence) || this.nextSpawnSequence < 0
      || this.nextSpawnSequence + members.length > Number.MAX_SAFE_INTEGER) return null;
    const leashRadius = options.leashRadius ?? 900;
    if (!Number.isFinite(leashRadius) || leashRadius < 256 || leashRadius > 1600) return null;
    if (options.wolfPack && (members.length < 4 || members.length > 6
      || members.some(member => member.enemyId !== 'gray-wolf'))) return null;
    for (const [i,{ enemyId, world, role }] of members.entries()) {
      const enemy = Object.hasOwn(ENEMY_BY_ID, enemyId) ? ENEMY_BY_ID[enemyId] : undefined;
      if (!enemy || enemy.boss || !Number.isFinite(world.x) || !Number.isFinite(world.y)
        || world.x < 0 || world.y < 0 || world.x >= WORLD_WIDTH || world.y >= WORLD_HEIGHT
        || role !== undefined && !['leader','melee','flanker','ranged','heavy'].includes(role)
        || Math.hypot(world.x-members[0].world.x,world.y-members[0].world.y) > leashRadius * .4) return null;
      const radius=(enemy.bodyRadius??11)*(options.wolfPack&&i===0?1.18:1);
      for(let j=0;j<i;j++) {
        const other=members[j],otherDefinition=ENEMY_BY_ID[other.enemyId];
        const otherRadius=(otherDefinition.bodyRadius??11)*(options.wolfPack&&j===0?1.18:1);
        if(Math.hypot(world.x-other.world.x,world.y-other.world.y)<Math.max(35,radius+otherRadius+8))return null;
      }
    }
    if (this.getSpawnCount() + members.length > MAX_PERSISTENT_SPAWNS) return null;
    const encounterId = `${options.wolfPack ? 'wolf-pack' : 'encounter'}:${this.nextSpawnSequence}`;
    // Resolve every initial state before touching indices. An initializer
    // failure must not leave half a pack registered or consume its identities.
    const orderedIds = members.map((_, i) => `spawn:${this.nextSpawnSequence + i}`);
    if (options.wolfPack) orderedIds.splice(1, orderedIds.length - 1, ...orderedIds.slice(1).sort((a,b)=>a.localeCompare(b)));
    const staged = members.map(({ enemyId, world, role }, i) => {
      const definition: CreatureContentDefinition = {
        id: `spawn:${this.nextSpawnSequence + i}`, kind: 'creature', enemyId, world: { ...world },
        eventSpawn, encounterId,
        encounterBehavior: { home: {...members[0].world}, station: {...world}, leashRadius,
          role: options.wolfPack ? i === 0 ? 'leader' : 'flanker' : role ?? (i === 0 ? 'leader' : 'melee'),
          slot: orderedIds.indexOf(`spawn:${this.nextSpawnSequence + i}`) },
        ...(options.wolfPack ? { wolfPackId: encounterId, wolfAlpha: i === 0 } : {}),
      };
      if (this.definitions.has(definition.id)) throw new Error(`Duplicate content ID: ${definition.id}`);
      return { definition, initial: this.host.initialState(definition) };
    });
    for (const { definition, initial } of staged) {
      this.register(definition, initial);
      this.spawns.set(definition.id, definition);
    }
    this.nextSpawnSequence += staged.length;
    return staged.map(({ definition }) => definition.id);
  }

  getState(id: string): ContentState | undefined {
    const definition = this.definitions.get(id);
    const recorded=this.states.get(id);
    return definition ? { ...this.host.initialState(definition), ...recorded,
      // A legacy record's HP is real damage, not the untouched spawn default.
      ...(recorded?.hp!==undefined&&recorded.hpMax===undefined?{hpMax:undefined}:{}) } : undefined;
  }
  getDefinition(id: string) { return this.definitions.get(id); }
  getActiveIds() { return [...this.active.keys()]; }
  getActiveKeys() { return [...this.wanted]; }
  getActor(id: string) { return this.active.get(id); }
  getWolfPackActors(packId: string) { return this.groupActors(`wolf:${packId}`); }
  getEncounterActors(encounterId: string) { return this.groupActors(`encounter:${encounterId}`); }
  private groupActors(key: string): Actor[] {
    const actors: Actor[] = [];
    for (const id of this.creatureGroups.get(key) ?? []) {
      const actor = this.active.get(id);
      if (actor !== undefined) actors.push(actor);
    }
    return actors;
  }
  /** Admission-time query, not a per-frame world scan. Only the local buckets
   * are visited. Bosses have their own reservations; dead records own no slot. */
  getPendingCreatureCount(x: number, y: number) {
    let count = 0;
    for (const key of chunkNeighborhood(x, y)) {
      for (const id of this.buckets.get(key) ?? []) {
        const definition = this.definitions.get(id)!;
        if (definition.kind !== 'creature' || definition.bossId || this.active.has(id)) continue;
        if (!this.getState(id)!.defeated) count++;
      }
    }
    return count;
  }
  /** Unlike spawn count, this saved sequence never rewinds after pruning. */
  getNextSpawnSequence() { return this.nextSpawnSequence; }
  getSpawnCount() { if(this.spawns.size >= 380)this.pruneDefeatedSpawns(); return this.spawns.size; }
  /** Clear only defeated ambient/event spawns; bosses and authored creatures are never removed. */
  private pruneDefeatedSpawns(){
    for(const id of [...this.spawns.keys()]){
      if(!this.states.get(id)?.defeated || this.active.has(id))continue;
      const bucketKey=this.locations.get(id);
      if(bucketKey){const bucket=this.buckets.get(bucketKey);bucket?.delete(id);if(bucket?.size===0)this.buckets.delete(bucketKey);}
      const groupKey = creatureGroupKey(this.spawns.get(id)!);
      if (groupKey) {
        const members = this.creatureGroups.get(groupKey);
        members?.delete(id);
        if (members?.size === 0) this.creatureGroups.delete(groupKey);
      }
      this.locations.delete(id);this.spawns.delete(id);this.states.delete(id);
      this.definitions.delete(id);this.returns.delete(id);
    }
  }


  patchState(id: string, patch: Partial<ContentState>) {
    if (!this.definitions.has(id)) return;
    this.capture(id);
    const state = { ...this.getState(id)!, ...patch };
    this.states.set(id, state);
    if(state.defeated&&state.respawnAt!==undefined)this.returns.add(id);else this.returns.delete(id);
    this.index(id, contentChunkKey(state.x, state.y));
    // A logical relocation disposes the old actor before it can overwrite the new position.
    if (state.defeated || patch.x !== undefined || patch.y !== undefined) this.deactivate(id, false);
  }

  snapshot(): ContentWorldState {
    for (const id of this.active.keys()) this.capture(id);
    return { states: Object.fromEntries(this.states), spawns: Object.fromEntries(this.spawns), nextSpawnSequence: this.nextSpawnSequence };
  }

  destroy() {
    for (const id of [...this.active.keys()]) this.deactivate(id);
    this.wanted.clear(); this.centerKey = '';
  }

  /** Upgrade old group records once without moving actors or changing damage.
   * Persist derived homes/roles so a later reload cannot move their leash. */
  private normalizeEncounterBehavior(key?:string) {
    const groups=key?[this.creatureGroups.get(key)!]:this.creatureGroups.values();
    for (const ids of groups) {
      const definitions = [...ids].map(id => this.definitions.get(id)! as CreatureContentDefinition)
        .sort((a,b)=>Number(Boolean(b.wolfAlpha))-Number(Boolean(a.wolfAlpha)) || a.id.localeCompare(b.id));
      const existing = definitions.find(d=>d.encounterBehavior)?.encounterBehavior;
      const alphaId=definitions.find(d=>d.wolfAlpha)?.id;
      const anchor = definitions.find(d=>!this.states.get(d.id)?.defeated) ?? definitions[0];
      const home = existing?.home ?? this.states.get(anchor.id) ?? anchor.world;
      const occupied=new Set(definitions.filter(d=>d.encounterBehavior).map(d=>d.encounterBehavior!.slot));
      for (const [slot, definition] of definitions.entries()) {
        if (definition.encounterBehavior) continue;
        const station = this.states.get(definition.id) ?? definition.world;
        const radius=existing?.leashRadius ?? 900;
        const alpha=definition.wolfAlpha&&definition.id===alphaId;
        let assigned=definition.wolfPackId&&!alpha?Math.max(1,slot):slot;
        while(occupied.has(assigned)&&assigned<16)assigned++;
        if(assigned>=16)continue; // Corrupt/oversized legacy groups remain unconfigured, not overwritten.
        occupied.add(assigned);
        const safeStation=Math.hypot(station.x-home.x,station.y-home.y)<=radius*.4?station:home;
        const normalized: CreatureContentDefinition = { ...definition,...(definition.wolfPackId?{wolfAlpha:Boolean(alpha)}:{}), encounterBehavior: {
          home: {x:home.x,y:home.y}, station:{x:safeStation.x,y:safeStation.y}, leashRadius:radius,
          role: definition.wolfPackId ? alpha ? 'leader' : 'flanker' : slot === 0 ? 'leader' : 'melee', slot:assigned,
        } };
        this.definitions.set(definition.id, normalized);
        if (this.spawns.has(definition.id)) this.spawns.set(definition.id, normalized);
      }
    }
  }

  private register(definition: ContentDefinition, initial?: ContentState) {
    if (this.definitions.has(definition.id)) throw new Error(`Duplicate content ID: ${definition.id}`);
    this.definitions.set(definition.id, definition);
    const groupKey = definition.kind === 'creature' ? creatureGroupKey(definition) : undefined;
    if (groupKey) {
      let members = this.creatureGroups.get(groupKey);
      if (!members) this.creatureGroups.set(groupKey, members = new Set());
      members.add(definition.id);
    }
    if('streamRadiusChunks' in definition&&definition.streamRadiusChunks)
      this.oversized.set(definition.id,Math.min(3,definition.streamRadiusChunks));
    const state = initial ?? this.getState(definition.id)!;
    this.index(definition.id, contentChunkKey(state.x, state.y));
  }
  private activateCreatureGroup(groupKey: string) {
    const pending: CreatureActivation[] = [];
    // Cached membership avoids searching all saved spawns for every creature.
    for (const id of this.creatureGroups.get(groupKey) ?? []) {
      if (this.active.has(id)) continue;
      const definition = this.definitions.get(id)! as CreatureContentDefinition;
      const state = this.getState(id)!;
      if (state.defeated) continue; // Restore survivors, never resurrect casualties.
      // Do not pull distant packmates into the local physics/render budget.
      // Wait until all pending survivors are in the streamed neighborhood.
      if (!this.wanted.has(this.locations.get(id)!)) return false;
      if (this.host.canActivate && !this.host.canActivate(definition, state)) return false;
      pending.push({ definition, state });
    }
    if (!pending.length || !this.host.canActivateGroup!(pending)) return false;
    const created: string[] = [];
    try {
      for (const { definition, state } of pending) {
        this.active.set(definition.id, this.host.create(definition, { ...state }));
        created.push(definition.id);
      }
    } catch (error) {
      // Keep logical records unchanged if actor construction fails mid-group.
      for (const id of created) this.deactivate(id, false);
      throw error;
    }
    return true;
  }
  private index(id: string, key: string) {
    const previous = this.locations.get(id);
    if (previous === key) return;
    if (previous) {
      const bucket = this.buckets.get(previous)!;
      bucket.delete(id);
      if (!bucket.size) this.buckets.delete(previous);
    }
    if (!this.buckets.has(key)) this.buckets.set(key, new Set());
    this.buckets.get(key)!.add(id); this.locations.set(id, key);
  }
  private nearOversized(id:string,p:Vec2,x:number,y:number){
    const extra=this.oversized.get(id);if(extra===undefined)return false;
    const radius=STREAM_RADIUS+extra;
    return Math.abs(Math.floor(p.x/CHUNK_SIZE)-Math.floor(x/CHUNK_SIZE))<=radius
      &&Math.abs(Math.floor(p.y/CHUNK_SIZE)-Math.floor(y/CHUNK_SIZE))<=radius;
  }
  private capture(id: string) {
    const actor = this.active.get(id), definition = this.definitions.get(id);
    if (!actor || !definition) return;
    const state = { ...this.getState(id)!, ...this.host.capture(definition, actor) };
    const initial = this.host.initialState(definition);
    if (Object.entries(state).some(([key, value]) => value !== initial[key as keyof ContentState])) this.states.set(id, state);
    this.index(id, contentChunkKey(state.x, state.y));
  }
  private deactivate(id: string, capture = true) {
    const actor = this.active.get(id);
    if (!actor) return;
    if (capture) this.capture(id);
    this.active.delete(id); this.host.destroy(actor);
  }
}

// LEIGHNERON_WOLF_PACKS_ROAD_BANDITS_V1

// LEIGHNERON_MOBILE_GRAPHICS_NPC_FIX_V1
