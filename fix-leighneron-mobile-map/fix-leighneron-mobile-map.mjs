/** Restore a mobile-specific regional/world map layout without changing desktop.
 * Run with: node .\fix-leighneron-mobile-map.mjs from mernondna-rpg-base.
 * No dependencies, tests, builds or commits. */
import {existsSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';

let root=process.cwd();
for(let n=0;n<6;n++){
  if(existsSync(join(root,'package.json')) && existsSync(join(root,'src','map-regional-navigation.css')))break;
  const parent=dirname(root);
  if(parent===root)break;
  root=parent;
}
const cssPath=join(root,'src','map-regional-navigation.css');
if(!existsSync(join(root,'package.json')) || !existsSync(cssPath)){
  throw new Error('Cannot find mernondna-rpg-base with src/map-regional-navigation.css. Run from your project root after applying the map navigation update.');
}
const start='/* MOBILE-ONLY DESTINATION LAYOUT - BEGIN */';
const end='/* MOBILE-ONLY DESTINATION LAYOUT - END */';
const mobileCss=String.raw`
${'/* MOBILE-ONLY DESTINATION LAYOUT - BEGIN */'}
/* The compact PC destinations strip is desktop-only.  On mobile landscape,
   keep the map as the primary view and put destinations in a scrollable side
   column; on mobile portrait, stack destinations beneath the map. */
@media (pointer: coarse), (hover: none), (max-width: 1000px) and (max-height: 560px) {
  .map-panel .map-stage {
    display: grid !important;
    grid-template-columns: minmax(0, 1.65fr) minmax(150px, 1fr) !important;
    grid-template-rows: minmax(0, 1fr) !important;
    justify-items: stretch !important;
    align-items: stretch !important;
    gap: 6px !important;
  }
  .map-panel .map-stage > .map-viewport {
    grid-column: 1 !important;
    grid-row: 1 !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
  }
  .map-panel .map-stage > .map-sidebar {
    grid-column: 2 !important;
    grid-row: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: none !important;
    min-width: 0 !important;
    gap: 3px !important;
    padding: 3px !important;
    overflow: hidden !important;
    border: 0 !important;
    background: rgba(90,57,28,.08) !important;
    box-shadow: none !important;
  }
  .map-panel .map-sidebar-heading {
    display: flex !important;
    flex: 0 0 auto !important;
    white-space: normal !important;
  }
  .map-panel .map-destination-grid {
    display: grid !important;
    flex: 1 1 auto !important;
    grid-template-columns: repeat(2,minmax(0,1fr)) !important;
    grid-auto-rows: minmax(42px,auto) !important;
    align-content: start !important;
    width: 100% !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-height: none !important;
    gap: 4px !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    touch-action: pan-y !important;
    overscroll-behavior: contain;
  }
  .map-panel .map-destination-grid button {
    display: flex !important;
    flex: none !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: center !important;
    min-width: 0 !important;
    min-height: 42px !important;
    height: auto !important;
    width: 100% !important;
    padding: 4px 6px !important;
  }
  .map-panel .map-destination-grid button > span:first-child {
    width: 100% !important;
    min-width: 0 !important;
  }
  .map-panel .map-destination-grid button strong {
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .map-panel .map-region-details {
    display: none !important;
  }
  .map-panel .map-help {display: none !important;}
}
@media (orientation: portrait) and (max-width: 760px) {
  .map-panel .map-stage {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) !important;
    grid-template-rows: minmax(0,1.35fr) minmax(105px,1fr) !important;
  }
  .map-panel .map-stage > .map-viewport {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }
  .map-panel .map-stage > .map-sidebar {
    grid-column: 1 !important;
    grid-row: 2 !important;
    height: 100% !important;
  }
  .map-panel .map-destination-grid {
    grid-template-columns: repeat(2,minmax(0,1fr)) !important;
  }
}
${'/* MOBILE-ONLY DESTINATION LAYOUT - END */'}
`;
let original=readFileSync(cssPath,'utf8');
const beginAt=original.indexOf(start);
const endAt=original.indexOf(end);
if((beginAt>=0)!==(endAt>=0))throw new Error('Incomplete previous mobile override markers. No files changed.');
let next=original;
if(beginAt>=0){
  if(endAt<beginAt)throw new Error('Invalid mobile override marker order.');
  next=original.slice(0,beginAt)+original.slice(endAt+end.length);
}
if(!existsSync(cssPath+'.before-mobile-fix.bak'))copyFileSync(cssPath,cssPath+'.before-mobile-fix.bak');
writeFileSync(cssPath,next.trimEnd()+'\n\n'+mobileCss.trim()+'\n');
console.log('Corrected mobile map layout: landscape destinations on the side, portrait beneath the map.');
console.log('Desktop single-row layout preserved. Existing map navigation and zoom logic unchanged.');
console.log('Backup: src/map-regional-navigation.css.before-mobile-fix.bak');
console.log('No tests, builds, commits or pushes performed.');
