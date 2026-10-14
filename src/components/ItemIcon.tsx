import {itemIcon} from '../data/economy';
export function ItemIcon({id}:{id:string}){
  const frame=itemIcon(id);
  return <span className="item-icon" aria-hidden="true" style={{backgroundPosition:`${frame%4*100/3}% ${Math.floor(frame/4)*100/3}%`}}/>;
}
