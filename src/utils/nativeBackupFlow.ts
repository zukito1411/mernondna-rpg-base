/** Export contract shared by the Android bridge and its fast regression tests.
 * An empty/truncated backup is never reported as successfully exported. */
export interface NativeBackupBridge {
 stageExportJson(options:{content:string}):Promise<{token:string;bytes:number}>;
 exportStagedJson(options:{filename:string;token:string}):Promise<{saved:boolean;bytes:number;filename:string}>;
}
export async function saveVerifiedNativeBackup(
 bridge:NativeBackupBridge,backup:{filename:string;json:string}
):Promise<{bytes:number;filename:string}>{
 const expected=new TextEncoder().encode(backup.json).length;
 if(expected<32)throw new Error('Backup is empty; nothing was exported.');
 const staged=await bridge.stageExportJson({content:backup.json});
 if(!staged.token||staged.bytes!==expected)
  throw new Error('Android did not stage the entire save backup.');
 const exported=await bridge.exportStagedJson({filename:backup.filename,token:staged.token});
 if(!exported.saved||exported.bytes!==expected)
  throw new Error('Android backup verification failed; the original save is unchanged.');
 return {bytes:exported.bytes,filename:exported.filename};
}
