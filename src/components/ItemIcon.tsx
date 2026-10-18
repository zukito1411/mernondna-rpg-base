import {itemIcon} from '../data/economy';
import {ARMOR_BY_ID,ARMOR_ART_FRAMES} from '../data/armor';
export function ItemIcon({id}:{id:string}){
  const armor=ARMOR_BY_ID[id];
  if(armor){
    const [x,y,width,height]=ARMOR_ART_FRAMES[armor.icon],scale=90/Math.max(width,height);
    return <span className="item-icon armor-icon" aria-hidden="true" style={{backgroundImage:'none',position:'relative',overflow:'hidden'}}><img src={`${import.meta.env.BASE_URL}assets/items/armor-v1.png`} alt="" draggable={false} style={{position:'absolute',maxWidth:'none',maxHeight:'none',width:`${1024*scale}%`,height:`${1536*scale}%`,left:`${(100-width*scale)/2-x*scale}%`,top:`${(100-height*scale)/2-y*scale}%`,clipPath:`inset(${y/1536*100}% ${(1024-x-width)/1024*100}% ${(1536-y-height)/1536*100}% ${x/1024*100}%)`}}/></span>;
  }
  const frame=itemIcon(id);
  return <span className="item-icon" aria-hidden="true" style={{backgroundPosition:`${frame%4*100/3}% ${Math.floor(frame/4)*100/3}%`}}/>;
}
