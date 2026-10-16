import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {dismissStartupSplash} from '../src/utils/startupSplash';

describe('initial startup artwork',()=>{
  beforeEach(()=>vi.useFakeTimers());
  afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
  function fixture(){
    const image=Object.assign(new EventTarget(),{complete:false});
    const splash={classList:{add:vi.fn()},setAttribute:vi.fn(),remove:vi.fn()};
    vi.stubGlobal('document',{getElementById:()=>splash,querySelectorAll:()=>[image]});
    vi.stubGlobal('window',{setTimeout,clearTimeout,matchMedia:()=>({matches:false})});
    vi.stubGlobal('requestAnimationFrame',(callback:()=>void)=>setTimeout(callback,1));
    vi.stubGlobal('cancelAnimationFrame',clearTimeout);
    return {image,splash};
  }
  it('waits for the menu, fades, and removes the startup screen without a fixed logo delay',()=>{
    const {image,splash}=fixture(),cleanup=dismissStartupSplash();
    expect(splash.classList.add).not.toHaveBeenCalled();image.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(1);expect(splash.classList.add).toHaveBeenCalledWith('is-complete');
    expect(splash.remove).not.toHaveBeenCalled();vi.advanceTimersByTime(450);
    expect(splash.remove).toHaveBeenCalledOnce();cleanup?.();
  });
  it('cannot hang on a missing image and cleans up safely before a StrictMode remount',()=>{
    const {splash}=fixture(),first=dismissStartupSplash();first?.();
    vi.advanceTimersByTime(3000);expect(splash.remove).not.toHaveBeenCalled();
    const second=dismissStartupSplash();vi.advanceTimersByTime(2951);
    expect(splash.remove).toHaveBeenCalledOnce();second?.();
  });
});
