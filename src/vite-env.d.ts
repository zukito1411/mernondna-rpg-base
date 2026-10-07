/// <reference types="vite/client" />
declare module 'virtual:mernondna-art-packs' {
  const manifests:Record<string,import('./data/animationPacks').PackManifest>;
  export default manifests;
}
