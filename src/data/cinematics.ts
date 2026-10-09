import { TOWN_BY_ID } from './towns';
import { SETTLEMENT_BY_ID } from './settlements';
export interface StoryShot {x:number;y:number;zoom:number;duration:number;line:string}
export interface StoryScene {id:string;title:string;shots:StoryShot[]}
const city=TOWN_BY_ID.highmere.world,castle=SETTLEMENT_BY_ID.highmere.buildings[1];
const shot=(x:number,y:number,line:string,duration=2600,zoom=.85):StoryShot=>({x:city.x+x,y:city.y+y,zoom,duration,line});
export const CINEMATICS:Record<string,StoryScene>={
  'charter-audience':{id:'charter-audience',title:'The King’s Promise',shots:[
    shot(castle.x,castle.y-100,'Edmund’s seal and Thomas’s testimony tell the same tale: flour was stolen beneath the King’s own mark.',3200,.8),
    shot(-1360,1585,'The first flour cart reaches the Lower Ward. The people gather, weary but no longer afraid to speak.',2800,.9),
    shot(850,0,'Beyond Highmere, old waystones bear the same dark sign. The theft was only the beginning.',2800,.9),
  ]},
  'regional-charter-return':{id:'regional-charter-return',title:'Signs Across the Realm',shots:[
    shot(castle.x,castle.y-100,'From the forest to the frozen sea, the same dark mark appears wherever the old guardians have fallen.',3400,.8),
    shot(-120,0,'The signs point to something buried beneath the realm. Leigneron has found the trail—and the courage to follow it.',3400,.9),
  ]},
  'highmere-arrival':{id:'highmere-arrival',title:'Highmere — Crown of Trandum',shots:[
    shot(-120,0,'Highmere rises above the river, where the king’s road meets the crowded market and the old bridge.'),
    shot(castle.x,castle.y-160,'The crown watches over the city. Not every shadow below it is seen.',3000,.65),
    shot(-1780,-320,'The watch keeps to its posts, unaware that a flour cart has vanished under their eyes.'),
    shot(-1350,1740,'In the Lower Ward, the kitchens are hungry—and Thomas has disappeared.'),
  ]},
  'lower-meeting':{id:'lower-meeting',title:'The Empty Granary',shots:[shot(-2100,2140,'A hidden grain tally and a frightened carter reveal the thief’s mark. Someone in Highmere has been stealing from the hungry.',3200,1)]},
  'grain-resolution':{id:'grain-resolution',title:'Thomas Comes Home',shots:[shot(-1360,1585,'Thomas returns to his mother. The stolen flour will feed the Lower Ward once more.',3200,1)]},
  'guard-muster':{id:'guard-muster',title:'The Watch Stands',shots:[shot(-1780,-320,'Isabel’s guards keep watch over the storehouse. This time, the flour will reach the hungry.',3200,1)]},
  'royal-audience':{id:'royal-audience',title:'Bread for Highmere',shots:[shot(castle.x,castle.y-50,'The crown granaries open. Flour carts roll toward the kitchens before the first snow falls.',3600,.8)]},
  'city-resolution':{id:'city-resolution',title:'The King’s Bread',shots:[shot(-120,0,'The city gathers around the ovens. For tonight, no child in Highmere will go hungry.',3200,.9)]},
};
