// Offline art preparation only. No browser, game, test suite or build runs.
import {readFile,writeFile,access} from 'node:fs/promises';
import {registerHooks} from 'node:module';
import {readRgbaPng,writeRgbaPng} from './lib/png-rgba.mjs';
import {drawPackedPose} from './lib/hero-sprite-packing.mjs';
registerHooks({resolve(s,c,next){try{return next(s,c)}catch(e){if(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}});
const {actorSpriteSubjects}=await import('../src/game/systems/spriteComponents.ts');
const {PLAYER_SKILL_ART}=await import('../src/data/playerSkillArt.ts');
const {heroGrip}=await import('../src/data/modularHero.ts');
const {AWAKENING_PROFILES}=await import('../src/data/awakening.ts');
const {HERO_SKILL_BODY_GUARDS}=await import('../src/data/heroSkillBodyGuards.ts');
const legacy=['azure-cleave','skyfall-slam','crown-rally','crescent-flurry'];
const exists=async path=>{try{await access(path);return true}catch{return false}};
const selected=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const selectedStates=process.argv.find(a=>a.startsWith('--states='))?.slice(9).split(',');
if(selected.some(slug=>!AWAKENING_PROFILES.some(p=>p.slug===slug)))throw Error('Unknown outfit selection');
for(const profile of AWAKENING_PROFILES){
 const slug=profile.slug;if(selected.length&&!selected.includes(slug))continue;
 const root=`public/assets/characters/leigneron/awakened/${slug}/`,sources=`docs/art/awakening-source/${slug}/`;
 const manifest=JSON.parse(await readFile(root+'manifest-v1.json','utf8'));
 const prepared=[];
 for(const state of [...legacy,'iron-rush-down']){
  if(selectedStates&&!selectedStates.includes(state))continue;
  const customPath=sources+state+'-v2.layout.json',custom=await exists(customPath)?JSON.parse(await readFile(customPath,'utf8')):null;
  if(state==='iron-rush-down'&&!custom)continue;
  const source=readRgbaPng(await readFile(sources+state+`-v${custom?2:1}.png`));
  if(custom&&(!Number.isInteger(custom.columns)||!Number.isInteger(custom.rows)||custom.columns<1||custom.rows<1||custom.columns*custom.rows!==6||custom.grips?.some(point=>point.length!==3)))throw Error('Incomplete six-pose skill layout: '+slug+'/'+state);
  if(custom&&(![custom.pivots,custom.grips].every(points=>Array.isArray(points)&&points.length===6&&points.every(point=>Array.isArray(point)&&point.length>=2&&point.every(Number.isFinite)&&point[0]>=0&&point[0]<source.width&&point[1]>=0&&point[1]<source.height))))throw Error('Missing authored skill pivots/fists: '+slug+'/'+state);
  const art=PLAYER_SKILL_ART.find(a=>a.texture==='skill_'+state.replaceAll('-','_'));
  if(!art)throw Error('Unknown skill art: '+state);
  // New spaced masters and the two independently separated legacy strips
  // contain complete connected poses. Never erase colors outside body guards.
  if(!custom&&!['skyfall-slam','crown-rally'].includes(state))throw Error('Overlapping legacy skill needs a spaced v2 master: '+slug+'/'+state);
  const poses=actorSpriteSubjects(source.pixels,source.width,source.height,custom?.columns??6,custom?.rows??1);
  if(!custom)poses[5]=poses[0]; // clean recovery, never a neighboring impact fragment
  if(poses.length!==6)throw Error('Incomplete skill: '+slug+'/'+state);
  // A generated master must contain complete subjects; padding cannot repair
  // already missing artwork. Legacy strips are checked before publication too.
  if(poses.some(p=>p.region[0]<=0||p.region[1]<=0||p.region[0]+p.region[2]>=source.width||p.region[1]+p.region[3]>=source.height))throw Error('Skill artwork touches source edge: '+slug+'/'+state);
  const fit=76/((poses[0].region[3]+poses[5].region[3])/2),density=3,pad=12;
  const ground=Math.max(...[0,5].map(i=>poses[i].region[1]+poses[i].region[3]));
  const placements=poses.map((p,i)=>{
   const [x,y,w,h]=p.region;
   // Legacy strips preserve their authored source-space arc/jump trajectory.
   // New full-pose masters have a fixed body pivot; the skill controller owns
   // the airborne height, so wing size cannot move/resize the character.
   const pivot=custom?[...custom.pivots[i]]:[art.roots[i===5?0:i]*source.width/2172,ground];
   if(custom&&(i===0||i===5))pivot[1]=y+h; // actual boot line, not empty cell bottom
   return {p,left:(x-pivot[0])*fit,top:(y-pivot[1])*fit+20,w:w*fit,h:h*fit,pivot};
  });
  const width=Math.ceil(Math.max(...placements.map(p=>Math.max(Math.abs(p.left),Math.abs(p.left+p.w))))*density*2+pad*2);
  const height=Math.ceil(Math.max(...placements.map(p=>p.h))*density+pad*2),atlasWidth=width*3,atlasHeight=height*2;
  if(atlasWidth>2048||atlasHeight>2048)throw Error('Skill atlas exceeds mobile budget: '+slug+'/'+state);
  const output=Buffer.alloc(atlasWidth*atlasHeight*4);
  const frames=placements.map(({p,left,top},i)=>{
   const x=i%3*width,y=Math.floor(i/3)*height,dx=width/2+left*density;
   drawPackedPose(output,atlasWidth,p,x+dx,y+pad,fit*density);
   let hand;
   if(custom)hand={x:custom.grips[i][0],y:custom.grips[i][1],angle:custom.grips[i][2],behind:false};
   else {const base=heroGrip(art.path,i===5?0:i);if(base)hand={...base,x:base.x*source.width/2172,y:base.y*source.height/724};}
   const grip=hand?{...hand,x:dx+(hand.x-p.region[0])*fit*density,y:pad+(hand.y-p.region[1])*fit*density}:undefined;
   if(grip&&(grip.x<3||grip.y<3||grip.x>=width-3||grip.y>=height-3))throw Error('Gripping fist outside complete pose: '+slug+'/'+state+'/'+i);
   return {x,y,width,height,originX:.5,originY:(pad-top*density)/height,grip,bodyScale:1,bodyOffsetY:0};
  });
  if(!custom||custom.tintEffects){
   // Preserve the existing baked effect palette without deleting any alpha.
   const color=[profile.color>>16&255,profile.color>>8&255,profile.color&255];
   for(let i=0;i<output.length;i+=4){
    const r=output[i],g=output[i+1],b=output[i+2];if(!output[i+3])continue;
    const at=i/4,px=at%atlasWidth,py=Math.floor(at/atlasWidth),index=Math.floor(py/height)*3+Math.floor(px/width);
    // Neutral poses have no spell pixels: never recolor their eyes or skin.
    if(index===0||index===5)continue;
    const blue=b>120&&b>r*1.25&&b>g*.95;
    const gold=state==='crown-rally'&&r>120&&g>90&&r>b*1.25&&g>b*1.15;
    if(!blue&&!gold)continue;
    if(gold&&!blue){
     const pose=placements[index],guard=HERO_SKILL_BODY_GUARDS[art.texture][index];
     const sx=pose.p.region[0]+(px%width-width/2-pose.left*density)/(fit*density);
     const sy=pose.p.region[1]+(py%height-pad)/(fit*density);
     // Gold energy shares hues with skin and armor. Recolor only OUTSIDE the
     // authored body envelope; unlike the removed cropper, alpha stays intact.
     const margin=24,x=sx*2172/source.width,y=sy*724/source.height;
     if(x>=guard[0]-margin&&x<=guard[0]+guard[2]+margin&&y>=guard[1]-margin&&y<=guard[1]+guard[3]+margin)continue;
    }
    const peak=Math.max(r,g,b),white=Math.min(r,g,b)/Math.max(1,peak);
    for(let c=0;c<3;c++)output[i+c]=Math.round(peak*(white+(1-white)*color[c]/255));
   }
  }
  const spec={width:atlasWidth,height:atlasHeight,frames,preparationVersion:6,bodyRegistrationVersion:1,completeSkillPoses:true,sourceVersion:custom?2:1};
  manifest.states[state]=spec;
  prepared.push({state,png:writeRgbaPng(atlasWidth,atlasHeight,output),spec});
  console.log('Prepared complete skill poses:',slug,state,`${atlasWidth}x${atlasHeight}`);
 }
 // Do not publish half of an outfit if any later pose cannot be prepared.
 for(const {state,png,spec} of prepared){
  await writeFile(root+state+'-atlas-v1.png',png);
  await writeFile(root+state+'-registration-v1.json',JSON.stringify(spec));
 }
 await writeFile(root+'manifest-v1.json',JSON.stringify(manifest));
}
