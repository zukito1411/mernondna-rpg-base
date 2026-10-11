import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = process.cwd();
const relative = 'src/styles.css';
const destination = join(root, relative);
const marker = 'LEIGHNERON_DESKTOP_BOSS_BAR_TOP_CENTER_V1';

if (!existsSync(destination)) {
  console.error(`Expected ${relative} in the current folder. Run this installer from the game project root.`);
  process.exit(1);
}
const original = readFileSync(destination, 'utf8');
const newline = original.includes('\r\n') ? '\r\n' : '\n';
const normalized = original.replace(/\r\n/g, '\n');
if (normalized.includes(marker)) {
  console.log('Desktop boss HP positioning fix is already installed. No files changed.');
  process.exit(0);
}
const expectedBoss = '.boss-encounter-card { position: absolute; left: 50%; bottom: max(22px, env(safe-area-inset-bottom)); transform: translateX(-50%);';
const expectedBar = '.hud-layer .desktop-skillbar {';
const expectedHUD = '.hud-layer { position: absolute; inset: 0;';
const missing = [
  [expectedBoss, 'original bottom-anchored boss HP CSS'],
  [expectedBar, 'desktop skill-bar CSS'],
  [expectedHUD, 'HUD layout container'],
].filter(([needle]) => !normalized.includes(needle)).map(([, label]) => label);
if (missing.length) {
  console.error('This local stylesheet does not match the verified GitHub layout; nothing was changed.');
  for (const label of missing) console.error(`- Missing: ${label}`);
  console.error('Share only the relevant CSS if you want an installer adapted to this version.');
  process.exit(1);
}

// Keep mobile boss-bar positioning intact: override only mouse/trackpad desktop UI.
// Use the same existing boss component and styling; this is not a duplicate HUD.
const patch = `
/* ${marker}
   Desktop boss health belongs at the top center, never beneath the skill bar.
   Phone/tablet touch layouts retain their current responsive positions. */
@media (hover: hover) and (pointer: fine) {
  .hud-layer .boss-encounter-card {
    top: max(16px, env(safe-area-inset-top));
    bottom: auto;
    z-index: 10;
  }
}
`;
const backup = join(root, '.leighneron-boss-hud-backup', String(Date.now()), relative);
mkdirSync(dirname(backup), { recursive: true });
copyFileSync(destination, backup);
writeFileSync(destination, original + patch.replace(/\n/g, newline), 'utf8');
console.log('Desktop boss HP is now positioned at top-center, clear of the bottom skill bar.');
console.log(`Modified: ${relative}`);
console.log(`Backup: ${backup}`);
console.log('Mobile styles, HUD components, combat logic, and saves were not modified.');
console.log('No game builds, tests, commits, or pushes were performed.');
