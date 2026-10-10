import Phaser from 'phaser';
import {ART_BY_KEY} from '../../data/art';
import {BANDIT_COMBAT_ART,BANDIT_COMBAT_TEXTURE,banditCombatPath} from '../../data/banditCombatArt';
import {DIRECTIONAL_ENEMY_ART} from '../../data/directionalEnemyArt';
import {actorSpriteSubjects} from './spriteComponents';
import {createSpriteCropper,spriteSubjectCanvas} from './spriteArt';

/** Complete authored combat poses, one standing-body calibration per source
 * sheet. Extra sword reach/crouching never changes the actor's model scale. */
export function prepareBanditCombatArt(scene:Phaser.Scene){
 const sheet=ART_BY_KEY[BANDIT_COMBAT_TEXTURE],density=sheet.density,fw=sheet.frameWidth*density,fh=sheet.frameHeight*density;
 const texture=scene.textures.createCanvas(BANDIT_COMBAT_TEXTURE,fw*6,fh*3)!,ctx=texture.getContext();
 // Directional animations are created after preparation. The right neutral is
 // already prepared in its own atlas and provides the approved full body size.
 const walk=DIRECTIONAL_ENEMY_ART.find(art=>art.species===1)!.walkTexture;
 const neutral=scene.textures.getFrame(walk,10)!;
 const height=(neutral.customData as {visibleBounds:{height:number}}).visibleBounds.height;
 const draw=createSpriteCropper();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 BANDIT_COMBAT_ART.forEach((art,row)=>{
  const key='bandit-combat-source:'+art.state,source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const sourceCtx=canvas.getContext('2d')!;sourceCtx.drawImage(source,0,0);
  const subjects=actorSpriteSubjects(sourceCtx.getImageData(0,0,source.width,source.height).data,source.width,source.height,3,2);
  const fit=height/subjects[art.referencePose].region[3];
  subjects.forEach((subject,i)=>{
   const [rx,ry,w,h]=subject.region,root=art.roots[i],left=sheet.frameWidth/2+(rx-root)*fit,top=sheet.frameHeight-2-h*fit;
   if(left<2||top<2||left+w*fit>sheet.frameWidth-2)throw new Error('Complete bandit '+art.state+'/'+i+' exceeds its canvas');
   const x=i*fw,y=row*fh;
   draw(ctx,spriteSubjectCanvas(subject),[0,0,w,h],x+left*density,y+top*density,w*fit*density,h*fit*density);
   const frame=texture.add(row*6+i,0,x,y,fw,fh)!;
   frame.customData={fullSprite:true,isolatedSubject:true,foreignProbes:subject.foreignProbes,sourcePath:banditCombatPath(art.state),
    sourceRegion:subject.region,sourceImageSize:[source.width,source.height],sourceFit:fit,sourceRoot:root,
    visibleBounds:{left,top,width:w*fit,height:h*fit}};
  });
  scene.textures.remove(key);canvas.width=canvas.height=1;
 });
 texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
