import {createRoot} from 'react-dom/client';
import {InventoryPanel} from '../../src/components/InventoryPanel';
import {CharacterPanel} from '../../src/components/CharacterPanel';
import {DialoguePanel} from '../../src/components/DialoguePanel';
import {MobileControls} from '../../src/components/MobileControls';
import {DesktopSkillBar} from '../../src/components/DesktopSkillBar';
import {useGameStore} from '../../src/store/gameStore';
export function openEquipmentUI(){
  const parent=document.createElement('div');parent.className='game-shell';parent.style.cssText='position:fixed;inset:0;z-index:99999;background:#24352b';document.body.append(parent);
  createRoot(parent).render(<><InventoryPanel/><CharacterPanel/><DialoguePanel/><MobileControls/><div className="hud-layer"><DesktopSkillBar/></div></>);
  (window as any).__equipmentStore=useGameStore;
  useGameStore.getState().hydrate({level:30,gold:3000,skillPoints:12,pendingCinematic:null,hp:35,stamina:25});
}
