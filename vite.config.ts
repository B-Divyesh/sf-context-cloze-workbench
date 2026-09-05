import { defineConfig } from 'vite';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

function releaseId(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 12);
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
}

const buildId = releaseId();

function releaseFiles() {
  return {
    name: 'context-cloze-release-files',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist');
      for (const file of ['sw.js', 'manifest.webmanifest']) {
        const path = resolve(dist, file);
        writeFileSync(path, readFileSync(path, 'utf8').replaceAll('__BUILD_ID__', buildId));
      }
      copyFileSync(resolve(process.cwd(), 'staticwebapp.config.json'), resolve(dist, 'staticwebapp.config.json'));
    }
  };
}

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true
  },
  plugins: [releaseFiles()]
});
