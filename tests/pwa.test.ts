import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('installable web app assets', () => {
  it('provides a scoped standalone manifest and actual 192/512 PNG icons', () => {
    const manifest = JSON.parse(readFileSync(resolve('public/manifest.webmanifest'),'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.display_override).toEqual(['fullscreen','standalone']);
    expect(manifest.start_url).toBe('.');
    expect(manifest.scope).toBe('.');
    for (const size of [192,512]) {
      const icon = manifest.icons.find((entry:{ sizes:string }) => entry.sizes === `${size}x${size}`);
      expect(icon).toBeTruthy();
      const png = readFileSync(resolve('public',icon.src));
      expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
    expect(readFileSync(resolve('index.html'),'utf8')).toContain('manifest.webmanifest');
    const worker = readFileSync(resolve('public/sw.js'),'utf8');
    expect(worker).toContain("self.addEventListener('fetch'");
    expect(worker).toContain("cache.match(request,{ignoreVary:true})");
  });
});
