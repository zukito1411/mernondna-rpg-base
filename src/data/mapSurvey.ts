export const ATLAS_WIDTH=1448,ATLAS_HEIGHT=1086;
// Source-pixel survey anchors on the supplied atlas: castle/citadel, harbor,
// woodland halls and the southern Cibar agricultural settlement. Town data and
// player projection share these same anchors; no UI-only percent offsets.
export const ATLAS_TOWNS:Record<string,readonly [number,number]>={
  "oakmere": [
    347,
    444
  ],
  "highmere": [
    445,
    327
  ],
  "willowcross": [
    610,
    345
  ],
  "elarion": [
    822,
    218
  ],
  "moonfall": [
    941,
    288
  ],
  "starhold": [
    1134,
    348
  ],
  "redmesa": [
    1000,
    584
  ],
  "deepford": [
    853,
    689
  ],
  "tidewatch": [
    490,
    785
  ],
  "skallheim": [
    1329,
    731
  ],
  "blackspire": [
    1228,
    195
  ],
  "cibar-plains": [
    955,
    838
  ]
};
