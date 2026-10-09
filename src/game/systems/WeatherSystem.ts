import Phaser from 'phaser';
import {seededRandom} from '../../utils/seededRandom';
import {useGameStore} from '../../store/gameStore';
import {WORLD_CONTENT} from '../../data/content';
import {spriteBounds,type Rect} from '../../data/settlementGeometry';
import type {WorldGenerator} from './WorldGenerator';
import {REGION_SCENERY} from '../../data/regionScenery';
import {nightStrength} from '../../data/environmentLights';
import {FogArt} from './FogArt';
type Kind='clear'|'cloudy'|'rain'|'storm'|'snow'|'fog'|'wind'|'dust';
const labels:Record<Kind,string>={clear:'Clear skies',cloudy:'Overcast',rain:'Light rain',storm:'Heavy rain',snow:'Snowfall',fog:'Valley mist',wind:'Windy',dust:'Dust and ash'};
export function weatherFor(region:string,biome:string,day:number,minute:number):Kind{
  const rng=seededRandom(`weather:${region}:${day}:${Math.floor(minute/480)}`),value=rng();
  if(region==='darkav')return value<.5?'dust':'wind';
  if(region==='rindass')return value<.3?'dust':value<.6?'wind':'clear';
  if(region==='frostlands'||biome==='snowfield')return value<.5?'snow':value<.7?'fog':'cloudy';
  if(biome==='wetland'&&minute<600)return 'fog';
  if(value<.25)return 'clear';if(value<.45)return 'cloudy';if(value<.7)return 'rain';if(value<.82)return 'storm';
  return minute<600?'fog':'wind';
}
/** One bounded screen canvas, one precipitation state, gradual transitions.
 * Weather is deterministically restored from the saved region/day/clock. */
export class WeatherSystem {
  private readonly texture:Phaser.Textures.CanvasTexture;
  private readonly overlay:Phaser.GameObjects.Image;
  private kind:Kind='clear';private target:Kind='clear';private strength=0;private elapsed=0;private drawMs=100;
  private roofMs=500;private roofs:Rect[]=[];
  private readonly fogArt=new FogArt();private ambientMist=0;private nextBirdMs=0;
  private readonly points:Array<{x:number;y:number;speed:number;phase:number}>;
  private audio:AudioContext|null=null;private gain:GainNode|null=null;private source:AudioBufferSourceNode|null=null;
  private audioBus:GainNode|null=null;private audioFilter:BiquadFilterNode|null=null;
  private destroyed=false;
  get windStrength(){return this.kind==='wind'||this.kind==='storm'||this.kind==='dust'?this.strength:.18+this.strength*.25;}
  constructor(private readonly scene:Phaser.Scene,private readonly world:WorldGenerator){
    this.texture=scene.textures.createCanvas('weather-overlay',scene.scale.width,scene.scale.height)!;
    this.overlay=scene.add.image(0,0,'weather-overlay').setOrigin(0).setScrollFactor(0).setDepth(999_990).setName('regional-weather');
    const rng=seededRandom('weather-particles');this.points=Array.from({length:96},()=>({x:rng(),y:rng(),speed:.6+rng(),phase:rng()*6.28}));
    window.addEventListener('mernondna-weather-audio',this.enableAudio);
    window.addEventListener('pointerdown',this.unlockAudio);
    window.addEventListener('keydown',this.unlockAudio);
    document.addEventListener('visibilitychange',this.visibility);
  }
  private visibility=()=>{if(document.hidden)void this.audio?.suspend().catch(()=>{});else if(useGameStore.getState().weatherAudio)void this.audio?.resume().catch(()=>{});};
  private unlockAudio=()=>{if(useGameStore.getState().weatherAudio&&(!this.audio||this.audio.state==='suspended'))this.enableAudio();};
  private enableAudio=()=>{
    if(!useGameStore.getState().weatherAudio)return;
    try{if(!this.audio){this.audio=new AudioContext();const buffer=this.audio.createBuffer(1,this.audio.sampleRate*2,this.audio.sampleRate),channel=buffer.getChannelData(0);
      for(let i=0;i<channel.length;i++)channel[i]=(Math.random()-.5)*.5;
      this.source=this.audio.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
      this.audioFilter=this.audio.createBiquadFilter();this.audioFilter.type='lowpass';this.audioFilter.frequency.value=700;
      this.audioBus=this.audio.createGain();this.audioBus.gain.value=0;
      this.gain=this.audio.createGain();this.gain.gain.value=0;
      this.source.connect(this.audioFilter).connect(this.gain).connect(this.audioBus).connect(this.audio.destination);this.source.start();}
      void this.audio.resume().catch(()=>{});
    }catch{/* Unsupported/muted audio never prevents play. */}
  };
  update(delta:number,x:number,y:number,paused=false){
    const state=useGameStore.getState(),biome=this.world.getBiomeAt(x,y),region=this.world.getRegionAt(x,y);
    this.target=weatherFor(region,biome,state.day,state.minuteOfDay);
    const step=Math.min(delta,100)/6000;
    if(this.target!==this.kind){this.strength=Math.max(0,this.strength-step);if(this.strength===0)this.kind=this.target;}
    else {const goal=this.kind==='clear'?0:this.kind==='snow'&&(state.day+Math.floor(state.minuteOfDay/480))%2?.55:1;
      this.strength+=Math.max(-step,Math.min(step,goal-this.strength));}
    this.elapsed+=delta;this.drawMs+=delta;this.roofMs+=delta;
    const night=nightStrength(state.minuteOfDay),dawn=state.minuteOfDay>=240&&state.minuteOfDay<540;
    const mistTarget=(dawn||night>.5)&&(biome==='forest'||biome==='wetland'||this.world.distanceToWater(x,y)<300)?(dawn ? .32 : .1):0;
    this.ambientMist+=Math.max(-step,Math.min(step,mistTarget-this.ambientMist));
    if(state.weatherLabel!==labels[this.kind])state.hydrate({weatherLabel:labels[this.kind]});
    this.updateAmbience(region,biome,night,paused||!state.weatherAudio);
    if(this.drawMs<50)return;this.drawMs=0;
    const camera=this.scene.cameras.main,z=camera.zoom,w=this.scene.scale.width,h=this.scene.scale.height;
    if(this.texture.width!==w||this.texture.height!==h)this.texture.setSize(w,h);
    const fogAmount=Math.max(this.ambientMist,this.kind==='fog'?this.strength:0);
    this.overlay.setScale(1/z).setPosition(w/2*(1-1/z),h/2*(1-1/z)).setVisible(this.strength>0||fogAmount>0);
    if(this.strength===0&&fogAmount===0)return;
    if(this.roofMs>350){this.roofMs=0;const cx=camera.worldView.x+w/z/2,cy=camera.worldView.y+h/z/2;
      this.roofs=WORLD_CONTENT.filter(d=>d.kind==='settlement-prop'&&Math.abs(d.world.x-cx)<w/z+500&&Math.abs(d.world.y-cy)<h/z+500)
      .map(d=>d.kind==='settlement-prop'?spriteBounds(d.texture??'world_objects',d.frame,d.scale,d.world.x,d.world.y):{left:0,right:0,top:0,bottom:0});}
    const ctx=this.texture.getContext();ctx.clearRect(0,0,w,h);
    const wet=this.kind==='rain'||this.kind==='storm';
    ctx.fillStyle=`rgba(42,58,72,${this.strength*(this.kind==='storm'?.16:wet?.07:this.kind==='cloudy'?.1:0)})`;ctx.fillRect(0,0,w,h);
    this.fogArt.draw(ctx,w,h,camera.worldView.x,camera.worldView.y,this.elapsed,fogAmount,REGION_SCENERY[region].fogTint,night);
    if(this.kind!=='cloudy'&&this.kind!=='clear'&&this.kind!=='fog'){
      const count=this.kind==='storm'?96:wet?60:this.kind==='snow'?Math.floor(32+this.strength*40):20;
      for(let i=0;i<count;i++){const p=this.points[i],px=(p.x*w+this.elapsed*(wet?.08:.018)*p.speed)%w,
        py=(p.y*h+this.elapsed*(wet?.55:this.kind==='snow'?.04:.009)*p.speed)%h;
        const wx=camera.worldView.x+px/z,wy=camera.worldView.y+py/z;
        if((wet||this.kind==='snow')&&this.roofs.some(r=>wx>=r.left&&wx<=r.right&&wy>=r.top&&wy<=r.bottom))continue;
        ctx.globalAlpha=this.strength*(wet?.35:.5);ctx.strokeStyle=wet?'#b9d9ee':'#c5b287';ctx.fillStyle=this.kind==='snow'?'#e7f0f5':'#c5b287';
        if(wet){ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+3,py+10);ctx.stroke();}
        else{ctx.beginPath();ctx.ellipse(px+Math.sin(this.elapsed*.001+p.phase)*12,py,this.kind==='snow'?2:4,1.4,0,0,Math.PI*2);ctx.fill();}
      }ctx.globalAlpha=1;
    }
    this.texture.refresh();
  }
  private updateAmbience(region:string,biome:string,night:number,muted:boolean){
    if(!this.audio||!this.gain||!this.audioBus||!this.audioFilter)return;
    const now=this.audio.currentTime,coast=region==='dead-sea'||biome==='coast';
    this.audioBus.gain.setTargetAtTime(muted?0:1,now,.18);
    const weather=['rain','storm','wind','dust'].includes(this.kind)?this.strength*.045:0;
    const bed=coast ? .013+Math.sin(this.elapsed*.0007)*.005 : biome==='forest' ? (night>.5 ? .005 : .002) :
      region==='nardorous'||region==='frostlands' ? .007 : region==='darkav' ? .005 : .002;
    this.gain.gain.setTargetAtTime(weather+bed,now,.8);
    this.audioFilter.frequency.setTargetAtTime(this.kind==='rain'||this.kind==='storm'?1100:coast?420:260,now,1);
    // Optional, quiet synthesized birds/crickets; bounded voices and no asset
    // downloads. Respect the existing audio toggle and browser gesture policy.
    if(muted||this.audio.state!=='running'||biome!=='forest'||this.elapsed<this.nextBirdMs)return;
    this.nextBirdMs=this.elapsed+6500+Math.sin(this.elapsed*.001)*1800;
    const voice=this.audio.createOscillator(),envelope=this.audio.createGain();
    voice.type='sine';voice.frequency.setValueAtTime(night>.5?3300:1450,now);
    voice.frequency.linearRampToValueAtTime(night>.5?3600:2100,now+.12);
    voice.frequency.linearRampToValueAtTime(night>.5?3300:1650,now+.24);
    envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(night>.5 ? .004 : .008,now+.05);
    envelope.gain.linearRampToValueAtTime(0,now+.35);voice.connect(envelope).connect(this.audioBus);
    voice.onended=()=>{voice.disconnect();envelope.disconnect();};voice.start(now);voice.stop(now+.4);
  }
  destroy(){if(this.destroyed)return;this.destroyed=true;
    window.removeEventListener('mernondna-weather-audio',this.enableAudio);window.removeEventListener('pointerdown',this.unlockAudio);window.removeEventListener('keydown',this.unlockAudio);
    document.removeEventListener('visibilitychange',this.visibility);this.source?.stop();void this.audio?.close().catch(()=>{});
    this.fogArt.destroy();this.overlay.destroy();this.scene.textures.remove('weather-overlay');}
}
