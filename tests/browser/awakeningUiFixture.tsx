import {createRoot} from 'react-dom/client';
import {InventoryPanel} from '../../src/components/InventoryPanel';
import {NpcServices} from '../../src/components/NpcServices';
import {useGameStore} from '../../src/store/gameStore';
import {NPCS} from '../../src/data/npcs';
import {isBlacksmith} from '../../src/data/economy';
import {AWAKENING_PROFILES} from '../../src/data/awakening';
import {BREAKTHROUGH_ACCEPTED,BREAKTHROUGH_TRIAL,BREAKTHROUGH_COMPLETE,WORLD_ASCENSION} from '../../src/data/breakthrough';
import {xpTotalForLevel,attributeBudget,skillBudget} from '../../src/data/progression';
import {allowExplicitNewGame,setSaveSnapshotProvider} from '../../src/utils/save';
import '../../src/styles.css';import '../../src/fantasy-ui.css';import '../../src/inventory-column.css';
allowExplicitNewGame();setSaveSnapshotProvider();
const smith=NPCS.find(n=>isBlacksmith(n.id))!.id,weaponId='varkhul-emberfang';
useGameStore.getState().resetGame();
useGameStore.setState({level:75,xp:xpTotalForLevel(75),statPoints:attributeBudget(75),skillPoints:skillBudget(75),
 storyFlags:{...useGameStore.getState().storyFlags,[BREAKTHROUGH_ACCEPTED]:true,[BREAKTHROUGH_TRIAL]:true,[BREAKTHROUGH_COMPLETE]:true,[WORLD_ASCENSION]:true},
 inventory:['roadwarden-sword',...AWAKENING_PROFILES.map(p=>p.weaponId)],weaponId,
 awakenedWeapons:AWAKENING_PROFILES.filter(p=>p.weaponId!==weaponId).map(p=>p.weaponId),bossHearts:{varkhul:3},weaponUpgrades:{[weaponId]:3},bossMaterials:{[weaponId]:1},gold:10000,pendingCinematic:null,cinematic:null,cinematicQueue:[]});
const root=createRoot(document.getElementById('root')!);
const showBag=()=>{useGameStore.setState({panel:'inventory',dialogue:null});root.render(<InventoryPanel/>);};
const showForge=()=>{useGameStore.setState({panel:null,dialogue:{npcId:smith,lines:['Show me the heart of that dragon, lad.'],lineIndex:0}});root.render(<div className="dialogue-wrap"><section className="dialogue-panel"><NpcServices npcId={smith}/></section></div>);};
(window as any).__awakeningUi={store:useGameStore,showBag,showForge};showBag();
