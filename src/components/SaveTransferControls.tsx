import { useRef, useState, type ChangeEvent } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { createSaveBackupExport, importSaveBackup, inspectSaveImport } from '../utils/save';

interface SaveFilesNative {
  stageExportJson(options:{content:string}):Promise<{token:string;bytes:number}>;
  exportStagedJson(options:{filename:string;token:string}):Promise<{saved:boolean;bytes:number;filename:string}>;
  importJson():Promise<{content:string}>;
}
const NativeSaveFiles=registerPlugin<SaveFilesNative>('SaveFiles');
const MAX_IMPORT_BYTES=64*1024*1024;

/** Save transfers stay on-device. Android uses the system document picker;
 * browsers use Web Share or downloadable JSON plus the HTML file picker. */
export function SaveTransferControls({exportOnly=false,storedOnly=false}:{exportOnly?:boolean;storedOnly?:boolean}={}){
  const fileInput=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  const exportBackup=async()=>{
    if(busy)return;
    setBusy(true);
    setMessage(null);
    try{
      const backup=createSaveBackupExport(!storedOnly);
      if(Capacitor.isNativePlatform()){
        // Stage the JSON privately, then request Downloads with a tiny native
        // call. On Android 10+ this NEVER opens a document picker and therefore
        // cannot background/restart the heavy game WebView mid-export.
        const expected=new TextEncoder().encode(backup.json).length;
        const staged=await NativeSaveFiles.stageExportJson({content:backup.json});
        if(staged.bytes!==expected)throw new Error('Staging did not preserve the full backup.');
        const result=await NativeSaveFiles.exportStagedJson({filename:backup.filename,token:staged.token});
        if(!result.saved||result.bytes!==expected)throw new Error(`Backup verification failed (expected ${expected} bytes, found ${result.bytes??0}). Original saves were not changed.`);
        setMessage(`Verified ${result.bytes.toLocaleString()}-byte backup: Downloads/TalesOfLeigneron/${result.filename} (${backup.copies} copies).`);
        return;
      }
      const file=new File([backup.json],backup.filename,{type:'application/json'});
      if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'
        &&navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],title:'Tales of Leigneron save backup'});
          setMessage(`Save backup shared (${backup.copies} copies).`);
          return;
        }catch(error){
          if(error instanceof DOMException&&error.name==='AbortError'){
            setMessage('Backup sharing cancelled. No saves were changed.');
            return;
          }
          console.warn('[save] Web Share unavailable:',error);
        }
      }
      const url=URL.createObjectURL(file);
      try{
        const link=document.createElement('a');
        link.href=url;
        link.download=backup.filename;
        link.style.display='none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setMessage(`Requested backup download (${backup.copies} copies). Check your Downloads folder.`);
      }finally{window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
    }catch(error){
      setMessage(error instanceof Error?error.message:'Could not export the backup.');
    }finally{setBusy(false);}
  };

  const restoreJson=(json:string)=>{
    const preview=inspectSaveImport(json);
    const saved=preview.savedAt?new Date(preview.savedAt):null;
    const timestamp=saved&&!Number.isNaN(saved.getTime())?saved.toLocaleString():'unknown date';
    const approved=window.confirm(
      `Import level ${preview.level} save from ${timestamp} (${preview.source})?\n\n`+
      'Your current primary save will be backed up before replacement. The game will reload. '+
      'Keep an exported backup for extra safety.'
    );
    if(!approved){setMessage('Import cancelled. Your saves were not changed.');return;}
    importSaveBackup(preview);
    // Import blocks pagehide/visibility autosaves until the next page load.
    window.location.reload();
  };

  const importNative=async()=>{
    if(busy)return;
    setBusy(true);
    setMessage(null);
    try{
      const {content}=await NativeSaveFiles.importJson();
      restoreJson(content);
    }catch(error){
      setMessage(error instanceof Error?error.message:'Could not import the selected backup.');
    }finally{setBusy(false);}
  };

  const onFileChosen=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file||busy)return;
    if(file.size>MAX_IMPORT_BYTES){
      setMessage('Backup exceeds the 64 MB import limit. Existing saves were not changed.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try{restoreJson(await file.text());}
    catch(error){setMessage(error instanceof Error?error.message:'Could not import the selected backup.');}
    finally{setBusy(false);}
  };

  return <div className="save-transfer-controls" aria-label="Save backup and restore">
    <div className="save-transfer-buttons">
      <button type="button" onClick={()=>{void exportBackup();}} disabled={busy}>
        {busy?'Working…':'Export Save Backup'}
      </button>
      {!exportOnly&&<button type="button" onClick={()=>{
        if(Capacitor.isNativePlatform())void importNative();
        else fileInput.current?.click();
      }} disabled={busy}>
        Import Save Backup
      </button>}
    </div>
    {!exportOnly&&<input ref={fileInput} type="file" accept="application/json,.json"
      onChange={event=>{void onFileChosen(event);}} hidden aria-label="Choose a saved game JSON backup"/>}
    {message&&<p className="save-transfer-message" role="status">{message}</p>}
  </div>;
}
