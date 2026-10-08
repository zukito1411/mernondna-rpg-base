import { ART_BY_KEY, artFrameSize, type ArtTextureKey } from './art';

type Light = { x:number; y:number; radius:number; fire:boolean; mask:number };
// Source-space window/lantern centers, not guessed atlas cells. Flames can stay
// active by day; their environmental illumination is still night-only.
const centers:Partial<Record<ArtTextureKey,number[][][]>>={
  world_objects:[[[282,445]],[[794,293],[817,452]],[],[[1950,398]]],
  world_buildings:[[[250,290],[197,406]],[[715,254],[855,304],[854,399],[764,398]],[[1240,375],[1320,390,1]],[[252,828]],[],[[1159,690],[1279,700]]],
  capital_buildings:[[[112,255],[230,255],[193,352],[253,335]],[[540,229],[620,245],[693,272],[626,340],[678,335]],
    [[824,170],[867,170],[910,171],[904,350]],[[1137,264],[1255,264],[1193,227],[1119,335,1],[1279,335,1]],
    [[156,593],[203,646]],[[598,646,1],[541,625]],[[910,549],[785,615],[907,615]],[[1217,547],[1284,618]],
    [[438,932],[496,932],[359,891],[568,803],[720,806],[797,930],[852,930],[543,991,1],[706,991,1]],[[1135,898],[1145,980]]],
  others:[[[248,196]],[[430,144]],[[793,256]],[[1020,213,1]],[],[[87,603]],[],[],[],[],[],[],[],[[1282,845,1]]],
  world_assets:[[],[],[],[],[],[],[[1772,470,1]],[]],
  bridges:[[],[],[],[],[],[],[[689,800]],[],[[1373,841]]],
  royal_walls:[[],[],[],[],[[1144,714,1],[1302,714,1]]],
};
export function environmentLightPoints(texture:ArtTextureKey,frame:number):Light[] {
  const region=ART_BY_KEY[texture].regions?.[frame];if(!region) return [];
  const fit=artFrameSize(texture,frame).width/region[2];
  return (centers[texture]?.[frame]??[]).map(([x,y,fire])=>({
    x:(x-region[0]-region[2]/2)*fit,y:-(region[1]+region[3]-y)*fit-2,
    radius:fire?100:72,fire:Boolean(fire),mask:(texture==='capital_buildings'?28:32)*fit,
  }));
}
export function nightStrength(minute:number) {
  const hour=minute/60;
  if(hour>=20||hour<5) return 1;
  if(hour>=18) return (hour-18)/2;
  if(hour<7) return (7-hour)/2;
  return 0;
}
