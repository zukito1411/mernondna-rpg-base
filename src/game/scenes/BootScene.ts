import Phaser from 'phaser';
import { ART_SHEETS, PLAYER_ANIMATIONS, NPC_ANIMATIONS, artFrameSize } from '../../data/art';
import { ENEMY_ANIMATIONS } from '../../data/animationPacks';
import { PLAYER_ATTACK_ANIMATIONS, PLAYER_EFFECT_ANIMATIONS } from '../../data/spriteBoards';
import { alphaFrameBounds } from '../systems/spriteArt';

export class BootScene extends Phaser.Scene {
  private readonly failures:string[] = [];
  constructor() {
    super('boot');
  }

  preload() {
    this.failures.length = 0;
    this.load.on('loaderror',(file:Phaser.Loader.File) => this.failures.push(String(file.url)));
    const files = new Set<string>();
    for (const sheet of ART_SHEETS) {
      if (sheet.sources) for (const source of sheet.sources) files.add(source.path);
      else files.add(sheet.path);
    }
    for (const path of files) this.load.image(`source:${path}`,path);
  }

  create() {
    if (this.failures.length) {
      const message = `Art could not load:\n${this.failures.join('\n')}\nCheck public/assets and the pack manifests, then reload.`;
      this.registry.set('assetError',message);
      this.add.text(20,20,message,{ fontSize:'16px',color:'#ffe1bd',wordWrap:{ width:Math.max(280,this.scale.width - 40) } });
      return; // Never start the world with silent missing-texture placeholders.
    }
    const pixels = new Map<string,{ data:Uint8ClampedArray; width:number }>();
    const loaded = new Set<string>();
    for (const sheet of ART_SHEETS) {
      const source = this.textures.get(`source:${sheet.path}`).getSourceImage() as HTMLImageElement;
      loaded.add(sheet.path);
      const columns = sheet.atlasColumns ?? sheet.columns;
      const width = sheet.frameWidth * sheet.density, height = sheet.frameHeight * sheet.density;
      const texture = this.textures.createCanvas(sheet.key, columns * width, Math.ceil(sheet.columns / columns) * height);
      if (!texture) throw new Error(`Cannot prepare ${sheet.key} art`);
      const ctx = texture.getContext();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const scaleX = sheet.sourceSize ? source.width / sheet.sourceSize[0] : 1;
      const scaleY = sheet.sourceSize ? source.height / sheet.sourceSize[1] : 1;
      for (let frame = 0; frame < sheet.columns; frame++) {
        const packed = sheet.sources?.[frame];
        const frameSource = packed ? this.textures.get(`source:${packed.path}`).getSourceImage() as HTMLImageElement : source;
        if (packed && (frameSource.width !== packed.imageSize[0] || frameSource.height !== packed.imageSize[1])) {
          throw new Error(`Sprite dimensions disagree with manifest: ${packed.path}`);
        }
        if ((packed || sheet.trimRegions) && !pixels.has(packed?.path ?? sheet.path)) {
          const canvas = document.createElement('canvas'); canvas.width = frameSource.width; canvas.height = frameSource.height;
          const context = canvas.getContext('2d',{ willReadFrequently:true })!;
          context.drawImage(frameSource,0,0);
          const pixelPath = packed?.path ?? sheet.path;
          pixels.set(pixelPath,{ data:context.getImageData(0,0,canvas.width,canvas.height).data,width:canvas.width });
          loaded.add(pixelPath);
        }
        const sourceWidth = source.width / sheet.columns;
        const inset = sheet.sourceInset ?? 0;
        const data = packed ? pixels.get(packed.path) : sheet.trimRegions ? pixels.get(sheet.path) : undefined;
        const cell = packed?.cell ?? sheet.regions?.[frame];
        const region = data && cell ? alphaFrameBounds(data.data,data.width,cell) : sheet.regions?.[frame];
        if (packed && !region) throw new Error(`Empty sprite frame: ${packed.name}`);
        if (packed && region && sheet.contentSize && (region[2] > sheet.contentSize[0] || region[3] > sheet.contentSize[1])) {
          throw new Error(`Sprite alpha bounds changed; update art metadata: ${packed.name}`);
        }
        const size = artFrameSize(sheet.key, frame);
        const fit = packed?.renderScale ?? (packed && sheet.contentSize ? Math.min((sheet.frameWidth - 4) / sheet.contentSize[0],(sheet.frameHeight - 4) / sheet.contentSize[1]) : 1);
        const drawWidth = (packed && region ? region[2] * fit : size.width) * sheet.density;
        const drawHeight = (packed && region ? region[3] * fit : size.height) * sheet.density;
        const x = (frame % columns) * width, y = Math.floor(frame / columns) * height;
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
        ctx.drawImage(frameSource, region ? region[0] * (packed ? 1 : scaleX) : frame * sourceWidth + inset, region ? region[1] * (packed ? 1 : scaleY) : inset,
          region ? region[2] * (packed ? 1 : scaleX) : sourceWidth - inset * 2, region ? region[3] * (packed ? 1 : scaleY) : source.height - inset * 2,
          x + (width - drawWidth) / 2, y + (region ? height - 2 * sheet.density - drawHeight : 0), drawWidth, drawHeight);
        ctx.restore();
        texture.add(frame, 0, x, y, width, height);
      }
      if (sheet.blackBackground) {
        const pixels = ctx.getImageData(0, 0, texture.width, texture.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (pixels.data[i] < 12 && pixels.data[i + 1] < 12 && pixels.data[i + 2] < 12) pixels.data[i + 3] = 0;
        }
        ctx.putImageData(pixels, 0, 0);
      }
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    for (const path of loaded) this.textures.remove(`source:${path}`);
    for (const { key,texture,frames,frameRate,repeat } of [...PLAYER_ANIMATIONS,...NPC_ANIMATIONS,...ENEMY_ANIMATIONS,...PLAYER_ATTACK_ANIMATIONS,...PLAYER_EFFECT_ANIMATIONS]) {
      this.anims.create({ key,frames:frames.map(frame => ({ key:texture,frame })),frameRate,repeat });
    }
    this.scene.start('world');
  }
}
