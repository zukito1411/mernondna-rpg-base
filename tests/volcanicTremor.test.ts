import {describe,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {VolcanicTremor} from '../src/game/systems/VolcanicTremor';
import {volcanicRumbleIntensity} from '../src/game/systems/volcanicRumbleProfile';

class TestVoice extends EventTarget {
 currentTime=0;duration=12;paused=true;ended=false;muted=false;volume=0;loop=false;preload='none';
 load=vi.fn();removeAttribute=vi.fn();
 play=vi.fn(async()=>{this.paused=false;this.ended=false;});
 pause=vi.fn(()=>{this.paused=true;});
 begin(seconds=0){this.currentTime=seconds;this.paused=false;this.dispatchEvent(new Event('playing'));}
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
const fixture=()=>{
 const voice=new TestVoice(),create=vi.fn(()=>voice as unknown as HTMLAudioElement);
 return{voice,create,tremor:new VolcanicTremor(create),shake:vi.fn(),silence:vi.fn()};
};
describe('Darkav volcanic tremors',()=>{
 it('loads only in Darkav, waits for actual playback and follows media time rather than frame delta',()=>{
  const {voice,create,tremor,shake,silence}=fixture();
  tremor.update(60000,false,false,shake,silence);expect(create).not.toHaveBeenCalled();
  tremor.update(60000,true,false,shake,silence);expect(voice.play).toHaveBeenCalledTimes(1);expect(shake).not.toHaveBeenCalled();
  voice.begin(2);expect(shake).toHaveBeenLastCalledWith(2,.0018);
  tremor.update(60000,true,false,shake,silence);
  expect(voice.play).toHaveBeenCalledTimes(1);expect(shake).toHaveBeenLastCalledWith(2,.0018);
  voice.currentTime=10;tremor.update(16,true,false,shake,silence);
  expect(shake).toHaveBeenLastCalledWith(10,volcanicRumbleIntensity(10));expect(volcanicRumbleIntensity(10)).toBeLessThan(.0018);
  tremor.destroy();
 });
 it('pauses audio and motion together, then resumes from the same playback position',async()=>{
  const {voice,tremor,shake,silence}=fixture();
  tremor.update(60000,true,false,shake,silence);voice.begin(4);await flush();
  tremor.update(60000,true,true,shake,silence);expect(voice.paused).toBe(true);expect(voice.currentTime).toBe(4);expect(silence).toHaveBeenCalled();
  shake.mockClear();tremor.update(16,true,false,shake,silence);
  expect(voice.play).toHaveBeenCalledTimes(2);expect(shake).not.toHaveBeenCalled();
  voice.begin(4);expect(shake).toHaveBeenLastCalledWith(4,volcanicRumbleIntensity(4));tremor.destroy();
 });
 it('stops motion during buffering and resumes only when the sound resumes',()=>{
  const {voice,tremor,shake,silence}=fixture();tremor.update(60000,true,false,shake,silence);voice.begin(3);
  voice.dispatchEvent(new Event('waiting'));shake.mockClear();tremor.update(1000,true,false,shake,silence);
  expect(shake).not.toHaveBeenCalled();expect(silence).toHaveBeenCalled();
  voice.begin(3.2);expect(shake).toHaveBeenLastCalledWith(3.2,volcanicRumbleIntensity(3.2));tremor.destroy();
 });
 it('stops and rewinds on region exit and waits between completed recordings',async()=>{
  const {voice,tremor,shake,silence}=fixture();tremor.update(60000,true,false,shake,silence);voice.begin(5);await flush();
  tremor.update(16,false,false,shake,silence);expect(voice.paused).toBe(true);expect(voice.currentTime).toBe(0);
  tremor.update(10000,true,false,shake,silence);expect(voice.play).toHaveBeenCalledTimes(1);
  tremor.update(60000,true,false,shake,silence);voice.begin(11);voice.ended=true;voice.dispatchEvent(new Event('ended'));
  shake.mockClear();tremor.update(10000,true,false,shake,silence);expect(shake).not.toHaveBeenCalled();expect(voice.play).toHaveBeenCalledTimes(2);
  tremor.destroy();
 });
 it('honors ambience mute without removing the visual tremor, and releases its media on teardown',()=>{
  const {voice,tremor,shake,silence}=fixture();tremor.update(60000,true,false,shake,silence,true);voice.begin(2);
  expect(voice.muted).toBe(true);expect(shake).toHaveBeenLastCalledWith(2,.0018);
  tremor.destroy();expect(voice.paused).toBe(true);expect(voice.removeAttribute).toHaveBeenCalledWith('src');
  shake.mockClear();voice.begin(2);expect(shake).not.toHaveBeenCalled();
 });
 it('does not animate or retry every frame if autoplay was rejected',async()=>{
  const {voice,tremor,shake,silence}=fixture();voice.play.mockRejectedValueOnce(new Error('gesture required'));
  tremor.update(60000,true,false,shake,silence);await flush();
  for(let i=0;i<20;i++)tremor.update(16,true,false,shake,silence);
  expect(voice.play).toHaveBeenCalledTimes(1);expect(shake).not.toHaveBeenCalled();tremor.destroy();
 });
 it('uses an envelope measured from the actual recording, with its crescendo and fade intact',()=>{
  expect(createHash('sha256').update(readFileSync('public/assets/audio/ambience/volcanic.mp3')).digest('hex'))
   .toBe('04304f3ea6139f6411c27a98bc779f0a7570d64c93ef4d2d695a4c0251cd1e1c');
  expect(volcanicRumbleIntensity(2)).toBe(.0018);
  expect(volcanicRumbleIntensity(0)).toBeLessThan(volcanicRumbleIntensity(1));
  expect(volcanicRumbleIntensity(10)).toBeGreaterThan(volcanicRumbleIntensity(11));
  expect(volcanicRumbleIntensity(12)).toBe(0);expect(volcanicRumbleIntensity(-1)).toBe(0);expect(volcanicRumbleIntensity(NaN)).toBe(0);
 });
});
