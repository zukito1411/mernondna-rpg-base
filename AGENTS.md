# Project workflow

- Do not run production or APK builds, create commits, push code, or publish
  releases unless the user explicitly requests the action for the current task.
- Requested source fixes may use inspection, local edits, type checks, unit
  tests, and development-server browser checks without creating a build.
- Sprite validation must inspect rendered appearances and registration across
  locomotion and combat states, including dragon ground/flight transitions.
  Checking source pixels and animation names alone does not validate GPU frame
  coordinates, body proportions, weapon placement, or collision-foot alignment.
- Use complete enemy poses. Do not stitch old upper bodies onto new legs.
  Compare detail, proportions and frame containment across idle, walking,
  attack, hurt, death and flight. The bandit must pass through its complete
  neutral side pose between steps; never substitute drawn line limbs.
- Bandit side-walk fixes apply only to left/right. Preserve its approved
  up/down walking sequence, cadence and sizing unless the user asks otherwise.
