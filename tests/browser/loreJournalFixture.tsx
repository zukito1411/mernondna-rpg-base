import {createRoot} from 'react-dom/client';
import {LoreJournal} from '../../src/components/LoreJournal';
import {InventoryPanel} from '../../src/components/InventoryPanel';
import {useGameStore} from '../../src/store/gameStore';
import {WEAPONS} from '../../src/data/weapons';
declare global {interface Window {__loreStore:typeof useGameStore}}
export function openLoreUI(){
  const parent=document.createElement('div');parent.className='game-shell';parent.style.cssText='position:fixed;inset:0;z-index:99999;background:#24352b';document.body.append(parent);
  createRoot(parent).render(<><LoreJournal/><InventoryPanel/></>);
  window.__loreStore=useGameStore;
  useGameStore.getState().resetGame();
  useGameStore.getState().hydrate({pendingCinematic:null,inventory:WEAPONS.filter(w=>w.kind==='sword').map(w=>w.id)});
  useGameStore.getState().discoverCreature('gray-wolf',undefined,true);
  useGameStore.getState().discoverCreature('frost-wolf');
  useGameStore.getState().discoverCreature('bandit-captain','captain-varr',true);
  useGameStore.getState().discoverRecord('characters','joren-pike');
  useGameStore.getState().openPanel('codex');
}
