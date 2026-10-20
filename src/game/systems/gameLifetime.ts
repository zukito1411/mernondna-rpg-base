import type Phaser from 'phaser';

export const GAME_DISPOSING='mernondna-game-disposing';
const disposing=new WeakSet<Phaser.Game>();
const pendingDestruction=new Set<Promise<void>>();
export const isGameDisposing=(game:Phaser.Game)=>disposing.has(game);

/** Never hydrate a replacement journey while an old scene can still clean up
 * shared state. A failed teardown must not permit overlapping game instances. */
export async function waitForGameDisposal(){
 while(pendingDestruction.size){
  let timeout:number|undefined;
  try{
   await Promise.race([
    Promise.all([...pendingDestruction]),
    new Promise<never>((_resolve,reject)=>{timeout=window.setTimeout(()=>reject(new Error('Previous game cleanup did not finish')),15000);}),
   ]);
  }finally{if(timeout!==undefined)window.clearTimeout(timeout);}
 }
}

/** Phaser's destroy() is deferred until a later engine frame. Cancel our
 * asynchronous work immediately, before a new instance can start loading. */
export function disposeGame(game:Phaser.Game){
 if(disposing.has(game))return;
 disposing.add(game);
 const finished=new Promise<void>(resolve=>game.events.once('destroy',resolve));
 pendingDestruction.add(finished);
 // DESTROY fires before renderer cleanup; promise continuations run only after
 // Phaser has returned from that complete destruction stack.
 void finished.then(()=>pendingDestruction.delete(finished));
 try{game.events.emit(GAME_DISPOSING);}
 catch(error){console.warn('[shutdown] Immediate load cancellation failed:',error);}
 game.destroy(true);
 // A sleeping engine has no next frame to consume its destroy request.
 // Use Phaser's public loop API, not its private runDestroy/pendingDestroy.
 if(game.isRunning&&!game.loop.running)game.loop.wake();
}
