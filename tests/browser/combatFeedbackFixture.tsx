import Phaser from 'phaser';
import {createRoot} from 'react-dom/client';
import {RareLootPopup} from '../../src/components/RareLootPopup';
import {DialoguePanel} from '../../src/components/DialoguePanel';
import {MobileControls} from '../../src/components/MobileControls';
import {useGameStore} from '../../src/store/gameStore';
import {mobileInput} from '../../src/game/input';
import {AttackTelegraph} from '../../src/game/systems/AttackTelegraph';
import type {AttackArea} from '../../src/game/systems/attackWarning';
import '../../src/styles.css';
import '../../src/inventory-column.css';

declare global {interface Window {__combatFeedback?:{
  store:typeof useGameStore;input:typeof mobileInput;phaser:typeof Phaser;setProgress:(p:number)=>void;ready:boolean;
}}}
export function openCombatFeedback(){
  useGameStore.getState().resetGame();useGameStore.getState().hydrate({pendingCinematic:null,cinematic:null});
  const root=document.createElement('div');root.className='game-shell';root.style.cssText='position:fixed;inset:0;background:#263a30';document.body.append(root);
  const canvas=document.createElement('div');root.append(canvas);
  const ui=document.createElement('div');root.append(ui);
  createRoot(ui).render(<><RareLootPopup/><DialoguePanel/><MobileControls/></>);
  const feedback={store:useGameStore,input:mobileInput,phaser:Phaser,setProgress:(_p:number)=>{},ready:false};window.__combatFeedback=feedback;
  class Review extends Phaser.Scene {
    create(){
      const areas:AttackArea[]=[{kind:'circle',x:140,y:190,angle:0,radius:85},
        {kind:'ring',x:410,y:190,angle:0,radius:100,innerRadius:52},
        {kind:'cone',x:680,y:190,angle:0,radius:135,halfAngle:.9},
        {kind:'line',x:130,y:450,angle:0,radius:30,range:225}];
      const warnings=areas.map((area,i)=>{
        this.add.text(area.x-60,area.y-125,['Stomp','Hollow quake','Locked cleave','Charge lane'][i],{color:'#f2e4c5',fontSize:'18px'});
        return new AttackTelegraph(this,'review-warning:'+i);
      });
      feedback.setProgress=p=>warnings.forEach((warning,i)=>warning.draw(areas[i],p,1));
      feedback.setProgress(.5);feedback.ready=true;
    }
  }
  new Phaser.Game({type:Phaser.WEBGL,parent:canvas,width:1000,height:650,backgroundColor:'#263a30',
    audio:{noAudio:true},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Review]});
}
