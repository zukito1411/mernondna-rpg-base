import Phaser from 'phaser';
import { ART_SHEETS, PLAYER_ANIMATIONS, NPC_ANIMATIONS, artFrameSize, HERO_VISIBLE_HEIGHT } from '../../data/art';
import { ENEMY_ANIMATIONS, type SpriteAnimation } from '../../data/animationPacks';
import { PLAYER_ATTACK_ANIMATIONS, PLAYER_EFFECT_ANIMATIONS } from '../../data/spriteBoards';
import { PLAYER_SKILL_ANIMATIONS } from '../../data/playerSkillArt';
import { alphaFrameBounds } from '../systems/spriteArt';
import { prepareEnvironmentLightArt } from '../systems/EnvironmentLightArt';
import { prepareBridgeRail } from '../systems/BridgeArt';
import { prepareTreeArt } from '../systems/TreeArt';
import {renderDensity} from '../systems/renderSizing';
import {prepareScorchedArt} from '../systems/ScorchedArt';

const AUDIO_ASSETS = [
  ['sfx-blade-draw', 'assets/audio/drawKnife1.ogg'],
  ['sfx-sword-whoosh', 'assets/audio/sword-whoosh.ogg'],
  ['sfx-sword-slash', 'assets/audio/sword-slash.mp3'],
  ['sfx-sword-flesh-impact', 'assets/audio/sword-flesh-impact.wav'],
  ['sfx-energy-impact', 'assets/audio/energy-impact.ogg'],
  ['sfx-heavy-slam', 'assets/audio/heavy-slam.ogg'],
  ['sfx-footstep-grass-1', 'assets/audio/footstep_grass_000.ogg'],
  ['sfx-footstep-grass-2', 'assets/audio/footstep_grass_002.ogg'],
  ['sfx-footstep-grass-3', 'assets/audio/footstep_grass_004.ogg'],
  ['sfx-footstep-stone-1', 'assets/audio/footstep_concrete_001.ogg'],
  ['sfx-footstep-stone-2', 'assets/audio/footstep_concrete_003.ogg'],
  ['sfx-footstep-stone-3', 'assets/audio/footstep_concrete_004.ogg'],
  ['sfx-footstep-snow-1', 'assets/audio/footstep_snow_000.ogg'],
  ['sfx-footstep-snow-2', 'assets/audio/footstep_snow_002.ogg'],
  ['sfx-footstep-snow-3', 'assets/audio/footstep_snow_004.ogg'],
  ['sfx-footstep-wood-1', 'assets/audio/footstep_wood_001.ogg'],
  ['sfx-footstep-wood-2', 'assets/audio/footstep_wood_003.ogg'],
  ['sfx-impact-1', 'assets/audio/impactSoft_medium_000.ogg'],
  ['sfx-impact-2', 'assets/audio/impactSoft_medium_002.ogg'],
  ['sfx-impact-3', 'assets/audio/impactSoft_medium_004.ogg'],
  ['sfx-impact-heavy-1', 'assets/audio/impactPunch_heavy_000.ogg'],
  ['sfx-impact-heavy-2', 'assets/audio/impactPunch_heavy_003.ogg'],
  ['sfx-heal-bell', 'assets/audio/impactBell_heavy_002.ogg'],
  ['sfx-dash', 'assets/audio/drawKnife3.ogg'],
] as const;

// Generated sprite sheets contain almost-transparent stray pixels outside the
// actual character. Use a visibility threshold before calculating render scale.
// Without this, the 360px-high idle character is scaled against a ~682px cell.
function heroVisibleBounds(
  rgba: Uint8ClampedArray,
  imageWidth: number,
  cell: readonly [number, number, number, number]
): readonly [number, number, number, number] | undefined {
  const [x, y, width, height] = cell;
  let left = x + width;
  let top = y + height;
  let right = x - 1;
  let bottom = y - 1;
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      if (rgba[(py * imageWidth + px) * 4 + 3] <= 16) continue;
      left = Math.min(left, px);
      top = Math.min(top, py);
      right = Math.max(right, px);
      bottom = Math.max(bottom, py);
    }
  }
  return right >= left && bottom >= top
    ? [left, top, right - left + 1, bottom - top + 1]
    : undefined;
}

export class BootScene extends Phaser.Scene {
  private readonly failures: string[] = [];

  constructor() {
    super('boot');
  }

  preload() {
    this.failures.length = 0;
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.type === 'audio') {
        console.warn(`[audio] Could not load ${file.url}`);
        return;
      }
      this.failures.push(String(file.url));
    });
    for (const [key, path] of AUDIO_ASSETS) this.load.audio(key, path);

    const files = new Set<string>();
    for (const sheet of ART_SHEETS.filter(s => s.key !== 'walls')) {
      if (sheet.sources) {
        for (const source of sheet.sources) files.add(source.path);
      } else {
        files.add(sheet.path);
      }
    }
    for (const path of files) this.load.image(`source:${path}`, path);
  }

  create() {
    if (this.failures.length) {
      const message = `Art could not load:\n${this.failures.join('\n')}\nCheck public/assets and the pack manifests, then reload.`;
      this.registry.set('assetError', message);
      const density=renderDensity(this);
      this.add.text(20*density,20*density,message,{
        fontSize: `${16*density}px`, color: '#ffe1bd',
        wordWrap: { width: Math.max(280*density,this.scale.width-40*density) }
      });
      return;
    }

    const pixels = new Map<string, { data: Uint8ClampedArray; width: number }>();
    const loaded = new Set<string>();
    const heroFits=new Map<string,number>();

    for (const sheet of ART_SHEETS.filter(s => s.key !== 'walls')) {
      const source = this.textures.get(`source:${sheet.path}`).getSourceImage() as HTMLImageElement;
      loaded.add(sheet.path);
      const columns = sheet.atlasColumns ?? sheet.columns;
      const width = sheet.frameWidth * sheet.density;
      const height = sheet.frameHeight * sheet.density;
      const texture = this.textures.createCanvas(
        sheet.key,
        columns * width,
        Math.ceil(sheet.columns / columns) * height
      );
      if (!texture) throw new Error(`Cannot prepare ${sheet.key} art`);

      const ctx = texture.getContext();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const scaleX = sheet.sourceSize ? source.width / sheet.sourceSize[0] : 1;
      const scaleY = sheet.sourceSize ? source.height / sheet.sourceSize[1] : 1;
      const isHeroWalk = sheet.key === 'leigneron';
      const isHeroArt = isHeroWalk || sheet.key === 'leigneron_idle' ||
        sheet.key === 'leigneron_idle_sides' || sheet.key === 'leigneron_running';

      for (let frame = 0; frame < sheet.columns; frame++) {
        const packed = sheet.sources?.[frame];
        const frameSource = packed
          ? this.textures.get(`source:${packed.path}`).getSourceImage() as HTMLImageElement
          : source;

        const wrongDimensions = packed && (
          frameSource.width !== packed.imageSize[0] ||
          frameSource.height !== packed.imageSize[1]
        );
        if (wrongDimensions) {
          if (!isHeroWalk) {
            throw new Error(
              `Sprite dimensions disagree with manifest: ${packed.path}; ` +
              `expected ${packed.imageSize[0]}x${packed.imageSize[1]}, ` +
              `loaded ${frameSource.width}x${frameSource.height}`
            );
          }
          // Hero walk frames are six horizontal frames per image. Use the
          // actual image size when stale metadata describes an older export.
          if (frame % 6 === 0) {
            console.warn(
              `[hero art] ${packed.path}: manifest=${packed.imageSize.join('x')}, ` +
              `loaded=${frameSource.width}x${frameSource.height}; using loaded dimensions`
            );
          }
        }

        if ((packed || sheet.trimRegions) && !pixels.has(packed?.path ?? sheet.path)) {
          const canvas = document.createElement('canvas');
          canvas.width = frameSource.width;
          canvas.height = frameSource.height;
          const context = canvas.getContext('2d', { willReadFrequently: true })!;
          context.drawImage(frameSource, 0, 0);
          const pixelPath = packed?.path ?? sheet.path;
          pixels.set(pixelPath, {
            data: context.getImageData(0, 0, canvas.width, canvas.height).data,
            width: canvas.width
          });
          loaded.add(pixelPath);
        }

        const sourceWidth = source.width / sheet.columns;
        const inset = sheet.sourceInset ?? 0;
        const data = packed
          ? pixels.get(packed.path)
          : sheet.trimRegions ? pixels.get(sheet.path) : undefined;

        // Hero artwork: 6 horizontal frames, regardless of PNG dimensions.
        // Floor boundaries prevent fractional-pixel gaps for 2048px strips.
        const heroStart = Math.floor((frame % 6) * frameSource.width / 6);
        const heroEnd = Math.floor(((frame % 6) + 1) * frameSource.width / 6);
        const cell = isHeroWalk && packed && wrongDimensions
          ? [heroStart, 0, heroEnd - heroStart, frameSource.height] as const
          : packed?.cell ?? sheet.regions?.[frame];
        const region = data && cell
          ? isHeroArt
            ? heroVisibleBounds(data.data, data.width, cell)
            : alphaFrameBounds(data.data, data.width, cell)
          : sheet.regions?.[frame];

        if (packed && !region) throw new Error(`Empty sprite frame: ${packed.name}`);
        if (packed && region && !isHeroWalk && !packed.renderScale && sheet.contentSize &&
            (region[2] > sheet.contentSize[0] || region[3] > sheet.contentSize[1])) {
          throw new Error(`Sprite alpha bounds changed; update art metadata: ${packed.name}`);
        }

        const size = artFrameSize(sheet.key, frame);
        if(isHeroArt && data && !heroFits.has(packed?.path??sheet.path)) {
          const cells=packed?sheet.sources!.filter(s=>s.path===packed.path).map(s=>s.cell):sheet.regions!;
          const bounds=cells.map(c=>heroVisibleBounds(data.data,data.width,c)).filter((r):r is readonly [number,number,number,number]=>Boolean(r));
          // Registered clips can share the upright walking scale so a leaning
          // or airborne running pose does not grow to fill the same height.
          const registeredScale = packed?.groundAnchor ? packed.renderScale : undefined;
          heroFits.set(packed?.path??sheet.path,Math.min((sheet.frameWidth-4)/Math.max(...bounds.map(r=>r[2])),
            registeredScale ?? HERO_VISIBLE_HEIGHT/Math.max(...bounds.map(r=>r[3]))));
        }
        const fit = isHeroArt && region
          ? heroFits.get(packed?.path??sheet.path)!
          : packed?.renderScale ?? (sheet.contentSize
            ? Math.min(
                (sheet.frameWidth - 4) / sheet.contentSize[0],
                (sheet.frameHeight - 4) / sheet.contentSize[1]
              )
            : 1);
        // Alpha trimming must not stretch a silhouette back into its untrimmed box.
        const regionFit = isHeroArt
          ? fit
          : !packed && region && cell && !sheet.contentSize
            ? size.width / cell[2]
            : fit;
        const drawWidth = (region && (packed || sheet.trimRegions)
          ? region[2] * regionFit : size.width) * sheet.density;
        const drawHeight = (region && (packed || sheet.trimRegions)
          ? region[3] * regionFit : size.height) * sheet.density;
        const x = (frame % columns) * width;
        const y = Math.floor(frame / columns) * height;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        // Register side strides by their body/ground anchor, rather than the
        // changing weapon/cape silhouette, so alpha trimming cannot move the head.
        const drawX = packed?.groundAnchor && region
          ? x + width / 2 + (region[0] - packed.groundAnchor[0]) * fit * sheet.density
          : isHeroArt
          ? x + (width - drawWidth) / 2
          : packed?.anchor && region
            ? x + width / 2 + (region[0] - packed.anchor[0]) * fit * sheet.density
            : x + (width - drawWidth) / 2;
        const drawY = packed?.groundAnchor && region
          ? y + height - (sheet.groundPadding??2) * sheet.density + (region[1] - packed.groundAnchor[1]) * fit * sheet.density
          : isHeroArt
          ? y + height - 2 * sheet.density - drawHeight
          : packed?.anchor && region
            ? y + height / 2 + (region[1] - packed.anchor[1]) * fit * sheet.density
            : y + (region ? height - 2 * sheet.density - drawHeight : 0);

        ctx.drawImage(
          frameSource,
          region ? region[0] * (packed ? 1 : scaleX) : frame * sourceWidth + inset,
          region ? region[1] * (packed ? 1 : scaleY) : inset,
          region ? region[2] * (packed ? 1 : scaleX) : sourceWidth - inset * 2,
          region ? region[3] * (packed ? 1 : scaleY) : source.height - inset * 2,
          drawX, drawY, drawWidth, drawHeight
        );
        ctx.restore();
        const preparedFrame=texture.add(frame,0,x,y,width,height);
        if(preparedFrame)preparedFrame.customData={visibleBounds:{left:(drawX-x)/sheet.density,top:(drawY-y)/sheet.density,width:drawWidth/sheet.density,height:drawHeight/sheet.density},
          sourceRegion:region?[...region]:undefined,sourceFit:regionFit};
      }

      if (sheet.blackBackground) {
        const imageData = ctx.getImageData(0, 0, texture.width, texture.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i] < 12 &&
              imageData.data[i + 1] < 12 &&
              imageData.data[i + 2] < 12) {
            imageData.data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
      texture.refresh();
      texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      prepareEnvironmentLightArt(this, sheet.key);
    }

    prepareScorchedArt(this);
    prepareBridgeRail(this);
    prepareTreeArt(this);
    for (const path of loaded) this.textures.remove(`source:${path}`);
    const animations: SpriteAnimation[] = [
      ...PLAYER_ANIMATIONS,
      ...NPC_ANIMATIONS,
      ...ENEMY_ANIMATIONS,
      ...PLAYER_ATTACK_ANIMATIONS,
      ...PLAYER_EFFECT_ANIMATIONS,
      ...PLAYER_SKILL_ANIMATIONS
    ];
    for (const { key, texture, frames, frameRate, repeat, frameDurations } of animations) {
      this.anims.create({
        key,
        // A per-frame duration overrides Phaser's normal frame interval.
        frames: frames.map((frame,index) => ({ key: texture, frame,
          duration:frameDurations?.[index] ?? 0,
        })),
        frameRate,
        repeat
      });
    }
    this.scene.start('world');
  }
}
