import {seededRandom} from '../../utils/seededRandom';
import {volcanicRumbleIntensity} from './volcanicRumbleProfile';

/** Occasional Darkav rumble. The media clock owns the quake's phase, so loading,
 * buffering and pausing cannot let camera movement outrun the recording. */
export class VolcanicTremor {
  private readonly random=seededRandom('darkav:volcanic-tremors');
  private elapsed=0;
  private nextTremor=24000+this.random()*30000;
  private voice:HTMLAudioElement|null=null;
  private inDarkav=false;
  private active=false;
  private playing=false;
  private starting=false;
  private awaitingGesture=false;
  private blocked=false;
  private destroyed=false;
  private onRumble:(seconds:number,intensity:number)=>void=()=>{};
  private onSilence:()=>void=()=>{};

  constructor(private readonly createVoice:()=>HTMLAudioElement=()=>new Audio('assets/audio/ambience/volcanic.mp3')){
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.visibility);
    if(typeof window!=='undefined'){
      window.addEventListener('pointerdown',this.gesture);
      window.addEventListener('keydown',this.gesture);
    }
  }
  update(delta:number,inDarkav:boolean,paused:boolean,onRumble:(seconds:number,intensity:number)=>void,onSilence:()=>void=()=>{},muted=false){
    if(this.destroyed)return;
    this.onRumble=onRumble;this.onSilence=onSilence;
    this.blocked=paused||(typeof document!=='undefined'&&document.hidden);
    if(!inDarkav){
      if(this.inDarkav){this.finish();if(this.voice)this.voice.currentTime=0;this.nextTremor=24000+this.random()*30000;}
      this.inDarkav=false;return;
    }
    this.inDarkav=true;
    const voice=this.ensureVoice();voice.muted=muted;
    if(this.blocked){this.pause();return;}
    if(!this.active){
      this.elapsed+=Math.max(0,delta);
      if(this.elapsed<this.nextTremor)return;
      this.active=true;voice.currentTime=0;this.awaitingGesture=false;this.play();
    }else if(voice.paused&&!this.starting&&!this.awaitingGesture)this.play();
    if(this.playing&&!voice.paused&&!voice.ended)this.sample();
  }
  pause(){
    this.blocked=true;this.playing=false;this.voice?.pause();this.onSilence();
  }
  private ensureVoice(){
    if(this.voice)return this.voice;
    const voice=this.voice=this.createVoice();voice.preload='auto';voice.loop=false;voice.volume=.45;
    voice.addEventListener('playing',this.started);
    voice.addEventListener('waiting',this.waiting);
    voice.addEventListener('ended',this.finished);
    voice.addEventListener('error',this.finished);
    voice.load();return voice;
  }
  private sample(){
    const seconds=this.voice!.currentTime;
    this.onRumble(seconds,volcanicRumbleIntensity(seconds));
  }
  private started=()=>{
    if(this.destroyed||!this.active||this.blocked){this.voice?.pause();return;}
    this.playing=true;this.sample();
  };
  private waiting=()=>{this.playing=false;this.onSilence();};
  private finished=()=>this.finish();
  private visibility=()=>{if(document.hidden)this.pause();};
  private gesture=()=>{
    if(this.active&&!this.blocked&&!this.destroyed&&this.awaitingGesture){this.awaitingGesture=false;this.play();}
  };
  private play(){
    if(this.starting||this.blocked||!this.active)return;
    this.starting=true;
    void this.voice!.play().catch(()=>{this.awaitingGesture=true;this.waiting();})
      .finally(()=>{this.starting=false;if(this.blocked||!this.active||this.destroyed)this.voice?.pause();});
  }
  private finish(){
    this.voice?.pause();this.playing=false;this.active=false;this.awaitingGesture=false;
    this.elapsed=0;this.nextTremor=35000+this.random()*40000;this.onSilence();
  }
  destroy(){
    if(this.destroyed)return;this.destroyed=true;this.finish();
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.visibility);
    if(typeof window!=='undefined'){
      window.removeEventListener('pointerdown',this.gesture);
      window.removeEventListener('keydown',this.gesture);
    }
    if(this.voice){
      this.voice.removeEventListener('playing',this.started);this.voice.removeEventListener('waiting',this.waiting);
      this.voice.removeEventListener('ended',this.finished);this.voice.removeEventListener('error',this.finished);
      this.voice.removeAttribute('src');this.voice.load();
    }
  }
}
