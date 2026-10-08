import Phaser from 'phaser';
import { ART_BY_KEY, artFrameSize } from '../../data/art';

/** The supplied stone bridge faces east/west. Split only its foreground rail,
 * not the deck or arch supports; keep the player above the crossing surface. */
export function prepareBridgeRail(scene:Phaser.Scene) {
  const sheet=ART_BY_KEY.bridges,region=sheet.regions![2],fit=artFrameSize('bridges',2).width/region[2];
  const atlas=scene.textures.get('bridges') as Phaser.Textures.CanvasTexture;
  const w=sheet.frameWidth*sheet.density,h=sheet.frameHeight*sheet.density;
  const texture=scene.textures.createCanvas('bridge-front-rail',w,h)!;
  const y=h-2*sheet.density-(region[1]+region[3]-482)*fit*sheet.density;
  const height=(529-482)*fit*sheet.density;
  texture.getContext().drawImage(atlas.getSourceImage() as HTMLCanvasElement,2*w,y,w,height,0,y,w,height);
  texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
