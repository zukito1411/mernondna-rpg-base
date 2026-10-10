import type {EnemyDefinition} from '../game/types';
export type EnemySoundCue='attack'|'growl'|'hurt'|'death';
export type EnemyVoice='wolf'|'human'|'boar'|'wraith'|'troll'|'wyrm'|'dragon';
const voices:Record<string,EnemyVoice>={
 'gray-wolf':'wolf','road-bandit':'human','bandit-captain':'human','salt-king':'human',
 'rindass-boar':'boar','redmesa-chieftain':'boar','marsh-wraith':'wraith',
 'moonlit-warden':'wraith','rootfather':'wraith','ashen-seer':'wraith',
 'cave-troll':'troll','stonejaw-troll':'troll','frost-wyrm':'wyrm','ash-dragon':'dragon',
};
export function enemyVoice(enemy:EnemyDefinition):EnemyVoice {
 return voices[enemy.id]??(['wolf','human','boar','wraith','troll','dragon'] as const)[enemy.spriteFrame]??'boar';
}
// Measured decoded RMS: modest gains keep the louder troll hurt recording
// balanced with the quiet human attacks. Keep dragon recordings at natural pitch.
const gains:Record<EnemyVoice,Record<EnemySoundCue,number>>={
 wolf:{attack:1,growl:.8,hurt:.75,death:.8},human:{attack:1.6,growl:1.3,hurt:1.1,death:1},
 boar:{attack:1.2,growl:.85,hurt:.85,death:.85},wraith:{attack:1.6,growl:.6,hurt:.75,death:1.2},
 troll:{attack:1.2,growl:.85,hurt:.5,death:.65},wyrm:{attack:1.6,growl:.75,hurt:.75,death:.75},
 dragon:{attack:1.3,growl:2,hurt:1.4,death:1.4},
};
export function enemyAudioCue(enemy:EnemyDefinition,cue:EnemySoundCue){
 const voice=enemyVoice(enemy);
 return {key:`sfx-enemy-${voice}-${cue}`,gain:gains[voice][cue],
  // The six-second dragon attack must not outlast the windup and next attack.
  maxDuration:voice==='dragon'?(cue==='attack'?1.5:cue==='growl'?2.4:1.2):1.6,
  rate:voice==='dragon'?1:enemy.boss?.96:1};
}
