import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repo = fileURLToPath(new URL('../', import.meta.url));

function buildFor(release: string): { cacheId: string; startUrl: string } {
  execFileSync('npm', ['run', 'build'], {
    cwd: repo,
    env: { ...process.env, GITHUB_SHA: release },
    stdio: 'pipe'
  });
  const serviceWorker = readFileSync(resolve(repo, 'dist/sw.js'), 'utf8');
  const manifest = JSON.parse(readFileSync(resolve(repo, 'dist/manifest.webmanifest'), 'utf8')) as { start_url: string };
  const cacheId = serviceWorker.match(/context-cloze-([a-f0-9]{12})/)?.[1];
  expect(cacheId).toBeTruthy();
  return { cacheId: cacheId!, startUrl: manifest.start_url };
}

describe('release PWA files', () => {
  it('emits a new cache namespace and start URL for each release', () => {
    const first = buildFor('111111111111aaaa');
    const second = buildFor('222222222222bbbb');

    expect(second.cacheId).not.toBe(first.cacheId);
    expect(first.startUrl).toContain(first.cacheId);
    expect(second.startUrl).toContain(second.cacheId);
  }, 20_000);
});
