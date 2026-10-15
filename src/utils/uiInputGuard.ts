/** Gesture ownership survives DOM replacement and Phaser -> React transitions. */
let revision=0;
let actionAfter=0;
export function noteUiTransition(){revision++;actionAfter=performance.now()+120;}
export function acceptUiAction(){
  if(performance.now()<actionAfter)return false;
  actionAfter=performance.now()+120;
  return true;
}

export function installUiInputGuard(modalOpen:()=>boolean){
  const gestures=new Map<number,{revision:number}>();
  const completed=new Map<number,number>();
  let released:{revision:number}|undefined;
  const block=(event:Event)=>{event.preventDefault();event.stopImmediatePropagation();};
  const down=(event:PointerEvent)=>{
    gestures.set(event.pointerId,{revision});completed.delete(event.pointerId);released=undefined;
  };
  const up=(event:PointerEvent)=>{
    released=gestures.get(event.pointerId);gestures.delete(event.pointerId);
    if(released)completed.set(event.pointerId,released.revision);
    if(completed.size>16)completed.delete(completed.keys().next().value!);
    if(released&&released.revision!==revision)block(event);
  };
  const cancel=(event:PointerEvent)=>{gestures.delete(event.pointerId);completed.delete(event.pointerId);released=undefined;};
  const click=(event:MouseEvent)=>{
    // Keyboard/assistive clicks have detail zero; native pointer gestures have
    // their own ownership. A second click in a double-click is never a choice.
    const pointerId=(event as PointerEvent).pointerId;
    const owner=completed.get(pointerId)??released?.revision;
    if((event.detail>0&&owner!==undefined&&owner!==revision)
      ||(modalOpen()&&event.detail>1))block(event);
    completed.delete(pointerId);
    released=undefined;
  };
  const key=(event:KeyboardEvent)=>{
    if(modalOpen()&&event.repeat&&['Enter',' ','e','E','Escape'].includes(event.key))block(event);
  };
  const clear=()=>{gestures.clear();completed.clear();released=undefined;};
  document.addEventListener('pointerdown',down,true);
  document.addEventListener('pointerup',up,true);
  document.addEventListener('pointercancel',cancel,true);
  document.addEventListener('click',click,true);
  document.addEventListener('keydown',key,true);
  window.addEventListener('blur',clear);
  return ()=>{
    document.removeEventListener('pointerdown',down,true);
    document.removeEventListener('pointerup',up,true);
    document.removeEventListener('pointercancel',cancel,true);
    document.removeEventListener('click',click,true);
    document.removeEventListener('keydown',key,true);
    window.removeEventListener('blur',clear);clear();
  };
}
