import {useId} from 'react';
import {STORY_PANEL_ART,type StoryPanelRef} from '../data/storyPanelArt';

/** The approved bitmap is shared by every panel. SVG viewports crop it without
 * writing three redundant PNGs or stretching the characters to fit the screen. */
export function StoryPanels({artwork,ready}:{artwork:StoryPanelRef;ready:boolean}){
  const page=STORY_PANEL_ART[artwork.page],id=useId().replace(/:/g,'');
  return <div className={'cinematic-art-stage'+(ready?'':' is-loading')}>
    <div className="cinematic-storyboard" aria-label={page.title}>
      {page.panels.map((panel,index)=>{
        const [x,y,width,height]=panel.region,active=index===artwork.panel;
        const clip=id+'-panel-'+index;
        return <figure key={index} className={'cinematic-story-panel '+(active?'is-active':index<artwork.panel?'is-past':'is-future')}
          aria-hidden={!active}>
          <div className="cinematic-panel-motion">
            <svg viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img"
              aria-label={panel.description} focusable="false">
              <defs><clipPath id={clip}><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
              <image href={page.path} x={0} y={0} width={page.width} height={page.height} clipPath={`url(#${clip})`}/>
            </svg>
          </div>
          <span className="cinematic-panel-number" aria-hidden="true">{index+1}</span>
        </figure>;
      })}
    </div>
  </div>;
}
