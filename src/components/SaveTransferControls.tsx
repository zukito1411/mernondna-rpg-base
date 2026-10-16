import { useRef, useState, type ChangeEvent } from 'react';
import { createSaveBackupExport, importSaveBackup, inspectSaveImport } from '../utils/save';

const MAX_IMPORT_BYTES=64*1024*1024;

/** Save transfers stay entirely on-device. The player explicitly chooses a
 * download/share destination or a JSON file to restore. */
export function SaveTransferControls(){
  const fileInput=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  const exportBackup=async()=>{
    if(busy)return;
    setBusy(true);
    setMessage(null);
    try{
      const backup=createSaveBackupExport();
      const file=new File([backup.json],backup.filename,{type:'application/json'});
      // Android's native share sheet, when available, lets players store a
      // backup in Files/Drive rather than only inside the app's sandbox.
      if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'
        &&navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],title:'Tales of Leigneron save backup'});
          setMessage(`Save backup shared (${backup.copies} copies). Keep the JSON file somewhere safe.`);
          return;
        }catch(error){
          if(error instanceof DOMException&&error.name==='AbortError'){
            setMessage('Backup sharing cancelled. No saves were changed.');
            return;
          }
          // Some Android WebViews report file-sharing support but reject the
          // share request. Fall back to a regular browser download below.
          console.warn('[save] Native file sharing unavailable:',error);
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
        setMessage(`Requested JSON backup download (${backup.copies} copies). Check Downloads before clearing app data.`);
      }finally{
        window.setTimeout(()=>URL.revokeObjectURL(url),60000);
      }
    }catch(error){
      setMessage(error instanceof Error?error.message:'Could not export the save backup.');
    }finally{setBusy(false);}
  };

  const onFileChosen=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];
    // Choosing the same file twice must still fire onChange.
    event.target.value='';
    if(!file||busy)return;
    if(file.size>MAX_IMPORT_BYTES){
      setMessage('Backup exceeds the 64 MB import limit. Existing saves were not changed.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try{
      const preview=inspectSaveImport(await file.text());
      const saved=preview.savedAt?new Date(preview.savedAt):null;
      const timestamp=saved&&!Number.isNaN(saved.getTime())?saved.toLocaleString():'unknown date';
      const approved=window.confirm(
        `Import level ${preview.level} save from ${timestamp} (${preview.source})?\n\n`+
        'Your current primary save will be backed up before replacement. The game will reload. '+
        'Keep a separate exported backup for extra safety.'
      );
      if(!approved){setMessage('Import cancelled. Your saves were not changed.');return;}
      importSaveBackup(preview);
      // Import blocks any pagehide/visibility autosave until this reload.
      window.location.reload();
    }catch(error){
      setMessage(error instanceof Error?error.message:'Unable to import the selected backup.');
    }finally{setBusy(false);}
  };

  return <div className="save-transfer-controls" aria-label="Save backup and restore">
    <div className="save-transfer-buttons">
      <button type="button" onClick={()=>{void exportBackup();}} disabled={busy}>
        {busy?'Working…':'Export Save Backup'}
      </button>
      <button type="button" onClick={()=>fileInput.current?.click()} disabled={busy}>
        Import Save Backup
      </button>
    </div>
    <input ref={fileInput} type="file" accept="application/json,.json"
      onChange={event=>{void onFileChosen(event);}} hidden aria-label="Choose a saved game JSON backup"/>
    {message&&<p className="save-transfer-message" role="status">{message}</p>}
  </div>;
}
