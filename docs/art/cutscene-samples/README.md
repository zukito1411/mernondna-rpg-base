# Anime/manga opening cutscene — style sample v1

The approved sample has also been extended to sixteen new campaign pages (48
additional panels). See `public/assets/cinematics/README.md` for scene coverage,
resource handling and the unperformed runtime checks. Exact rollout prompts are
in `story-rollout-prompts.json`; final asset selections and the Thomas age
correction are in `story-rollout-selection.json`. The sample itself is unchanged.

Approved style sample, generated with the built-in image-generation tool on 2026-10-16. The original preview remains here. After approval, the unchanged bitmap was copied to `public/assets/cinematics/roadborn-opening/prologue-waiting-v1.png` and linked to three illustrated opening beats. No tests, game launch, builds, commits or pushes were run for that integration.

## Deliverable

- `docs/art/cutscene-samples/prologue-waiting-v1.png`: one three-panel landscape storyboard.
- Original generation retained at `C:\Users\nbernardo\.codex\generated_images\01a1145d-acb6-7093-a7ce-9a11cb788b86\exec-ac2a8572-6ffe-4325-a2c3-a6abe947db9c.png`.
- Canonical source: `main-storyline.md`, “Prologue — The Child Who Waited”.
- Beats: waiting at Marrow Inn with untouched soup; hope at an arriving wagon; disappointment that the travelers are strangers.
- Character references: `public/assets/characters/leigneron/idle.png` and `public/assets/npcs/attendant_woman/idle_atd_w.png`. These are reference inputs, not edited targets.
- Anime interpretation preserves hair, blue eyes, rounded human ears, navy/gold/forest-green palette. Childhood clothes are a proposed age-appropriate adaptation, not a replacement game model.
- No baked-in captions, dialogue, title, or speech bubbles.
- Implementation uses three measured SVG crop windows over the single shared page, rather than storing duplicate cropped bitmaps. Captions remain accessible HTML text. Panels reveal in sequence, with restrained motion, a portrait-phone single-panel layout, reduced-motion support and existing Skip behavior. Ordinary world cutscenes resume afterward.

## Exact final prompt

Use case: illustration-story.
Asset type: ONE polished landscape anime/manga cutscene storyboard sample for the medieval fantasy RPG Tales of Leigneron. This is a three-panel opening memory, based strictly on the canonical prologue "The Child Who Waited", NOT a gameplay sprite sheet.
Input images: Image 1 is the EXISTING adult Leigneron sprite, an identity/palette reference only: swept tousled medium chestnut-brown hair with the same distinctive fringe, clear BLUE eyes, rounded HUMAN ears, navy-and-gold clothing, dark forest-green gold-edged cloak, brown boots. Translate his recognizable identity into a 7-year-old child in this flashback, not a different protagonist. Image 2 is the EXISTING innkeeper woman's model, identity/clothing reference only if she appears in the background: chestnut side-bun hair, small navy ribbon, cream sleeves/apron, navy-and-gold dress, normal human ears.
Primary request: a cinematic, emotionally restrained, FULL-COLOR anime illustration told through EXACTLY THREE bordered manga panels, read left to right. Landscape 16:9 canvas, refined dark ink panel borders and narrow ivory gutters, all three panels generous enough to read on a phone. Professional expressive hand-drawn faces, confident natural anatomy, elegant clean linework, richly painted medieval backgrounds, controlled cel shading, subtle rain/screentone texture, detailed fabrics and warm firelight. Not pixel art, not a 3D render, not photorealism, not tiny sprite proportions, not generic modern anime schoolchildren.
Panel 1 (left third): inside Marrow Inn in rural Oakmere, a small brown-haired BLUE-eyed boy Leigneron sits sideways on a wooden chair beside a rain-streaked leaded window. His hand lightly touches the window sill while he watches the dark road outside, quietly waiting. An untouched earthenware bowl of soup with wooden spoon is on the table beside him. Simple timber-beam inn, aged oak table and chair, warm amber hearth light against blue-gray rain. His childhood clothing echoes the navy/gold and forest-green palette in modest wool/linen, NOT ornate adult armor. Small brown boots. He is a vulnerable real child, not a miniature armed adult.
Panel 2 (middle third): view outside through the inn's rain-beaded window: a humble horse-drawn covered wooden wagon approaches on Oakmere's muddy village road in the storm. A readable hopeful reaction of the SAME boy in the foreground, rising from his chair and turning toward the door, blue eyes brightening. Correct horse/cart connection, period wheels and harness. The wagon approaches the INN, no battles or palace.
Panel 3 (right third): the same small boy stands just inside the inn, seen in a close three-quarter emotional portrait with the open doorway behind him. Two rain-soaked adult TRAVELERS who are STRANGERS enter, faces unimportant, practical medieval wool cloaks; they are NOT his parents. The boy realizes this, hope falling into quiet disappointment; show it delicately in his eyes and softened shoulders, not melodramatic crying. Innkeeper from Image 2 may be a small soft-focus figure attending the doorway, concerned but not taking focus.
Visual continuity: EXACT same boy face, age, hair, blue eyes, child outfit and body proportions across all panels; same rainy evening and coherent inn layout, soup remains on table, logical lighting. Warm golden interior vs cool slate-blue rain. The child is unarmed in EVERY panel. No sword, crown, prophecy, magic glow, graves, dead parents, combat or invented lore. Show uncertainty and waiting, not confirmation of his parents' fate.
Text: ABSOLUTELY NO lettering, title, captions, speech bubbles, sound effects, labels, logos or watermarks. Dialogue and narration will be rendered by the game separately. Keep important faces/hands safely inset from panel edges and image edges. Beautiful emotionally resonant storybook atmosphere, clearly anime/manga rather than the original chibi game sprite rendering.
