import {describe,it,expect,vi} from 'vitest';
import {saveVerifiedNativeBackup,type NativeBackupBridge} from '../src/utils/nativeBackupFlow';

const backup={filename:'Tales-of-Leigneron-Save-2026-10-20.json',
 json:JSON.stringify({format:'tales-of-leighneron-save-backup',copies:[{slot:'primary',raw:'abc'}]})};
const bytes=new TextEncoder().encode(backup.json).length;
function bridge(overrides:Partial<NativeBackupBridge>={}):NativeBackupBridge{
 return {
  stageExportJson:vi.fn(async()=>({token:'12345678-1234-1234-1234-123456789abc',bytes})),
  exportStagedJson:vi.fn(async()=>({saved:true,bytes,filename:backup.filename})),
  ...overrides
 };
}
describe('Android backup export integrity',()=>{
 it('stages before writing Downloads and verifies every byte',async()=>{
  const native=bridge();
  expect(await saveVerifiedNativeBackup(native,backup)).toEqual({bytes,filename:backup.filename});
  expect(native.stageExportJson).toHaveBeenCalledWith({content:backup.json});
  expect(native.exportStagedJson).toHaveBeenCalledWith({
   filename:backup.filename,token:'12345678-1234-1234-1234-123456789abc'});
 });
 it('refuses an empty JSON before touching Android',async()=>{
  const native=bridge();
  await expect(saveVerifiedNativeBackup(native,{filename:backup.filename,json:''})).rejects.toThrow('empty');
  expect(native.stageExportJson).not.toHaveBeenCalled();
 });
 it('does not proceed to Downloads when staging was truncated',async()=>{
  const native=bridge({stageExportJson:async()=>({token:'abc',bytes:0})});
  await expect(saveVerifiedNativeBackup(native,backup)).rejects.toThrow('stage');
  expect(native.exportStagedJson).not.toHaveBeenCalled();
 });
 it('rejects zero-byte provider exports as failures',async()=>{
  const native=bridge({exportStagedJson:async()=>({saved:true,bytes:0,filename:backup.filename})});
  await expect(saveVerifiedNativeBackup(native,backup)).rejects.toThrow('verification failed');
 });
 it('propagates cancellation or storage failure without claiming success',async()=>{
  const native=bridge({exportStagedJson:async()=>{throw new Error('Downloads is unavailable');}});
  await expect(saveVerifiedNativeBackup(native,backup)).rejects.toThrow('Downloads is unavailable');
 });
});
