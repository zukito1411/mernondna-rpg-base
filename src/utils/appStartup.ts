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
  await navigator.serviceWorker.register(new URL('sw.js',scope),{scope,updateViaCache:'none'});
  if(navigator.serviceWorker.controller)return;
  await new Promise<void>((resolve,reject)=>{
    const changed=()=>{if(navigator.serviceWorker.controller){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();}};
    const timer=window.setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',changed);reject(new Error('Offline preparation is incomplete. Keep the app online until assets finish loading.'));},15000);
    navigator.serviceWorker.addEventListener('controllerchange',changed);changed();
  });
}
