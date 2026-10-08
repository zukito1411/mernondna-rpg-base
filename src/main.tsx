import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {prepareOfflineStartup} from './utils/appStartup';

async function start(){
  try{await prepareOfflineStartup();}catch(error){console.warn('Offline preparation:',error);}
  try{
    const [{default:App},{loadGame}]=await Promise.all([import('./App'),import('./utils/save')]);
    loadGame();
    createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
  }catch(error){window.dispatchEvent(new CustomEvent('mernondna-startup-error',{detail:error}));}
}
void start();
