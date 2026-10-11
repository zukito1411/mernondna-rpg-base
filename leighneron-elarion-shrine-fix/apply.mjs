import fs from 'node:fs';
import path from 'node:path';

/** Targeted Elarion shrine interaction repair; does not overwrite local gameplay files. */
const root=process.cwd();
const file='src/game/scenes/WorldScene.ts';
const full=path.join(root,file);
if(!fs.existsSync(full)){
  console.error(`Could not find ${file}. Run this from the game project's root folder.`);
  process.exitCode=1;
}else{
  const original=fs.readFileSync(full,'utf8');
  const eol=original.includes('\r\n')?'\r\n':'\n';
  let code=original.replace(/\r\n/g,'\n');
  const errors=[];
  if(code.includes('LEIGHNERON_ELARION_SHRINE_APPROACH_V1')) errors.push('This patch is already installed.');
  function edit(label,pattern,change){
    const matches=[...code.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))];
    if(matches.length!==1){errors.push(`${label}: expected one match, found ${matches.length}`);return;}
    code=code.replace(pattern,change);
  }

  // The illustrated elven shrine is taller/larger than standard shrine tiles.
  // Provide a front-of-door approach point rather than relying only on its base anchor.
  const helper=`  // LEIGHNERON_ELARION_SHRINE_APPROACH_V1
  // The elven shrine uses a taller, wider sprite than common wayfarer shrines.
  // The visible door is above the actor's ground anchor. Resolve a reachable
  // forecourt target once and reuse it for the prompt and actual interaction.
  private nearbyElarionShrine(x:number,y:number):
    {definition:InteractableContentDefinition;actor:ContentActor}|undefined {
    const shrine=TOWN_SHRINE_BY_ID.elarion;
    const entry=this.interactables.get(shrine.contentId);
    if(!entry || !entry.actor.active || entry.definition.townShrineId!=='elarion')return;
    const front={x:entry.actor.x,y:entry.actor.y+64};
    if(Phaser.Math.Distance.Between(x,y,front.x,front.y)>116)return;
    // Exclude the shrine's own foundation. Also accept the base sight line
    // already used by older saves/layouts, without walking through walls.
    if(!this.hasClearPath(x,y,front.x,front.y,entry.actor)
       && !this.hasClearPath(x,y,entry.actor.x,entry.actor.y,entry.actor))return;
    return entry;
  }

`;
  edit('insert shrine approach helper',/  tryInteract\(x: number, y: number\) \{/,
    `${helper}  tryInteract(x: number, y: number) {`);
  edit('prioritize usable shrine at the door',/(  tryInteract\(x: number, y: number\) \{\n    if \(useGameStore\.getState\(\)\.panel \|\| useGameStore\.getState\(\)\.dialogue\) return;\n)/,
    `$1    const elarionShrine=this.nearbyElarionShrine(x,y);\n    if(elarionShrine){this.useInteractable(elarionShrine.definition,elarionShrine.actor);return;}\n`);
  edit('keep hint and activation targeting consistent',/    let interaction: string \| null = null, distance = 72;/,
    `    let interaction: string | null = null, distance = 72;
    const elarionShrine=this.nearbyElarionShrine(this.player.x,this.player.y);
    if(elarionShrine){interaction=elarionShrine.definition.name;distance=0;}`);
  edit('allow direct shrine sprite taps from forecourt',/(    actor\.on\('pointerdown', \(\) => \{\n)(      const point=definition\.portId\?PORT_BY_ID\[definition\.portId\]\.landing:actor;)/,
    `$1      if(definition.townShrineId==='elarion'){
        const elarionShrine=this.nearbyElarionShrine(this.player.x,this.player.y);
        if(elarionShrine){this.useInteractable(elarionShrine.definition,elarionShrine.actor);return;}
      }
$2`);
  edit('open the shrine panel before optional world-state updates',/    if \(definition\.townShrineId\) \{\n      this\.contentManager\.patchState\(definition\.id,\{ used:true \}\);\n      actor\.setTint\(0xc9e7eb\);\n      useGameStore\.getState\(\)\.setContentWorld\(this\.contentManager\.snapshot\(\)\);\n      useGameStore\.getState\(\)\.openShrineTravel\(definition\.townShrineId\);\n      saveGame\(\);\n      return;\n    \}/,
    `    if (definition.townShrineId) {
      // The travel UI is the action, not a side effect of marking scenery used.
      // Open it first so a save/capture problem cannot silently swallow E.
      useGameStore.getState().openShrineTravel(definition.townShrineId);
      if(useGameStore.getState().panel!=='travel'){
        this.notify('Shrine travel did not open. Close any current menu and try again.');
        return;
      }
      try {
        this.contentManager.patchState(definition.id,{used:true});
        if(actor.active)actor.setTint(0xc9e7eb);
        useGameStore.getState().setContentWorld(this.contentManager.snapshot());
        saveGame();
      }catch(error){
        console.error('Shrine attunement persistence failed:',definition.id,error);
        this.notify('Shrine travel opened, but its attunement could not be saved.');
      }
      return;
    }`);

  if(errors.length){
    const report=`Elarion shrine interaction preflight failed. NO GAME FILES MODIFIED.\n\n${errors.map((e,i)=>`${i+1}. ${e}`).join('\n')}\n`;
    fs.writeFileSync(path.join(root,'leighneron-elarion-shrine-preflight.txt'),report);
    console.error(report);process.exitCode=1;
  }else{
    const backup=path.join(root,'.leighneron-elarion-shrine-backup',String(Date.now()),file);
    fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,original);
    try{fs.writeFileSync(full,code.replace(/\n/g,eol));}
    catch(error){fs.writeFileSync(full,original);throw error;}
    console.log('Elarion shrine approach and interaction fix installed.');
    console.log(`Updated: ${file}`);
    console.log(`Backup: ${backup}`);
    console.log('No builds, tests, commits, or pushes were run.');
  }
}
