import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load root .env.local for tests (vitest runs with cwd = package dir, not root)
const rootEnvLocal = path.resolve(__dirname, '../../../../.env.local');
const rootEnv = path.resolve(__dirname, '../../../../.env');
const packageEnv = path.resolve(__dirname, '../../.env');

for (const p of [rootEnvLocal, rootEnv, packageEnv]) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}
