// Keep Alice's authored identity so quests, portraits and saves share one NPC.
export const ALICE_NPC_ID='mira-fen';
export const ALICE_COMPANION_FLAG='companion:alice-fen:following';
export const aliceIsFollowing=(flags:Record<string,boolean>)=>flags[ALICE_COMPANION_FLAG]===true;
