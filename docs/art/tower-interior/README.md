# Circular shadow chamber

Generated with the built-in image tool, not SVG or procedural replacement art.
Runtime: `public/assets/interiors/tower_of_might/arena-v1.png`.
Recoverable source: `arena-master-v1.png` beside this document.
Source is 1,254 × 1,254 RGBA, with transparent exterior padding.

The existing tower exterior and its matched stone doors were supporting style
references. A first tall-wall design was rejected because perspective hid too
much of the circular floor. The selected refinement retains the charcoal
stone and violet illumination, using a lower surrounding masonry ring.

Final refinement prompt (built-in image edit):

> Use case: precise-object-edit. Edit target: provided circular shadow tower chamber. Preserve its beautiful dark charcoal slate textures, gloomy violet rune rings, worn stone, restrained purple sconces and detailed pixel-RPG style. Change ONLY camera projection, wall height and containment for gameplay registration. REQUIRED strict straight-down ORTHOGRAPHIC top-down view: the walkable FLOOR must be a mathematically circular disk, not an ellipse, its centre exactly at the square canvas centre. The central rune and every floor rune ring must be true concentric circles. The floor radius is 41% of canvas width, and the LOW surrounding stone wall ring runs from radius 41% to 46% of canvas width. All masonry and rune fixtures contained within radius 47%, leaving at least 3% genuinely transparent padding on ALL four edges. Do NOT use a tall rear/north wall face that hides any of the round floor; low overhead-visible wall caps only, same depth around full circumference. At exact north and south poles leave small simple stone threshold recesses integrated in the wall ring, no painted doors. Preserve a large clear combat floor and no furniture, monsters, portals or chests. No perspective foreshortening, no high walls, no royal gold/cream/blue banners, no text or UI. Finished game-ready round chamber background on true transparency; dark and eerie but floor remains readable under live attack warnings.

Runtime registration is authoritative: a circular floor of radius 710 about
(900,900), a complete uniform 2,048-unit painting centred there, and separate
live north/south door sprites. The outer masonry is not walkable. The square
room rectangle defines camera bounds only; collision, AI paths, spawns,
charges, player movement and minimap use the circle. No per-frame alpha scans.
One background and four prepared prop states load only on tower entry; reuse
them across floors and release them when the room closes.

Artwork was inspected directly. Gameplay screenshots have not been recaptured
for this revision; on-device composition, depth and size still need review.
