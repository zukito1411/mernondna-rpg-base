import fs from 'node:fs';
import path from 'node:path';

// Repairs the NPC alias replacement of Elarion's shrine identifier.
const root = process.cwd();
const relative = 'src/data/npcPresentation.ts';
const full = path.join(root, relative);
if (!fs.existsSync(full)) {
  console.error(`Missing ${relative}. Run from the project root.`);
  process.exitCode = 1;
} else {
  const original = fs.readFileSync(full, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  let code = original.replace(/\r\n/g, '\n');
  const issues = [];
  const marker = '// LEIGHNERON_SHRINE_TOWN_ID_ALIAS_FIX_V1';
  if (code.includes(marker)) issues.push('Already installed: shrine town-ID alias fix. No changes needed.');
  function replaceExactly(label, before, after) {
    const count = code.split(before).length - 1;
    if (count !== 1) { issues.push(`${label}: expected one anchor, found ${count}`); return; }
    code = code.replace(before, after);
  }
  replaceExactly('town import',
    "import type { NpcDefinition } from '../game/types';\n",
    "import type { NpcDefinition } from '../game/types';\nimport { TOWNS } from './towns';\n");
  replaceExactly('reserved settlement names',
    "function makeAliases(npcs: readonly NpcDefinition[], namesById: ReadonlyMap<string, string>): Map<string, string> {",
    `${marker}\n// NPCs such as "Elarion King" must not rename the settlement of Elarion.\nconst SETTLEMENT_NAME_KEYS = new Set(TOWNS.flatMap(town => [\n  town.id.toLowerCase(), town.name.toLowerCase(),\n]));\n\nfunction makeAliases(npcs: readonly NpcDefinition[], namesById: ReadonlyMap<string, string>): Map<string, string> {`);
  replaceExactly('disallow settlement-name first-name aliases',
    '    if (targets.size === 1) aliases.set(oldGiven, [...targets][0]);',
    '    if (targets.size === 1 && !SETTLEMENT_NAME_KEYS.has(oldGiven)) aliases.set(oldGiven, [...targets][0]);');
  replaceExactly('protect referential game IDs',
    "  'npcId', 'questIds', 'townId', 'regionId', 'bossId', 'prerequisiteQuestId', 'nextQuestId',",
    "  'npcId', 'questIds', 'townId', 'townShrineId', 'portId', 'regionId', 'bossId', 'enemyId',\n  'wolfPackId', 'prerequisiteQuestId', 'nextQuestId',");
  if (issues.length) {
    const report = `Shrine root-cause fix preflight: NOTHING WAS CHANGED.\n${issues.map((s, i) => `${i+1}. ${s}`).join('\n')}\n`;
    console.error(report);
    fs.writeFileSync(path.join(root, 'leighneron-shrine-alias-preflight.txt'), report);
    process.exitCode = 1;
  } else {
    const backup = path.join(root, '.leighneron-shrine-alias-backup', String(Date.now()), relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, original);
    try { fs.writeFileSync(full, code.replace(/\n/g, eol)); }
    catch (error) { fs.writeFileSync(full, original); throw error; }
    console.log('Fixed Elarion shrine name/ID corruption at its source.');
    console.log(`Updated: ${relative}`);
    console.log(`Backup: ${backup}`);
    console.log('Restart the Vite dev server and reload the game. Existing save data is preserved.');
    console.log('No tests, builds, commits, or pushes were run.');
  }
}
