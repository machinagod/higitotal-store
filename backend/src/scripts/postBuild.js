const fs = require('fs');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// Copy .env if it exists (medusa start runs from .medusa/server and reads it).
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Reuse the root install instead of materializing a SECOND prod dependency tree
// inside .medusa/server. The generated .medusa/server/package.json declares
// exactly the project's runtime dependencies — every one is already present in
// the root node_modules (same pnpm-lock.yaml), so a symlink resolves every server
// `require`, and after the image's `pnpm prune --prod` the symlink still points at
// the prod-only root tree. This drops a full `pnpm i --prod` from every build.
const rootNodeModules = path.join(process.cwd(), 'node_modules');
const serverNodeModules = path.join(MEDUSA_SERVER_PATH, 'node_modules');
if (!fs.existsSync(rootNodeModules)) {
  throw new Error('Root node_modules not found — cannot link .medusa/server to it.');
}
fs.rmSync(serverNodeModules, { recursive: true, force: true });
fs.symlinkSync(
  path.relative(MEDUSA_SERVER_PATH, rootNodeModules),
  serverNodeModules,
  'dir'
);
console.log('Linked .medusa/server/node_modules -> root node_modules (skipped second prod install).');
