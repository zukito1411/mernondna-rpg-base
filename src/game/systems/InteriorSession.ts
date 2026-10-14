import Phaser from 'phaser';
import {INTERIOR_ENTRIES,INTERIOR_RESIDENTS_BY_ENTRY,roomPlan,type InteriorEntry,type RoomPlan,type RoomRect} from '../../data/interiors';
import {NPC_BY_ID} from '../../data/npcs';
import {useGameStore} from '../../store/gameStore';
import type {Vec2} from '../types';
import type {WorldScene} from '../scenes/WorldScene';
import {Npc} from '../entities/Npc';
import {spriteSubjectCanvas} from './spriteArt';
import {actorSpriteGridSubjects} from './spriteComponents';
import {INTERIOR_ART,INTERIOR_FLOORS,interiorFloorIndex,type InteriorArtKey} from '../../data/interiorArt';
import {resolveQuestTarget,questBearing,activeObjective} from './questNavigation';
import {InteriorQuestRoutes} from './interiorQuestRoutes';

const DEPTH=10_000_000;
const SOURCE='interior-source',ATLAS='interior-furniture';
const FLOORS=['interior-floor','interior-floor-secondary'] as const;

/** A bounded room overlay in the existing scene. Outdoor physics/streaming
 * freeze; only the local player's swept feet advance, so hidden world actors
 * cannot fight, move or collide with room furniture. Saves use safePosition. */
export class InteriorSession {
  private entry:InteriorEntry|null=null;
  private plan:RoomPlan|null=null;
  private origin:Vec2={x:0,y:0};
  private outside:Vec2|null=null;
  private loading=false;
  private disposed=false;
  private objects:Phaser.GameObjects.GameObject[]=[];
  private residents:Npc[]=[];
  private hidden:Array<{object:Phaser.GameObjects.GameObject;visible:boolean;filter:number}>=[];
  private formerBounds:Phaser.Geom.Rectangle|null=null;
  private callbacks:{complete:()=>void;error:(file:Phaser.Loader.File)=>void}|null=null;
  private syncMs=0;
  private guide:Phaser.GameObjects.Graphics|null=null;
  private wallSolids:RoomRect[]=[];
  private floorMask:Phaser.Display.Masks.GeometryMask|null=null;
  private questRoutes:InteriorQuestRoutes|null=null;
  private questPath:Vec2[]=[];
  private questPathKey='';
  private nextGuideAt=0;
  private mapFloors:RoomRect[]=[];
  private guidePoint:Vec2|null=null;
  constructor(private readonly scene:WorldScene){}
  get active(){return this.loading||this.entry!==null;}
  get ready(){return this.entry!==null&&!this.loading;}
  get safePosition(){return this.outside;}
  getActor(npcId:string){return this.residents.find(n=>n.definition.id===npcId);}

  nearest(x:number,y:number){
    let nearest:InteriorEntry|undefined,distance=95;
    for(const entry of INTERIOR_ENTRIES){
      const d=Math.hypot(entry.door.x-x,entry.door.y-y);
      if(d<distance&&this.scene.interiorDoorClear(entry.door.x,entry.door.y)
        &&this.scene.hasClearPath(x,y,entry.door.x,entry.door.y)){nearest=entry;distance=d;}
    }
    return nearest;
  }
  enter(entry:InteriorEntry){
    if(this.active||this.disposed)return;
    for(const enemy of this.scene.enemySteeringActors())if(enemy.active&&enemy.hp>0
      &&Math.hypot(enemy.x-this.scene.player.x,enemy.y-this.scene.player.y)<500){
      this.scene.notify('Leave combat before entering a building.');return;
    }
    this.outside={x:this.scene.player.x,y:this.scene.player.y};
    this.scene.player.resetInput();this.scene.targeting.clear();this.scene.physics.world.pause();
    this.loading=true;this.scene.notify(`Entering ${entry.name}…`);
    const complete=()=>{
      this.detachLoader();
      if(this.disposed)return;
      try{
        if(!this.scene.textures.exists(SOURCE))throw new Error('Interior kit unavailable');
        this.prepareArt();this.open(entry);
      }catch(error){if(this.entry)this.exit();this.loading=false;this.entry=null;this.outside=null;this.releaseArt();this.scene.physics.world.resume();
        this.scene.notify(`Could not enter: ${error instanceof Error?error.message:String(error)}`);}
    };
    const error=(file:Phaser.Loader.File)=>{
      if(file.key!==SOURCE)return;
      this.detachLoader();this.loading=false;this.outside=null;this.releaseArt();
      this.scene.physics.world.resume();
      this.scene.notify('Interior art could not load. You remain outside.');
    };
    this.callbacks={complete,error};
    this.scene.load.once(Phaser.Loader.Events.COMPLETE,complete);
    this.scene.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,error);
    this.scene.load.image(SOURCE,`assets/interiors/${entry.kit}/kit.png`);
    if(!this.scene.load.isLoading())this.scene.load.start();
  }
  private prepareArt(){
    const image=this.scene.textures.get(SOURCE).getSourceImage() as HTMLImageElement;
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
    const atlas=this.scene.textures.createCanvas(ATLAS,256*8,256*3)!;
    for(const [index,[art,[left,top,w,h]]] of Object.entries(INTERIOR_ART).entries()){
      const subject=actorSpriteGridSubjects(ctx.getImageData(left,top,w,h).data,w,h,1,1,{rejectEdgeFragments:true})[0];
      const pose=spriteSubjectCanvas(subject),fit=248/Math.max(pose.width,pose.height);
      const width=pose.width*fit,height=pose.height*fit;
      const x=(index%8)*256,y=Math.floor(index/8)*256;
      atlas.getContext().drawImage(pose,x+(256-width)/2,y+252-height,width,height);
      atlas.add(art,0,x,y,256,256)!.customData={visibleWidth:width,visibleHeight:height};
    }
    atlas.refresh();
    // Inner floor only: excludes the illustrated source-square outline.
    for(const [index,[x,y,w,h]] of INTERIOR_FLOORS.entries()){
      const floor=this.scene.textures.createCanvas(FLOORS[index],176,176)!;
      floor.getContext().drawImage(image,x,y,w,h,0,0,176,176);floor.refresh();
    }
    this.scene.textures.remove(SOURCE);
  }
  private own<T extends Phaser.GameObjects.GameObject>(object:T):T {this.objects.push(object);return object;}
  private artHeight(art:InteriorArtKey,width:number){
    const dimensions=this.scene.textures.getFrame(ATLAS,art).customData as {visibleWidth:number;visibleHeight:number};
    return width*dimensions.visibleHeight/dimensions.visibleWidth;
  }
  private drawArt(art:InteriorArtKey,x:number,y:number,width:number,depth:number){
    const image=this.own(this.scene.add.image(this.origin.x+x,this.origin.y+y,ATLAS,art));
    const dimensions=image.frame.customData as {visibleWidth:number;visibleHeight:number};
    return image.setOrigin(.5,252/256).setScale(width/dimensions.visibleWidth).setDepth(depth);
  }
  private renderWalls(){
    const plan=this.plan!,edges=new Map<string,{side:'north'|'west'|'east';axis:number;spans:Array<[number,number]>}>();
    const inside=(x:number,y:number)=>plan.floors.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height);
    // Exact rectangle-union edge intervals. No wall is laid across a corridor
    // opening, even at overlap joins or when rooms have different dimensions.
    for(const r of plan.floors)for(const side of ['north','west','east'] as const){
      const horizontal=side==='north',axis=horizontal?r.y:side==='west'?r.x:r.x+r.width;
      const from=horizontal?r.x:r.y,to=from+(horizontal?r.width:r.height);
      const breaks=[...new Set([from,to,...plan.floors.flatMap(f=>horizontal?[f.x,f.x+f.width]:[f.y,f.y+f.height])
        .filter(p=>p>from&&p<to)])].sort((a,b)=>a-b);
      const key=side+':'+axis,edge=edges.get(key)??{side,axis,spans:[] as Array<[number,number]>};
      for(let i=1;i<breaks.length;i++){
        const start=breaks[i-1],end=breaks[i],middle=(start+end)/2;
        const covered=horizontal?inside(middle,axis-.1):inside(axis+(side==='west'?-.1:.1),middle);
        if(!covered)edge.spans.push([start,end]);
      }
      edges.set(key,edge);
    }
    this.wallSolids=[];
    for(const {side,axis,spans} of edges.values()){
      spans.sort((a,b)=>a[0]-b[0]);const merged:Array<[number,number]>=[];
      for(const span of spans){const last=merged.at(-1);if(last&&span[0]<=last[1])last[1]=Math.max(last[1],span[1]);else merged.push([span[0],span[1]]);}
      for(const [start,end] of merged){
        const north=side==='north',length=end-start,count=Math.max(1,Math.ceil(length/(north?180:120))),step=length/count;
        this.wallSolids.push(north?{x:start,y:axis,width:length,height:40}
          :{x:side==='west'?axis:axis-22,y:start,width:22,height:length});
        for(let i=0;i<count;i++){
          if(north)this.drawArt('northWall',start+(i+.5)*step,axis+38,step+1,DEPTH+axis+38);
          else {
            const x=axis+(side==='west'?10:-10),y=start+(i+1)*step;
            const ratio=this.artHeight('sideWall',1);
            this.drawArt('sideWall',x,y,step/ratio,DEPTH+y).setFlipX(side==='east');
          }
        }
      }
    }
  }
  private open(entry:InteriorEntry){
    const scene=this.scene,plan=roomPlan(entry.hall,entry.name,entry.profile,entry.kit);this.entry=entry;this.plan=plan;this.loading=false;
    this.origin={x:this.outside!.x-plan.entrance.x,y:this.outside!.y-plan.entrance.y};
    this.mapFloors=plan.floors.map(r=>({x:this.origin.x+r.x,y:this.origin.y+r.y,width:r.width,height:r.height}));
    const camera=scene.cameras.main;
    for(const object of scene.children.list){
      if(object===scene.player)continue;
      if('visible' in object&&'cameraFilter' in object){
        const render=object as Phaser.GameObjects.GameObject&{visible:boolean;cameraFilter:number};
        this.hidden.push({object,visible:render.visible,filter:render.cameraFilter});camera.ignore(object);
      }
    }
    this.formerBounds=camera.useBounds?Phaser.Geom.Rectangle.Clone(camera.getBounds()):null;camera.removeBounds();
    this.own(scene.add.rectangle(0,0,scene.scale.width*8,scene.scale.height*8,0x000000)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH-1000));
    for(const floor of plan.floors)this.own(scene.add.tileSprite(this.origin.x+floor.x,this.origin.y+floor.y,
      floor.width,floor.height,FLOORS[interiorFloorIndex(entry.kit,floor.kind)]).setOrigin(0).setDepth(DEPTH-900));
    for(const object of plan.objects)this.drawArt(object.art,object.x,object.y,object.width,
      object.art==='rug'?DEPTH-800:DEPTH+object.y);
    this.renderWalls();
    // The open arch is a doorway, never the wardrobe/counter source. Its
    // transparent opening and the vestibule footprint share the same centre.
    this.drawArt('doorway',plan.entrance.x,plan.entrance.y+55,190,DEPTH+plan.entrance.y+55);
    for(const dx of [-95,43])this.wallSolids.push({x:plan.entrance.x+dx,y:plan.entrance.y-50,width:52,height:105});
    for(const r of plan.rooms){
      this.own(scene.add.text(this.origin.x+r.x+r.width/2,this.origin.y+r.y+100,r.label,
        {fontFamily:'Georgia, serif',fontSize:'11px',color:'#bba67d',stroke:'#19140f',strokeThickness:2})
        .setResolution(2).setOrigin(.5).setDepth(DEPTH+3000).setAlpha(.7));
    }
    if(scene.textures.exists('warm-light')){
      const maskShape=this.own(scene.make.graphics({x:0,y:0}));maskShape.setVisible(false);
      for(const r of plan.floors)maskShape.fillStyle(0xffffff).fillRect(this.origin.x+r.x,this.origin.y+r.y,r.width,r.height);
      this.floorMask=maskShape.createGeometryMask();
      for(const [index,r] of plan.rooms.entries()){
        const x=r.x+r.width/2,y=r.y+160;
        this.drawArt('lantern',r.x+65,r.y+100,40,DEPTH+r.y+100);
        const glow=this.own(scene.add.image(this.origin.x+x,this.origin.y+y,'warm-light')
          .setDisplaySize(290,220).setAlpha(.14).setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(DEPTH+2500).setMask(this.floorMask));
        scene.tweens.add({targets:glow,alpha:.22,duration:1600+index*97,yoyo:true,repeat:-1});
      }
    }
    for(const resident of INTERIOR_RESIDENTS_BY_ENTRY[entry.id]??[]){
      const definition=NPC_BY_ID[resident.npcId];if(!definition)continue;
      const royal=['elarion-king','lady-adria-vale'].includes(definition.id)&&plan.throneResident;
      const preferred=resident.guardSide&&plan.guardPosts?plan.guardPosts[resident.guardSide]
        :royal||plan.residents[Math.min(resident.slot,plan.residents.length-1)];
      const p=this.residentPosition(preferred);
      const world={x:this.origin.x+p.x,y:this.origin.y+p.y};
      const npc=new Npc(scene,{...definition,stationary:true},world.x,world.y,world);
      npc.storyRest();npc.setDepth(DEPTH+p.y);npc.setInteriorLabelDepth(DEPTH-this.origin.y);
      this.residents.push(npc);this.objects.push(npc);
      npc.on('pointerdown',()=>{if(this.reachableResident(npc))this.talk(npc);});
    }
    this.guide=this.own(scene.add.graphics().setDepth(DEPTH+3000));
    scene.player.resetInput();scene.player.setDepth(DEPTH+plan.entrance.y);
    camera.centerOn(scene.player.x,scene.player.y);
    const story=useGameStore.getState(),visitFlag='visited:interior:'+entry.id;
    if(!story.storyFlags[visitFlag])story.setStoryFlag(visitFlag);
    const objective=activeObjective(story.quests,story.trackedQuestId)?.objective;
    if(objective?.type==='visit'&&objective.targetId===entry.id)story.progressQuest('visit',entry.id);
    this.scene.notify(`${entry.name} — use the south doorway to leave.`);
  }
  private residentPosition(preferred:Vec2):Vec2 {
    const plan=this.plan!;
    const clear=(p:Vec2)=>{
      const person={x:p.x-36,y:p.y-84,width:72,height:84};
      if(!plan.floors.some(r=>person.x>=r.x+40&&person.x+person.width<=r.x+r.width-40
        &&person.y>=r.y+40&&p.y<=r.y+r.height-40))return false;
      const touches=(a:RoomRect,b:RoomRect)=>a.x<b.x+b.width&&a.x+a.width>b.x
        &&a.y<b.y+b.height&&a.y+a.height>b.y;
      const feet={x:p.x-14,y:p.y-24,width:28,height:24};
      if(this.wallSolids.some(r=>touches(feet,r))||plan.objects.some(o=>o.solid&&touches(feet,o.solid)))return false;
      // Conservative complete furniture bounds: a resident must not start
      // beneath a foreground counter, bed, shelf or planter. Rugs/stairs are
      // floor artwork. Prefer the authored workplace before looking nearby.
      if(plan.objects.some(o=>o.art!=='rug'&&o.y>p.y
        &&touches(person,{x:o.x-o.width/2,y:o.y-this.artHeight(o.art,o.width),width:o.width,height:this.artHeight(o.art,o.width)})))return false;
      return this.residents.every(n=>Math.abs(n.x-this.origin.x-p.x)>=80
        ||Math.abs(n.y-this.origin.y-p.y)>=112);
    };
    const offsets:Array<[number,number]>=[[0,0]];
    for(const radius of [48,80,112,160,224,288])
      for(const [dx,dy] of [[-1,0],[1,0],[0,1],[0,-1],[-1,1],[1,1],[-1,-1],[1,-1]])offsets.push([dx*radius,dy*radius]);
    const position=offsets.map(([dx,dy])=>({x:preferred.x+dx,y:preferred.y+dy})).find(clear);
    if(!position)throw new Error('No clear interior workplace for resident');
    return position;
  }
  private validFeet(x:number,y:number,ignoreResident?:Npc){
    if(!this.plan)return false;
    const local={x:x-this.origin.x,y:y-this.origin.y};
    // Full 24x24 foot footprint, including corners at floor/corridor joins.
    for(const dx of [-12,0,12])for(const dy of [-24,-12,0])
      if(!this.plan.floors.some(r=>local.x+dx>=r.x&&local.x+dx<=r.x+r.width
        &&local.y+dy>=r.y&&local.y+dy<=r.y+r.height))return false;
    const feet={x:local.x-12,y:local.y-24,width:24,height:24};
    const overlaps=(r:RoomRect)=>feet.x<r.x+r.width&&feet.x+feet.width>r.x
      &&feet.y<r.y+r.height&&feet.y+feet.height>r.y;
    return !this.wallSolids.some(overlaps)&&!this.plan.objects.some(o=>o.solid&&overlaps(o.solid))
      &&!this.residents.some(n=>n!==ignoreResident&&overlaps({x:n.x-this.origin.x-14,y:n.y-this.origin.y-24,width:28,height:24}));
  }
  clearPath(a:Vec2,b:Vec2,skipResident?:Npc){
    if(!this.validFeet(b.x,b.y,skipResident))return false;
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6));
    // Ignore only the person being spoken to, not intervening furniture, walls
    // or other residents. Include the endpoint even for a sub-six-unit path.
    for(let i=1;i<steps;i++)if(!this.validFeet(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,skipResident))return false;
    return true;
  }
  private reachableResident(npc:Npc){return Math.hypot(npc.x-this.scene.player.x,npc.y-this.scene.player.y)<90
    &&this.clearPath(this.scene.player,npc,npc);}
  private guideWaypoint(target:Vec2,key:string){
    const player=this.scene.player;
    if(!this.plan)return target;
    if(this.questPathKey===key&&this.guidePoint&&this.scene.time.now<this.nextGuideAt)return this.guidePoint;
    const resident=this.residents.find(n=>key==='npc:'+n.definition.id);
    const goal=resident?[{x:resident.x,y:resident.y+58},{x:resident.x-58,y:resident.y},{x:resident.x+58,y:resident.y}]
      .find(p=>this.validFeet(p.x,p.y))??target:target;
    if(this.clearPath(player,goal)){
      this.questPath=[];this.questPathKey=key;this.nextGuideAt=this.scene.time.now+200;this.guidePoint={...goal};return goal;
    }
    if(!this.questRoutes){
      const left=Math.min(...this.plan.floors.map(r=>r.x)),top=Math.min(...this.plan.floors.map(r=>r.y));
      const right=Math.max(...this.plan.floors.map(r=>r.x+r.width)),bottom=Math.max(...this.plan.floors.map(r=>r.y+r.height));
      this.questRoutes=new InteriorQuestRoutes({x:this.origin.x+left,y:this.origin.y+top,width:right-left,height:bottom-top},
        p=>this.validFeet(p.x,p.y),(a,b)=>this.clearPath(a,b));
    }
    if(this.questPathKey!==key||this.scene.time.now>=this.nextGuideAt){
      const first=this.questPath[0];
      if(this.questPathKey!==key||!first||Math.hypot(first.x-player.x,first.y-player.y)>170)
        this.questPath=this.questRoutes.route(player,goal);
      this.questPathKey=key;this.nextGuideAt=this.scene.time.now+200;
      while(this.questPath.length>1&&Math.hypot(this.questPath[0].x-player.x,this.questPath[0].y-player.y)<55)this.questPath.shift();
    }
    const point=this.questPath[0]??player;this.guidePoint={x:point.x,y:point.y};return this.guidePoint;
  }
  update(time:number,delta:number,blocked:boolean){
    this.scene.physics.world.pause();
    if(this.loading){this.scene.player.discardActions();return;}
    if(!this.entry||!this.plan)return;
    const player=this.scene.player,body=player.body as Phaser.Physics.Arcade.Body;
    if(blocked){this.guide?.setVisible(false);player.discardActions();body.setVelocity(0,0);return;}
    this.guide?.setVisible(true);
    const startingEntry=this.entry;
    player.updatePlayer(time,Math.min(delta,80));
    if(this.entry!==startingEntry)return; // Interact may have exited the room.
    const dx=body.velocity.x*Math.min(delta,80)/1000,dy=body.velocity.y*Math.min(delta,80)/1000;
    const velocity=body.velocity.clone(),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
    let x=player.x,y=player.y;
    for(let i=0;i<steps;i++){
      if(this.validFeet(x+dx/steps,y))x+=dx/steps;
      if(this.validFeet(x,y+dy/steps))y+=dy/steps;
    }
    body.reset(x,y);body.setVelocity(velocity.x,velocity.y);player.setDepth(DEPTH+y-this.origin.y);
    for(const npc of this.residents)npc.setDepth(DEPTH+npc.y-this.origin.y);
    const near=this.residents.find(n=>this.reachableResident(n));
    const exit=this.plan.entrance,nearExit=Math.hypot(x-this.origin.x-exit.x,y-this.origin.y-exit.y)<80;
    const store=useGameStore.getState();
    let target=resolveQuestTarget(store.quests,store.worldContent,player,id=>{
      const npc=id.startsWith('npc:')?this.getActor(id.slice(4)):undefined;return npc;
    },store.trackedQuestId,this.entry.id);
    if(target&&!this.residents.some(n=>target!.contentId==='npc:'+n.definition.id))target={...target,worldLocation:{x:target.x,y:target.y},
      x:this.origin.x+exit.x,y:this.origin.y+exit.y,contentId:'interior:exit:'+this.entry.id,
      label:`Leave ${this.entry.name} — ${target.label}`};
    else if(target)target={...target,worldLocation:{...this.entry.door}};
    if(target){const p=this.guideWaypoint(target,target.contentId);target={...target,waypoint:{x:p.x,y:p.y,label:'Follow the clear room passages'}};}
    for(const npc of this.residents)npc.updatePresentation(x,y,target?.contentId==='npc:'+npc.definition.id);
    for(const npc of this.residents)npc.setInteriorLabelDepth(DEPTH-this.origin.y);
    this.guide?.clear();
    if(target&&this.guide){
      const approach=target.waypoint??target,angle=questBearing(player,approach),dx=Math.sin(angle),dy=-Math.cos(angle),gx=x+dx*48,gy=y+dy*48;
      if(Math.hypot(approach.x-x,approach.y-y)>10)this.guide.fillStyle(0xffd976,.95).fillTriangle(gx+dx*9,gy+dy*9,gx-dx*5-dy*6,gy-dy*5+dx*6,gx-dx*5+dy*6,gy-dy*5-dx*6);
      this.guide.lineStyle(2,0xffd976,.8).strokeEllipse(target.x,target.y+2,28,10);
    }
    store.setNavigation({heading:Math.atan2(player.lastDirection.x,-player.lastDirection.y),target,
      playerPosition:{x,y},interiorName:this.entry.name,interiorFloors:this.mapFloors,
      markers:this.residents.map(n=>({id:'npc:'+n.definition.id,kind:'npc' as const,label:n.definition.name,x:n.x,y:n.y})),
      interaction:near?`Talk to ${near.definition.name}`:nearExit?'Leave building':null});
    this.syncMs+=Math.min(delta,80);
    if(this.syncMs>=500){this.syncMs=0;this.scene.syncState();}
  }
  interact(){
    const player=this.scene.player,near=this.residents.find(n=>this.reachableResident(n));
    if(near){this.talk(near);return;}
    if(this.plan&&Math.hypot(player.x-this.origin.x-this.plan.entrance.x,player.y-this.origin.y-this.plan.entrance.y)<80)this.exit();
    else this.scene.notify('Speak to a resident or return to the south doorway.');
  }
  private talk(npc:Npc){useGameStore.getState().startDialogue(npc.definition.id);}
  exit(){
    if(!this.entry)return;
    const returnPoint=this.outside!;this.entry=null;this.plan=null;
    this.questRoutes=null;this.questPath=[];this.questPathKey='';this.nextGuideAt=0;this.mapFloors=[];this.guidePoint=null;
    for(const object of this.objects){this.scene.tweens.killTweensOf(object);object.destroy();}this.objects=[];this.residents=[];this.guide=null;
    this.floorMask?.destroy();this.floorMask=null;this.wallSolids=[];
    for(const saved of this.hidden){if(saved.object.scene)saved.object.cameraFilter=saved.filter;}this.hidden=[];
    this.scene.player.resetInput();this.scene.restoreOutsidePosition(returnPoint);
    if(this.formerBounds)this.scene.cameras.main.setBounds(this.formerBounds.x,this.formerBounds.y,this.formerBounds.width,this.formerBounds.height);
    this.scene.cameras.main.centerOn(returnPoint.x,returnPoint.y);this.outside=null;this.formerBounds=null;
    this.releaseArt();this.scene.physics.world.resume();this.scene.syncState();
  }
  private detachLoader(){
    if(!this.callbacks)return;
    this.scene.load.off(Phaser.Loader.Events.COMPLETE,this.callbacks.complete);
    this.scene.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR,this.callbacks.error);this.callbacks=null;
  }
  private releaseArt(){for(const key of [SOURCE,ATLAS,...FLOORS])if(this.scene.textures.exists(key))this.scene.textures.remove(key);}
  destroy(){this.disposed=true;this.detachLoader();this.exit();this.releaseArt();}
}
