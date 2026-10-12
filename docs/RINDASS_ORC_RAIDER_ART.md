# Rindass orc raider art

M04's single melee family uses two authored, complete-pose atlases:

- `public/assets/enemies/rindass_orc_raider/walk.png`: 1659x948, seven columns
  by four directional rows (`down`, `left`, `right`, `up`). Column one is the
  neutral pose; the remaining six frames show alternating lead-foot contact,
  weight transfer, and passing phases. The runtime excludes neutral from the
  walk loop and sizes each direction from its neutral pose.
- `public/assets/enemies/rindass_orc_raider/actions.png`: 1774x887, six columns
  by three state rows (`attack`, `hurt`, `death`). Each six-frame sequence is
  retained as a complete actor pose, registered to the walking model's height
  and ground root. The attack is a low horizontal axe chop; it does not rely on
  clipped overhead artwork.
- `public/assets/enemies/rindass_orc_raider/manifest.json` records the exact
  source rectangles, directions, and action frame rates.

The final generation pass used `public/assets/enemies/directional/road-bandit.png`
as the visual-style reference and the first orc locomotion sheet as its identity
reference for combat. Prompt direction: “match the attached game's crisp,
dark-outlined, richly shaded compact RPG sprite style; preserve one orc's
identity and proportions; render a 7x4 sheet with distinct alternating feet in
each direction; render a padded 6x3 action sheet with a low horizontal axe
chop, readable hurt recovery, and complete non-gory collapse poses.” An initial
concept that missed the art direction was discarded and is not loaded.

The sources are normalized into separate `enemy_walk_orc_raider` and
`enemy_orc_raider` textures at runtime, so locomotion frames never replace or
mutate combat poses. Rendering/runtime inspection remains pending; the art
boards themselves were visually inspected, and no tests, build, or game launch
were run for this checkpoint.
