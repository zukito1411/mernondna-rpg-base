import type { ContentDefinition, ContentState, ContentWorldState, CreatureContentDefinition, Vec2 } from '../types';
import { chunkNeighborhood, contentChunkKey } from './chunkNeighborhood';

export interface ContentHost<Actor> {
  initialState(definition: ContentDefinition): ContentState;
  canActivate?(definition: ContentDefinition, state: ContentState): boolean;
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
  private wanted = new Set<string>();
  private centerKey = '';
  private nextSpawnSequence: number;

  constructor(definitions: ContentDefinition[], persisted: ContentWorldState, private readonly host: ContentHost<Actor>) {
    this.nextSpawnSequence = persisted.nextSpawnSequence;
    for (const [id, state] of Object.entries(persisted.states)) this.states.set(id, { ...state });
    for (const definition of definitions) this.register(definition);
    for (const definition of Object.values(persisted.spawns)) {
      this.register(definition); this.spawns.set(definition.id, definition);
    }
  }

  update(x: number, y: number): boolean {
    const center = contentChunkKey(x, y);
    let changed = center !== this.centerKey;
    if (changed) { this.centerKey = center; this.wanted = chunkNeighborhood(x, y); }
    // Only near actors are inspected. Bucket migration lets moving creatures cross chunks.
    for (const [id, actor] of this.active) {
      const position = this.host.position(actor);
      const key = contentChunkKey(position.x, position.y);
      this.index(id, key);
      if (!this.wanted.has(key)) { this.deactivate(id); changed = true; }
    }
    for (const key of this.wanted) {
      for (const id of this.buckets.get(key) ?? []) {
        if (this.active.has(id)) continue;
        const state = this.getState(id)!;
        if (state.defeated) continue;
        const definition = this.definitions.get(id)!;
        if (this.host.canActivate && !this.host.canActivate(definition, state)) continue;
        this.active.set(id, this.host.create(definition, { ...state }));
        changed = true;
      }
    }
    return changed;
  }

  addSpawn(enemyId: string, world: Vec2, eventSpawn: boolean) {
    const definition: CreatureContentDefinition = {
      id: `spawn:${this.nextSpawnSequence++}`, kind: 'creature', enemyId, world: { ...world }, eventSpawn,
    };
    this.spawns.set(definition.id, definition);
    this.register(definition);
    return definition.id;
  }

  getState(id: string): ContentState | undefined {
    const definition = this.definitions.get(id);
    return definition ? { ...this.host.initialState(definition), ...this.states.get(id) } : undefined;
  }
  getDefinition(id: string) { return this.definitions.get(id); }
  getActiveIds() { return [...this.active.keys()]; }
  getActiveKeys() { return [...this.wanted]; }
  getActor(id: string) { return this.active.get(id); }
  getSpawnCount() { return this.spawns.size; }

  patchState(id: string, patch: Partial<ContentState>) {
    if (!this.definitions.has(id)) return;
    this.capture(id);
    const state = { ...this.getState(id)!, ...patch };
    this.states.set(id, state);
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

  private register(definition: ContentDefinition) {
    if (this.definitions.has(definition.id)) throw new Error(`Duplicate content ID: ${definition.id}`);
    this.definitions.set(definition.id, definition);
    const state = this.getState(definition.id)!;
    this.index(definition.id, contentChunkKey(state.x, state.y));
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
