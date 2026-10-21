# Pixel-preserving asset packaging

No rescaling, cropping, palette reduction, alpha quantization, near-lossless
encoding or changes to frames, origins, grips, timing or texture keys.
Audio is not transcoded. Source masters remain in the repository.

## Applied results

The recorded original public asset inventory was **651.55 MiB**. The filtered,
optimized shipping inventory is **581.53 MiB**, a **70.01 MiB (10.75%)** reduction:

- 328 smaller PNGs: 28.81 MiB saved, with exact RGBA comparison.
- 141 smaller, round-trip-verified WebPs: another 20.62 MiB saved.
- Confirmed authoring/retired files excluded: another 20.59 MiB.

All 17 cinematic candidates remain PNG because their metadata requires
preservation. Reference/title/loading artwork remains present. Repository
`public/` itself is larger because it deliberately retains original PNG masters
alongside generated WebPs; the release copier does not ship both alternatives.
These are filesystem inventory measurements, not a measured APK size.

## Offline preparation

`scripts/lib/png-rgba.mjs` now selects PNG filters per row before DEFLATE.
The explicit compression command recompresses supported non-interlaced RGBA8
PNGs, retaining every non-IDAT chunk byte-for-byte. Other formats, animated
PNGs and signed PNGs are left alone. A candidate is adopted only if smaller
and its decoded RGBA buffer matches exactly, including hidden transparent RGB.

Run deliberately, not as part of game startup or ordinary builds:

```powershell
node scripts/compress-assets.mjs png
node scripts/compress-assets.mjs webp --cwebp <encoder-path> --dwebp <decoder-path>
```

WebP uses Google's `cwebp -lossless -exact -q 100 -m 4 -metadata all`.
Every adopted file is decoded with `dwebp` and compared byte-for-byte against
the PNG. Only prepared cosmetic atlases, cinematic pages, boss-effect atlases
and housing images with traced consumers are candidates. PNG is kept if it
wins or contains metadata WebP cannot preserve. In particular, color-profile,
gamma and chromaticity-bearing PNGs are not converted. No encoder is required
to build or run the game; generated alternatives are version-controlled.

Original PNGs remain accessible to authoring tools. The committed URL map and
`asset-compression-report.json` record accepted alternatives, sizes, dimensions,
pixel hashes and encoded-file hashes. Failed/interrupted preparation never
publishes an unverified URL; subsequent runs can resume safely. Temporary
decoder files are bounded to one image and removed in `finally`.

## Preventing stale artwork

The existing Vite manifest plugin embeds only alternatives whose PNG and WebP
file hashes still match their preservation report. If a packer later regenerates
the original PNG, the next bundling pass automatically chooses that fresh PNG
until compression is deliberately rerun. Runtime performs only a small immutable
URL lookup: no hashing, capability probes, canvas scans or extra asset loads.

Cosmetic manifests and all frame registrations remain unchanged. Existing
timeouts, cancellation, two-atlas decoding concurrency, staged boot and optional
scene-local loading remain intact. Title/loading images and the app icon retain
their paths and formats.

## Release copying and offline caching

`scripts/lib/public-assets.mjs` supplies the same shipping inventory to the
filtered public-file copier and offline-shell manifest/version generation.
The copier streams filesystem copies rather than holding the asset tree in
Rollup memory. There is no separate asset renderer or asset download system.

Excluded from shipping, not deleted from the repository:

- Markdown, the old parchment backup and authoring-only audio README.
- Per-state cosmetic registration JSON already consolidated into runtime manifests.
- Previous boss-skill atlas, four superseded boss walk sheets, and Grand Magus
  source poses now contained in his HD runtime atlas.
- Original PNGs only when their traced consumer uses a verified smaller WebP.

Keep `reference/`, licenses, runtime manifests, heart/weapon icons and all
unconfirmed alternative files. Public-directory development serving is unchanged.
The service worker uses a new build version after these changes and continues
to cache optional game assets on demand, not en masse during installation.

## Evidence and limits

The compression report measures source-file/shipping-inventory bytes, not APK
download size, GPU memory or Android frame time. Lossless compression reduces
stored/downloaded bytes, not the decoded texture dimensions or GPU allocation.
Pixel equality was checked as part of asset preparation; it is not a gameplay or
browser test. Both required TypeScript checks passed. No game launch, unit suite,
production build or APK build is authorized for this task. Release packaging,
offline upgrade behavior and actual Android rendering still need runtime/build
verification when requested.

References: [Google encoder options](https://developers.google.com/speed/webp/docs/cwebp),
[Vite public-directory behavior](https://vite.dev/guide/assets.html#the-public-directory).
