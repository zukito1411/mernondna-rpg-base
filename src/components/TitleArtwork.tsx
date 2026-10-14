import type {CSSProperties} from 'react';

const MOTES=[
  [12,72,17,-4],[25,83,21,-12],[39,66,19,-8],
  [57,88,23,-16],[73,73,18,-6],[88,86,22,-14],
] as const;

/** Shared menu/loading artwork. CSS-only motion; no game-loop work or timers. */
export function TitleArtwork(){
  return <div className="title-artwork" aria-hidden="true">
    <img className="title-art-scene" src="/assets/reference/Tales%20of%20Leighneron_%20Sunset%20Valley.png"
      alt="" decoding="async" fetchPriority="high" draggable={false}/>
    <div className="title-art-shade"/>
    <div className="title-art-motes">
      {MOTES.map(([x,y,duration,delay],i)=><i key={i} style={{
        '--mote-x':`${x}%`,'--mote-y':`${y}%`,'--mote-duration':`${duration}s`,'--mote-delay':`${delay}s`,
      } as CSSProperties}/>) }
    </div>
    <div className="title-art-logo">
      <div className="title-art-reveal">
        <img src="/assets/reference/Title.png" width={1672} height={941} alt="" decoding="async" draggable={false}/>
        <span className="title-art-sheen"/>
      </div>
    </div>
  </div>;
}
