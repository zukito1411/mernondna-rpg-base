/// <reference types="vite/client" />
declare module 'virtual:mernondna-art-packs' {
  const manifests:Record<string,import('./data/animationPacks').PackManifest>;
  export default manifests;
}
declare module 'virtual:mernondna-lossless-images' {
  const paths:Readonly<Record<string,string>>;
  export default paths;
}
