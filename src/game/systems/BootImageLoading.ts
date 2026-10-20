import Phaser from 'phaser';
import {GAME_DISPOSING,isGameDisposing} from './gameLifetime';

/** Keep Phaser's image cache and processing lifecycle, but bound requests in
 * image-element mode (where XHR timeout/retry settings do not apply). */
export function installBootImageLoading(scene:Phaser.Scene){
 const pending=new Set<{cancel:()=>void;resume:()=>void}>();
 let disposed=false;
 const usable=()=>!disposed&&!isGameDisposing(scene.game);
 const onAdd=(_key:string,type:string,_loader:Phaser.Loader.LoaderPlugin,file:Phaser.Loader.File)=>{
  if(type!=='image')return;
  const start=file.load;
  file.load=()=>{
   if(!usable())return;
   start.call(file);
   const data:unknown=file.data;
   if(!(data instanceof HTMLImageElement))return;
   let image=data;
   const loaded=image.onload,errored=image.onerror;
   let timer:number|undefined,retried=false,settled=false;
   const arm=()=>{
    if(timer!==undefined)window.clearTimeout(timer);
    timer=window.setTimeout(()=>{
     if(settled)return;
     if(!usable()){release(true);return;}
     // Suspended/background WebViews get a fresh deadline on resume, not an
     // immediate false timeout for time when JavaScript could not run.
     if(document.hidden){arm();return;}
     // A long main-thread task can delay delivery of an already finished image
     // event. Use its real completion state rather than downloading it again.
     if(image.complete&&image.naturalWidth>0){image.onload?.call(image,new Event('load'));return;}
     console.warn('[startup] Image request exceeded its deadline:',file.key);
     failed(new Event('error'));
    },30000);
   };
   const release=(abort:boolean)=>{
    if(settled)return;settled=true;
    if(timer!==undefined)window.clearTimeout(timer);
    image.onload=null;image.onerror=null;pending.delete(control);
    if(abort)image.removeAttribute('src');
   };
   const failed=(event:Event)=>{
    if(settled)return;
    if(!usable()){release(true);return;}
    if(!retried){
     retried=true;
     const url=new URL(image.src,window.location.href);
     url.searchParams.set('boot-retry','1');
     // A new element isolates late events from the abandoned request. Reusing
     // the old element lets an old error incorrectly fail the new attempt.
     const next=new Image();next.crossOrigin=image.crossOrigin;
     image.onload=null;image.onerror=null;image.removeAttribute('src');
     image=next;file.data=next;bindImage();arm();next.src=url.href;return;
    }
    release(true);
    // Let Phaser record the failed file and drain the queue normally. Required
    // sources still pass through BootScene's existing repair/validation path.
    errored?.call(image,event);
   };
   const control={cancel:()=>release(true),resume:()=>{if(!settled)arm();}};
   pending.add(control);
   const bindImage=()=>{
    const target=image;
    target.onload=event=>{
     if(settled||target!==image)return;
     const active=usable();release(!active);
     if(active)loaded?.call(target,event);
    };
    target.onerror=event=>{if(target===image)failed(event instanceof Event?event:new Event('error'));};
   };
   bindImage();arm();
  };
 };
 const onVisible=()=>{if(!document.hidden)for(const item of pending)item.resume();};
 const cleanup=()=>{
  if(disposed)return;disposed=true;
  for(const item of pending)item.cancel();pending.clear();
  document.removeEventListener('visibilitychange',onVisible);
  scene.load.off(Phaser.Loader.Events.ADD,onAdd);
  scene.events.off(Phaser.Scenes.Events.SHUTDOWN,cleanup);
  scene.events.off(Phaser.Scenes.Events.DESTROY,cleanup);
  scene.game.events.off(Phaser.Core.Events.DESTROY,cleanup);
  scene.game.events.off(GAME_DISPOSING,cleanup);
 };
 scene.load.on(Phaser.Loader.Events.ADD,onAdd);
 document.addEventListener('visibilitychange',onVisible);
 scene.events.once(Phaser.Scenes.Events.SHUTDOWN,cleanup);
 scene.events.once(Phaser.Scenes.Events.DESTROY,cleanup);
 scene.game.events.once(Phaser.Core.Events.DESTROY,cleanup);
 scene.game.events.once(GAME_DISPOSING,cleanup);
}
