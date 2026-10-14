# Grove spider action transparency repair

Runtime uses `actions-transparent-v2.png`. The original `actions.png` remains
unchanged for reference. Its partly opaque brown backdrop connected separate
poses and broke whole-subject extraction; runtime color-keying damaged legs.
The replacement repairs alpha instead, retaining eighteen complete poses and
the existing design. Walking artwork, combat rules and collision size are unchanged.

Created using the built-in image-generation tool, background-extraction edit.
Prompt:

> Background extraction edit for an existing RPG sprite sheet. Remove ONLY the brown studio backdrop from the supplied image, including the gaps between every spider's legs. Output a genuinely transparent PNG. Preserve ALL eighteen complete original spider poses, EXACT same bronze/gold legs, purple mottled abdomen, red eyes, black outlines, paint detail, proportions and orientations. Keep the six columns by three rows layout and original 1536x1024 aspect ratio. Row1 facing down, row2 facing right, row3 facing up. Preserve original windup/strike/recovery/hurt/dying/dead poses in order. Every complete spider must be isolated by fully transparent gutters with no clipped legs, no remaining brown backdrop, no shadows/haze/halos, no extra pixels or foreign legs. Do not redesign, add or remove any spider, change pose identities, or simplify artwork. This is clean cutout extraction, not new character generation.

Verification: `tests/browser/spiderCartVisual.spec.ts` uses the actual WebGL
renderer, runtime atlas preparation and Enemy instances. All 44 directional
idle/walk/action frames were captured and visually inspected, with atlas UV
and collision-foot registration assertions. This is a focused art fixture,
not a full-world gameplay or AI validation.
