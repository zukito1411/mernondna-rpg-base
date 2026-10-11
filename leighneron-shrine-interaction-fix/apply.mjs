import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = new Map();
const problems = [];
function edit(file, edits) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { problems.push(`${file}: not found`); return; }
  const original = fs.readFileSync(full, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  let code = original.replace(/\r\n/g,'\n');
  for (const [label, needle, replacement] of edits) {
    const matches = [...code.matchAll(needle)];
    if (matches.length !== 1) {
      problems.push(`${file}: ${label} — expected one match; found ${matches.length}`);
      continue;
    }
    code = code.replace(needle, replacement);
  }
  files.set(file, { original, result: code.replace(/\n/g,eol) });
}

edit('src/components/GameCanvas.tsx', [
  ['import keyboard fallback dependencies',
    /import \{ createMernondnaGame \} from '\.\.\/game\/MernondnaGame';/g,
    "import { createMernondnaGame } from '../game/MernondnaGame';\nimport { mobileInput } from '../game/input';\nimport { useGameStore } from '../store/gameStore';"],
  ['receive E even if canvas keyboard focus was lost',
    /    window\.addEventListener\('error',onError\);window\.addEventListener\('unhandledrejection',onRejection\);/g,
    `    window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);
    // Some overlay focus transitions prevent Phaser from seeing a keydown.
    // Both inputs use the same boolean action queue, so a duplicate event is harmless.
    const onInteractKey = (event:KeyboardEvent) => {
      if(event.code!=='KeyE'||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
      const target=event.target instanceof HTMLElement?event.target:null;
      if(target && (target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
      const state=useGameStore.getState();
      if(state.panel||state.dialogue||state.cinematic||!state.navigation.interaction)return;
      mobileInput.press('interact');
    };
    window.addEventListener('keydown',onInteractKey);`],
  ['remove keyboard fallback on cleanup',
    /window\.removeEventListener\('error',onError\);window\.removeEventListener\('unhandledrejection',onRejection\);/g,
    "window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection);window.removeEventListener('keydown',onInteractKey);"],
]);

edit('src/components/HUD.tsx', [
  ['import shared action queue',
    /import \{ useGameStore \} from '\.\.\/store\/gameStore';/g,
    "import { useGameStore } from '../store/gameStore';\nimport { mobileInput } from '../game/input';"],
  ['make visible interaction hint actionable',
    /<div className="interaction-hint"><kbd>E<\/kbd><span>{interaction}<\/span><small>or tap nearby<\/small><\/div>/g,
    `<button type="button" className="interaction-hint"
        aria-label={\`Interact: \${interaction}\`} title={\`Interact: \${interaction}\`}
        onClick={() => mobileInput.press('interact')}>
        <kbd>E</kbd><span>{interaction}</span><small>Click or press E</small>
      </button>`],
]);

edit('src/game/entities/Player.ts', [
  ['explain interaction blocked by a combat art',
    /if \(interactPressed && !this\.skills\.isCasting\) scene\.tryInteract\(this\.x, this\.y\);/g,
    `if (interactPressed) {
      if (this.skills.isCasting) scene.notify('Finish your combat art before interacting.');
      else scene.tryInteract(this.x, this.y);
    }`],
]);

edit('src/styles.css', []);
{
  const css = files.get('src/styles.css');
  const style = `\n/* An interaction shown on-screen should also be clickable. */\n.hud-layer button.interaction-hint {pointer-events:auto;cursor:pointer;color:#f1dfb9;font-family:inherit;text-align:left;z-index:16;}\n.hud-layer button.interaction-hint:hover {border-color:#d9b779;background:#2a2118f5;}\n.hud-layer button.interaction-hint:focus-visible {outline:2px solid #f6d38a;outline-offset:2px;}\n`;
  if (css.original.includes('/* An interaction shown on-screen should also be clickable. */')) problems.push('src/styles.css: patch already installed');
  else css.result += css.original.includes('\r\n')?style.replace(/\n/g,'\r\n'):style;
}

if (problems.length) {
  const report=`Shrine interaction patch preflight failed. NO GAME FILES CHANGED.\n\n${problems.join('\n')}\n`;
  fs.writeFileSync(path.join(root,'leighneron-shrine-interaction-preflight.txt'), report);
  console.error(report);
  process.exitCode=1;
} else {
  const backupDir=path.join(root,'.leighneron-shrine-interaction-backup',Date.now().toString());
  fs.mkdirSync(backupDir,{recursive:true});
  for(const [name,record] of files){
    const dest=path.join(backupDir,name);fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,record.original);
  }
  const written=[];
  try {
    for(const [name,record] of files){
      fs.writeFileSync(path.join(root,name),record.result);
      written.push(name);
    }
  } catch(error) {
    for(const name of written)fs.writeFileSync(path.join(root,name),files.get(name).original);
    throw error;
  }
  console.log('Shrine interaction fallback installed.');
  console.log('Updated:',[...files.keys()].join(', '));
  console.log('Backups:',backupDir);
  console.log('No builds, tests, commits, or pushes were run.');
}
