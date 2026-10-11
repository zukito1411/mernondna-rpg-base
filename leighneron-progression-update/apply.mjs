import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const root = resolve(process.cwd());
// Installer revision 4: cross-platform CRLF/LF matching + staged diagnostics.
// All prepared edits are checked before writing any project files.
if (!existsSync(join(root, 'src', 'store', 'gameStore.ts')) || !existsSync(join(root,'src','data','progression.ts')))
  throw new Error('Run from the mernondna-rpg-base repository root. Nothing was changed.');
const changes = new Map();
const diagnostics = [];
const read = path => readFileSync(join(root,path),'utf8');
// Preflight every file; only commit the staged content when ALL patches succeed.
const update = (path, fn) => {
  try {
    const initial=changes.has(path)?changes.get(path):read(path);
    const next=fn(initial);
    if(next===initial) throw new Error('The expected change is absent, or already applied.');
    changes.set(path,next);
  } catch(error) {
    diagnostics.push({path, message:error instanceof Error?error.message:String(error)});
  }
};
function rep(s,needle,value,label='anchor'){
  // Windows editors/git checkouts commonly use CRLF, while source patches
  // ship with LF. Compare using LF but preserve the on-disk newline style.
  const eol=s.includes('\r\n')?'\r\n':'\n';
  const normalize=text=>text.replace(/\r\n?/g,'\n');
  const body=normalize(s),find=normalize(needle),replacement=normalize(value);
  const times=body.split(find).length-1;
  if(times!==1)throw new Error(`${label}: expected one normalized source match, got ${times}.`);
  const changed=body.replace(find,replacement);
  return eol==='\r\n'?changed.replace(/\n/g,'\r\n'):changed;
}
function patch(path,pairs){
  update(path,src=>pairs.reduce((acc,[before,after,label])=>rep(acc,before,after,label??`${path} anchor: ${before.slice(0,64).replaceAll('\\n',' ')}`),src));
}
const make=(path,data)=>{
  if(existsSync(join(root,path)))diagnostics.push({path,message:'Destination file already exists; refusing to overwrite.'});
  else changes.set(path,data);
};

// Each level's cost climbs by 25 XP. XP is cumulative, so existing level thresholds remain understandable.
const progression=`export const XP_PER_LEVEL = 250; // Base requirement, retained for older callers.
export const PLAYER_ACTOR_HEIGHT = 76;
export function xpNeededForLevel(level: number) { return XP_PER_LEVEL+25*Math.max(0,Math.floor(level)-1); }
export function xpTotalForLevel(level: number) {
  const completed=Math.max(0,Math.floor(level)-1);
  return completed*XP_PER_LEVEL+25*completed*(completed-1)/2;
}
export function experienceWithinLevel(xp:number) {
  const level=levelForExperience(xp);
  return {level, current:Math.max(0,xp-xpTotalForLevel(level)), required:xpNeededForLevel(level)};
}
export function levelForExperience(xp: number) {
  if(!Number.isFinite(xp)||xp<=0)return 1;
  // This is intentionally small (level 100 needs 146,250 XP); no approximation drift.
  let level=1;
  while(level<2000&&xp>=xpTotalForLevel(level+1))level++;
  return level;
}
export function playerDamageGrowth(level:number){return 1+Math.min(.35,Math.max(0,level-5)*.018);}
export function npcApparentHeight(texture: string) {
  if(texture==='npc_elven_king'||texture==='npc_elven_king_idle')return 128;
  if(texture==='npc_woman'||texture==='npc_elven_woman_idle')return PLAYER_ACTOR_HEIGHT*1.12;
  return texture==='npc_guard'||texture==='npc_elven_guard'||texture==='npc_elven_guard_idle'||texture==='npc_royal_guard'
    ? PLAYER_ACTOR_HEIGHT*1.27 : PLAYER_ACTOR_HEIGHT;
}
export type AttributeId = 'strength'|'vitality'|'agility';
export type SkillId = 'heavy-strike'|'fleet-foot'|'iron-heart'|'deep-reserves'|'steady-edge'|'battle-focus'|
  'second-wind'|'iron-guard'|'windrunner'|'spell-tempo'|'veteran-strike'|'last-stand';
export type PlayerAttributes = Record<AttributeId,number>;
export const BASE_ATTRIBUTES:PlayerAttributes={strength:0,vitality:0,agility:0};
export type SkillBranch='Might'|'Survival'|'Mobility';
export interface SkillDefinition {
 id:SkillId;name:string;description:string;branch:SkillBranch;minLevel:number;cost:number;requires?:SkillId;
}
export const SKILLS:SkillDefinition[]=[
 {id:'heavy-strike',name:'Heavy Strike',description:'+12% weapon damage.',branch:'Might',minLevel:2,cost:1},
 {id:'steady-edge',name:'Steady Edge',description:'+6% weapon damage.',branch:'Might',minLevel:6,cost:1,requires:'heavy-strike'},
 {id:'battle-focus',name:'Battle Focus',description:'+5% combat-art damage.',branch:'Might',minLevel:10,cost:2,requires:'steady-edge'},
 {id:'veteran-strike',name:'Veteran Strike',description:'+8% weapon damage.',branch:'Might',minLevel:18,cost:2,requires:'battle-focus'},
 {id:'iron-heart',name:'Iron Heart',description:'+25 maximum health.',branch:'Survival',minLevel:2,cost:1},
 {id:'deep-reserves',name:'Deep Reserves',description:'+30 maximum stamina.',branch:'Survival',minLevel:3,cost:1},
 {id:'iron-guard',name:'Iron Guard',description:'Take 5% less damage.',branch:'Survival',minLevel:10,cost:2,requires:'iron-heart'},
 {id:'last-stand',name:'Last Stand',description:'+20 maximum health.',branch:'Survival',minLevel:20,cost:2,requires:'iron-guard'},
 {id:'fleet-foot',name:'Fleet Foot',description:'+6% movement speed.',branch:'Mobility',minLevel:2,cost:1},
 {id:'windrunner',name:'Windrunner',description:'+4% movement speed.',branch:'Mobility',minLevel:7,cost:1,requires:'fleet-foot'},
 {id:'second-wind',name:'Second Wind',description:'+20 maximum stamina.',branch:'Mobility',minLevel:12,cost:2,requires:'windrunner'},
 {id:'spell-tempo',name:'Battle Rhythm',description:'Reduce art cooldowns by 6%.',branch:'Mobility',minLevel:16,cost:2,requires:'second-wind'},
];
export function progressionStats(attributes:PlayerAttributes,skills:SkillId[]){
 const has=(id:SkillId)=>skills.includes(id);
 return {
  maxHp:100+attributes.vitality*12+(has('iron-heart') ? 25:0)+(has('last-stand') ? 20:0),
  maxStamina:100+attributes.agility*4+(has('deep-reserves') ? 30:0)+(has('second-wind') ? 20:0),
  damageMultiplier:1+attributes.strength*.06+(has('heavy-strike') ? .12:0)+(has('steady-edge') ? .06:0)+(has('veteran-strike') ? .08:0),
  speedMultiplier:1+attributes.agility*.025+(has('fleet-foot') ? .06:0)+(has('windrunner') ? .04:0),
  cooldownMultiplier:Math.max(.7,1-attributes.agility*.012-(has('spell-tempo') ? .06:0)),
  skillDamageMultiplier:1+(has('battle-focus') ? .05:0),
  incomingDamageMultiplier:has('iron-guard') ? .95:1,
 };
}
`;
update('src/data/progression.ts',()=>progression);

const enemyTiers=`import { TOWNS } from './towns';
import type { EnemyDefinition, RegionId } from '../game/types';

/** Settlement-route danger tiers. There are twelve settlements but eight regions. */
const ROUTE=['oakmere','highmere','willowcross','elarion','moonfall','starhold',
 'redmesa','deepford','tidewatch','skallheim','blackspire','cibar-plains'] as const;
const REGION_FALLBACK:Record<Exclude<RegionId,'dead-sea'>,number>={
 trandum:5,narenthil:10,nardorous:15,rindass:20,druganwoods:20,portquill:25,frostlands:25,darkav:30,
};
export const BOSS_RESPAWN_MS=20*60*1000;
export function areaMonsterLevel(x:number,y:number,regionId:RegionId):number {
 if(regionId==='dead-sea')return 5;
 const nearby=TOWNS.filter(t=>t.regionId===regionId).map(t=>({
  id:t.id,distance:Math.hypot(t.world.x-x,t.world.y-y),
 })).sort((a,b)=>a.distance-b.distance)[0];
 const index=ROUTE.indexOf(nearby?.id as typeof ROUTE[number]);
 // Far from a settlement, use the region's consistent wilderness difficulty.
 return nearby&&nearby.distance<15000&&index>=0?5+Math.floor(index/2)*5:REGION_FALLBACK[regionId];
}
export function scaledEnemy(definition:EnemyDefinition,level:number):EnemyDefinition {
 const steps=Math.max(0,level-5),boss=Boolean(definition.boss);
 // Higher-level enemies have noticeably more health, but damage rises more slowly.
 const hpScale=1+steps*.11,damageScale=1+steps*.035;
 const xpScale=(1+steps*.13)*(boss?1.5:1);
 return {...definition,hp:Math.round(definition.hp*hpScale),damage:Math.max(1,Math.round(definition.damage*damageScale)),
  xp:Math.max(1,Math.round(definition.xp*xpScale))};
}
`;
make('src/data/enemyTiers.ts',enemyTiers);

// The local project can contain formatting changes from the UI patches.
// Match each combat art by its stable ID rather than an exact full source line.
update('src/data/activeSkills.ts',source=>{
  let out=source;
  const iface=/export\s+interface\s+ActiveSkillDefinition\s*\{([\s\S]*?)\}/;
  const match=iface.exec(out);
  if(!match)throw new Error('Cannot locate ActiveSkillDefinition interface. Nothing has been written.');
  if(!/\bminLevel\s*:/.test(match[1])){
    const updated=match[0].replace(/(\btexture\s*:\s*PlayerSkillTexture\s*;)/,
      '$1 minLevel:number;');
    if(updated===match[0])throw new Error('Cannot insert combat art level field. Nothing has been written.');
    out=out.replace(match[0],updated);
  }
  const arts={
    'azure-cleave':5,
    'skyfall-slam':10,
    'crown-rally':5,
    'crescent-flurry':15,
  };
  for(const [id,minimum] of Object.entries(arts)){
    // Locate the skill object without depending on spacing or property order.
    const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const skillPattern=new RegExp(`\\bid\\s*:\\s*['\"]${escaped}['\"][\\s\\S]{0,360}?\\bslot\\s*:`);
    const found=skillPattern.exec(out);
    if(!found)throw new Error(`Combat art ${id} not recognized in your local activeSkills.ts. Nothing has been written.`);
    if(/\bminLevel\s*:/.test(found[0])){
      if(!new RegExp(`\\bminLevel\\s*:\\s*${minimum}\\b`).test(found[0]))
        throw new Error(`Existing unlock level differs for ${id}; inspect manually. Nothing has been written.`);
      continue;
    }
    const updated=found[0].replace(/(\bslot\s*:)/,`minLevel:${minimum},$1`);
    if(updated===found[0])throw new Error(`Cannot insert unlock level for ${id}. Nothing has been written.`);
    out=out.slice(0,found.index)+updated+out.slice(found.index+found[0].length);
  }
  if(out===source)throw new Error('Combat art gating is already present. No changes written.');
  return out;
});

patch('src/store/gameStore.ts',[
 ["if (!skill || state.skillPoints <= 0 || state.learnedSkills.includes(skillId)) return {};",
  "if (!skill || state.skillPoints < skill.cost || state.level < skill.minLevel || (skill.requires&&!state.learnedSkills.includes(skill.requires)) || state.learnedSkills.includes(skillId)) return {};"],
 ["skillPoints: state.skillPoints - 1, maxHp:","skillPoints: state.skillPoints - skill.cost, maxHp:"],
]);

patch('src/game/entities/Player.ts',[
 ["amount * this.skills.incomingDamageMultiplier","amount * this.skills.incomingDamageMultiplier * progressionStats(useGameStore.getState().attributes,useGameStore.getState().learnedSkills).incomingDamageMultiplier"],
]);

// Patch just the ability system semantics, not a verbatim multi-line snippet.
// This tolerates the user's locally customized formatting of tryCast().
update('src/game/systems/PlayerSkillSystem.ts',source=>{
  let result=source;
  if(!/import\s*\{[^}]*progressionStats[^}]*\}\s*from\s*['"]\.\.\/\.\.\/data\/progression['"]/.test(result)){
    const anchor=/import\s*\{\s*artScale\s*\}\s*from\s*['"]\.\.\/\.\.\/data\/art['"];?/;
    if(!anchor.test(result))throw new Error('Could not locate the artScale import for progressionStats.');
    result=result.replace(anchor,m=>`${m}\nimport { progressionStats } from '../../data/progression';`);
  }
  const castBlock=/\btryCast\s*\(\s*id\s*:\s*ActiveSkillId\s*\)\s*:\s*boolean\s*\{/;
  if(!castBlock.test(result))throw new Error('Could not locate the tryCast(id:ActiveSkillId) method.');
  if(!/\bstate\.level\s*<\s*skill\.minLevel\b/.test(result)){
    const check=/if\s*\(\s*this\.cast\s*\)\s*return\s+false\s*;/;
    if(!check.test(result))throw new Error('Could not locate the casting guard in tryCast().');
    result=result.replace(check,match=>`${match}\n    const state=useGameStore.getState();\n    if(state.level<skill.minLevel){this.scene.notify(\`\${skill.name} unlocks at level \${skill.minLevel}.\`);return false;}`);
  }
  if(!/this\.cooldowns\s*\[\s*id\s*\]\s*=\s*Math\.round\s*\(\s*skill\.cooldownMs\s*\*\s*stats\.cooldownMultiplier\s*\)/.test(result)){
    const cooldown=/this\.cooldowns\s*\[\s*id\s*\]\s*=\s*skill\.cooldownMs\s*;/;
    if(!cooldown.test(result))throw new Error('Cannot find normal cooldown assignment; inspect whether a custom cooldown system was already added.');
    result=result.replace(cooldown,`const stats=progressionStats(useGameStore.getState().attributes,useGameStore.getState().learnedSkills);\n    this.cooldowns[id] = Math.round(skill.cooldownMs*stats.cooldownMultiplier);`);
  }
  return result;
});

// Skill multipliers are capped; regular weapon hits also gain a small level bonus.
patch('src/game/scenes/WorldScene.ts',[
 ["import { progressionStats } from '../../data/progression';","import { progressionStats, playerDamageGrowth } from '../../data/progression';"],
 ["import { BOSSES,BOSS_BY_ID, ENEMIES, ENEMY_BY_ID } from '../../data/enemies';",
  "import { BOSSES,BOSS_BY_ID, ENEMIES, ENEMY_BY_ID } from '../../data/enemies';\nimport { areaMonsterLevel, BOSS_RESPAWN_MS } from '../../data/enemyTiers';"],
 ["enemy.takeDamage(Math.max(1,Math.round(this.getEquippedWeapon().damage*progression.damageMultiplier*multiplier)),direction);",
  "const level=useGameStore.getState().level;\n    const growth=playerDamageGrowth(level);\n    enemy.takeDamage(Math.max(1,Math.round(this.getEquippedWeapon().damage*progression.damageMultiplier*progression.skillDamageMultiplier*growth*multiplier)),direction);"],
 ["    for (const bossId of state.defeatedBosses) {\n      if(BOSS_BY_ID[bossId]?.respawns)continue; // Victory history is not permanent dragon removal.\n      const definition = WORLD_CONTENT.find(d => d.id === `boss:${bossId}`);\n      if (definition) logical.states[definition.id] = { ...initialContentState(definition), hp: 0, defeated: true };\n    }",
  "    // Defeat history remains permanent for quests; the content ledger, not\n    // defeatedBosses, controls the 20-minute battle respawn timer.\n    for (const bossId of state.defeatedBosses) {\n      const definition=WORLD_CONTENT.find(d=>d.id===`boss:${bossId}`);\n      if(definition&&!logical.states[definition.id])logical.states[definition.id]={\n        ...initialContentState(definition),hp:0,defeated:true,respawnAt:Date.now()+BOSS_RESPAWN_MS,\n      };\n    }"],
 ["enemy.takeDamage(Math.round(weapon.damage * progression.damageMultiplier), facing);",
  "enemy.takeDamage(Math.max(1,Math.round(weapon.damage * progression.damageMultiplier*playerDamageGrowth(useGameStore.getState().level))), facing);"],
 ["const damage = Math.max(1,Math.round(this.getEquippedWeapon().damage * progression.damageMultiplier * multiplier));",
  "const damage = Math.max(1,Math.round(this.getEquippedWeapon().damage * progression.damageMultiplier * progression.skillDamageMultiplier*playerDamageGrowth(useGameStore.getState().level) * multiplier));"],
 ["    useGameStore.getState().recordEnemyDefeat(definition.id, definition.xp, gold, bossId, this.contentManager.snapshot());",
  "    useGameStore.getState().recordEnemyDefeat(definition.id, definition.xp, gold, bossId, this.contentManager.snapshot());\n    const gained=this.add.text(enemy.x,enemy.y-48,`+${definition.xp} XP`,{fontFamily:'Georgia,serif',fontSize:'15px',fontStyle:'bold',color:'#f8dc8c',stroke:'#23160b',strokeThickness:4}).setResolution(2).setDepth(enemy.y+900).setOrigin(.5);\n    this.tweens.add({targets:gained,y:enemy.y-112,alpha:0,duration:1450,ease:'Sine.easeOut',onComplete:()=>gained.destroy()});"],
 ["this.notify(boss?.respawns?`${definition.name} takes flight! He returns to his lair in 30 minutes.`\n        :`${definition.name} defeated. The world state remembers this.`);",
  "this.notify(boss?`${definition.name} defeated! This boss returns in 20 minutes.`:`${definition.name} defeated.`);"],
]);

// A default content-state HP value is the unscaled definition's full HP.
// Restore fresh enemies at their level-scaled max rather than at level-1 HP.
update('src/game/scenes/WorldScene.ts',source=>rep(source,
  'enemy.hp = state.hp ?? enemy.hp;',
  `const baseMax=ENEMY_BY_ID[definition.enemyId].hp;
      enemy.hp=state.hp===undefined||state.hp===baseMax ? enemy.definition.hp :
        Math.max(0,Math.min(enemy.definition.hp,state.hp));`,
  'scaled enemy full HP restoration'));

// All bosses—including story bosses—return, but only their first victory completes a quest.
update('src/data/enemies.ts',s=>{
  const b=s.indexOf('export const BOSSES: BossDefinition[] = [');
  const e=s.indexOf('export const BOSS_BY_ID',b);
  if(b<0||e<0)throw Error('Boss definition boundaries changed');
  const block=s.slice(b,e).replaceAll('respawns: false','respawns: true, respawnDelayMs: 20*60*1000')
    .replace('respawnDelayMs:DRAGON_RETURN_MS','respawnDelayMs:20*60*1000');
  if(!block.includes('respawns: true, respawnDelayMs: 20*60*1000'))throw Error('Boss respawn anchors missing');
  return s.slice(0,b)+block+s.slice(e);
});
patch('src/data/dragonLair.ts',[
 ["export const DRAGON_RETURN_MS=30*60*1000;", "export const DRAGON_RETURN_MS=20*60*1000;"],
 ["Varkhul will return after thirty minutes", "Varkhul will return after twenty minutes"],
]);

// Instantiate each enemy's own copy of its scaled definition, retaining region-appropriate stats on reload.
patch('src/game/entities/Enemy.ts',[
 ["import { BOSS_BY_ID, enemyAppearanceMultiplier } from '../../data/enemies';",
  "import { BOSS_BY_ID, enemyAppearanceMultiplier } from '../../data/enemies';\nimport { areaMonsterLevel,scaledEnemy } from '../../data/enemyTiers';"],
 ["  readonly eventSpawn: boolean;", "  readonly eventSpawn: boolean;\n  readonly level:number;"],
 ["    this.definition = definition;\n    this.boss = instanceId.startsWith('boss:') ? BOSS_BY_ID[instanceId.slice(5)] : undefined;\n    this.hp = definition.hp;",
  "    this.boss = instanceId.startsWith('boss:') ? BOSS_BY_ID[instanceId.slice(5)] : undefined;\n    const zone=(scene as WorldScene).getRegionAtPosition(x,y);\n    this.level=areaMonsterLevel(x,y,zone)+(this.boss?10:0);\n    this.definition=scaledEnemy(definition,this.level);\n    this.hp=this.definition.hp;"],
 ["this.boss?.name ?? definition.name, {", "`Lv.${this.level} ${this.boss?.name ?? definition.name}`, {"],
]);

// WorldScene exposes its existing world-generator lookup for enemy-tier assignment.
update('src/game/scenes/WorldScene.ts',s=>{
  const anchor='  getEquippedWeapon(): WeaponDefinition {';
  return rep(s,anchor,`  getRegionAtPosition(x:number,y:number){return this.worldGenerator.getRegionAt(x,y);}\n\n${anchor}`,'world region lookup');
});

// Existing saves have a flat 250 XP/level curve. Migrate total XP while retaining their level and progress.
patch('src/utils/save.ts',[
 ["import { BASE_ATTRIBUTES, SKILLS, levelForExperience, progressionStats, type PlayerAttributes, type SkillId } from '../data/progression';",
  "import { BASE_ATTRIBUTES, SKILLS, levelForExperience, xpTotalForLevel, xpNeededForLevel, progressionStats, type PlayerAttributes, type SkillId } from '../data/progression';"],
 ["export interface SaveData { version: 4; savedAt: string; state: SavedState & {cinematicQueue?:string[]} }",
  "export interface SaveData { version: 5; savedAt: string; state: SavedState & {cinematicQueue?:string[]} }"],
 ["if (!record(data) || data.version !== 4 || !record(data.state)) return null;",
  "if (!record(data) || data.version !== 5 || !record(data.state)) return null;"],
 ["const data: SaveData = { version: 4, savedAt:", "const data: SaveData = { version: 5, savedAt:"],
 ["return { version: 4, savedAt: typeof data.savedAt", "return { version: 5, savedAt: typeof data.savedAt"],
]);
update('src/utils/save.ts',s=>{
 const old='  return migrated;\n}\n\nexport function parseSave';
 const replacement=`  if(record(migrated)&&migrated.version===4&&record(migrated.state)){
    const old=migrated.state;
    const level=typeof old.level==='number'&&Number.isFinite(old.level)?Math.max(1,Math.floor(old.level)):1;
    const rawXp=typeof old.xp==='number'&&Number.isFinite(old.xp)?old.xp:0;
    const oldInto=Math.max(0,rawXp-(level-1)*250);
    // Preserve current level and the percentage of its old experience bar.
    const xp=xpTotalForLevel(level)+Math.round(Math.min(1,oldInto/250)*xpNeededForLevel(level));
    const content=old.worldContent;
    const states:Record<string,unknown>=record(content)&&record(content.states)?{...content.states}:{};
    for(const boss of BOSSES){
      const id='boss:'+boss.id;
      const previous=states[id];
      if((Array.isArray(old.defeatedBosses)&&old.defeatedBosses.includes(boss.id))||
        (record(previous)&&previous.defeated===true)){
        const def=CONTENT_BY_ID[id];
        if(def){const base=record(previous)?previous:initialContentState(def);
          states[id]={...base,hp:0,defeated:true,respawnAt:typeof base.respawnAt==='number'?Math.min(base.respawnAt,Date.now()+20*60*1000):
            (Number.isFinite(Date.parse(String(migrated.savedAt)))?Date.parse(String(migrated.savedAt)):Date.now())+20*60*1000};
        }
      }
    }
    migrated={...migrated,version:5,state:{...old,xp,
      worldContent:record(content)?{...content,states}:content}};
  }
  return migrated;
}

export function parseSave`;
 return rep(s,old,replacement,'save migration end');
});
update('src/utils/save.ts',s=>rep(s,
 "ENEMY_BY_ID[definition.enemyId].hp)","ENEMY_BY_ID[definition.enemyId].hp*8)","validate scaled enemy HP"));

// On-screen stats display the correct requirement for the current level.
patch('src/components/HUD.tsx',[
 ["import { XP_PER_LEVEL } from '../data/progression';", "import { experienceWithinLevel } from '../data/progression';"],
 ["  const xpInLevel = xp % XP_PER_LEVEL;", "  const xpProgress=experienceWithinLevel(xp);"],
 ["aria-valuemax={XP_PER_LEVEL} aria-valuenow={xpInLevel}",
  "aria-valuemax={xpProgress.required} aria-valuenow={xpProgress.current}"],
 ["barPercent(xpInLevel, XP_PER_LEVEL)","barPercent(xpProgress.current, xpProgress.required)"],
 ["{xpInLevel} / {XP_PER_LEVEL} XP", "{xpProgress.current} / {xpProgress.required} XP"],
]);

// Character panel: a skill tree with prerequisites and four visual level-gated combat arts.
patch('src/components/CharacterPanel.tsx',[
 ["import { SKILLS, type AttributeId } from '../data/progression';",
  "import { SKILLS, type AttributeId } from '../data/progression';\nimport { SKILL_ICON_PATHS } from '../data/skillIcons';"],
 ["            {SKILLS.map(skill => {", "            <div className=\"skill-tree\">{(['Might','Survival','Mobility'] as const).map(branch=><section className=\"skill-branch\" key={branch}><h4>{branch}</h4>{SKILLS.filter(s=>s.branch===branch).map(skill => {"],
 ["              const learned = learnedSkills.includes(skill.id);\n              return (",
  "              const learned = learnedSkills.includes(skill.id);\n              const missing=skill.requires&&!learnedSkills.includes(skill.requires);\n              const canLearn=!learned&&skillPoints>=skill.cost&&level>=skill.minLevel&&!missing;\n              return ("],
 ["                  <div><strong>{skill.name}{learned && <span> · Learned</span>}</strong><p>{skill.description}</p></div>\n                  <button type=\"button\" disabled={learned || skillPoints === 0} onClick={() => unlock(skill.id)}>{learned ? 'Known' : 'Learn'}</button>",
  "                  <div><strong>{skill.name}{learned && <span> · Learned</span>}</strong><p>{skill.description}</p><small>Lv. {skill.minLevel} · {skill.cost} point{skill.cost===1?'':'s'}{skill.requires?` · Requires ${SKILLS.find(s=>s.id===skill.requires)?.name}`:''}</small></div>\n                  <button type=\"button\" disabled={!canLearn} onClick={() => unlock(skill.id)}>{learned?'Known':level<skill.minLevel?'Locked':missing?'Prerequisite':`Learn (${skill.cost})`}</button>"],
 ["            })}\n          </section>\n          <section className=\"combat-art-section\">",
  "            })}</section>)}</div>\n          </section>\n          <section className=\"combat-art-section\">"],
 ["<span>Always available · keys 1–4</span>", "<span>Unlock automatically at levels 5, 10 and 15 · keys 1–4</span>"],
 ["                const status = activeSkillStatus.casting === skill.id ? 'Casting'",
  "                const locked=level<skill.minLevel;\n                const status = locked?`Unlocks at level ${skill.minLevel}`:activeSkillStatus.casting === skill.id ? 'Casting'"],
 ["<article className=\"combat-art-row\" key={skill.id}>\n                    <span className={`combat-art-slot combat-art-slot-${skill.slot}`}>{skill.slot}</span>",
  "<article className={`combat-art-row ${locked?'combat-art-locked':''}`} key={skill.id}>\n                    <span className={`combat-art-slot combat-art-slot-${skill.slot}`}>{skill.slot}</span>\n                    <img className=\"combat-art-icon\" src={SKILL_ICON_PATHS[skill.id]} alt=\"\" loading=\"lazy\" />"],
]);

patch('src/components/MobileControls.tsx',[
 ["  const activeSkillStatus = useGameStore(s => s.activeSkillStatus);",
  "  const activeSkillStatus = useGameStore(s => s.activeSkillStatus);\n  const level=useGameStore(s=>s.level);"],
 ["          const remaining = activeSkillStatus.cooldowns[skill.id];",
  "          const locked=level<skill.minLevel;\n          const remaining = activeSkillStatus.cooldowns[skill.id];"],
 ["          const cooldownLabel = cooldown ? `cooldown ${Math.ceil(remaining / 1000)} seconds` : 'ready';",
  "          const cooldownLabel=locked?`unlocks at level ${skill.minLevel}`:cooldown?`cooldown ${Math.ceil(remaining / 1000)} seconds`:'ready';"],
 ["className={`touch-button touch-skill skill-${skill.slot}${cooldown ? ' cooling' : ''}`}\n              onPointerDown={() => mobileInput.press(skill.action)}",
  "className={`touch-button touch-skill skill-${skill.slot}${cooldown ? ' cooling' : ''}${locked?' locked':''}`}\n              disabled={locked}\n              onPointerDown={() => {if(!locked)mobileInput.press(skill.action);}}"],
]);
patch('src/components/DesktopSkillBar.tsx',[
 ["  const stamina=useGameStore(s=>s.stamina);",
  "  const stamina=useGameStore(s=>s.stamina);\n  const level=useGameStore(s=>s.level);"],
 ["      const remaining=Math.max(0,status.cooldowns[skill.id]);",
  "      const locked=level<skill.minLevel;\n      const remaining=Math.max(0,status.cooldowns[skill.id]);"],
 ["      const disabled=cooling||insufficient||status.casting!==null;",
  "      const disabled=locked||cooling||insufficient||status.casting!==null;"],
 ["\${cooling?'on-cooldown':''}", "\${cooling?'on-cooldown':''}\${locked?' is-locked':''}"],
 ["{cooling&&<span className=\"desktop-skill-shade\"",
  "{locked&&<span className=\"desktop-skill-shade\" style={{height:'100%'}}/>}\n          {cooling&&!locked&&<span className=\"desktop-skill-shade\""],
 ["{casting&&<span className=\"desktop-skill-casting\">Casting</span>}",
  "{casting&&<span className=\"desktop-skill-casting\">Casting</span>}\n          {locked&&<span className=\"desktop-skill-remaining\">Lv {skill.minLevel}</span>}"],
 ["{!cooling&&!casting&&<span className=\"desktop-skill-state\">{insufficient?'Low stamina':'Ready'}</span>}",
  "{!cooling&&!casting&&!locked&&<span className=\"desktop-skill-state\">{insufficient?'Low stamina':'Ready'}</span>}\n        {locked&&<span className=\"desktop-skill-state\">Locked</span>}"],
]);

// In-world enemy names and health bars now use per-instance scaled maxima, so
// rendering and combat math remain consistent for higher-tier creatures.
changes.set('src/styles.css',read('src/styles.css')+`
/* Wider skill-tree progression and clear combat-art unlocks. */
.character-panel .skill-tree{display:grid;gap:9px;}
.character-panel .skill-branch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;min-width:0;}
.character-panel .skill-branch h4{grid-column:1/-1;margin:6px 0 0;font:700 15px Georgia,serif;color:#674224;}
.character-panel .skill-branch .progression-row{margin:0;min-width:0;display:flex;align-items:center;}
.character-panel .skill-branch .progression-row small{display:block;margin-top:4px;font-size:10px;opacity:.8;}
.character-panel .skill-branch .progression-row button{font-size:11px;white-space:nowrap;}
.character-panel .combat-art-icon{width:48px;height:48px;border-radius:8px;object-fit:cover;flex:0 0 48px;box-shadow:0 2px 9px #3b251d65;}
.character-panel .combat-art-locked .combat-art-icon{filter:grayscale(.75) brightness(.5);}
.character-panel .combat-art-row{align-items:center;}
.character-panel .combat-art-grid{gap:12px;}
.desktop-skill-slot.is-locked .desktop-skill-art img{filter:grayscale(.65);}
.touch-skill.locked .touch-skill-glyph{filter:grayscale(1) brightness(.45);}
@media(max-width:1000px){.character-panel .skill-branch{grid-template-columns:1fr;}}
`);

// Preflight result: show EVERY source mismatch and do not touch game files.
if(diagnostics.length){
  const reportPath=join(root,'leighneron-progression-preflight.txt');
  const body=[
    'Leighneron progression installer preflight (no game files changed)',
    `Found ${diagnostics.length} issue(s):`,
    ...diagnostics.map((d,i)=>`${i+1}. ${d.path}\n   ${d.message}`),
    '\nProvide this report alongside the source file(s) named above, if needed.'
  ].join('\n');
  writeFileSync(reportPath,body+'\n','utf8');
  console.error(body);
  console.error(`\nFull report saved to: ${reportPath}`);
  process.exitCode=1;
} else {
// Ensure all anchors are present before touching the project.
const backup=join(root,'.leighneron-progression-backup',String(Date.now()));
for(const [path,content] of changes){if(typeof content!=='string'||!content.length)throw new Error(`Empty generated file: ${path}`);}
for(const [path,content] of changes){const dest=join(root,path);mkdirSync(dirname(dest),{recursive:true});if(existsSync(dest)){const saved=join(backup,path);mkdirSync(dirname(saved),{recursive:true});copyFileSync(dest,saved);}writeFileSync(dest,content,'utf8');}
console.log('Progression update installed. Modified:',[...changes.keys()].join(', '));
console.log('Backups:',backup,'\nNo tests, builds, commits or pushes were run.');

}
