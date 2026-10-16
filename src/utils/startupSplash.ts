/** Hand the static, pre-JavaScript splash over to the mounted menu. This is not
 * a fake loading timer: reveal as soon as the menu images settle, with a bounded
 * wait so a slow/missing optional image can never lock the app behind the logo. */
export function dismissStartupSplash(){
  const splash=document.getElementById('startup-splash');
  if(!splash)return;
  let disposed=false,revealing=false,pending=0;
  let deadline:number|undefined,removal:number|undefined,frame:number|undefined;
  const listeners:Array<()=>void>=[];
  const detach=()=>{for(const remove of listeners)remove();listeners.length=0;};
  const reveal=()=>{
    if(disposed||revealing)return;
    revealing=true;window.clearTimeout(deadline);detach();
    // Wait for the mounted menu to paint beneath the static layer, not for an
    // arbitrary studio-logo duration. CSS controls the fade, not a frame loop.
    frame=requestAnimationFrame(()=>{
      if(disposed)return;
      splash.classList.add('is-complete');splash.setAttribute('aria-hidden','true');
      const fadeMs=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:450;
      removal=window.setTimeout(()=>splash.remove(),fadeMs);
    });
  };
  const images=document.querySelectorAll<HTMLImageElement>('#root .home-menu .title-artwork img');
  for(const image of images){
    if(image.complete)continue;
    pending++;
    const settled=()=>{
      image.removeEventListener('load',settled);image.removeEventListener('error',settled);
      if(--pending===0)reveal();
    };
    image.addEventListener('load',settled);image.addEventListener('error',settled);
    listeners.push(()=>{image.removeEventListener('load',settled);image.removeEventListener('error',settled);});
  }
  deadline=window.setTimeout(reveal,2500);
  if(pending===0)reveal();
  return ()=>{
    disposed=true;window.clearTimeout(deadline);window.clearTimeout(removal);
    if(frame!==undefined)cancelAnimationFrame(frame);
    detach();
  };
}
