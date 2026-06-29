#!/usr/bin/env node
/**
 * npm "prepare" lifecycle wrapper.
 *
 * Originally `"prepare": "husky || true"`. The bare shell `||` inside a
 * script value triggered Cursor's NPM task detector on startup
 * ("failed to parse the file …/package.json") even though the JSON itself
 * was structurally valid (confirmed via jsonc-parser probe on Jun 29). The
 * detector tokenizes script command strings and chokes on shell operators
 * that aren't wrapped in `npm exec` / `--`. Extracting the logic to a node
 * script keeps the command string free of shell operators while preserving
 * the "best effort" husky install semantics in CI / fresh clones.
 */

import { spawnSync } from 'node:child_process';

const result = spawnSync('husky', [], { stdio: 'inherit', shell: false });

if (result.error && result.error.code === 'ENOENT') {
  process.exit(0);
}

process.exit(0);
