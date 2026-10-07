import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

export function createMernondnaGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1b2418',
    pixelArt: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, WorldScene],
    render: {
      roundPixels: false,
      antialiasGL: true,
    },
  });
}
