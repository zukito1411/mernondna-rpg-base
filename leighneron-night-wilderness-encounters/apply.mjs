// More nighttime / wilderness encounters for Tales of Leighneron.
// Compatible with the wolf-pack, roadside-bandit, and wolf-flanking installers.
// No builds, tests, commits, or pushes are executed.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const relative='src/game/scenes/WorldScene.ts';
const file=path.join(root,relative);
const marker='LEIGHNERON_NIGHT_WILDERNESS_ENCOUNTERS_V1';
const issues=[];
let original='', updated='';
const normalize=s=>s.replace(/\r\n/g,'\n');
function replaceOne(source,needle,replacement,label){
  const flags=needle.flags.includes('g')?needle.flags:needle.flags+'g';
  const match=[...source.matchAll(new RegExp(needle.source,flags))];
  if(match.length!==1)throw new Error(`${label}: expected exactly one source match; got ${match.length}`);
  return source.replace(needle,replacement);
}
try{
  original=fs.readFileSync(file,'utf8');
  updated=normalize(original);
  if(updated.includes(marker)){
    console.log('Night wilderness encounter update is already installed. No files changed.');
    process.exit(0);
  }
  updated=replaceOne(updated,/  private spawnAccumulator = 0;/,
`  private spawnAccumulator = 0;
  private nextAmbientIntervalMs = 11000;`, 'ambient timer field');
  updated=replaceOne(updated,/    this\.spawnAttempts = 0; this\.spawnAccumulator = 0; this\.hudAccumulator = 0;/,
`    this.spawnAttempts = 0; this.spawnAccumulator = 0; this.hudAccumulator = 0;
    this.nextAmbientIntervalMs = 11000;`, 'ambient timer reset');
  updated=replaceOne(updated,
/    if \(!uiBlocked\) this\.spawnAccumulator \+= delta;\n    if \(this\.spawnAccumulator > 11000 && !uiBlocked\) \{\n      this\.spawnAccumulator = 0;\n      ([^\n]+)\n    \}/,
(_whole,encounterCall)=>`    if (!uiBlocked) this.spawnAccumulator += Math.min(delta,250);
    if (!uiBlocked && this.spawnAccumulator >= this.nextAmbientIntervalMs) {
      this.spawnAccumulator = 0;
      const biome=this.worldGenerator.getBiomeAt(this.player.x,this.player.y);
      const hour=this.dayNight.getHour();
      const night=hour>=18||hour<6;
      const wilderness=['forest','wetland','highland','snowfield','volcanic'].includes(biome);
      // Higher wilderness activity after sunset, without per-frame terrain scans.
      this.nextAmbientIntervalMs=wilderness?(night?5900:8500):(night?7600:11000);
      ${encounterCall}
    }`, 'ambient cadence block');
  updated=replaceOne(updated,
/  private trySpawnAmbientEnemy\(regionId: RegionId\) \{[\s\S]*?\n  \}\n\n  private enforceLandCollision\(\)/,
`  private trySpawnAmbientEnemy(regionId: RegionId) {
    if(regionId==='dead-sea'||!this.isEnemyTerritory(this.player.x,this.player.y)||this.player.hp<=0)return;
    const biome=this.worldGenerator.getBiomeAt(this.player.x,this.player.y);
    const hour=this.dayNight.getHour(),night=hour>=18||hour<6;
    const forest=biome==='forest',swamp=biome==='wetland';
    const wild=forest||swamp||biome==='highland'||biome==='snowfield'||biome==='volcanic';
    // Leave room for complete 4-6 wolf packs, bosses, and roadside events.
    const cap=wild?(night?12:9):(night?10:7);
    if(this.enemies.size>=cap)return;
    // Do not materialize fresh enemies in the middle of an ongoing melee.
    if([...this.enemies].some(e=>e.active&&e.hp>0&&Math.hypot(e.x-this.player.x,e.y-this.player.y)<250))return;
    const rng=seededRandom('ambient:'+(this.spawnAttempts++)+':'+Math.floor(this.player.x/256)+':'+Math.floor(this.player.y/256));
    const chance=wild?(night?.86:.62):(night?.66:.42);
    if(rng()>chance)return;

    // Native wildlife dominates forests; wetland creatures dominate swamps.
    // Region weights still control which species can actually appear.
    const weights: string[]=[];
    const roomForPack=this.enemies.size<=cap-4;
    for(const e of ENEMIES){
      if(e.boss||(e.id==='marsh-wraith'&&!swamp&&regionId!=='darkav'))continue;
      if(e.id==='gray-wolf'&&!roomForPack)continue;
      const count=e.regionWeights[regionId]??0;
      if(count<=0)continue;
      let extra=0;
      if(forest&&e.id==='gray-wolf')extra=night?5:3;
      if(swamp&&e.id==='marsh-wraith')extra=night?5:3;
      if(biome==='highland'&&e.id==='cave-troll')extra=night?2:1;
      if(biome==='snowfield'&&e.id==='gray-wolf')extra=night?3:1;
      for(let i=0;i<count+extra;i++)weights.push(e.id);
    }
    if(!weights.length)return;
    // New encounters appear beyond immediate melee range, never inside
    // protected towns or blocked geometry; the current spawn API handles
    // complete wolf packs and their alpha/flanking data.
    for(let attempt=0;attempt<9;attempt++){
      const angle=rng()*Math.PI*2;
      const distance=430+rng()*390;
      const px=this.player.x+Math.cos(angle)*distance;
      const py=this.player.y+Math.sin(angle)*distance;
      if(!this.canEnemyOccupy(px,py))continue;
      const id=weights[Math.floor(rng()*weights.length)];
      if(this.spawnEnemy(id,px,py))return;
    }
  }

  private enforceLandCollision()`, 'ambient encounter selection');
  updated+='\n  // '+marker+'\n';
  if(original.includes('\r\n'))updated=updated.replace(/\n/g,'\r\n');
  if(updated===original)throw new Error('No source changes were prepared');
}catch(error){issues.push(`${relative}: ${error.message}`);}
if(issues.length){
  const report=['Night wilderness encounters preflight: NO GAME FILES CHANGED',...issues.map((x,i)=>`${i+1}. ${x}`)].join('\n');
  const reportFile=path.join(root,'leighneron-night-wilderness-preflight.txt');
  fs.writeFileSync(reportFile,report+'\n','utf8');
  console.error(report);console.error('Report: '+reportFile);process.exitCode=1;
}else{
  const backup=path.join(root,'.leighneron-night-wilderness-backup',String(Date.now()));
  const target=path.join(backup,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,original,'utf8');
  fs.writeFileSync(file,updated,'utf8');
  console.log('Night wilderness encounters installed: '+relative);
  console.log('Backup: '+backup);
  console.log('No builds, tests, commits, or pushes were run.');
}
