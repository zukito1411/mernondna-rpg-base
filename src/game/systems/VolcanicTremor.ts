import {seededRandom} from '../../utils/seededRandom';

/** Occasional low-intensity camera tremors while exploring Darkav. */
export class VolcanicTremor {
  private readonly random=seededRandom('darkav:volcanic-tremors');
  private elapsed=0;
  private nextTremor=24000+this.random()*30000;

  update(delta:number,inDarkav:boolean,paused:boolean,onTremor:()=>void){
    if(!inDarkav){this.elapsed=0;this.nextTremor=24000+this.random()*30000;return;}
    if(paused)return;
    this.elapsed+=Math.max(0,delta);
    if(this.elapsed<this.nextTremor)return;
    this.elapsed=0;
    this.nextTremor=35000+this.random()*40000;
    onTremor();
  }
}
