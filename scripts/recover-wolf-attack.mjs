import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
for (const extension of ['png', 'webp']) {
  const relative = `public/assets/enemies/gray_wolf/attack.${extension}`;
  const output = resolve(root, `public/assets/enemies/gray_wolf/attack-original.${extension}`);
  if (existsSync(output)) continue;
  const data = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', `HEAD:${relative}`], { cwd: root });
  writeFileSync(output, data);
}
