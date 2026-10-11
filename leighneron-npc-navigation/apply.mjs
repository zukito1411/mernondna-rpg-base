import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changes = new Map();
const issues = [];
const normalize = text => text.replace(/\r\n?/g, '\n');

function edit(file, callback) {
  const full = path.resolve(root, file);
  try {
    if (!fs.existsSync(full)) throw new Error('File is missing.');
    const raw = fs.readFileSync(full, 'utf8');
    const lf = normalize(raw);
    if (lf.includes('npcDetourWaypoint(') && file.endsWith('Npc.ts')) {
      throw new Error('NPC navigation patch already appears to be installed. No changes made.');
    }
    const updated = callback(lf);
    if (updated === lf) throw new Error('No modifications were produced.');
    changes.set(file, {full, raw, updated:raw.includes('\r\n') ? updated.replace(/\n/g,'\r\n') : updated});
  } catch(error) {issues.push({file,message:error instanceof Error?error.message:String(error)});}
}
function one(text,needle,replacement,label) {
  const hits=text.split(needle).length-1;
  if(hits!==1)throw new Error(`${label}: expected one match, found ${hits}`);
  return text.replace(needle,replacement);
}

edit('src/game/entities/Npc.ts', s=>{
  s=one(s,
    '  private escortGoal:Vec2|null=null;',
    `  private escortGoal:Vec2|null=null;
  // A temporary side step never consumes the original scheduled waypoint.
  private npcDetour:Vec2|null=null;
  private lastAvoidAttempt=0;
  private avoidSide=1;`, 'NPC fields');
  s=one(s,
    '  beginEscort(goal:Vec2) {this.escortGoal={...goal};this.route=[];this.target=null;}',
    '  beginEscort(goal:Vec2) {this.escortGoal={...goal};this.route=[];this.target=null;this.npcDetour=null;}', 'Escort route reset');
  s=one(s,
    '    if(!this.mayPatrol&&!this.escortGoal){\n      body.setVelocity(0,0);',
    '    if(!this.mayPatrol&&!this.escortGoal){\n      this.npcDetour=null;\n      body.setVelocity(0,0);', 'Stationary NPC reset');
  s=one(s,
    '        this.routineAnchor=toWorld(location);this.target=null;this.returningHome=false;',
    '        this.routineAnchor=toWorld(location);this.target=null;this.npcDetour=null;this.returningHome=false;', 'Routine change');
  const block=`    if(this.target) {
      const moved=Math.hypot(this.x-this.previousPosition.x,this.y-this.previousPosition.y);
      this.stalledMs=moved<.1?this.stalledMs+Math.min(delta,250):0;
      const length=Math.hypot(this.target.x-this.x,this.target.y-this.y),step=Math.min(1,24/Math.max(1,length));
      const ahead={x:this.x+(this.target.x-this.x)*step,y:this.y+(this.target.y-this.y)*step};
      const checkRoute=this.routeCheckMs>=120;if(checkRoute)this.routeCheckMs=0;
      if(this.stalledMs>2000 || checkRoute&&!scene.canNpcVisit(this,ahead)){this.target=null;this.route=[];this.nextPatrolAt=time+1500;this.stalledMs=0;}
    }`;
  const repl=`    if(this.target) {
      const moved=Math.hypot(this.x-this.previousPosition.x,this.y-this.previousPosition.y);
      this.stalledMs=moved<.12?this.stalledMs+Math.min(delta,250):0;
      if(this.npcDetour && Math.hypot(this.x-this.npcDetour.x,this.y-this.npcDetour.y)<12) {
        this.npcDetour=null;this.stalledMs=0;
      }
      const activeGoal=this.npcDetour??this.target;
      const length=Math.hypot(activeGoal.x-this.x,activeGoal.y-this.y);
      const step=Math.min(1,36/Math.max(1,length));
      const ahead={x:this.x+(activeGoal.x-this.x)*step,y:this.y+(activeGoal.y-this.y)*step};
      const checkRoute=this.routeCheckMs>=120;
      if(checkRoute)this.routeCheckMs=0;
      if(checkRoute || this.stalledMs>1050) {
        const blocker=scene.npcPathBlocker(this,ahead,this);
        const obstructed=!scene.canNpcVisit(this,ahead)||Boolean(blocker)||this.stalledMs>1050;
        if(obstructed && (time-this.lastAvoidAttempt>420||this.lastAvoidAttempt===0)) {
          this.lastAvoidAttempt=time;
          this.npcDetour=this.npcDetourWaypoint(scene,blocker);
          this.stalledMs=0;
        }
        if(obstructed && !this.npcDetour) {
          // Wait if both bypass lanes are obstructed. Never delete the route:
          // when the pedestrian moves, this NPC resumes the same destination.
          body.setVelocity(0,0);
          this.playDirection(this.facing.x,this.facing.y,false);
          this.previousPosition={x:this.x,y:this.y};
          return;
        }
      }
    }`;
  s=one(s,block,repl,'Blocked-route behavior');
  s=one(s,
    '    const dx = this.target.x - this.x, dy = this.target.y - this.y;',
    '    const navigationGoal=this.npcDetour??this.target;\n    const dx = navigationGoal.x - this.x, dy = navigationGoal.y - this.y;', 'Steer toward temporary detour');
  s=one(s,
    '      this.target = null;\n      if (!this.returningHome && !this.route.length)',
    '      this.target = null;this.npcDetour=null;\n      if (!this.returningHome && !this.route.length)', 'Destination arrival');
  const method=`  /** Try a short sidestep to either side of the blockage. The real target
   * and remaining schedule never change, so movement rejoins the old path. */
  private npcDetourWaypoint(scene:WorldScene, blocker:Vec2|null):Vec2|null {
    if(!this.target)return null;
    const dx=this.target.x-this.x,dy=this.target.y-this.y;
    const length=Math.hypot(dx,dy);
    if(length<1)return null;
    const forwardX=dx/length,forwardY=dy/length;
    const obstacleDistance=blocker ? Math.hypot(blocker.x-this.x,blocker.y-this.y) : 38;
    const forward=Math.max(40,Math.min(92,obstacleDistance+36));
    const sides=[this.avoidSide,-this.avoidSide];
    for(const side of sides)for(const lateral of [54,78,104]) {
      const candidate={x:this.x+forwardX*forward-forwardY*side*lateral,
        y:this.y+forwardY*forward+forwardX*side*lateral};
      if(!scene.npcCanStandAt(candidate.x,candidate.y,this))continue;
      if(!scene.canNpcVisit(this,candidate)||scene.npcPathBlocker(this,candidate,this))continue;
      this.avoidSide=side;
      return candidate;
    }
    // Reverse preference next time if the object or another pedestrian moves.
    this.avoidSide=-this.avoidSide;
    return null;
  }

`;
  s=one(s,'  private get mayPatrol(){',method+'  private get mayPatrol(){','Detour helper');
  return s;
});

edit('src/game/scenes/WorldScene.ts',s=>{
  const anchor=`    return this.hasClearPath(from.x, from.y, to.x, to.y);
  }

  create() {`;
  const extension=`    return this.hasClearPath(from.x, from.y, to.x, to.y);
  }

  /** Nearest person in an NPC's intended segment; used for local crowd avoidance. */
  npcPathBlocker(from:Vec2,to:Vec2,exclude?:Npc):Vec2|null {
    const dx=to.x-from.x,dy=to.y-from.y,len2=dx*dx+dy*dy;
    if(len2<1)return null;
    let best=Infinity,point:Vec2|null=null;
    const candidates=[...this.npcs.filter(n=>n.active&&n!==exclude),this.player].filter(Boolean);
    for(const other of candidates){
      const vx=other.x-from.x,vy=other.y-from.y;
      const fraction=Math.max(0,Math.min(1,(vx*dx+vy*dy)/len2));
      const projected={x:from.x+dx*fraction,y:from.y+dy*fraction};
      const sideGap=Math.hypot(other.x-projected.x,other.y-projected.y);
      const ahead=Math.hypot(other.x-from.x,other.y-from.y);
      if(ahead<8||sideGap>=43||fraction<=0)continue;
      if(ahead<best){best=ahead;point={x:other.x,y:other.y};}
    }
    return point;
  }
  npcCanStandAt(x:number,y:number,exclude?:Npc):boolean {
    return this.worldGenerator.isWalkable(x,y)&&!this.isBlockedByBuilding(x,y)
      &&!this.isNpcObscured(x,y)
      &&this.npcs.every(n=>!n.active||n===exclude||Math.hypot(n.x-x,n.y-y)>=64)
      &&(!this.player?.active||Math.hypot(this.player.x-x,this.player.y-y)>=52);
  }

  create() {`;
  s=one(s,anchor,extension,'NPC path helper placement');
  const init=`      const npc = new Npc(this, npcDefinition, position.x, position.y, definition.world);`;
  const placed=`      // Old saves can retain civilian positions from previous village layouts.
      // Alice works by the herb garden; Hawise stays outside the inn entrance.
      // Keep their narrative identity, trust and quests; repair position only.
      let npcPosition=position;
      if(npcDefinition.townId==='oakmere' && (definition.npcId==='mira-fen'||definition.npcId==='sena-marrow')) {
        const preferred=definition.npcId==='mira-fen'
          ? {x:town.world.x+195,y:town.world.y+140}
          : {x:town.world.x+440,y:town.world.y+340};
        const offsets=[[0,0],[60,0],[-60,0],[0,65],[0,-65],[80,65],[-80,65],[90,-65],[-90,-65]];
        const safe=offsets.map(([dx,dy])=>({x:preferred.x+dx,y:preferred.y+dy}))
          .find(candidate=>this.npcCanStandAt(candidate.x,candidate.y));
        if(safe)npcPosition=safe;
        else if(this.npcCanStandAt(definition.world.x,definition.world.y))npcPosition=definition.world;
      }
      const npc = new Npc(this, npcDefinition, npcPosition.x, npcPosition.y, definition.world);`;
  s=one(s,init,placed,'Oakmere civilian positions');
  return s;
});

if(issues.length){
  const message=['Leighneron NPC navigation preflight (no game files changed)',
    ...issues.map((issue,i)=>`${i+1}. ${issue.file}\n   ${issue.message}`)].join('\n');
  fs.writeFileSync(path.join(root,'leighneron-npc-navigation-preflight.txt'),message+'\n');
  console.error(message);
  process.exitCode=1;
}else{
  const backup=path.join(root,'.leighneron-npc-navigation-backup',String(Date.now()));
  fs.mkdirSync(backup,{recursive:true});
  const touched=[];
  try{
    for(const [file,{full,raw,updated}] of changes){
      const old=path.join(backup,file);
      fs.mkdirSync(path.dirname(old),{recursive:true});
      fs.writeFileSync(old,raw,'utf8');
      const temp=full+'.leighneron-new';
      fs.writeFileSync(temp,updated,'utf8');
      fs.renameSync(temp,full);
      touched.push({full,raw});
    }
  }catch(error){
    for(const {full,raw} of touched.reverse())fs.writeFileSync(full,raw,'utf8');
    console.error('Installation failed. Files written by this installer have been restored.',error);
    process.exitCode=1;
  }
  if(!process.exitCode)console.log(`NPC navigation installed. Updated: ${[...changes.keys()].join(', ')}\nSource backups: ${backup}\nNo game tests, builds or GitHub pushes were run.`);
}
