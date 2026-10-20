import {itemIcon} from '../data/economy';
import {ARMOR_BY_ID,ARMOR_ART_FRAMES,MAGUS_ARMOR_ART,SHADOW_MAGUS_SET,ARMOR_SLOTS} from '../data/armor';
import {useGameStore} from '../store/gameStore';
import {AWAKENING_BY_WEAPON,heartProfile,awakeningArtPath} from '../data/awakening';
export function ItemIcon({id}:{id:string}){
  const awakened=useGameStore(s=>s.awakenedWeapons.includes(id));
  const heart=heartProfile(id),final=awakened?AWAKENING_BY_WEAPON[id]:undefined;
  if(heart||final){const profile=(heart??final)!;return <span className="item-icon awakened-item-icon" aria-hidden="true" style={{backgroundImage:'none'}}><img src={import.meta.env.BASE_URL+awakeningArtPath(profile,heart?'heart-v1.png':'weapon-v1.png')} alt="" draggable={false} style={{width:'100%',height:'100%',objectFit:'contain'}}/></span>;}
  const armor=ARMOR_BY_ID[id];
  if(armor){
    if(armor.setId===SHADOW_MAGUS_SET){
      const [x,y,width,height]=MAGUS_ARMOR_ART.frames[ARMOR_SLOTS.indexOf(armor.slot)],scale=90/Math.max(width,height),art=MAGUS_ARMOR_ART;
      return <span className="item-icon armor-icon" aria-hidden="true" style={{backgroundImage:'none',position:'relative',overflow:'hidden'}}><img src={import.meta.env.BASE_URL+art.path} alt="" draggable={false}
        style={{position:'absolute',maxWidth:'none',maxHeight:'none',width:`${art.width*scale}%`,height:`${art.height*scale}%`,left:`${(100-width*scale)/2-x*scale}%`,top:`${(100-height*scale)/2-y*scale}%`,clipPath:`inset(${y/art.height*100}% ${(art.width-x-width)/art.width*100}% ${(art.height-y-height)/art.height*100}% ${x/art.width*100}%)`}}/></span>;
    }
    const [x,y,width,height]=ARMOR_ART_FRAMES[armor.icon],scale=90/Math.max(width,height);
    return <span className="item-icon armor-icon" aria-hidden="true" style={{backgroundImage:'none',position:'relative',overflow:'hidden'}}><img src={`${import.meta.env.BASE_URL}assets/items/armor-v1.png`} alt="" draggable={false} style={{position:'absolute',maxWidth:'none',maxHeight:'none',width:`${1024*scale}%`,height:`${1536*scale}%`,left:`${(100-width*scale)/2-x*scale}%`,top:`${(100-height*scale)/2-y*scale}%`,clipPath:`inset(${y/1536*100}% ${(1024-x-width)/1024*100}% ${(1536-y-height)/1536*100}% ${x/1024*100}%)`}}/></span>;
  }
  const frame=itemIcon(id);
  return <span className="item-icon" aria-hidden="true" style={{backgroundPosition:`${frame%4*100/3}% ${Math.floor(frame/4)*100/3}%`}}/>;
}
