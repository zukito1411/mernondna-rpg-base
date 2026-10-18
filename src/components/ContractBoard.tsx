import {useGameStore} from '../store/gameStore';
import {CONTRACTS,CONTRACTS_BY_TOWN,MAX_ACTIVE_CONTRACTS,outstandingContracts,contractObjective,type Contract} from '../data/contracts';
import {TOWN_BY_ID} from '../data/towns';

function ContractCard({contract:c,board=false}:{contract:Contract;board?:boolean}){
  const p=useGameStore(s=>s.contracts[c.id]);
  const accept=useGameStore(s=>s.acceptContract),claim=useGameStore(s=>s.claimContract),abandon=useGameStore(s=>s.abandonContract);
  return <article className="contract-card">
    <small>{TOWN_BY_ID[c.townId].name} · {p?.claimed?'Fulfilled':p?p.progress>=c.amount?'Ready to collect':'Accepted':c.bossId?'Boss bounty':'Hunting contract'}</small>
    <h3>{c.title}</h3>
    {c.amount>=30&&<strong className="contract-difficulty">{c.amount>=50?'Elite hunt · 50 targets':'Veteran hunt · 30 targets'}</strong>}
    <p>{c.description}</p><p>{contractObjective(c)}</p>
    {p&&<p><strong>{p.progress} / {c.amount}</strong></p>}
    <small>Base reward: {c.gold}G · {c.xp} XP · One-time contract</small>
    {!p&&board&&<button type="button" onClick={()=>accept(c.id)}>Accept contract</button>}
    {p&&!p.claimed&&<div className="contract-actions">
      {p.progress>=c.amount&&(board?<button type="button" onClick={()=>claim(c.id)}>Collect reward</button>:<p>Collect at a notice board in {TOWN_BY_ID[c.townId].name}.</p>)}
      {p.progress<c.amount&&<button type="button" onClick={()=>abandon(c.id)}>Abandon contract</button>}
    </div>}
  </article>;
}
export function AcceptedContracts(){
  const ledger=useGameStore(s=>s.contracts);
  const accepted=CONTRACTS.filter(c=>ledger[c.id]&&!ledger[c.id].claimed);
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
  const town=townId?TOWN_BY_ID[townId]:null;
  return <div className="overlay-backdrop"><section className="quest-journal" aria-label="Town notice board">
    <header><h2>{town?.name??'Town'} notice board</h2><button type="button" onClick={close}>Close</button></header>
    <div className="journal-content"><p>Carry up to {MAX_ACTIVE_CONTRACTS} contracts. Accepted: {outstandingContracts(ledger)}/{MAX_ACTIVE_CONTRACTS}.</p>
      <p>Choose a short patrol, a 30-target veteran hunt, a 50-target elite hunt, or the regional boss bounty. Longer hunts pay substantially more. Every settlement has a board, marked “Board” on the minimap.</p>
      <p>Only defeats after accepting count, within the named region. Temporary summons and story waves do not count. Alice can help. Collect payment here after finishing.</p>
      {townId&&(CONTRACTS_BY_TOWN[townId]??[]).map(c=><ContractCard key={c.id} contract={c} board/>)}
    </div>
  </section></div>;
}
