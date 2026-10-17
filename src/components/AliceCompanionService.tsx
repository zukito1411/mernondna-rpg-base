import {ALICE_NPC_ID,aliceIsFollowing} from '../data/aliceCompanion';
import {useGameStore} from '../store/gameStore';

export function AliceCompanionService({npcId}:{npcId:string}){
  const following=useGameStore(s=>aliceIsFollowing(s.storyFlags));
  const ask=useGameStore(s=>s.askAliceToAdventure);
  if(npcId!==ALICE_NPC_ID)return null;
  return <section className="merchant-stock" aria-label="Adventure with Alice">
    <p>{following?'Alice keeps her bow ready, watching the road beside you.':'Alice checks her arrows. “There is room for one more on that road, you know.”'}</p>
    <button type="button" onClick={()=>ask(!following)}>
      {following?'Take a rest in Oakmere':'Come adventuring with me'}
    </button>
  </section>;
}
