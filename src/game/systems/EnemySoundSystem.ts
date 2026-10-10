import Phaser from 'phaser';
import type {EnemyDefinition} from '../types';
import {useGameStore} from '../../store/gameStore';

export type EnemySoundCue='attack'|'growl'|'hurt'|'death';
export type EnemyAttackFoley='windup'|'impact';
type Voice='wolf'|'human'|'boar'|'wraith'|'troll'|'wyrm'|'dragon';
interface VoiceProfile {base:number;range:number;harmonics:number;breath:number;roughness:number}

const VOICES:Record<Voice,VoiceProfile>={
 wolf:{base:88,range:1.85,harmonics:2.7,breath:.32,roughness:.72},
 human:{base:112,range:1.55,harmonics:2.15,breath:.16,roughness:.42},
 boar:{base:67,range:1.65,harmonics:3.1,breath:.58,roughness:.8},
 wraith:{base:176,range:2.1,harmonics:1.72,breath:.42,roughness:.24},
 troll:{base:49,range:1.48,harmonics:3.4,breath:.25,roughness:.95},
 wyrm:{base:74,range:2.05,harmonics:2.6,breath:.36,roughness:.64},
 dragon:{base:42,range:2.4,harmonics:3.2,breath:.5,roughness:.9},
};

const CUES:Record<EnemySoundCue,{duration:number;start:number;end:number;volume:number}>={
 attack:{duration:.38,start:1.55,end:.72,volume:.2},
 growl:{duration:.82,start:.78,end:1.28,volume:.145},
 hurt:{duration:.31,start:1.8,end:.62,volume:.23},
 death:{duration:1.08,start:1.2,end:.38,volume:.28},
};

function voiceFor(enemy:EnemyDefinition):Voice{
 if(enemy.combatStyle==='dragon')return 'dragon';
 if(enemy.combatStyle==='troll')return 'troll';
 switch(enemy.id){
  case 'gray-wolf':return 'wolf';
  case 'road-bandit':case 'bandit-captain':case 'salt-king':return 'human';
  case 'rindass-boar':case 'redmesa-chieftain':return 'boar';
  case 'frost-wyrm':return 'wyrm';
  case 'marsh-wraith':case 'moonlit-warden':case 'rootfather':case 'ashen-seer':return 'wraith';
  default:throw new Error(`No enemy voice profile for ${enemy.id}`);
 }
}

/** Short, spatially placed monster calls synthesized from each creature's voice profile. */
export class EnemySoundSystem {
 private readonly buffers=new Map<string,AudioBuffer>();
 private readonly lastHurt=new Map<string,number>();
 constructor(private readonly scene:Phaser.Scene){}

 play(enemy:EnemyDefinition,instanceId:string,cue:EnemySoundCue,x:number,y:number){
  if(!useGameStore.getState().weatherAudio||this.scene.sound.locked
   ||!(this.scene.sound instanceof Phaser.Sound.WebAudioSoundManager))return;
  const player=this.scene.player;
  if(!player?.active)return;
  const distance=Math.hypot(player.x-x,player.y-y);
  const audibleRadius=cue==='death'?1300:1050;
  if(distance>=audibleRadius)return;
  const now=this.scene.time.now;
  if(cue==='hurt'&&now-(this.lastHurt.get(instanceId)??-Infinity)<140)return;
  if(cue==='hurt')this.lastHurt.set(instanceId,now);

  const voice=voiceFor(enemy),buffer=this.buffer(voice,cue),context=this.scene.sound.context;
  const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();
  const camera=this.scene.cameras.main,halfWidth=camera.width/(camera.zoom*2);
  const attenuation=Math.pow(1-distance/audibleRadius,1.35),bossScale=enemy.boss?1.22:1;
  source.buffer=buffer;source.playbackRate.value=Phaser.Math.FloatBetween(.94,1.06);
  gain.gain.value=CUES[cue].volume*attenuation*bossScale;
  pan.pan.value=Phaser.Math.Clamp((x-camera.midPoint.x)/Math.max(1,halfWidth),-1,1);
  source.connect(gain);gain.connect(pan);pan.connect(context.destination);
  source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();};
  source.start();
 }

 private buffer(voice:Voice,cue:EnemySoundCue){
  const key=voice+':'+cue,saved=this.buffers.get(key);
  if(saved)return saved;
  const profile=VOICES[voice],shape=CUES[cue],context=(this.scene.sound as Phaser.Sound.WebAudioSoundManager).context;
  const sampleRate=context.sampleRate,length=Math.ceil(sampleRate*shape.duration),buffer=context.createBuffer(1,length,sampleRate);
  const samples=buffer.getChannelData(0);
  let phase=0,filteredNoise=0;
  for(let i=0;i<length;i++){
   const t=i/(length-1),sweep=shape.start*Math.pow(shape.end/shape.start,t);
   const wobble=1+Math.sin(t*Math.PI*(cue==='growl'?5:3))*profile.roughness*.13;
   const frequency=profile.base*sweep*wobble;
   phase+=Math.PI*2*frequency/sampleRate;
   const envelope=Math.min(1,t*15)*Math.pow(1-t,cue==='death'?.72:1.25);
   const tone=Math.sin(phase)+Math.sin(phase*2.01)*.32+Math.sin(phase*profile.harmonics)*.18;
   const noise=(Math.random()*2-1);
   filteredNoise+=.075*(noise-filteredNoise);
   const airy=noise*(1-profile.roughness)+filteredNoise*profile.roughness;
   const rasp=Math.sin(phase*.47+Math.sin(phase*.11)*2)*profile.roughness;
   samples[i]=Math.tanh((tone*.58+airy*profile.breath+rasp*.2)*envelope*1.8)*.78;
  }
  this.buffers.set(key,buffer);
  return buffer;
 }

 forget(instanceId:string){this.lastHurt.delete(instanceId);}
 destroy(){this.buffers.clear();this.lastHurt.clear();}
}
