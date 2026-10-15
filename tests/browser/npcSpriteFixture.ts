import Phaser from 'phaser';
import {NPC_COMBAT_ART,NPC_COMBAT_DIRECTIONS,npcCombatKey} from '../../src/data/npcCombatArt';
import {ART_BY_KEY,type ArtTextureKey} from '../../src/data/art';
import {npcCombatSourceKey,prepareNpcCombatSheet} from '../../src/game/systems/NpcCombatArt';
import {NPC_WALK_ART,npcWalkPath,npcWalkTexture} from '../../src/data/npcWalkArt';
import {GUARD_MARCH_ART,guardMarchTexture} from '../../src/data/guardMarchArt';
import {prepareNpcWalkArt} from '../../src/game/systems/NpcWalkArt';
import {prepareGuardMarchArt,guardMarchScale} from '../../src/game/systems/GuardMarchArt';
import type {SpriteAnimation} from '../../src/data/animationPacks';
import {NPC_IDLE_ART,npcIdleSources} from '../../src/data/npcIdleArt';
import {CITIZEN_SOURCES,prepareCitizenArt} from '../../src/game/systems/RegionalCitizenArt';
import {alphaFrameBounds,createSpriteCropper} from '../../src/game/systems/spriteArt';
import {Npc} from '../../src/game/entities/Npc';
import {NPCS} from '../../src/data/npcs';
import type {WorldScene} from '../../src/game/scenes/WorldScene';

/** Small real-WebGL review of production preparation, without booting a world. */
export function openNpcSpriteReview(){
  class Review extends Phaser.Scene{
    preload(){
      for(const spec of NPC_COMBAT_ART)spec.sources.forEach((source,i)=>this.load.image(npcCombatSourceKey(spec,i),'/'+source.path));
      for(const spec of NPC_WALK_ART)this.load.image('npc-walk-source:'+spec.walk,'/'+npcWalkPath(spec));
      for(const spec of GUARD_MARCH_ART)this.load.image('guard-march-source:'+spec.walk,'/'+spec.path);
      for(const spec of NPC_IDLE_ART)this.load.image('source:'+spec.path,'/'+spec.path);
      for(const spec of CITIZEN_SOURCES)this.load.image(spec.key,'/'+spec.path);
    }
    create(){
      const report:{id:string;error?:string;frames:number;border:number;uv:number}[]=[];
      const register=(clips:SpriteAnimation[])=>{
        for(const clip of clips)this.anims.create({key:clip.key,frames:clip.frames.map(frame=>({key:clip.texture,frame})),frameRate:clip.frameRate,repeat:clip.repeat});
      };
      // Reference idles only: the locomotion/combat packers and Npc class below
      // are production code. Do not boot unrelated world/enemy/effect assets.
      const crop=createSpriteCropper();
      for(const spec of NPC_IDLE_ART){
        const sheet=ART_BY_KEY[spec.key],fw=sheet.frameWidth*2,fh=sheet.frameHeight*2;
        const source=this.textures.get('source:'+spec.path).getSourceImage() as HTMLImageElement;
        const native=document.createElement('canvas');native.width=source.width;native.height=source.height;
        const ctx=native.getContext('2d')!;ctx.drawImage(source,0,0);
        const pixels=ctx.getImageData(0,0,source.width,source.height).data;
        const texture=this.textures.createCanvas(spec.key,fw*6,fh)!;
        npcIdleSources(spec).forEach((pose,i)=>{
          const bounds=alphaFrameBounds(pixels,source.width,pose.cell)!;
          const w=bounds[2]*pose.renderScale!*2,h=bounds[3]*pose.renderScale!*2;
          crop(texture.getContext(),source,bounds,i*fw+(fw-w)/2,fh-4-h,w,h);
          texture.add(i,0,i*fw,0,fw,fh);
        });
        texture.refresh();native.width=native.height=1;
        register([{key:spec.walk+'-idle',texture:spec.key,frames:[0,1,2,3,4,5],frameRate:2.5,repeat:-1}]);
      }
      prepareCitizenArt(this);
      const audit=(id:string,key:ArtTextureKey)=>{
        const texture=this.textures.get(key),canvas=texture.getSourceImage() as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
        let border=0,uv=0;
        if(canvas.width>2048||canvas.height>2048)throw new Error('NPC atlas exceeds mobile texture budget: '+id);
        for(let i=0;i<ART_BY_KEY[key].columns;i++){
          const f=texture.get(i),pixels=ctx.getImageData(f.cutX,f.cutY,f.cutWidth,f.cutHeight).data;
          for(let y=0;y<f.cutHeight;y++)for(let x=0;x<f.cutWidth;x++)
            if(pixels[(y*f.cutWidth+x)*4+3]>32&&(x<2||y<2||x>=f.cutWidth-2||y>=f.cutHeight-2))border++;
          if(Math.abs(f.u0-f.cutX/canvas.width)>1e-7||Math.abs(f.v0-f.cutY/canvas.height)>1e-7
            ||Math.abs(f.u1-(f.cutX+f.cutWidth)/canvas.width)>1e-7||Math.abs(f.v1-(f.cutY+f.cutHeight)/canvas.height)>1e-7)uv++;
        }
        report.push({id,frames:ART_BY_KEY[key].columns,border,uv});
      };
      try{
        register(prepareNpcWalkArt(this));register(prepareGuardMarchArt(this));
        for(const spec of NPC_WALK_ART)audit('walk-'+spec.id,npcWalkTexture(spec.walk)!);
        for(const spec of GUARD_MARCH_ART)audit('walk-'+spec.walk,spec.texture);
      }catch(error){report.push({id:'walking',error:String(error),frames:0,border:0,uv:0});}
      for(const spec of NPC_COMBAT_ART){
        try{
          register(prepareNpcCombatSheet(this,spec));audit(spec.id,spec.texture);
        }catch(error){report.push({id:spec.id,error:String(error),frames:0,border:0,uv:0});}
      }
      (window as any).__npcReview={scene:this,report,actors:()=>{
        const issues:string[]=[];let fighters=0,walks=0,attacks=0;
        for(const definition of NPCS.filter(npc=>npc.combatant)){
          const npc=new Npc(this as unknown as WorldScene,definition,400,400,{x:400,y:400});
          // Test access to the real movement presenter; no AI/path simulation.
          const present=npc as unknown as {playDirection(x:number,y:number,walking:boolean):void};
          const body=npc.body as Phaser.Physics.Arcade.Body;
          fighters++;
          try{
            if(!npc.canStoryFight)throw new Error('missing walking/combat clips');
            for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]){
              body.setVelocity(dx*44,dy*44);present.playDirection(dx,dy,true);
              if(!npc.anims.isPlaying)throw new Error('walking failed');
              const check=()=>{
                if(!(npc.frame.customData as {isolatedSubject?:boolean}).isolatedSubject)throw new Error('unisolated frame');
                body.updateFromGameObject();
                if(Math.abs(body.bottom-npc.y)>.1)throw new Error('collision feet drift');
              };
              const count=npc.anims.currentAnim!.frames.length;
              for(let i=0;i<count;i++){npc.anims.setProgress((i+.1)/count);check();walks++;}
              npc.storyRest();npc.beginStoryGuard();
              if(!npc.beginStoryAttack({x:npc.x+dx*80,y:npc.y+dy*80}))throw new Error('attack failed');
              let strike=false;
              for(let tick=0;tick<12;tick++){npc.anims.update(tick*100,100);check();strike ||=npc.storyStrikeReady;}
              if(!strike||!npc.storyAttackFinished)throw new Error('attack impact/completion failed');
              attacks++;npc.endStoryAttack();npc.endStoryGuard();
            }
          }catch(error){issues.push(definition.id+': '+String(error));}finally{npc.destroy();}
        }
        return {issues,fighters,walks,attacks};
      },render:(id:string)=>{
        this.children.removeAll(true);
        const spec=NPC_COMBAT_ART.find(a=>a.id===id);
        const walker=NPC_WALK_ART.find(a=>'walk-'+a.id===id);
        const guard=GUARD_MARCH_ART.find(a=>'walk-'+a.walk===id);
        const walk=spec?.walk??walker?.walk??guard!.walk;
        const walkingTexture=spec?.walkRows?spec.texture:guardMarchTexture(walk)??npcWalkTexture(walk)!;
        this.add.text(20,15,id+' - walk then attack / DOWN, LEFT, RIGHT, UP',{fontSize:'20px',color:'#ffffff'});
        NPC_COMBAT_DIRECTIONS.forEach((direction,row)=>{
          const clips=[{state:'walk',key:spec?.walkRows?npcCombatKey(spec,'walk',direction):walk+'-'+direction,texture:walkingTexture},
            ...(spec?[{state:'attack',key:npcCombatKey(spec,'attack',direction),texture:spec.texture}]:[])];
          let column=0;
          for(const {state,key,texture} of clips){
            const clip=this.anims.get(key),sheet=ART_BY_KEY[texture];
            if(!clip)continue;
            for(const frame of clip.frames){
              const x=100+column*145,y=230+row*235;
              this.add.ellipse(x,y,34,8,0x111111,.25);
              const idle=NPC_IDLE_ART.find(a=>a.walk===walk);
              const scale=state==='walk'&&guardMarchTexture(walk)===texture
                ?guardMarchScale(this,texture,idle!)*(walk==='npc_elven_guard'?1.12:1)
                :(walk==='npc_elven_guard'?1.12:1)/sheet.density;
              this.add.sprite(x,y,texture,frame.textureFrame).setScale(scale*1.5)
                .setOrigin(.5,1-(sheet.groundPadding??2)/sheet.frameHeight);
              this.add.text(x,y+20,direction+' '+state+' '+column,{fontSize:'12px',color:'#ffffff'}).setOrigin(.5);
              column++;
            }
          }
        });
      }};
    }
  }
  return new Phaser.Game({type:Phaser.WEBGL,width:1920,height:1040,backgroundColor:'#35453d',
    antialias:true,pixelArt:false,physics:{default:'arcade',arcade:{gravity:{x:0,y:0}}},
    scene:[Review],render:{preserveDrawingBuffer:true}});
}
