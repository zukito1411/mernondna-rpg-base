export function natureMix(minute: number, region: string, biome: string) {
  const night = minute < 360 || minute >= 1080;
  const alive =
    !['darkav', 'dead-sea', 'frostlands'].includes(region) &&
    !['snowfield', 'volcanic', 'coast'].includes(biome);

  return {
    night,
    music: night ? 0 : 0.24,
    birds: alive && !night ? 0.35 : 0,
    crickets: alive && night ? 0.9 : 0,
    owl: alive && night ? 0.9 : 0,
  };
}

/** Richer nature ambience with natural gaps and lightweight audio playback. */
export class NatureAmbience {
  private readonly birds = new Audio('assets/audio/ambience/day-birds.ogg');
  private readonly crickets = new Audio('assets/audio/ambience/night-crickets.mp3');
  private readonly owl = new Audio('assets/audio/ambience/night-owl.mp3');

  private elapsed = 0;
  private nextBird = 2200;
  private nextOwl = 9000;
  private birdUntil = 0;

  private enabled = false;
  private destroyed = false;
  private readonly starting = new Set<HTMLAudioElement>();

  constructor() {
    for (const voice of [this.birds, this.crickets, this.owl]) {
      voice.volume = 0;
      voice.preload = 'none';
    }

    this.crickets.loop = true;
  }

  unlock() {
    this.enabled = true;
  }

  update(
    delta: number,
    minute: number,
    region: string,
    biome: string,
    muted: boolean
  ) {
    if (this.destroyed || !this.enabled) return;

    const mix = natureMix(minute, region, biome);
    const step = Math.min(100, Math.max(0, delta));

    if (muted || document.hidden) {
      this.pause();
      return;
    }

    this.elapsed += step;

    // Smooth nighttime cricket ambience.
    const cricketTarget = mix.crickets;
    const fadeStep = step * 0.00012;

    this.crickets.volume += Math.max(
      -fadeStep,
      Math.min(fadeStep, cricketTarget - this.crickets.volume)
    );

    if (this.crickets.volume > 0.001) {
      if (this.crickets.paused) this.play(this.crickets);
    } else {
      this.crickets.pause();
    }

    // More frequent daytime bird calls.
    if (!mix.birds || this.elapsed >= this.birdUntil) {
      this.birds.pause();
      this.birds.volume = 0;
    }

    if (mix.birds && this.elapsed >= this.nextBird) {
      const available = Number.isFinite(this.birds.duration)
        ? Math.max(0, this.birds.duration - 5)
        : 0;

      this.birds.currentTime = Math.random() * available;
      this.birds.volume = mix.birds;
      this.play(this.birds);

      this.birdUntil = this.elapsed + 4800;

      // Approximately every 7–13 seconds.
      this.nextBird = this.elapsed + 7000 + Math.random() * 6000;
    }

    // More noticeable nighttime owl calls, without constant repetition.
    if (!mix.owl) {
      this.owl.pause();
      this.owl.volume = 0;
    }

    if (mix.owl && this.elapsed >= this.nextOwl) {
      this.owl.currentTime = 0;
      this.owl.volume = mix.owl;
      this.play(this.owl);

      // Approximately every 18–30 seconds.
      this.nextOwl = this.elapsed + 18000 + Math.random() * 12000;
    }
  }

  pause() {
    for (const voice of [this.birds, this.crickets, this.owl]) {
      voice.pause();
      voice.volume = 0;
    }
  }

  private play(voice: HTMLAudioElement) {
    if (this.starting.has(voice)) return;

    this.starting.add(voice);

    void voice
      .play()
      .catch(() => {})
      .finally(() => this.starting.delete(voice));
  }

  destroy() {
    this.destroyed = true;
    this.pause();

    for (const voice of [this.birds, this.crickets, this.owl]) {
      voice.removeAttribute('src');
      voice.load();
    }
  }
}
