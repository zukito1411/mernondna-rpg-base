import {MAP_SERVICE_STYLE,type MapService} from '../data/mapServices';

const icons=new Map<MapService,HTMLCanvasElement>();
/** Tiny cached service badges. No image loading or independent animation loop. */
export function mapServiceIcon(service:MapService){
  const cached=icons.get(service);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=18;
  const ctx=canvas.getContext('2d');if(!ctx)return canvas;
  ctx.fillStyle='#211b13';ctx.strokeStyle=MAP_SERVICE_STYLE[service].color;ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(9,9,8,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.lineWidth=1.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  if(service==='home'){
    ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.fillStyle=MAP_SERVICE_STYLE.home.color;ctx.fillText('⌂',9,14);
  }else if(service==='inn'){
    ctx.moveTo(4,6);ctx.lineTo(4,13);ctx.moveTo(4,10);ctx.lineTo(14,10);ctx.lineTo(14,13);
    ctx.moveTo(7,10);ctx.lineTo(7,7);ctx.lineTo(13,7);ctx.lineTo(14,10);
    ctx.moveTo(5,8);ctx.lineTo(6,8);
  }else if(service==='blacksmith'){
    ctx.moveTo(6,13);ctx.lineTo(11,7);ctx.moveTo(8,5);ctx.lineTo(11,3);ctx.lineTo(15,7);
    ctx.lineTo(12,9);ctx.closePath();
  }else if(service==='contracts'){
    ctx.rect(5,4,8,9);ctx.moveTo(7,6);ctx.lineTo(11,6);ctx.moveTo(7,9);ctx.lineTo(11,9);
    ctx.moveTo(7,13);ctx.lineTo(7,15);ctx.moveTo(11,13);ctx.lineTo(11,15);
  }else if(service==='harbor'){
    ctx.moveTo(9,4);ctx.lineTo(9,14);ctx.moveTo(6,7);ctx.lineTo(12,7);
    ctx.moveTo(4,10);ctx.quadraticCurveTo(5,14,9,14);ctx.quadraticCurveTo(13,14,14,10);
  }else if(service==='cave'){
    ctx.moveTo(3,14);ctx.lineTo(5,7);ctx.lineTo(8,4);ctx.lineTo(12,5);ctx.lineTo(15,14);
    ctx.lineTo(11,14);ctx.lineTo(11,10);ctx.quadraticCurveTo(9,6,7,10);ctx.lineTo(7,14);ctx.closePath();
  }else{
    ctx.moveTo(9,3);ctx.lineTo(14,9);ctx.lineTo(9,15);ctx.lineTo(4,9);ctx.closePath();
    ctx.moveTo(9,6);ctx.lineTo(9,12);ctx.moveTo(6,9);ctx.lineTo(12,9);
  }
  ctx.stroke();icons.set(service,canvas);return canvas;
}
