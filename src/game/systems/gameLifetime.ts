import type Phaser from 'phaser';

export const GAME_DISPOSING='mernondna-game-disposing';
const disposing=new WeakSet<Phaser.Game>();
export const isGameDisposing=(game:Phaser.Game)=>disposing.has(game);

/** Phaser's destroy() is deferred until a later engine frame. Cancel our
 * asynchronous work immediately, before a new instance can start loading. */
export function disposeGame(game:Phaser.Game){
 if(disposing.has(game))return;
 disposing.add(game);
 game.events.emit(GAME_DISPOSING);
 game.destroy(true);
}
