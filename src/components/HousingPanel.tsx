import {useEffect,useRef,useState} from 'react';
import type {CSSProperties,PointerEvent} from 'react';
import {useGameStore} from '../store/gameStore';
import {housingFor,HOME_PRICE,HOME_FLOORS,HOME_FURNITURE,HOME_KITS,HOME_KIT_NAMES,HOME_EDITOR_HEIGHT,
 FURNITURE_BY_ART,furnitureFootprint,furnitureVisualBounds,homeWeaponMount,housingLayoutProblem,snapFurnitureToWalls,type HomeItem} from '../data/housing';
import art from '../data/housingArt.json';
import {WEAPON_BY_ID} from '../data/weapons';
import {saveGame} from '../utils/save';
import {mobileInput} from '../game/input';
import {ItemIcon} from './ItemIcon';
import {localPlayCheatsEnabled,goldLabel} from '../utils/localPlayCheats';
import './housing.css';
import {PLAYER_HOME_BY_ID} from '../data/playerHomes';
import {TOWN_BY_ID} from '../data/towns';

const url=(path:string)=>import.meta.env.BASE_URL+'assets/interiors/'+path;
function FurnitureIcon({kit,kind}:{kit:string;kind:string}){
 const frame=art.frames[(kit+':'+kind) as keyof typeof art.frames];
 const style:CSSProperties={backgroundImage:`url("${url(`housing-furniture-${frame.atlas}-v1.png`)}")`,
  backgroundSize:`${art.width/192*100}% ${art.height/192*100}%`,
  backgroundPosition:`${frame.x/(art.width-192)*100}% ${frame.y/(art.height-192)*100}%`};
 return <span className="housing-furniture-icon" style={style} aria-hidden="true"/>;
}
export function HousingPanel(){
 const panel=useGameStore(s=>s.panel),context=useGameStore(s=>s.housingContext),housing=useGameStore(s=>s.housing);
 const property=context?PLAYER_HOME_BY_ID[context.startsWith('purchase:')?context.slice(9):context]:undefined;
 const home=housingFor(housing,property?.id),homeName=property?.homeName??'Your home',townName=property?TOWN_BY_ID[property.townId].name:'';
 const gold=useGameStore(s=>s.gold),materials=useGameStore(s=>s.bossMaterials);
 const canvas=useRef<HTMLCanvasElement>(null),root=useRef<HTMLElement>(null),boardViewport=useRef<HTMLDivElement>(null);
 const [fitWidth,setFitWidth]=useState(400);
 const [images,setImages]=useState<HTMLImageElement[]>([]),[loadError,setLoadError]=useState('');
 const [draft,setDraft]=useState<HomeItem[]>([]),[nextId,setNextId]=useState(1);
 const [kit,setKit]=useState<string>(HOME_KITS[0]),[category,setCategory]=useState('All');
 const [pending,setPending]=useState<HomeItem|null>(null),[message,setMessage]=useState('');
 const [tab,setTab]=useState<'catalogue'|'stored'>('catalogue'),[confirm,setConfirm]=useState<'buy'|'discard'|null>(null);
 const [zoom,setZoom]=useState(1);
 const open=panel==='housing',purchase=Boolean(property&&context?.startsWith('purchase:'));
 useEffect(()=>{
  if(!open){if(useGameStore.getState().housingEditing)useGameStore.setState({housingEditing:false});return;}
  setDraft(home.items.map(i=>({...i})));setNextId(home.nextId);setPending(null);setMessage('');setConfirm(null);setZoom(1);
  if(property)setKit(property.kit);
  mobileInput.reset();root.current?.focus();
  // Intentionally capture the committed snapshot only on opening, not each edit.
 },[open,context]);
 useEffect(()=>{
  if(!open||purchase)return;
  let cancelled=false;setLoadError('');
  const paths=[0,1,2].map(i=>url(`housing-furniture-${i}-v1.png`));paths.push(url('housing-floor-v1.png'));
  void Promise.all(paths.map(src=>new Promise<HTMLImageElement>((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Furniture artwork could not load. Close and reopen the editor to retry.'));image.src=src;
  }))).then(loaded=>{if(!cancelled)setImages(loaded);}).catch((e:unknown)=>{if(!cancelled)setLoadError(e instanceof Error?e.message:'Artwork unavailable.');});
  return ()=>{cancelled=true;setImages([]);};
 },[open,purchase]);
 useEffect(()=>{
  const node=boardViewport.current;if(!open||purchase||!node)return;
  const measure=()=>setFitWidth(Math.max(100,Math.min(node.clientWidth-8,(node.clientHeight-8)*768/HOME_EDITOR_HEIGHT)));
  const observer=new ResizeObserver(measure);observer.observe(node);measure();return ()=>observer.disconnect();
 },[open,purchase]);
 const oldIds=new Set(home.items.map(i=>i.id));
 const cost=draft.filter(i=>!oldIds.has(i.id)).reduce((sum,i)=>sum+FURNITURE_BY_ART[i.art]!.price,0);
 const error=pending?housingLayoutProblem([...draft.filter(i=>i.id!==pending.id),pending]):null;
 useEffect(()=>{
  const node=canvas.current,ctx=node?.getContext('2d');if(!node||!ctx||images.length!==4)return;
  ctx.clearRect(0,0,768,HOME_EDITOR_HEIGHT);ctx.fillStyle='#0c1110';ctx.fillRect(0,0,768,HOME_EDITOR_HEIGHT);
  const floor=ctx.createPattern(images[3],'repeat');if(!floor)return;ctx.fillStyle=floor;
  ctx.save();
  for(const r of HOME_FLOORS){ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeStyle='#a4824d';ctx.lineWidth=8;ctx.strokeRect(r.x+4,r.y+4,r.width-8,r.height-8);}
  // Clear the visual seams of connected hallways with the same floor texture.
  ctx.fillStyle=floor;ctx.fillRect(144,240,480,96);ctx.fillRect(336,800,96,144);
  const draw=(item:HomeItem,ghost=false)=>{
   if(item.stored)return;const f=FURNITURE_BY_ART[item.art]!,r=furnitureFootprint(item);
   const frame=art.frames[(item.kit+':'+item.art) as keyof typeof art.frames],scale=f.width/frame.visibleWidth;
   ctx.save();ctx.globalAlpha=ghost ? .65 : 1;ctx.translate(r.x+r.width/2,r.y+r.height/2);ctx.rotate(item.rotation*Math.PI/180);
   ctx.drawImage(images[frame.atlas],frame.x,frame.y,192,192,-96*scale,f.h*16-186*scale,192*scale,192*scale);ctx.restore();
  };
  for(const i of draft.filter(i=>FURNITURE_BY_ART[i.art]?.walkable))draw(i);
  for(const i of [...draft].filter(i=>!FURNITURE_BY_ART[i.art]?.walkable).sort((a,b)=>a.y-b.y))draw(i);
  ctx.strokeStyle='#f9edce38';ctx.lineWidth=1;
  for(const r of HOME_FLOORS){for(let x=r.x;x<=r.x+r.width;x+=32){ctx.beginPath();ctx.moveTo(x,r.y);ctx.lineTo(x,r.y+r.height);ctx.stroke();}
   for(let y=r.y;y<=r.y+r.height;y+=32){ctx.beginPath();ctx.moveTo(r.x,y);ctx.lineTo(r.x+r.width,y);ctx.stroke();}}
  if(pending){draw(pending,true);const r=furnitureFootprint(pending);ctx.fillStyle=error?'#db665455':'#91d6ad55';ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeStyle=error?'#ff9b83':'#cbffcf';ctx.lineWidth=3;ctx.strokeRect(r.x+1,r.y+1,r.width-2,r.height-2);}
  ctx.fillStyle='#f7ead0';ctx.textAlign='center';ctx.font='18px Georgia';
  ctx.fillText('BEDROOM',176,28);ctx.fillText('KITCHEN',592,28);ctx.fillText('LIVING ROOM',384,360);ctx.fillText('KEEP DOORWAY CLEAR',384,925);
  ctx.restore();
 },[draft,pending,images,error]);
 if(!open){
  return null; // Home shortcuts live in the shared, collapsible HUD dock.
 }
 const close=()=>{mobileInput.reset();useGameStore.setState({panel:null,housingEditing:false,...(purchase?{housingContext:null}:{})});};
 const changed=JSON.stringify(draft)!==JSON.stringify(home.items);
 const cancel=()=>{if(changed)setConfirm('discard');else close();};
 const place=()=>{
  if(!pending||error){setMessage(error??'Choose furniture first.');return;}
  const existing=draft.some(i=>i.id===pending.id);
  setDraft([...draft.filter(i=>i.id!==pending.id),{...pending,stored:false}]);
  if(!existing)setNextId(n=>Math.max(n,pending.id+1));
  setMessage(existing?'Furniture moved.':'Added to your draft. Gold is charged only when you finish.');setPending(null);
 };
 const point=(event:PointerEvent<HTMLCanvasElement>)=>{
  const b=event.currentTarget.getBoundingClientRect(),px=(event.clientX-b.left)*768/b.width,py=(event.clientY-b.top)*HOME_EDITOR_HEIGHT/b.height;
  const x=Math.floor(px/32)*32,y=Math.floor(py/32)*32;
  if(pending){setPending(snapFurnitureToWalls({...pending,x,y,stored:false}));return;}
  const selected=[...draft].reverse().find(i=>{if(i.stored)return false;const r=furnitureFootprint(i),v=furnitureVisualBounds(i);return px>=r.x&&px<r.x+r.width&&py>=r.y&&py<r.y+r.height||px>=v.left&&px<v.right&&py>=v.top&&py<v.bottom;});
  if(selected)setPending({...selected});
 };
 const finish=()=>{
  const problem=useGameStore.getState().saveHomeLayout(draft,nextId);if(problem){setMessage(problem);return;}
  close();if(!saveGame())useGameStore.getState().showToast('Layout is in memory, but saving failed. Keep the game open and export a backup.');
 };
 const pendingExisting=pending&&oldIds.has(pending.id);
 return <section ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={purchase?'Buy a home':'Home furnishing editor'}
  className={`housing-overlay ${purchase?'housing-purchase':''}`} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}
  onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();if(confirm)setConfirm(null);else cancel();}
   if(e.key.toLowerCase()==='r'&&!e.repeat&&pending&&!['SELECT','INPUT'].includes((e.target as HTMLElement).tagName))setPending(snapFurnitureToWalls({...pending,rotation:((pending.rotation+90)%360) as HomeItem['rotation']}));
   if(e.key==='Tab'){const buttons=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,input,[tabindex="0"]')??[]);
    const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }}>
  {purchase?<div className="housing-deed">
   <small>{townName.toUpperCase()} · {property?.agentName}</small><h1>A place to call your own</h1>
   <div className="housing-deed-art"><FurnitureIcon kit={kit} kind="hearth"/><FurnitureIcon kit={kit} kind="bed"/><FurnitureIcon kit={kit} kind="table"/></div>
   <h2>{homeName}</h2><p>{property?.name}, {townName}. A living room, bedroom and kitchen, ready for your own furnishings. Keep your other homes, too.</p>
   <ul><li>Permanent ownership · 7,500 gold</li><li>All nine regional furniture collections · 50–200G per new piece</li><li>Your own bed, weapon displays and a home marked on the map</li></ul>
   <p className="housing-wallet">Your purse: {goldLabel(gold)}G</p>
   <div className="housing-deed-buttons"><button onClick={close}>Not now</button><button className="housing-primary" disabled={gold<HOME_PRICE||home.owned} onClick={()=>setConfirm('buy')}>Buy home · 7,500G</button></div>
   {gold<HOME_PRICE&&<p>You need {HOME_PRICE-gold}G more.</p>}
  </div>:<>
   <header className="housing-heading"><div><small>MAKE YOURSELF AT HOME</small><h1>{homeName} <span>{townName}</span></h1></div>
    <div className="housing-budget"><span>Purse <b>{goldLabel(gold)}G</b></span><span>New furnishings <b>{cost}G</b></span></div>
    <button onClick={cancel}>Cancel</button><button className="housing-primary" disabled={Boolean(loadError)||images.length!==4||!localPlayCheatsEnabled()&&cost>gold} onClick={finish}>Finish editing{cost?` · ${cost}G`:''}</button>
   </header>
   <div className="housing-workspace">
    <aside className="housing-catalogue"><h2>Your furniture collection</h2>
     <div className="housing-tabs"><button aria-pressed={tab==='catalogue'} onClick={()=>setTab('catalogue')}>Shop · 50–200G</button><button aria-pressed={tab==='stored'} onClick={()=>setTab('stored')}>Stored ({draft.filter(i=>i.stored).length})</button></div>
     {tab==='catalogue'?<><label>Collection<select value={kit} onChange={e=>setKit(e.target.value)}>{HOME_KITS.map((k,i)=><option key={k} value={k}>{HOME_KIT_NAMES[i]}</option>)}</select></label>
      <label>Room & purpose<select value={category} onChange={e=>setCategory(e.target.value)}>{['All','Comfort','Storage','Decor','Craft'].map(c=><option key={c}>{c}</option>)}</select></label>
      <div className="housing-stock">{HOME_FURNITURE.filter(f=>category==='All'||f.category===category).map(f=><button key={f.art} className={pending?.art===f.art&&pending.kit===kit?'is-selected':''}
       onClick={()=>{setPending({id:nextId,art:f.art,kit,x:192,y:512,rotation:0,stored:false});setMessage('Tap a grid square, rotate if needed, then choose Place furniture.');}}>
       <FurnitureIcon kit={kit} kind={f.art}/><strong>{f.name}</strong><span>{f.price}G</span>
      </button>)}</div></>:<div className="housing-stock">{draft.filter(i=>i.stored).map(i=><button key={i.id} onClick={()=>setPending({...i,stored:false})}><FurnitureIcon kit={i.kit} kind={i.art}/><strong>{FURNITURE_BY_ART[i.art]!.name}</strong><span>Owned · free to place</span></button>)}
       {!draft.some(i=>i.stored)&&<p>Store a placed piece to reuse it later, at no extra cost.</p>}</div>}
    </aside>
    <main className="housing-plan"><div className="housing-plan-tools"><span>32-unit snap grid · {draft.filter(i=>!i.stored).length}/60 placed</span>
     <button disabled={zoom>=4} onClick={()=>setZoom(z=>Math.min(4,z+.5))}>Zoom in</button><button disabled={zoom===1} onClick={()=>setZoom(1)}>Fit room</button><button onClick={()=>setPending(null)}>Select / clear preview</button></div>
     <div ref={boardViewport} className="housing-board-scroll"><div className="housing-board-size" style={{width:fitWidth*zoom}}><canvas ref={canvas} width={768} height={HOME_EDITOR_HEIGHT} onPointerDown={point} aria-label="Home floor plan. Choose furniture, tap a grid square, then place."/>
      {draft.filter(i=>!i.stored&&i.weaponId).map(i=>{const mount=homeWeaponMount(i);return <span key={i.id} className="housing-rack-weapon" title={WEAPON_BY_ID[i.weaponId!]?.name} style={{left:mount.x/768*100+'%',top:mount.y/HOME_EDITOR_HEIGHT*100+'%',width:36/768*100+'%',height:58/HOME_EDITOR_HEIGHT*100+'%',transform:`translate(-50%,-50%) rotate(${i.rotation}deg)`}}><ItemIcon id={i.weaponId!}/></span>;})}
     </div></div>
     {loadError&&<p role="alert">{loadError}</p>}{images.length!==4&&!loadError&&<p role="status">Loading your furniture collection…</p>}
    </main>
    <aside className="housing-inspector"><h2>{pending?FURNITURE_BY_ART[pending.art]!.name:'A room of your own'}</h2>
     {pending?<><FurnitureIcon kit={pending.kit} kind={pending.art}/><p>{pendingExisting?'Already paid for · moving is free':`${FURNITURE_BY_ART[pending.art]!.price}G on finishing`}</p>
      <p>Facing {pending.rotation}° · grid {Math.floor(pending.x/32)+1}, {Math.floor(pending.y/32)+1}</p>
      <button onClick={()=>setPending(snapFurnitureToWalls({...pending,rotation:((pending.rotation+90)%360) as HomeItem['rotation']}))}>Rotate 90° · R</button>
      {pending.art==='weaponRack'&&<label>Display a spare weapon<select aria-label="Weapon for rack" value={pending.weaponId??''} onChange={e=>setPending({...pending,weaponId:e.target.value||undefined})}>
       <option value="">Empty rack</option>{Object.entries(WEAPON_BY_ID).filter(([id])=>(materials[id]??0)+home.items.filter(i=>i.weaponId===id).length-draft.filter(i=>i.id!==pending.id&&i.weaponId===id).length>0).map(([id,w])=><option key={id} value={id}>{w.name}</option>)}</select><small>Spare boss-weapon copies only. Displaying reserves a copy; clearing or storing the rack returns it.</small>{pending.weaponId&&<ItemIcon id={pending.weaponId}/>}</label>}
      {error&&<p className="housing-error" role="status">{error}</p>}
      <button className="housing-primary" disabled={Boolean(error)} onClick={place}>{draft.some(i=>i.id===pending.id)?'Move / apply changes':'Place furniture'}</button>
      {draft.some(i=>i.id===pending.id)&&<button onClick={()=>{setDraft(d=>oldIds.has(pending.id)?d.map(i=>i.id===pending.id?{...i,stored:true,weaponId:undefined}:i):d.filter(i=>i.id!==pending.id));setPending(null);setMessage('Removed from the room. Paid furniture stays in storage.');}}>Store / remove</button>}
      <button onClick={()=>setPending(null)}>Clear selection</button>
     </>:<><p>Choose a piece from the collection, then tap where it should stand. Select a placed piece to move, rotate or store it.</p><p>Keep the doorway and hallways clear. Beds and racks need a reachable side.</p><p>A bed lets you sleep until morning for free. Weapon racks display your spare boss weapons.</p><p>Nothing is charged until you finish. Cancel discards this draft.</p></>}
    </aside>
   </div><footer className="housing-footer" role="status">{message||'Tap to position · Rotate with R or the button · Place to add it · Finish to save'}{cost>gold&&!localPlayCheatsEnabled()&&<strong> Not enough gold.</strong>}</footer>
  </>}
  {confirm&&<div className="housing-confirm" role="alertdialog" aria-modal="true" aria-label={confirm==='buy'?'Confirm home purchase':'Discard layout'}>
   <div><h2>{confirm==='buy'?`Your own key to ${townName}`:'Leave these changes behind?'}</h2><p>{confirm==='buy'?`Pay 7,500G for ${homeName} at ${property?.name}? Other homes remain yours. Furniture is purchased separately.`:'Your saved home and gold will stay as they were before editing.'}</p>
    <button onClick={()=>setConfirm(null)}>Go back</button><button className="housing-primary" onClick={()=>{
     if(confirm==='buy'){if(!useGameStore.getState().buyHome()){setConfirm(null);return;}close();if(!saveGame())useGameStore.getState().showToast('Home purchased, but the save could not be written. Export a backup before closing.');}
     else close();setConfirm(null);
    }}>{confirm==='buy'?'Confirm purchase · 7,500G':'Discard changes'}</button></div>
  </div>}
 </section>;
}
