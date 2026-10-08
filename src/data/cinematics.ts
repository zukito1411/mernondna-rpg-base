import { TOWN_BY_ID } from './towns';
import { SETTLEMENT_BY_ID } from './settlements';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const city=TOWN_BY_ID.highmere.world,castle=SETTLEMENT_BY_ID.highmere.buildings[1];
const shot=(x:number,y:number,line:string,duration=2600,zoom=.85):StoryShot=>({x:city.x+x,y:city.y+y,zoom,duration,line});
export const CINEMATICS:Record<string,StoryScene>={
  'charter-audience':{id:'charter-audience',title:'The road belongs to the living',shots:[
    shot(castle.x,castle.y-100,'Aldren’s account and Tovin’s testimony reach the same public audience. A broken road was the first sign, not the whole crime.',3200,.8),
    shot(-1360,1585,'The Lower Ward is entered into the charter beside the royal bridges. Those who depend on the road must have a voice in its keeping.',2800,.9),
    shot(850,0,'Renna’s regional inquiry begins here. The watch carries evidence and household needs, not merely news of fallen enemies.',2800,.9),
  ]},
  'regional-charter-return':{id:'regional-charter-return',title:'One continent, many witnesses',shots:[
    shot(castle.x,castle.y-100,'Forest wards, mountain refuges, clan wells, mine waters and sea channels enter the same public record.',3400,.8),
    shot(-120,0,'The capital’s promise will be judged by what its neighbors can rebuild. Leigneron’s journey ends with an account the kingdom cannot quietly lose.',3400,.9),
  ]},
  'highmere-arrival':{id:'highmere-arrival',title:'Highmere — Crown of Trandum',shots:[
    shot(-120,0,'Aldren’s roads meet here: royal charters, river tolls, and the kitchens that feed the kingdom.'),
    shot(castle.x,castle.y-160,'Above the wards, Crown Hall keeps the old roadwarden charters.',3000,.65),
    shot(-1780,-320,'The watch marches by order. Its oath is to protect the city, not only the crown.'),
    shot(-1350,1740,'In the Lower Ward, missing workers and empty grain carts tell another story.'),
  ]},
  'lower-meeting':{id:'lower-meeting',title:'The erased entries',shots:[shot(-2100,2140,'A copied signature. A living witness. The theft was organized from an office, not a roadside camp.',3200,1)]},
  'grain-resolution':{id:'grain-resolution',title:'The witness comes home',shots:[shot(-1360,1585,'Tovin returns to the kitchen. The evidence can no longer be erased with him.',3200,1)]},
  'guard-muster':{id:'guard-muster',title:'A guard’s obligation',shots:[shot(-1780,-320,'Yselle’s watch secures the relief stores. Service is measured in people kept safe.',3200,1)]},
  'royal-audience':{id:'royal-audience',title:'The royal audience',shots:[shot(castle.x,castle.y-50,'The petition carries signatures from both banks. The crown enters a binding relief agreement.',3600,.8)]},
  'city-resolution':{id:'city-resolution',title:'A promise entered into the charter',shots:[shot(-120,0,'A city is not healed by one decree. Open records give its people a way to hold the promise.',3200,.9)]},
};
