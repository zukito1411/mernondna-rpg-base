import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

const GAME_MINUTES_PER_REAL_SECOND = 2.5;

export class DayNightSystem {
  private day: number;
  private minuteOfDay: number;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private accumulator = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const state = useGameStore.getState();
    this.day = state.day;
    this.minuteOfDay = state.minuteOfDay;
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0x08111f, 0).setOrigin(0).setScrollFactor(0).setDepth(9000);
    this.resize(scene.scale.width, scene.scale.height);
    scene.scale.on('resize', this.onResize, this);
  }

  update(deltaMs: number) {
    this.minuteOfDay += (deltaMs / 1000) * GAME_MINUTES_PER_REAL_SECOND;
    if (this.minuteOfDay >= 1440) {
      this.day += Math.floor(this.minuteOfDay / 1440);
      this.minuteOfDay %= 1440;
    }

    this.accumulator += deltaMs;
    if (this.accumulator > 700) {
      this.accumulator = 0;
      useGameStore.getState().setClock(this.day, this.minuteOfDay);
    }

    const hour = this.minuteOfDay / 60;
    let alpha = 0;
    if (hour >= 20 || hour < 5) alpha = 0.34;
    else if (hour >= 18) alpha = ((hour - 18) / 2) * 0.34;
    else if (hour < 7) alpha = ((7 - hour) / 2) * 0.34;
    this.overlay.setAlpha(Phaser.Math.Clamp(alpha, 0, 0.34));
  }

  getHour() {
    return this.minuteOfDay / 60;
  }

  syncState() { useGameStore.getState().setClock(this.day, this.minuteOfDay); }
  destroy() {
    this.scene.scale.off('resize', this.onResize, this);
    this.overlay.destroy();
  }
  private onResize(size: Phaser.Structs.Size) { this.resize(size.width, size.height); }

  private resize(width: number, height: number) {
    this.overlay.setSize(width, height);
  }
}
