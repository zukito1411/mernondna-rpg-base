import {useGameStore} from '../store/gameStore';
import {boardContracts,contractBoardCycle,contractById,MAX_ACTIVE_CONTRACTS,outstandingContracts,contractObjective,type Contract} from '../data/contracts';
import {TOWN_BY_ID} from '../data/towns';

function ContractCard({contract:c,board=false}:{contract:Contract;board?:boolean}){
  const p=useGameStore(s=>s.contracts[c.id]);
  const accept=useGameStore(s=>s.acceptContract),claim=useGameStore(s=>s.claimContract),abandon=useGameStore(s=>s.abandonContract);
  return <article className="contract-card">
    <small>{TOWN_BY_ID[c.townId].name} · {p?.claimed?'Fulfilled':p?p.progress>=c.amount?'Ready to collect':'Accepted':c.dungeonId?'Dungeon expedition':c.bossId?'Boss bounty':'Hunting contract'}</small>
    <h3>{c.title}</h3>
    {c.amount>=30&&<strong className="contract-difficulty">{c.amount>=50?'Elite hunt · 50 targets':'Veteran hunt · 30 targets'}</strong>}
    <p>{c.description}</p><p>{contractObjective(c)}</p>
    {p&&<p><strong>{p.progress} / {c.amount}</strong></p>}
    <small>Base reward: {c.gold}G · {c.xp} XP · One reward per rotation</small>
    {!p&&board&&<button type="button" onClick={()=>accept(c.id)}>Accept contract</button>}
    {p&&!p.claimed&&<div className="contract-actions">
      {p.progress>=c.amount&&(board?<button type="button" onClick={()=>claim(c.id)}>Collect reward</button>:<p>Collect at a notice board in {TOWN_BY_ID[c.townId].name}.</p>)}
      {p.progress<c.amount&&<button type="button" onClick={()=>abandon(c.id)}>Abandon contract</button>}
    </div>}
  </article>;
}
export function AcceptedContracts(){
  const ledger=useGameStore(s=>s.contracts);
  const accepted=Object.entries(ledger).filter(([,p])=>!p.claimed)
    .map(([id])=>contractById(id)).filter((c):c is Contract=>Boolean(c));
  return <details className="accepted-contracts" open={accepted.length>0}><summary>Notice-board contracts ({accepted.length}/{MAX_ACTIVE_CONTRACTS})</summary>
    {!accepted.length&&<p>Visit a town notice board to accept local work.</p>}
    {accepted.map(c=><ContractCard key={c.id} contract={c}/>)}
  </details>;
}
export function ContractBoard(){
  const panel=useGameStore(s=>s.panel);
  return panel==='contracts'?<OpenContractBoard/>:null;
}
function OpenContractBoard(){
  const townId=useGameStore(s=>s.contractBoardTownId),ledger=useGameStore(s=>s.contracts),close=useGameStore(s=>s.closePanel);
  const day=useGameStore(s=>s.day);
  const cycle=contractBoardCycle(day),nextRefresh=(cycle+1)*3+1;
  const offers=townId?boardContracts(townId,day):[];
  const offeredIds=new Set(offers.map(c=>c.id));
  const ongoing=Object.entries(ledger)
    .filter(([id,p])=>!p.claimed&&!offeredIds.has(id))
    .map(([id])=>contractById(id))
    .filter((c):c is Contract=>Boolean(c)&&c.townId===townId);
  const town=townId?TOWN_BY_ID[townId]:null;
  return <div className="overlay-backdrop"><section className="quest-journal" aria-label="Town notice board">
    <header><h2>{town?.name??'Town'} notice board</h2><button type="button" onClick={close}>Close</button></header>
    <div className="journal-content"><p>Carry up to {MAX_ACTIVE_CONTRACTS} contracts. Accepted: {outstandingContracts(ledger)}/{MAX_ACTIVE_CONTRACTS}.</p>
      <p><strong>Current offers: days {cycle*3+1}–{nextRefresh-1}.</strong> The board refreshes on day {nextRefresh}, then every three game days. Accepted contracts survive rotations.</p>
      <p>Choose a short patrol, a 30-target veteran hunt, a 50-target elite hunt, a regional boss bounty, or a local cave expedition. New patrols rotate among naturally spawning regional enemies. Cave contracts pay extra on top of the cave chest. Every settlement has a board, marked “Board” on the minimap.</p>
      <p>Only defeats after accepting count, within the named region. Temporary summons and story waves do not count. Alice can help. Collect payment here after finishing.</p>
      {offers.map(c=><ContractCard key={c.id} contract={c} board/>)}
      {ongoing.length>0&&<><h3>Contracts from earlier boards</h3>
        <p>These remain active. Complete them and collect their rewards here.</p>
        {ongoing.map(c=><ContractCard key={c.id} contract={c} board/>)}</>}
    </div>
  </section></div>;
}
