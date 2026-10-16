/** Bounded, cancellable DOM-image preload. Artwork belongs to the HTML story
 * overlay, not to the world's GPU texture cache or chunk residency. */
export function loadCinematicArtwork(path:string){
  let cancel=()=>{};
  const promise=new Promise<boolean>(resolve=>{
    const image=new Image();let done=false;
    const finish=(ready:boolean)=>{
      if(done)return;done=true;window.clearTimeout(timer);
      image.onload=null;image.onerror=null;
      if(!ready)image.removeAttribute('src');
      resolve(ready);
    };
    const timer=window.setTimeout(()=>finish(false),8000);
    cancel=()=>finish(false);
    image.onload=()=>{
      // Decode before revealing, not on the first displayed animation frame.
      if(typeof image.decode==='function')void image.decode().then(()=>finish(true),()=>finish(false));
      else finish(true);
    };
    image.onerror=()=>finish(false);image.src=path;
  });
  return {promise,cancel:()=>cancel()};
}
