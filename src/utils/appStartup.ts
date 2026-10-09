import {Capacitor} from '@capacitor/core';

export async function prepareOfflineStartup() {
  if(!('serviceWorker' in navigator))return;
  const scope=new URL(import.meta.env.BASE_URL,location.href).href;
  if(Capacitor.isNativePlatform()){
    for(const registration of await navigator.serviceWorker.getRegistrations())
      if(registration.scope===scope)await registration.unregister();
    return;
  }
  if(!import.meta.env.PROD)return;
  if(typeof navigator.storage?.persist==='function'){
    void navigator.storage.persist().then(persisted=>{
      if(!persisted)console.info('Persistent offline storage was not granted; the browser may clear cached game assets when storage is low.');
    }).catch(error=>console.warn('Persistent offline storage request failed:',error));
  }
  void navigator.serviceWorker.register(new URL('sw.js',scope),{scope,updateViaCache:'none'})
    .catch(error=>console.warn('Offline app registration failed:',error));
}
