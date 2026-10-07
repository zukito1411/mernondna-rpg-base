import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { seededRandom } from '../../utils/seededRandom';

const GAME_MINUTES_PER_REAL_SECOND = 2.5;

interface Firefly {
  glow: Phaser.GameObjects.Arc;
  light: Phaser.GameObjects.Arc;
  offsetX: number;
  offsetY: number;
  phase: number;
  drift: number;
}

export class DayNightSystem {
  private day: number;
  private minuteOfDay: number;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly playerGlow: Phaser.GameObjects.Image;
  private readonly glowTextureKey = 'system:night-lantern-glow';
  private readonly fireflies: Firefly[] = [];
  private accumulator = 0;
  private elapsed = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const state = useGameStore.getState();
    this.day = state.day;
    this.minuteOfDay = state.minuteOfDay;
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0x05091b, 0).setOrigin(0).setScrollFactor(0).setDepth(1_000_000);
    const glowTexture = scene.textures.createCanvas(this.glowTextureKey, 256, 256);
    if (!glowTexture) throw new Error('Cannot create the night-light texture.');
    const context = glowTexture.getContext(), gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255,226,174,0.88)');
    gradient.addColorStop(0.38, 'rgba(255,204,122,0.38)');
    gradient.addColorStop(1, 'rgba(255,190,100,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 256, 256); glowTexture.refresh();
    this.playerGlow = scene.add.image(0, 0, this.glowTextureKey).setDisplaySize(620, 620)
      .setScrollFactor(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(1_000_001).setVisible(false).setName('night-player-light');
    this.resize(scene.scale.width, scene.scale.height);
    scene.scale.on('resize', this.onResize, this);
    const random = seededRandom('mernondna:fireflies');
    for (let i = 0; i < 18; i++) {
      const glow = scene.add.circle(0, 0, 8, 0x9bf5a7, 0.2).setScrollFactor(0).setName('firefly-glow').setDepth(1_000_001)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      const light = scene.add.circle(0, 0, 2, 0xe8ffd0, 0.8).setScrollFactor(0).setName('firefly-light').setDepth(1_000_002)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
      this.fireflies.push({ glow, light, offsetX: (random() - 0.5) * 480, offsetY: (random() - 0.5) * 360,
        phase: random() * Math.PI * 2, drift: 0.6 + random() * 0.8 });
    }
  }

  update(deltaMs: number, playerX: number, playerY: number) {
    this.elapsed += deltaMs;
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
    let darkness = 0;
    if (hour >= 20 || hour < 5) darkness = 0.64;
    else if (hour >= 18) darkness = ((hour - 18) / 2) * 0.64;
    else if (hour < 7) darkness = ((7 - hour) / 2) * 0.64;
    darkness = Phaser.Math.Clamp(darkness, 0, 0.64);
    this.overlay.setAlpha(darkness);
    const camera = this.scene.cameras.main;
    const screenX = (x: number) => (x - camera.scrollX) * camera.zoom + camera.x;
    const screenY = (y: number) => (y - camera.scrollY) * camera.zoom + camera.y;
    this.playerGlow.setPosition(screenX(playerX), screenY(playerY)).setAlpha(darkness / 0.64).setVisible(darkness > 0.005);
    this.updateFireflies(darkness / 0.64, playerX, playerY, screenX, screenY);
  }

  getHour() {
    return this.minuteOfDay / 60;
  }

  syncState() { useGameStore.getState().setClock(this.day, this.minuteOfDay); }
  destroy() {
    this.scene.scale.off('resize', this.onResize, this);
    this.overlay.destroy();
    this.playerGlow.destroy();
    this.scene.textures.remove(this.glowTextureKey);
    for (const firefly of this.fireflies) { firefly.glow.destroy(); firefly.light.destroy(); }
    this.fireflies.length = 0;
  }
  private onResize(size: Phaser.Structs.Size) { this.resize(size.width, size.height); }

  private resize(width: number, height: number) {
    this.overlay.setSize(width, height);
  }

  private updateFireflies(night: number, playerX: number, playerY: number,
    screenX: (x: number) => number, screenY: (y: number) => number) {
    for (const fly of this.fireflies) {
      const drift = this.elapsed * 0.00035 * fly.drift;
      const x = playerX + fly.offsetX + Math.sin(drift + fly.phase) * 32;
      const y = playerY + fly.offsetY + Math.cos(drift * 0.8 + fly.phase) * 24;
      const pulse = (Math.sin(this.elapsed * 0.003 + fly.phase) + 1) / 2;
      fly.glow.setPosition(screenX(x), screenY(y)).setAlpha(night * (0.04 + pulse * 0.28)).setVisible(night > 0.02);
      fly.light.setPosition(screenX(x), screenY(y)).setAlpha(night * (0.12 + pulse * 0.72)).setVisible(night > 0.02);
    }
  }
}
